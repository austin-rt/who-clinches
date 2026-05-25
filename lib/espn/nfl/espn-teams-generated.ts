export interface EspnTeamsGenerated {
  sports: Sport[];
}

export interface Sport {
  id: string;
  leagues: League[];
  name: string;
  slug: string;
  uid: string;
}

export interface League {
  abbreviation: string;
  id: string;
  name: string;
  season: Season;
  shortName: string;
  slug: string;
  teams: TeamElement[];
  uid: string;
  year: number;
}

export interface Season {
  displayName: string;
  year: number;
}

export interface TeamElement {
  team: TeamTeam;
}

export interface TeamTeam {
  abbreviation: string;
  alternateColor: string;
  color: string;
  displayName: string;
  id: string;
  isActive: boolean;
  isAllStar: boolean;
  links: Link[];
  location: string;
  logos: Logo[];
  name: string;
  nickname: string;
  shortDisplayName: string;
  slug: string;
  uid: string;
}

export interface Link {
  href: string;
  isExternal: boolean;
  isHidden: boolean;
  isPremium: boolean;
  language: string;
  rel: string[];
  shortText: string;
  text: string;
}

export interface Logo {
  alt: string;
  height: number;
  href: string;
  rel: string[];
  width: number;
}
