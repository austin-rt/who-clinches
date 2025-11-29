import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeTeamData } from '@/lib/reshape-teams';
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
import { TeamLean } from '@/lib/types';
import type { TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  try {
    await dbConnect();

    const { sport, conf } = await params;

    const body = await request.json().catch(() => ({}));
    const update = body.update; // 'rankings', 'stats', or undefined (full)
    const force = body.force === true;

    const { conferences, espnRoute } = sports[sport];
    const conferenceMeta = conferences[conf];

    if (!conferenceMeta) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${conf} for sport: ${sport}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    // Fetch from ESPN and upsert to database
    const bypassSeasonCheck = force || process.env.NODE_ENV === 'test';
    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, conf))) {
      // If off-season, just return existing data from DB
    } else {
      try {
        const client = createESPNClient(espnRoute);
        const conferenceTeams = await Team.find({ conferenceId: conferenceMeta.espnId }).lean();

        if (conferenceTeams.length === 0) {
          return NextResponse.json<ApiErrorResponse>(
            {
              error: `No teams found for conference ${conf}. Teams must be seeded first.`,
              code: 'NO_TEAMS',
            },
            { status: 400 }
          );
        }

        const failedTeams: string[] = [];
        const season = new Date().getFullYear();

        for (const team of conferenceTeams) {
          try {
            const teamAbbrev = team.abbreviation;
            const teamData = await client.getTeam(teamAbbrev);
            const recordData = await client.getTeamRecords(teamData.team.id, season);

            if (update === 'rankings' || update === 'stats') {
              // Update only rankings/stats, not full team data
              const nationalRanking =
                teamData.team.rank && teamData.team.rank !== 99 ? teamData.team.rank : null;
              const conferenceStanding = teamData.team.standingSummary;

              const overallRecord = recordData?.items?.find(
                (item) => item.name === RECORD_TYPE_OVERALL
              );
              const homeRecord = recordData?.items?.find(
                (item) =>
                  item.type === RECORD_TYPE_HOME || item.type === RECORD_TYPE_HOME_BASKETBALL
              );
              const awayRecord = recordData?.items?.find(
                (item) =>
                  item.type === RECORD_TYPE_AWAY || item.type === RECORD_TYPE_AWAY_BASKETBALL
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
              const siteStats =
                teamData.team.record?.items?.find((item) => item.summary)?.stats || [];
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
            } else {
              // Full update using reshape function
              const reshapedTeam = reshapeTeamData(teamData, recordData);
              if (reshapedTeam) {
                await Team.findOneAndUpdate({ _id: reshapedTeam._id }, reshapedTeam, {
                  upsert: true,
                  new: true,
                });
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            await ErrorModel.create({
              timestamp: new Date(),
              endpoint: `/api/teams/${sport}/${conf}`,
              payload: { team: team.abbreviation, conf },
              error: error instanceof Error ? error.message : String(error),
              stackTrace: error instanceof Error ? error.stack || '' : '',
            });
            failedTeams.push(team.abbreviation);
          }
        }
      } catch (error) {
        // Log error but continue to return data from DB
        await ErrorModel.create({
          timestamp: new Date(),
          endpoint: `/api/teams/${sport}/${conf}`,
          payload: { sport, conf, update },
          error: error instanceof Error ? error.message : 'Unknown error',
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    // Query database for teams
    const teamsRaw = await Team.find({ conferenceId: conferenceMeta.espnId })
      .lean()
      .sort({ nationalRanking: 1, 'record.stats.winPercent': -1 })
      .exec();

    const teams: TeamLean[] = teamsRaw.map((team): TeamLean => ({
      _id: String(team._id),
      name: String(team.name),
      displayName: String(team.displayName),
      abbreviation: String(team.abbreviation),
      logo: String(team.logo),
      color: String(team.color || '000000'),
      alternateColor: String(team.alternateColor || '000000'),
      conferenceId: String(team.conferenceId),
      record: team.record
        ? {
            overall: team.record.overall || undefined,
            conference: team.record.conference || undefined,
            home: team.record.home || undefined,
            away: team.record.away || undefined,
            stats: team.record.stats
              ? {
                  wins: team.record.stats.wins || 0,
                  losses: team.record.stats.losses || 0,
                  winPercent: team.record.stats.winPercent || 0,
                  pointsFor: team.record.stats.pointsFor || 0,
                  pointsAgainst: team.record.stats.pointsAgainst || 0,
                  pointDifferential: team.record.stats.pointDifferential || 0,
                  avgPointsFor: team.record.stats.avgPointsFor || 0,
                  avgPointsAgainst: team.record.stats.avgPointsAgainst || 0,
                }
              : undefined,
          }
        : undefined,
      conferenceStanding: team.conferenceStanding || undefined,
      nationalRanking: typeof team.nationalRanking === 'number' ? team.nationalRanking : undefined,
      playoffSeed: typeof team.playoffSeed === 'number' ? team.playoffSeed : undefined,
      nextGameId: team.nextGameId || undefined,
      lastUpdated: team.lastUpdated || new Date(),
    }));

    const teamMetadata: TeamMetadata[] = teams.map((team) => ({
      id: team._id,
      abbrev: team.abbreviation,
      name: team.name,
      displayName: team.displayName,
      logo: team.logo,
      color: team.color,
      alternateColor: team.alternateColor,
      conferenceStanding: team.conferenceStanding || 'Tied for 1st',
      conferenceRecord: team.record?.conference || '0-0',
    }));

    return NextResponse.json(
      {
        teams,
        teamsMetadata: teamMetadata,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    );
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
};

