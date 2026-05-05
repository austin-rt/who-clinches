import { ImageResponse } from 'next/og';
import { db } from '@/lib/db/client';
import type { SimulateResponse, StandingEntry } from '@/app/store/api';
import type { TeamLean, GameLean } from '@/lib/types';

interface SnapshotPayload {
  input: { overrides: Record<string, { homeScore: number; awayScore: number }> };
  output: SimulateResponse;
  teams: TeamLean[];
  games: GameLean[];
}

export const runtime = 'nodejs';
export const alt = 'Simulation Results';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OGImage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const snapshot = await db.simulationSnapshot.findUnique({ where: { id } });

  if (!snapshot) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
            fontSize: 48,
          }}
        >
          Simulation Not Found
        </div>
      ),
      { ...size }
    );
  }

  const payload = snapshot.payload as unknown as SnapshotPayload;
  const { output } = payload;
  const [team1Id, team2Id] = output.championship;
  const team1 = output.standings.find((s) => s.teamId === team1Id);
  const team2 = output.standings.find((s) => s.teamId === team2Id);
  const topStandings = output.standings.slice(0, 6);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a2e',
          color: '#ffffff',
          padding: '48px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: 40, fontWeight: 700 }}>
              {snapshot.conf.toUpperCase()} {snapshot.season}
            </div>
            <div style={{ fontSize: 20, color: '#a0a0b0' }}>Simulation Results</div>
          </div>
          <div style={{ fontSize: 20, color: '#a0a0b0' }}>whoclinches.com</div>
        </div>

        {team1 && team2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              marginTop: '32px',
              padding: '24px',
              backgroundColor: '#2a2a3e',
              borderRadius: '16px',
            }}
          >
            <TeamBlock team={team1} />
            <div style={{ fontSize: 28, color: '#a0a0b0' }}>vs</div>
            <TeamBlock team={team2} />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '32px',
          }}
        >
          <div style={{ fontSize: 18, color: '#a0a0b0', marginBottom: '4px' }}>Standings</div>
          {topStandings.map((s) => (
            <div
              key={s.teamId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: 20,
              }}
            >
              <span style={{ width: '28px', textAlign: 'right', color: '#a0a0b0' }}>{s.rank}.</span>
              {s.logo && <img src={s.logo} alt="" width={24} height={24} />}
              <span>{s.displayName}</span>
              <span style={{ color: '#a0a0b0' }}>
                ({s.confRecord.wins}-{s.confRecord.losses})
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
};

export default OGImage;

const TeamBlock = ({ team }: { team: StandingEntry }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {team.logo && <img src={team.logo} alt="" width={72} height={72} />}
      <span style={{ fontSize: 24, fontWeight: 600 }}>{team.abbrev}</span>
    </div>
  );
};
