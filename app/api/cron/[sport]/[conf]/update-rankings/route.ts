import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import ErrorLog from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import {
  RECORD_TYPE_OVERALL,
  RECORD_TYPE_HOME,
  RECORD_TYPE_HOME_BASKETBALL,
  RECORD_TYPE_AWAY,
  RECORD_TYPE_AWAY_BASKETBALL,
  RECORD_TYPE_CONFERENCE,
  STAT_AVG_POINTS_FOR,
  STAT_AVG_POINTS_AGAINST,
  STAT_WINS,
  STAT_LOSSES,
  STAT_DIFFERENTIAL,
  sports,
  type SportSlug,
  type ConferenceSlug,
} from '@/lib/constants';
import { CronRankingsResponse } from '@/lib/api-types';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sport, conf } = await params;

  const { conferences, espnRoute } = sports[sport];
  const conferenceMeta = conferences[conf];

  if (!conferenceMeta) {
    return NextResponse.json({ error: `Unsupported conference: ${conf}` }, { status: 400 });
  }

  try {
    await dbConnect();

    const conferenceTeams = await Team.find({ conferenceId: conferenceMeta.espnId }).lean();

    if (conferenceTeams.length === 0) {
      return NextResponse.json(
        {
          error: `No teams found for conference ${conf}. Call pull-games first to extract teams.`,
        },
        { status: 400 }
      );
    }

    const client = createESPNClient(espnRoute);

    const { searchParams } = new URL(request.url);
    const bypassSeasonCheck =
      searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, conf))) {
      return NextResponse.json(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    const failedTeams: string[] = [];
    let successfulUpdates = 0;

    for (const team of conferenceTeams) {
      try {
        const teamAbbrev = team.abbreviation;
        const teamData = await client.getTeam(teamAbbrev);

        const nationalRanking =
          teamData.team.rank && teamData.team.rank !== 99 ? teamData.team.rank : null;
        const conferenceStanding = teamData.team.standingSummary;

        const recordData = await client.getTeamRecords(teamData.team.id);

        const overallRecord = recordData?.items?.find((item) => item.name === RECORD_TYPE_OVERALL);
        const homeRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_HOME || item.type === RECORD_TYPE_HOME_BASKETBALL
        );
        const awayRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_AWAY || item.type === RECORD_TYPE_AWAY_BASKETBALL
        );
        const conferenceRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_CONFERENCE
        );

        const getStatValue = (
          stats: Array<{ name: string; value: number }> | undefined,
          statName: string
        ): number => {
          return stats?.find((s) => s.name === statName)?.value ?? 0;
        };

        const coreStats = overallRecord?.stats;

        const siteStats = teamData.team.record?.items?.find((item) => item.summary)?.stats || [];
        const useSiteAPI = !coreStats && siteStats.length > 0;

        let recordStats;
        if (useSiteAPI) {
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
              nationalRanking,
              conferenceStanding,
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
          endpoint: `/api/cron/${sport}/${conf}/update-rankings`,
          payload: { team: team.abbreviation, conf },
          error: error instanceof Error ? error.message : String(error),
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
        failedTeams.push(team.abbreviation);
      }
    }

    if (failedTeams.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const retryFailures: string[] = [];

      for (const teamAbbrev of failedTeams) {
        try {
          const teamData = await client.getTeam(teamAbbrev);

          const nationalRanking =
            teamData.team.rank && teamData.team.rank !== 99 ? teamData.team.rank : null;
          const conferenceStanding = teamData.team.standingSummary;

          const recordData = await client.getTeamRecords(teamData.team.id);

          const overallRecord = recordData?.items?.find(
            (item) => item.name === RECORD_TYPE_OVERALL
          );
          const homeRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_HOME || item.type === RECORD_TYPE_HOME_BASKETBALL
          );
          const awayRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_AWAY || item.type === RECORD_TYPE_AWAY_BASKETBALL
          );
          const conferenceRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_CONFERENCE
          );

          const getStatValue = (
            stats: Array<{ name: string; value: number }> | undefined,
            statName: string
          ): number => {
            return stats?.find((s) => s.name === statName)?.value ?? 0;
          };

          const coreStats = overallRecord?.stats;

          const siteStats = teamData.team.record?.items?.find((item) => item.summary)?.stats || [];
          const useSiteAPI = !coreStats && siteStats.length > 0;

          let recordStats;
          if (useSiteAPI) {
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
                nationalRanking,
                conferenceStanding,
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
            endpoint: `/api/cron/${sport}/${conf}/update-rankings`,
            payload: { team: teamAbbrev, conf, retry: true },
            error: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack || '' : '',
          });
          retryFailures.push(teamAbbrev);
        }
      }

      failedTeams.length = 0;
      failedTeams.push(...retryFailures);
    }

    return NextResponse.json<CronRankingsResponse>({
      updated: successfulUpdates,
      teamsChecked: conferenceTeams.length,
      espnCalls: conferenceTeams.length * 2 + failedTeams.length * 2,
      lastUpdated: new Date().toISOString(),
      errors: failedTeams.length > 0 ? failedTeams : undefined,
    });
  } catch (error) {
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: `/api/cron/${sport}/${conf}/update-rankings`,
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
