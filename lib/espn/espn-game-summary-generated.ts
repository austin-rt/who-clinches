import { GameState } from '@/lib/types';
export interface EspnGameSummaryGenerated {
    boxscore:           Boxscore;
    format:             Format;
    gameInfo:           GameInfo;
    drives:             Drives;
    leaders:            EspnGameSummaryGeneratedLeader[];
    broadcasts:         EspnGameSummaryGeneratedBroadcast[];
    pickcenter:         Pickcenter[];
    againstTheSpread:   AgainstTheSpread[];
    odds:               any[];
    header:             EspnGameSummaryGeneratedHeader;
    news:               News;
    winprobability:     Winprobability[];
    scoringPlays:       ScoringPlay[];
    article:            EspnGameSummaryGeneratedArticle;
    videos:             EspnGameSummaryGeneratedVideo[];
    wallclockAvailable: boolean;
    meta:               Meta;
    standings:          EspnGameSummaryGeneratedStandings;
}

export interface AgainstTheSpread {
    team:    AgainstTheSpreadTeam;
    records: any[];
}

export interface AgainstTheSpreadTeam {
    id:           string;
    uid:          string;
    displayName:  string;
    abbreviation: string;
    links:        FullViewLinkElement[];
    logo:         string;
    logos:        LogoElement[];
}

export interface FullViewLinkElement {
    href: string;
    text: string;
}

export interface LogoElement {
    href:         string;
    width:        number;
    height:       number;
    alt:          string;
    rel:          string[];
    lastUpdated?: string;
}

export interface EspnGameSummaryGeneratedArticle {
    id:                    number;
    nowId:                 string;
    contentKey:            string;
    dataSourceIdentifier:  string;
    publishedkey:          string;
    type:                  string;
    gameId:                string;
    headline:              string;
    description:           string;
    linkText:              string;
    categorized:           Date;
    originallyPosted:      Date;
    lastModified:          Date;
    published:             Date;
    section:               string;
    source:                string;
    images:                PurpleImage[];
    video:                 ArticleVideo[];
    categories:            VideoCategory[];
    keywords:              string[];
    story:                 string;
    premium:               boolean;
    isLiveBlog:            boolean;
    links:                 PurpleLinks;
    allowComments:         boolean;
    allowSearch:           boolean;
    allowContentReactions: boolean;
}

export interface VideoCategory {
    id?:          number;
    type:         string;
    uid?:         string;
    guid:         string;
    description?: string;
    sportId?:     number;
    teamId?:      number;
    team?:        CategoryTeam;
    leagueId?:    number;
    league?:      CategoryLeague;
    eventId?:     number;
    event?:       Event;
    topicId?:     number;
}

export interface Event {
    id:          number;
    sport:       string;
    league:      string;
    description: string;
    links?:      EventLinks;
}

export interface EventLinks {
    web:    PurpleMobile;
    mobile: PurpleMobile;
}

export interface PurpleMobile {
    event: SelfClass;
}

export interface SelfClass {
    href: string;
}

export interface CategoryLeague {
    id:           number;
    description:  string;
    abbreviation: string;
    links:        LeagueLinks;
}

export interface LeagueLinks {
    web:    FluffyMobile;
    mobile: FluffyMobile;
}

export interface FluffyMobile {
    leagues: SelfClass;
}

export interface CategoryTeam {
    id:          number;
    description: string;
    links?:      TeamLinks;
}

export interface TeamLinks {
    web:    TentacledMobile;
    mobile: TentacledMobile;
}

export interface TentacledMobile {
    teams: SelfClass;
}

export interface PurpleImage {
    type:    string;
    name:    string;
    caption: string;
    height:  number;
    width:   number;
    url:     string;
}

export interface PurpleLinks {
    web:    SelfClass;
    mobile: SelfClass;
    api:    Purpleapi;
    app:    App;
}

export interface Purpleapi {
    self: SelfClass;
}

export interface App {
    sportscenter: SelfClass;
}

