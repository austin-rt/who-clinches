import { headers } from 'next/headers';
import { GeoTeamProvider } from '@/app/components/Chat/GeoTeamProvider';

export default async function ConferenceLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const geoTeamName = headersList.get('x-geo-team') ?? null;
  const geoTeamId = headersList.get('x-geo-team-id') ?? null;

  return (
    <GeoTeamProvider teamName={geoTeamName} teamId={geoTeamId}>
      {children}
    </GeoTeamProvider>
  );
}
