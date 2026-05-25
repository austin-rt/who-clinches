export interface EspnScoreboardGenerated {
  leagues: League[];
  events: Event[];
  provider: Provider;
  week: Week;
}

export interface Event {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: EventSeason;
  week: Week;
  competitions: Competition[];
  links: EventLink[];
  status: Status;
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  type: CompetitionType;
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  venue: CompetitionVenue;
  competitors: Competitor[];
  notes: Note[];
  status: Status;
  broadcasts: Broadcast[];
  leaders: CompetitionLeader[];
  format: Format;
  startDate: string;
  broadcast: string;
  geoBroadcasts: GeoBroadcast[];
  highlights: Highlight[];
  headlines?: Headline[];
}

export interface Highlight {
  id: number;
  source: string;
  headline: string;
  description: string;
}

export interface Broadcast {
  market: string;
  names: string[];
}

export interface Competitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: string;
  winner: boolean;
  team: Team;
  score: string;
  linescores: Linescore[];
  statistics: CompetitorStatistic[];
  records: Record[];
}

export interface CompetitorStatistic {
  name: string;
  abbreviation: string;
  displayValue: string;
}

export interface Linescore {
  value: number;
  displayValue: string;
  period: number;
}

export interface Record {
  name: string;
  abbreviation?: string;
  type: string;
  summary: string;
}

export interface Team {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  venue: TeamClass;
  links: TeamLink[];
  logo: string;
}

export interface TeamLink {
  rel: string[];
  href: string;
  text: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface TeamClass {
  id: string;
}

export interface Format {
  regulation: Regulation;
}

export interface Regulation {
  periods: number;
}

export interface GeoBroadcast {
  type: GeoBroadcastType;
  market: Market;
  media: Media;
  lang: string;
  region: string;
}

export interface Market {
  id: string;
  type: string;
}

export interface Media {
  shortName: string;
  logo?: string;
  darkLogo?: string;
}

export interface GeoBroadcastType {
  id: string;
  shortName: string;
}

export interface Headline {
  type: string;
  description: string;
  shortLinkText: string;
}

export interface CompetitionLeader {
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  leaders: LeaderLeader[];
}

export interface LeaderLeader {
  displayValue: string;
  value: number;
  athlete: Athlete;
  team: TeamClass;
}

export interface Athlete {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  links: LinkElement[];
  headshot: string;
  jersey?: string;
  position: Position;
  team: TeamClass;
  active: boolean;
}

export interface LinkElement {
  rel: string[];
  href: string;
}

export interface Position {
  abbreviation: string;
}

export interface Note {
  type: string;
  headline: string;
}

export interface Status {
  clock: number;
  displayClock: string;
  period: number;
  type: StatusType;
  isTBDFlex?: boolean;
}

export interface StatusType {
  id: string;
  name: string;
  state: string;
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
  altDetail?: string;
}

export interface CompetitionType {
  id: string;
  abbreviation: string;
}

export interface CompetitionVenue {
  id: string;
  fullName: string;
  address: Address;
  indoor: boolean;
}

export interface Address {
  city: string;
  state?: string;
  country: string;
}

export interface EventLink {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface EventSeason {
  year: number;
  type: number;
  slug: string;
}

export interface Week {
  number: number;
}

export interface League {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  slug: string;
  season: LeagueSeason;
  logos: LeagueLogo[];
  calendar: CalendarEntry[];
}

export interface CalendarEntry {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  entries: CalendarWeekEntry[];
}

export interface CalendarWeekEntry {
  label: string;
  alternateLabel: string;
  detail: string;
  value: string;
  startDate: string;
  endDate: string;
}

export interface LeagueLogo {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated: string;
}

export interface LeagueSeason {
  year: number;
  startDate: string;
  endDate: string;
  displayName: string;
  type: SeasonType;
}

export interface SeasonType {
  id: string;
  type: number;
  name: string;
  abbreviation: string;
}

export interface Provider {
  id: string;
  name: string;
  displayName: string;
  priority: number;
  logos: LinkElement[];
}
