import { GameState } from '@/lib/types';
export interface EspnScoreboardGenerated {
  leagues: League[];
  groups: string[];
  season: EspnScoreboardGeneratedSeason;
  week: Week;
  events: Event[];
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
  links: OddLink[];
  status: Status;
  weather?: Weather;
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  type: CompetitionType;
  timeValid: boolean;
  dateValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  venue: CompetitionVenue;
  competitors: Competitor[];
  notes: Note[];
  status: Status;
  broadcasts: Broadcast[];
  leaders: CompetitorLeader[];
  format: Format;
  startDate: string;
  broadcast: string;
  geoBroadcasts: GeoBroadcast[];
  highlights: Highlight[];
  headlines?: Headline[];
  groups?: Groups;
  tickets?: Ticket[];
  odds?: Odd[];
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
  winner?: boolean;
  team: CompetitorTeam;
  score: string;
  linescores?: Linescore[];
  statistics: any[];
  curatedRank: CuratedRank;
  records: Record[];
  leaders?: CompetitorLeader[];
}

export interface CuratedRank {
  current: number;
}

export interface CompetitorLeader {
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
  jersey: string;
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

export interface TeamClass {
  id: string;
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

export interface CompetitorTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color?: string;
  alternateColor?: string;
  isActive: boolean;
  venue: TeamClass;
  links: TeamLink[];
  logo: string;
  conferenceId: string;
}

export interface TeamLink {
  rel: string[];
  href: string;
  text: string;
  isExternal: boolean;
  isPremium: boolean;
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

export interface Groups {
  id: string;
  name: string;
  shortName: string;
  isConference: boolean;
}

export interface Headline {
  type: string;
  description: string;
  shortLinkText: string;
  video?: Video[];
}

export interface Video {
  id: number;
  source: string;
  headline: string;
  thumbnail: string;
  duration: number;
  tracking: VideoTracking;
  deviceRestrictions: DeviceRestrictions;
  links: Links;
}

export interface DeviceRestrictions {
  type: string;
  devices: string[];
}

export interface Links {
  web: Web;
  mobile: Mobile;
  api: Api;
  source: Source;
  sportscenter: Sportscenter;
}

export interface Api {
  self: Sportscenter;
  artwork: Sportscenter;
}

export interface Sportscenter {
  href: string;
}

export interface Mobile {
  source: Sportscenter;
  alert: Sportscenter;
  streaming: Sportscenter;
  progressiveDownload: Sportscenter;
}

export interface Source {
  href: string;
  mezzanine: Sportscenter;
  flash: Sportscenter;
  hds: Sportscenter;
  HLS: HLS;
  HD: Sportscenter;
  full: Sportscenter;
}

export interface HLS {
  href: string;
  HD: Sportscenter;
  cmaf: Cmaf;
  '9x16'?: Sportscenter;
  shield: Sportscenter;
}

export interface Cmaf {
  href: string;
  '9x16'?: Sportscenter;
}

export interface Web {
  href: string;
  self: Self;
  seo: Sportscenter;
}

export interface Self {
  href: string;
  dsi: Sportscenter;
}

export interface VideoTracking {
  sportName: string;
  leagueName: string;
  coverageType: string;
  trackingName: string;
  trackingId: string;
}

export interface Highlight {
  id: number;
  cerebroId: string;
  source: string;
  headline: string;
  description: string;
  lastModified: Date;
  originalPublishDate: Date;
  duration: number;
  timeRestrictions: TimeRestrictions;
  deviceRestrictions: DeviceRestrictions;
  thumbnail: string;
  links: Links;
  ad: Ad;
  tracking: VideoTracking;
}

export interface Ad {
  sport: string;
  bundle: string;
}

export interface TimeRestrictions {
  embargoDate: Date;
  expirationDate: Date;
}

export interface Note {
  type: string;
  headline: string;
}

export interface Odd {
  provider: Provider;
  details: string;
  overUnder: number;
  spread: number;
  awayTeamOdds: TeamOdds;
  homeTeamOdds: TeamOdds;
  moneyline: Moneyline;
  pointSpread: PointSpread;
  total: Total;
  link: OddLink;
  header: Header;
}

export interface TeamOdds {
  favorite: boolean;
  underdog: boolean;
  team: AwayTeamOddsTeam;
  favoriteAtOpen: boolean;
}

export interface AwayTeamOddsTeam {
  id: string;
  uid: string;
  abbreviation: string;
  name: string;
  displayName: string;
  logo: string;
}

export interface Header {
  logo: HeaderLogo;
  text: string;
}

export interface HeaderLogo {
  dark: string;
  light: string;
  exclusivesLogoDark: string;
  exclusivesLogoLight: string;
}

export interface OddLink {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
  tracking?: LinkTracking;
}

export interface LinkTracking {
  campaign: string;
  tags: Tags;
}

export interface Tags {
  league: string;
  sport: string;
  gameId: number;
  betSide: string;
  betType: string;
  betDetails?: string;
}

export interface Moneyline {
  displayName: string;
  shortDisplayName: string;
  home: MoneylineAway;
  away: MoneylineAway;
}

export interface MoneylineAway {
  close: PurpleClose;
  open: PurpleOpen;
}

export interface PurpleClose {
  odds: string;
  link?: OddLink;
}

export interface PurpleOpen {
  odds: string;
}

export interface PointSpread {
  displayName: string;
  shortDisplayName: string;
  home: OverClass;
  away: OverClass;
}

export interface OverClass {
  close: OverClose;
  open: OverOpen;
}

export interface OverClose {
  line: string;
  odds: string;
  link: OddLink;
}

export interface OverOpen {
  line: string;
  odds: string;
}

export interface Provider {
  id: string;
  name: string;
  priority: number;
  logos: LinkElement[];
}

export interface Total {
  displayName: string;
  shortDisplayName: string;
  over: OverClass;
  under: OverClass;
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
  altDetail?: string;
}

export interface Ticket {
  summary: string;
  numberAvailable: number;
  links: Sportscenter[];
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
  state: string;
  country: string;
}

export interface EventSeason {
  year: number;
  type: number;
  slug: string;
}

export interface Weather {
  displayValue: string;
  temperature: number;
  highTemperature: number;
  conditionId: string;
  link: OddLink;
}

export interface Week {
  number: number;
}

export interface League {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  midsizeName: string;
  slug: string;
  season: LeagueSeason;
  logos: LeagueLogo[];
  calendarType: string;
  calendarIsWhitelist: boolean;
  calendarStartDate: string;
  calendarEndDate: string;
  calendar: Calendar[];
}

export interface Calendar {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  entries: Entry[];
}

export interface Entry {
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

export interface EspnScoreboardGeneratedSeason {
  type: number;
  year: number;
}
