import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeTeamsData } from '@/lib/cfb/helpers/reshape-teams';
import { TeamDataResponse } from '@/lib/types';
import {
  CONFERENCE_TEAMS_MAP,
  CONFERENCE_METADATA,
  type ConferenceSlug,
} from '@/lib/cfb/constants';
import { PullTeamsResponse, ApiErrorResponse } from '@/lib/api-types';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: { conf: string } }
) => {
  const conf = (await params).conf as ConferenceSlug;

  try {
    await dbConnect();

    const body = await request.json();
    const { teams, force } = body;

    const sport = 'football';
    const league = 'college-football';

    const client = createESPNClient(sport, league);

    let teamsToQuery: string[];
    if (teams) {
      teamsToQuery = teams;
    } else {
      if (!CONFERENCE_METADATA[conf]) {
        return NextResponse.json<ApiErrorResponse>(
          {
            error: `Unsupported conference: ${conf}`,
            code: 'INVALID_CONFERENCE',
          },
          { status: 400 }
        );
      }
      const conferenceTeams = CONFERENCE_TEAMS_MAP[CONFERENCE_METADATA[conf].espnId];
      if (!conferenceTeams) {
        return NextResponse.json<ApiErrorResponse>(
          {
            error: `Conference ${conf} not supported. Add conference to CONFERENCE_TEAMS_MAP in lib/cfb/constants.ts`,
            code: 'INVALID_CONFERENCE',
          },
          { status: 400 }
        );
      }
      teamsToQuery = [...conferenceTeams];
    }

    // Check if in season using ESPN calendar (with manual override for testing)
    // Tests automatically bypass the check since they're testing functionality, not season logic
    // Use current year as season since pull-teams doesn't have a season parameter
    const { searchParams } = new URL(request.url);
    const bypassSeasonCheck =
      force === true ||
      searchParams.get('force') === 'true' ||
      process.env.NODE_ENV === 'test';
    const currentSeason = new Date().getFullYear();

    if (!bypassSeasonCheck && !teams && !(await isInSeasonFromESPN(sport, league, conf, currentSeason))) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    const teamResponses: TeamDataResponse[] = [];

    for (const teamAbbrev of teamsToQuery) {
      try {
        const teamData = await client.getTeam(teamAbbrev);

        if (!teamData || !teamData.team) {
          teamResponses.push({
            abbreviation: teamAbbrev,
            data: null,
            recordData: undefined,
          });
          continue;
        }

        const teamId = teamData.team.id;

        let coreTeamData = null;
        try {
          coreTeamData = await client.getTeamRecords(teamId);
        } catch {
          teamResponses.push({
            abbreviation: teamAbbrev,
            data: teamData,
            recordData: undefined,
          });
          continue;
        }

        teamResponses.push({
          abbreviation: teamAbbrev,
          data: teamData,
          recordData: coreTeamData || undefined,
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        teamResponses.push({
          abbreviation: teamAbbrev,
          data: null,
          recordData: undefined,
        });
      }
    }

    const reshaped = reshapeTeamsData(teamResponses);

    // When pulling teams for a specific conference, ensure conferenceId is set correctly
    const conferenceEspnId = CONFERENCE_METADATA[conf].espnId.toString();
    for (const team of reshaped) {
      team.conferenceId = conferenceEspnId;
    }

    let upserted = 0;
    const errors: string[] = [];

    for (const team of reshaped) {
      try {
        await Team.findOneAndUpdate(
          { _id: team._id },
          {
            ...team,
            lastUpdated: new Date(),
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (error) {
        const errorMsg = `Failed to upsert team ${team._id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);

        await ErrorModel.create({
          timestamp: new Date(),
          endpoint: `/api/pull-teams/cfb/${conf}`,
          payload: { teamId: team._id },
          error: errorMsg,
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    return NextResponse.json<PullTeamsResponse>(
      {
        upserted,
        lastUpdated: new Date().toISOString(),
        ...(errors.length > 0 && { errors }),
      },
      { status: 200 }
    );
  } catch (error) {
    await ErrorModel.create({
      timestamp: new Date(),
      endpoint: `/api/pull-teams/cfb/${conf}`,
      payload: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
};

