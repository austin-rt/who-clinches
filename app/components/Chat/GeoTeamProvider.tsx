'use client';

import { createContext, useContext } from 'react';

interface GeoTeamContextValue {
  teamName: string | null;
  teamId: string | null;
}

const GeoTeamCtx = createContext<GeoTeamContextValue>({ teamName: null, teamId: null });

export const GeoTeamProvider = ({
  teamName,
  teamId,
  children,
}: GeoTeamContextValue & { children: React.ReactNode }) => {
  return <GeoTeamCtx.Provider value={{ teamName, teamId }}>{children}</GeoTeamCtx.Provider>;
};

export const useGeoTeam = () => {
  return useContext(GeoTeamCtx);
};