export interface ArticleVideo {
    id:                   number;
    dataSourceIdentifier: string;
    cerebroId:            string;
    pccId:                string;
    source:               string;
    headline:             string;
    caption:              string;
    title:                string;
    description:          string;
    lastModified:         Date;
    originalPublishDate:  Date;
    premium:              boolean;
    syndicatable:         boolean;
    duration:             number;
    videoRatio:           string;
    timeRestrictions:     TimeRestrictions;
    deviceRestrictions:   DeviceRestrictions;
    gameId:               number;
    thumbnail:            string;
    images:               VideoImage[];
    posterImages:         PosterImages;
    links:                VideoLinks;
    categories:           VideoCategory[];
    ad:                   Ad;
    tracking:             Tracking;
}

export interface Ad {
    sport:  string;
    bundle: string;
}

export interface DeviceRestrictions {
    type:    string;
    devices: string[];
}

export interface VideoImage {
    name:    string;
    caption: string;
    alt:     string;
    credit:  string;
    height:  number;
    width:   number;
    url:     string;
}

export interface VideoLinks {
    web:          Web;
    mobile:       StickyMobile;
    api:          Fluffyapi;
    source:       Source;
    sportscenter: SelfClass;
}

export interface Fluffyapi {
    self:     SelfClass;
    artwork?: SelfClass;
}

export interface StickyMobile {
    href:                string;
    source:              SelfClass;
    alert:               SelfClass;
    streaming:           SelfClass;
    progressiveDownload: SelfClass;
}

export interface Source {
    href:      string;
    mezzanine: SelfClass;
    flash:     SelfClass;
    hds:       SelfClass;
    HLS:       HLS;
    HD:        SelfClass;
    full:      SelfClass;
}

export interface HLS {
    href:   string;
    HD:     SelfClass;
    cmaf:   SelfClass;
    shield: SelfClass;
}

export interface Web {
    href:  string;
    self?: Self;
    seo?:  SelfClass;
}

export interface Self {
    href: string;
    dsi:  SelfClass;
}

export interface PosterImages {
    default: Default;
    full:    SelfClass;
    wide:    SelfClass;
    square:  SelfClass;
}

export interface Default {
    href:   string;
    width:  number;
    height: number;
}

export interface TimeRestrictions {
    embargoDate:    Date;
    expirationDate: Date;
}

export interface Tracking {
    sportName:    string;
    leagueName:   string;
    coverageType: string;
    trackingName: string;
    trackingId:   string;
}

export interface Boxscore {
    teams:   TeamElement[];
    players: Player[];
}

export interface Player {
    team:         PlayerTeam;
    statistics:   PlayerStatistic[];
    displayOrder: number;
}

export interface PlayerStatistic {
    name:         string;
    keys:         string[];
    text:         string;
    labels:       string[];
    descriptions: string[];
    athletes:     AthleteElement[];
    totals:       string[];
}

export interface AthleteElement {
    athlete: AthleteAthlete;
    stats:   string[];
}

export interface AthleteAthlete {
    id:          string;
    uid:         string;
    guid?:       string;
    firstName:   string;
    lastName:    string;
    displayName: string;
    links:       AthleteLink[];
    headshot?:   Headshot;
    jersey?:     string;
}

export interface Headshot {
    href: string;
    alt:  string;
}

export interface AthleteLink {
    rel:  string[];
    href: string;
    text: string;
}

export interface PlayerTeam {
    id:               string;
    uid:              string;
    slug:             string;
    location:         string;
    name:             string;
    abbreviation:     string;
    displayName:      string;
    shortDisplayName: string;
    color:            string;
    alternateColor:   string;
    logo:             string;
}

export interface TeamElement {
    team:         PlayerTeam;
    statistics:   TeamStatistic[];
    displayOrder: number;
    homeAway:     string;
}

export interface TeamStatistic {
    name:         string;
    displayValue: string;
    value:        number | string;
    label:        string;
}

export interface EspnGameSummaryGeneratedBroadcast {
    type:       PurpleType;
    station:    string;
    stationKey: string;
    market:     Market;
    media:      PurpleMedia;
    lang:       string;
    region:     string;
    isNational: boolean;
}

export interface Market {
    id:   string;
    type: string;
}

export interface PurpleMedia {
    callLetters: string;
    name:        string;
    shortName:   string;
}

export interface PurpleType {
    id:        string;
    shortName: string;
    longName:  string;
    slug:      string;
}

export interface Drives {
    previous: Previous[];
}

