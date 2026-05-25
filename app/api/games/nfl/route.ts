import { NextRequest, NextResponse } from 'next/server';
import { getAllSeasonGames, getTeams } from '@/lib/nfl/espn-cached';
import { reshapeEspnGames, reshapeEspnTeams } from '@/lib/nfl/reshape-espn';
import { getDefaultNflSeason } from '@/lib/nfl/helpers/get-default-season-nfl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    const seasonParam = request.nextUrl.searchParams.get('season');
    const season = seasonParam ? parseInt(seasonParam, 10) : getDefaultNflSeason();

    if (isNaN(season) || season < 2002 || season > 2099) {
      return NextResponse.json({ error: 'Invalid season' }, { status: 400 });
    }

    const [events, teamsData] = await Promise.all([getAllSeasonGames(season), getTeams()]);

    const games = reshapeEspnGames(events, season);
    const teams = reshapeEspnTeams(teamsData);

    const teamMetadata = teams.map((t) => ({
      id: t._id,
      abbrev: t.abbreviation,
      name: t.name,
      displayName: t.displayName,
      shortDisplayName: t.shortDisplayName,
      mascot: t.mascot,
      logo: t.logo,
      color: t.color,
      alternateColor: t.alternateColor,
      conferenceId: t.conferenceId,
      conferenceStanding: t.conferenceStanding,
      conferenceRecord: t.record.conference,
      record: t.record,
      rank: null,
      division: t.division,
    }));

    const hasLive = games.some((g) => g.state === 'in');

    return NextResponse.json(
      { events: games, teams: teamMetadata, season },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${hasLive ? 10 : 60}, stale-while-revalidate=300`,
        },
      }
    );
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, { endpoint: '/api/games/nfl', action: 'get-games' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
