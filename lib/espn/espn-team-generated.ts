import { GameState } from '@/lib/types';
export interface EspnTeamGenerated {
  team: EspnTeamGeneratedTeam;
}

export interface EspnTeamGeneratedTeam {
  id: string;
  uid: string;
  slug: string;
  location: string;
  name: string;
  nickname: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  logos: Logo[];
  record: TeamRecord;
  groups: Groups;
  links: NextEventLink[];
  nextEvent: NextEvent[];
  standingSummary: string;
  rank: number;
}

export interface Groups {
  id: string;
  parent: Parent;
  isConference: boolean;
}

export interface Parent {
  id: string;
}

export interface NextEventLink {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface Logo {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated: string;
}

export interface NextEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: Season;
  seasonType: SeasonType;
  week: Week;
  timeValid: boolean;
  competitions: Competition[];
  links: NextEventLink[];
}

export interface Competition {
  id: string;
  date: string;
  attendance: number;
  type: CompetitionType;
  timeValid: boolean;
  neutralSite: boolean;
  boxscoreAvailable: boolean;
  ticketsAvailable: boolean;
  venue: Venue;
  competitors: Competitor[];
  notes: any[];
  broadcasts: Broadcast[];
  status: Status;
}

export interface Broadcast {
  type: BroadcastType;
  market: Market;
  media: Media;
  lang: string;
  region: string;
  partnered: boolean;
}

export interface Market {
  id: string;
  type: string;
}

export interface Media {
  shortName: string;
}

export interface BroadcastType {
  id: string;
  shortName: string;
}

export interface Competitor {
  id: string;
  type: string;
  order: number;
  homeAway: string;
  winner: boolean;
  team: CompetitorTeam;
  score: Score;
  record: RecordElement[];
  curatedRank: CuratedRank;
}

export interface CuratedRank {
  current: number;
}

export interface RecordElement {
  id: string;
  abbreviation?: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  type: string;
  displayValue: string;
}

export interface Score {
  value: number;
  displayValue: string;
}

export interface CompetitorTeam {
  id: string;
  location: string;
  nickname: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logos: Logo[];
  links: PurpleLink[];
}

export interface PurpleLink {
  rel: string[];
  href: string;
  text: string;
}

export interface Status {
  clock: number;
  displayClock: string;
  period: number;
  type: StatusType;
}

export interface StatusType {
  id: string;
  name: string;
  state: GameState;
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface CompetitionType {
  id: string;
  text: string;
  abbreviation: string;
  slug: string;
  type: string;
}

export interface Venue {
  fullName: string;
  address: Address;
}

export interface Address {
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Season {
  year: number;
  displayName: string;
}

export interface SeasonType {
  id: string;
  type: number;
  name: string;
  abbreviation: string;
}

export interface Week {
  number: number;
  text: string;
}

export interface TeamRecord {
  items: Item[];
}

export interface Item {
  description: string;
  type: string;
  summary: string;
  stats: Stat[];
}

export interface Stat {
  name: string;
  value: number;
}