export interface Previous {
    id:                 string;
    description:        string;
    team:               PreviousTeam;
    start:              PreviousEnd;
    end:                PreviousEnd;
    timeElapsed:        TimeElapsed;
    yards:              number;
    isScore:            boolean;
    offensivePlays:     number;
    result:             string;
    shortDisplayResult: string;
    displayResult:      string;
    plays:              Play[];
}

export interface PreviousEnd {
    period:   EndPeriod;
    clock?:   TimeElapsed;
    yardLine: number;
    text:     string;
}

export interface TimeElapsed {
    displayValue: string;
}

export interface EndPeriod {
    type:   string;
    number: number;
}

export interface Play {
    id:                 string;
    sequenceNumber:     string;
    type:               PlayType;
    text:               string;
    awayScore:          number;
    homeScore:          number;
    period:             PlayPeriod;
    clock:              TimeElapsed;
    scoringPlay:        boolean;
    priority:           boolean;
    modified:           string;
    wallclock?:         Date;
    teamParticipants:   TeamParticipant[];
    start:              PlayEnd;
    end:                PlayEnd;
    statYardage:        number;
    scoringType?:       ScoringType;
    mediaId?:           string;
    pointAfterAttempt?: PointAfterAttempt;
}

export interface PlayEnd {
    down:                   number;
    distance:               number;
    yardLine:               number;
    yardsToEndzone:         number;
    team:                   GroupsClass;
    downDistanceText?:      string;
    shortDownDistanceText?: string;
    possessionText?:        string;
}

export interface GroupsClass {
    id: string;
}

export interface PlayPeriod {
    number: number;
}

export interface PointAfterAttempt {
    id:           number;
    text:         string;
    abbreviation: string;
    value:        number;
}

export interface ScoringType {
    name:         string;
    displayName:  string;
    abbreviation: string;
}

export interface TeamParticipant {
    team:  TeamParticipantTeam;
    id:    string;
    order: number;
    type:  string;
}

export interface TeamParticipantTeam {
    $ref: string;
}

export interface PlayType {
    id:            string;
    text:          string;
    abbreviation?: string;
}

export interface PreviousTeam {
    id:               string;
    name:             string;
    abbreviation:     string;
    displayName:      string;
    shortDisplayName: string;
    logos:            LogoElement[];
}

export interface Format {
    regulation: Overtime;
    overtime:   Overtime;
}

export interface Overtime {
    periods:     number;
    displayName: string;
    slug:        string;
    clock?:      number;
}

export interface GameInfo {
    venue:      Venue;
    attendance: number;
}

export interface Venue {
    id:       string;
    guid:     string;
    fullName: string;
    address:  Address;
    grass:    boolean;
    images:   LogoElement[];
}

export interface Address {
    city:    string;
    state:   string;
    zipCode: string;
    country: string;
}

export interface EspnGameSummaryGeneratedHeader {
    id:           string;
    uid:          string;
    season:       Season;
    timeValid:    boolean;
    competitions: Competition[];
    links:        HeaderLink[];
    week:         number;
    league:       HeaderLeague;
    gameNote:     string;
}

export interface Competition {
    id:                    string;
    uid:                   string;
    date:                  string;
    dateValid:             boolean;
    neutralSite:           boolean;
    conferenceCompetition: boolean;
    boxscoreAvailable:     boolean;
    commentaryAvailable:   boolean;
    liveAvailable:         boolean;
    onWatchESPN:           boolean;
    recent:                boolean;
    wallclockAvailable:    boolean;
    boxscoreSource:        string;
    playByPlaySource:      string;
    competitors:           Competitor[];
    status:                CompetitionStatus;
    broadcasts:            CompetitionBroadcast[];
    boxscoreMinutes:       boolean;
}

export interface CompetitionBroadcast {
    type:       FluffyType;
    market:     Market;
    media:      FluffyMedia;
    lang:       string;
    region:     string;
    isNational: boolean;
    url?:       string;
}

export interface FluffyMedia {
    shortName: string;
}

export interface FluffyType {
    id:        string;
    shortName: string;
}

