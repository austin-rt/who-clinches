import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { espnClient } from '@/lib/cfb/espn-client';
import {
  CONFERENCE_TEAMS_MAP,
  RECORD_TYPE_OVERALL,
  RECORD_TYPE_HOME,
  RECORD_TYPE_AWAY,
  RECORD_TYPE_CONFERENCE,
  STAT_AVG_POINTS_FOR,
  STAT_AVG_POINTS_AGAINST,
  STAT_WINS,
  STAT_LOSSES,
  STAT_DIFFERENTIAL,
  CONFERENCE_METADATA,
  type ConferenceSlug,
} from '@/lib/cfb/constants';
import { CronRankingsResponse } from '@/lib/api-types';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Pro Mode Only: Weekly team season averages update
 * Fetches avgPointsFor/Against from ESPN Core API
 * Runs Sunday 1 AM ET after all week's games complete
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: { conf: string } }
) => {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conf = (await params).conf as ConferenceSlug;

  if (!CONFERENCE_METADATA[conf]) {
    return NextResponse.json({ error: `Unsupported conference: ${conf}` }, { status: 400 });
  }

  const teams = CONFERENCE_TEAMS_MAP[CONFERENCE_METADATA[conf].espnId];
  if (!teams) {
    return NextResponse.json(
      { error: `Conference ${conf} not supported. Add conference to CONFERENCE_TEAMS_MAP in lib/cfb/constants.ts` },
      { status: 400 }
    );
  }

  try {
    // 2. Connect to database
    await dbConnect();

    // 3. Check if in season using ESPN calendar (with manual override for testing)
    // Use current year as season since this cron doesn't have a season parameter
    const { searchParams } = new URL(request.url);
    // Tests automatically bypass the check since they're testing functionality, not season logic
    const bypassSeasonCheck =
      searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';
    const currentSeason = new Date().getFullYear();
    const sport = 'football';
    const league = 'college-football';

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, league, conf, currentSeason))) {
      return NextResponse.json(
        {
          error: 'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    // 4. Update team season averages for all conference teams
    const failedTeams: string[] = [];
    let successfulUpdates = 0;

    for (const teamAbbrev of teams) {
      try {
        // Fetch team ID first (need ID for Core API)
        const teamData = await espnClient.getTeam(teamAbbrev);

        // Fetch team record from Core API (includes avgPointsFor/Against)
        const recordData = await espnClient.getTeamRecords(teamData.team.id);

        // Extract records by type from Core API
        const overallRecord = recordData?.items?.find((item) => item.name === RECORD_TYPE_OVERALL);
        const homeRecord = recordData?.items?.find((item) => item.type === RECORD_TYPE_HOME);
        const awayRecord = recordData?.items?.find((item) => item.type === RECORD_TYPE_AWAY);
        const conferenceRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_CONFERENCE
        );

        // Helper to extract stat value from flat stats array
        const getStatValue = (
          stats: Array<{ name: string; value: number }> | undefined,
          statName: string
        ): number => {
          return stats?.find((s) => s.name === statName)?.value ?? 0;
        };

        // Try Core API stats first
        const coreStats = overallRecord?.stats;

        // Fallback to Site API stats if Core API returns no data
        const siteStats = teamData.team.record?.items?.find((item) => item.summary)?.stats || [];
        const useSiteAPI = !coreStats && siteStats.length > 0;

        let recordStats;
        if (useSiteAPI) {
          // Parse Site API format
          recordStats = {
            wins: getStatValue(siteStats, 'wins'),
            losses: getStatValue(siteStats, 'losses'),
            winPercent: getStatValue(siteStats, 'winPercent'),
            pointsFor: getStatValue(siteStats, 'pointsFor'),
            pointsAgainst: getStatValue(siteStats, 'pointsAgainst'),
            pointDifferential: getStatValue(siteStats, 'pointDifferential'),
            avgPointsFor: getStatValue(siteStats, 'avgPointsFor'),
            avgPointsAgainst: getStatValue(siteStats, 'avgPointsAgainst'),
          };
        } else {
          // Parse Core API format (flat stats array)
          recordStats = {
            wins: getStatValue(coreStats, STAT_WINS),
            losses: getStatValue(coreStats, STAT_LOSSES),
            winPercent: getStatValue(coreStats, 'winPercent'),
            pointsFor: getStatValue(coreStats, 'pointsFor'),
            pointsAgainst: getStatValue(coreStats, 'pointsAgainst'),
            pointDifferential: getStatValue(coreStats, STAT_DIFFERENTIAL),
            avgPointsFor: getStatValue(coreStats, STAT_AVG_POINTS_FOR),
            avgPointsAgainst: getStatValue(coreStats, STAT_AVG_POINTS_AGAINST),
          };
        }

        // Update only record and stats fields (not rankings - those are handled by update-rankings cron)
        await Team.updateOne(
          { _id: teamData.team.id },
          {
            $set: {
              'record.overall':
                overallRecord?.summary || teamData.team.record?.items?.[0]?.summary || null,
              'record.conference': conferenceRecord?.summary || null,
              'record.home': homeRecord?.summary || null,
              'record.away': awayRecord?.summary || null,
              'record.stats.wins': recordStats.wins,
              'record.stats.losses': recordStats.losses,
              'record.stats.winPercent': recordStats.winPercent,
              'record.stats.pointsFor': recordStats.pointsFor,
              'record.stats.pointsAgainst': recordStats.pointsAgainst,
              'record.stats.pointDifferential': recordStats.pointDifferential,
              'record.stats.avgPointsFor': recordStats.avgPointsFor,
              'record.stats.avgPointsAgainst': recordStats.avgPointsAgainst,
              lastUpdated: new Date(),
            },
          }
        );

        successfulUpdates++;

        // Rate limit between calls (2 API calls per team)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        await ErrorLog.create({
          timestamp: new Date(),
          endpoint: `/api/cron/cfb/${conf}/update-team-averages`,
          payload: { team: teamAbbrev, conf },
          error: error instanceof Error ? error.message : String(error),
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
        failedTeams.push(teamAbbrev);
      }
    }

    // 5. Retry failed teams once (after 5 second delay)
    if (failedTeams.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const retryFailures: string[] = [];

      for (const teamAbbrev of failedTeams) {
        try {
          const teamData = await espnClient.getTeam(teamAbbrev);
          const recordData = await espnClient.getTeamRecords(teamData.team.id);

          // Extract records by type from Core API
          const overallRecord = recordData?.items?.find(
            (item) => item.name === RECORD_TYPE_OVERALL
          );
          const homeRecord = recordData?.items?.find((item) => item.type === RECORD_TYPE_HOME);
          const awayRecord = recordData?.items?.find((item) => item.type === RECORD_TYPE_AWAY);
          const conferenceRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_CONFERENCE
          );

          // Helper to extract stat value from flat stats array
          const getStatValue = (
            stats: Array<{ name: string; value: number }> | undefined,
            statName: string
          ): number => {
            return stats?.find((s) => s.name === statName)?.value ?? 0;
          };

          // Try Core API stats first
          const coreStats = overallRecord?.stats;

          // Fallback to Site API stats if Core API returns no data
          const siteStats = teamData.team.record?.items?.find((item) => item.summary)?.stats || [];
          const useSiteAPI = !coreStats && siteStats.length > 0;

          let recordStats;
          if (useSiteAPI) {
            // Parse Site API format (same flat array structure)
            const getSiteStatValue = (statName: string): number => {
              return siteStats.find((s) => s.name === statName)?.value ?? 0;
            };
            recordStats = {
              wins: getSiteStatValue('wins'),
              losses: getSiteStatValue('losses'),
              winPercent: getSiteStatValue('winPercent'),
              pointsFor: getSiteStatValue('pointsFor'),
              pointsAgainst: getSiteStatValue('pointsAgainst'),
              pointDifferential: getSiteStatValue('pointDifferential'),
              avgPointsFor: getSiteStatValue('avgPointsFor'),
              avgPointsAgainst: getSiteStatValue('avgPointsAgainst'),
            };
          } else {
            // Parse Core API format (flat stats array)
            recordStats = {
              wins: getStatValue(coreStats, STAT_WINS),
              losses: getStatValue(coreStats, STAT_LOSSES),
              winPercent: getStatValue(coreStats, 'winPercent'),
              pointsFor: getStatValue(coreStats, 'pointsFor'),
              pointsAgainst: getStatValue(coreStats, 'pointsAgainst'),
              pointDifferential: getStatValue(coreStats, STAT_DIFFERENTIAL),
              avgPointsFor: getStatValue(coreStats, STAT_AVG_POINTS_FOR),
              avgPointsAgainst: getStatValue(coreStats, STAT_AVG_POINTS_AGAINST),
            };
          }

          await Team.updateOne(
            { _id: teamData.team.id },
            {
              $set: {
                'record.overall':
                  overallRecord?.summary || teamData.team.record?.items?.[0]?.summary || null,
                'record.conference': conferenceRecord?.summary || null,
                'record.home': homeRecord?.summary || null,
                'record.away': awayRecord?.summary || null,
                'record.stats.wins': recordStats.wins,
                'record.stats.losses': recordStats.losses,
                'record.stats.winPercent': recordStats.winPercent,
                'record.stats.pointsFor': recordStats.pointsFor,
                'record.stats.pointsAgainst': recordStats.pointsAgainst,
                'record.stats.pointDifferential': recordStats.pointDifferential,
                'record.stats.avgPointsFor': recordStats.avgPointsFor,
                'record.stats.avgPointsAgainst': recordStats.avgPointsAgainst,
                lastUpdated: new Date(),
              },
            }
          );

          successfulUpdates++;
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          await ErrorLog.create({
            timestamp: new Date(),
            endpoint: `/api/cron/cfb/${conf}/update-team-averages`,
            payload: { team: teamAbbrev, conf, retry: true },
            error: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack || '' : '',
          });
          retryFailures.push(teamAbbrev);
        }
      }
    }

    return NextResponse.json<CronRankingsResponse>({
      updated: successfulUpdates,
      teamsChecked: teams.length,
      espnCalls: successfulUpdates * 2, // 2 API calls per successful team
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/cfb/${conf}/update-team-averages`,
      payload: { conf },
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

