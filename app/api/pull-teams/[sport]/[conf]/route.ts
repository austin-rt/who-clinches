import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { PullTeamsResponse, ApiErrorResponse } from '@/lib/api-types';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';
import { extractTeamsFromScoreboard } from '@/lib/reshape-teams-from-scoreboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  const { sport, conf } = await params;

  try {
    await dbConnect();

    const body = await request.json();
    const { force } = body;

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

    const { searchParams } = new URL(request.url);
    const bypassSeasonCheck =
      force === true || searchParams.get('force') === 'true' || process.env.NODE_ENV === 'test';

    if (!bypassSeasonCheck && !(await isInSeasonFromESPN(sport, conf))) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error:
            'Off-season: Data updates are disabled outside the season to prevent overwriting accurate data. Use ?force=true to override for testing.',
          code: 'OFF_SEASON',
        },
        { status: 403 }
      );
    }

    const existingTeams = await Team.find({ conferenceId: conferenceMeta.espnId }).lean();

    let upserted = 0;
    const errors: string[] = [];

    if (existingTeams.length === 0) {
      const client = createESPNClient(espnRoute);

      let seasonYear: number;
      try {
        const calendarResponse = await client.getScoreboard({
          groups: conferenceMeta.espnId,
        });
        seasonYear =
          calendarResponse.season?.year ||
          calendarResponse.leagues?.[0]?.season?.year ||
          new Date().getFullYear();
      } catch {
        seasonYear = new Date().getFullYear();
      }

      // Call scoreboard to extract teams
      const scoreboardResponse = await client.getScoreboard({
        groups: conferenceMeta.espnId,
        dates: seasonYear,
      });

      // Extract teams from scoreboard
      const teams = extractTeamsFromScoreboard(scoreboardResponse, conferenceMeta);

      // Store teams using findOneAndUpdate with upsert (handles both create and update)
      for (const team of teams) {
        try {
          await Team.findOneAndUpdate({ _id: team._id }, team, { upsert: true, new: true });
          upserted++;
        } catch (error) {
          const errorMsg = `Failed to upsert team ${team._id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          errors.push(errorMsg);

          await ErrorModel.create({
            timestamp: new Date(),
            endpoint: `/api/pull-teams/${sport}/${conf}`,
            payload: { teamId: team._id },
            error: errorMsg,
            stackTrace: error instanceof Error ? error.stack || '' : '',
          });
        }
      }
    } else if (existingTeams.length === conferenceMeta.teams) {
      // All teams exist - return existing count
      upserted = existingTeams.length;
    } else {
      // Partial teams - extract to fill gaps
      const client = createESPNClient(espnRoute);

      // Get season year from calendar
      let seasonYear: number;
      try {
        const calendarResponse = await client.getScoreboard({
          groups: conferenceMeta.espnId,
        });
        seasonYear =
          calendarResponse.season?.year ||
          calendarResponse.leagues?.[0]?.season?.year ||
          new Date().getFullYear();
      } catch {
        seasonYear = new Date().getFullYear();
      }

      // Call scoreboard to extract teams
      const scoreboardResponse = await client.getScoreboard({
        groups: conferenceMeta.espnId,
        dates: seasonYear,
      });

      // Extract teams from scoreboard
      const teams = extractTeamsFromScoreboard(scoreboardResponse, conferenceMeta);

      // Store teams using findOneAndUpdate with upsert (handles both create and update)
      for (const team of teams) {
        try {
          await Team.findOneAndUpdate({ _id: team._id }, team, { upsert: true, new: true });
          upserted++;
        } catch (error) {
          const errorMsg = `Failed to upsert team ${team._id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          errors.push(errorMsg);

          await ErrorModel.create({
            timestamp: new Date(),
            endpoint: `/api/pull-teams/${sport}/${conf}`,
            payload: { teamId: team._id },
            error: errorMsg,
            stackTrace: error instanceof Error ? error.stack || '' : '',
          });
        }
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
      endpoint: `/api/pull-teams/${sport}/${conf}`,
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