export interface Competitor {
    id:         string;
    uid:        string;
    order:      number;
    homeAway:   string;
    winner:     boolean;
    team:       CompetitorTeam;
    score:      string;
    linescores: TimeElapsed[];
    record:     Record[];
    possession: boolean;
    rank:       number;
}

export interface Record {
    type:         string;
    summary:      string;
    displayValue: string;
}

export interface CompetitorTeam {
    id:             string;
    guid:           string;
    uid:            string;
    location:       string;
    name:           string;
    nickname:       string;
    abbreviation:   string;
    displayName:    string;
    color:          string;
    alternateColor: string;
    logos:          LogoElement[];
    groups:         GroupsClass;
    links:          AthleteLink[];
}

export interface CompetitionStatus {
    type: StatusType;
}

export interface StatusType {
    id:          string;
    name:        string;
    state:       GameState;
    completed:   boolean;
    description: string;
    detail:      string;
    shortDetail: string;
    altDetail:   string;
}

export interface HeaderLeague {
    id:           string;
    uid:          string;
    name:         string;
    abbreviation: string;
    midsizeName:  string;
    slug:         string;
    isTournament: boolean;
    links:        AthleteLink[];
}

export interface HeaderLink {
    rel:        string[];
    href:       string;
    text:       string;
    shortText?: string;
    isExternal: boolean;
    isPremium:  boolean;
    language?:  string;
}

export interface Season {
    year:    number;
    current: boolean;
    type:    number;
}

export interface EspnGameSummaryGeneratedLeader {
    team:    AgainstTheSpreadTeam;
    leaders: PurpleLeader[];
}

export interface PurpleLeader {
    name:        string;
    displayName: string;
    leaders:     FluffyLeader[];
}

export interface FluffyLeader {
    displayValue: string;
    athlete:      LeaderAthlete;
    mainStat:     MainStat;
    summary:      string;
}

export interface LeaderAthlete {
    id:          string;
    uid:         string;
    guid:        string;
    lastName:    string;
    fullName:    string;
    displayName: string;
    shortName:   string;
    links:       AthleteLink[];
    headshot:    Headshot;
    jersey:      string;
    position:    Position;
    status:      AthleteStatus;
}

export interface Position {
    abbreviation: string;
}

export interface AthleteStatus {
    id:           string;
    name:         string;
    type:         string;
    abbreviation: string;
}

export interface MainStat {
    value: string;
    label: string;
}

export interface Meta {
    gp_topic:            string;
    gameSwitcherEnabled: boolean;
    picker_topic:        string;
    gameState:           string;
}

export interface News {
    header:   string;
    link:     HeaderLink;
    articles: ArticleElement[];
}

export interface ArticleElement {
    id:                   number;
    nowId:                string;
    contentKey:           string;
    dataSourceIdentifier: string;
    type:                 string;
    headline:             string;
    description:          string;
    lastModified:         Date;
    published:            Date;
    images:               FluffyImage[];
    categories:           PurpleCategory[];
    premium:              boolean;
    links:                FluffyLinks;
    byline?:              string;
}

export interface PurpleCategory {
    id?:          number;
    type:         string;
    guid:         string;
    description?: string;
    sportId?:     number;
    topicId?:     number;
    uid?:         string;
    leagueId?:    number;
    league?:      CategoryLeague;
    slug?:        string;
    contributor?: Contributor;
    teamId?:      number;
    team?:        CategoryTeam;
    athleteId?:   number;
    athlete?:     CategoryAthlete;
    eventId?:     number;
    event?:       Event;
}

export interface CategoryAthlete {
    id:          number;
    description: string;
    links:       AthleteLinks;
}

export interface AthleteLinks {
    web:    IndigoMobile;
    mobile: IndigoMobile;
}

export interface IndigoMobile {
    athletes: SelfClass;
}

export interface Contributor {
    id:          number;
    description: string;
    links:       ContributorLinks;
}

export interface ContributorLinks {
    web:    IndecentMobile;
    mobile: IndecentMobile;
}

export interface IndecentMobile {
    contributors?: SelfClass;
}

export interface FluffyImage {
    dataSourceIdentifier?: string;
    id?:                   number;
    type?:                 string;
    name:                  string;
    credit?:               string;
    height:                number;
    width:                 number;
    url:                   string;
    caption?:              string;
    alt?:                  string;
}

export interface FluffyLinks {
    web:           Web;
    mobile?:       SelfClass;
    api:           Fluffyapi;
    app?:          App;
    sportscenter?: SelfClass;
}

export interface Pickcenter {
    provider:     Provider;
    details:      string;
    overUnder:    number;
    spread:       number;
    overOdds:     number;
    underOdds:    number;
    awayTeamOdds: TeamOdds;
    homeTeamOdds: TeamOdds;
    links:        HeaderLink[];
    moneyline:    Moneyline;
    pointSpread:  PointSpread;
    total:        Total;
    link:         HeaderLink;
    header:       PickcenterHeader;
}

export interface TeamOdds {
    favorite:       boolean;
    underdog:       boolean;
    moneyLine:      number;
    spreadOdds:     number;
    team:           TeamParticipantTeam;
    teamId:         string;
    favoriteAtOpen: boolean;
}

export interface PickcenterHeader {
    logo: HeaderLogo;
    text: string;
}

export interface HeaderLogo {
    dark:                string;
    light:               string;
    exclusivesLogoDark:  string;
    exclusivesLogoLight: string;
}

export interface Moneyline {
    displayName:      string;
    shortDisplayName: string;
    home:             MoneylineHome;
    away:             MoneylineAway;
}

export interface MoneylineAway {
    close: OverClose;
    open:  PurpleOpen;
}

export interface OverClose {
    odds:     string;
    outcome:  string;
    icon:     string;
    iconDark: string;
    line?:    string;
}

export interface PurpleOpen {
    odds: string;
}

export interface MoneylineHome {
    close: PurpleClose;
    open:  PurpleOpen;
}

export interface PurpleClose {
    odds:    string;
    outcome: string;
}

export interface PointSpread {
    displayName:      string;
    shortDisplayName: string;
    home:             OverClass;
    away:             UnderClass;
}

export interface UnderClass {
    close: UnderClose;
    open:  UnderOpen;
}

export interface UnderClose {
    line:    string;
    odds:    string;
    outcome: string;
}

export interface UnderOpen {
    line: string;
    odds: string;
}

export interface OverClass {
    close: OverClose;
    open:  UnderOpen;
}

export interface Provider {
    id:       string;
    name:     string;
    priority: number;
    logos:    ProviderLogo[];
}

export interface ProviderLogo {
    href: string;
    rel:  string[];
}

export interface Total {
    displayName:      string;
    shortDisplayName: string;
    over:             OverClass;
    under:            UnderClass;
}

export interface ScoringPlay {
    id:          string;
    type:        PlayType;
    text:        string;
    awayScore:   number;
    homeScore:   number;
    period:      PlayPeriod;
    clock:       Clock;
    team:        AgainstTheSpreadTeam;
    scoringType: ScoringType;
}

export interface Clock {
    value:        number;
    displayValue: string;
}

export interface EspnGameSummaryGeneratedStandings {
    fullViewLink:     FullViewLinkElement;
    header:           string;
    groups:           Group[];
    isSameConference: boolean;
}

export interface Group {
    standings:           GroupStandings;
    header:              string;
    conferenceHeader:    string;
    divisionHeader:      string;
    shortDivisionHeader: string;
}

export interface GroupStandings {
    entries: Entry[];
}

export interface Entry {
    team:  string;
    link:  string;
    id:    string;
    uid:   string;
    stats: Stat[];
    logo:  LogoElement[];
}

export interface Stat {
    id:               string;
    name:             string;
    abbreviation:     string;
    displayName:      string;
    shortDisplayName: string;
    description:      string;
    type:             string;
    summary:          string;
    displayValue:     string;
}

export interface EspnGameSummaryGeneratedVideo {
    id:                  number;
    cerebroId:           string;
    source:              string;
    headline:            string;
    description:         string;
    lastModified:        Date;
    originalPublishDate: Date;
    duration:            number;
    timeRestrictions:    TimeRestrictions;
    deviceRestrictions:  DeviceRestrictions;
    thumbnail:           string;
    links:               VideoLinks;
    ad:                  Ad;
    tracking:            Tracking;
    playId?:             string;
}

export interface Winprobability {
    homeWinPercentage: number;
    tiePercentage:     number;
    playId:            string;
}
