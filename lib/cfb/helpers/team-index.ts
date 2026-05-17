import { getTeamsFromCfbd } from '../cfbd-rest-client';
import { createTeamMatcher, type TeamIndexEntry } from './fuzzy-team-matcher';

const SUPPLEMENTAL_ALIASES: Record<string, string[]> = {
  // SEC
  Alabama: ['Bama', 'Roll Tide', 'Tide'],
  Arkansas: ['Hogs', 'Razorbacks', 'Woo Pig'],
  Auburn: ['War Eagle', 'Tigers'],
  Florida: ['UF', 'Gators'],
  Georgia: ['Dawgs', 'Bulldogs'],
  Kentucky: ['UK', 'Wildcats', 'Cats'],
  LSU: ['Tigers', 'Geaux Tigers'],
  'Mississippi State': ['Miss State', 'Miss St', 'Bulldogs'],
  Missouri: ['Mizzou', 'Tigers'],
  Oklahoma: ['Sooners', 'Boomer Sooner'],
  'Ole Miss': ['Rebels', 'OM'],
  'South Carolina': ['Gamecocks', 'Cocks'],
  Tennessee: ['Vols', 'UT', 'Volunteers', 'Rocky Top'],
  Texas: ['Longhorns', 'Horns', 'UT Austin'],
  'Texas A&M': ['TAMU', 'Aggies'],
  Vanderbilt: ['Vandy', 'Commodores', 'Dores'],
  // ACC
  'Boston College': ['Eagles'],
  California: ['Cal Bears', 'Bears'],
  Clemson: ['Tigers'],
  Duke: ['Blue Devils'],
  'Florida State': ['Noles', 'Seminoles'],
  'Georgia Tech': ['Yellow Jackets', 'Jackets', 'Ramblin Wreck'],
  Louisville: ['Cards', 'Cardinals'],
  Miami: ['The U', 'Canes', 'Hurricanes'],
  'NC State': ['Wolfpack', 'Pack', 'Wolf Pack'],
  'North Carolina': ['Tar Heels', 'Heels', 'Carolina'],
  Pittsburgh: ['Panthers'],
  SMU: ['Mustangs', 'Ponies'],
  Stanford: ['Cardinal'],
  Syracuse: ['Orange', 'Cuse'],
  Virginia: ['Wahoos', 'Hoos', 'Cavaliers'],
  'Virginia Tech': ['Hokies'],
  'Wake Forest': ['Deacs', 'Demon Deacons'],
  // Big Ten
  Illinois: ['Illini', 'Fighting Illini'],
  Indiana: ['Hoosiers'],
  Iowa: ['Hawkeyes', 'Hawks'],
  Maryland: ['Terps', 'Terrapins'],
  Michigan: ['Wolverines', 'Big Blue'],
  'Michigan State': ['Sparty', 'Spartans'],
  Minnesota: ['Gophers', 'Golden Gophers'],
  Nebraska: ['Huskers', 'Cornhuskers', 'Big Red'],
  Northwestern: ['Wildcats'],
  'Ohio State': ['tOSU', 'Buckeyes', 'Bucks'],
  Oregon: ['Ducks'],
  'Penn State': ['Nittany Lions'],
  Purdue: ['Boilermakers', 'Boilers'],
  Rutgers: ['Scarlet Knights'],
  UCLA: ['Bruins'],
  USC: ['Trojans', 'Fight On'],
  Washington: ['Huskies', 'UW', 'Dawgs'],
  Wisconsin: ['Badgers'],
  // Big 12
  Arizona: ['Wildcats', 'Cats'],
  'Arizona State': ['Sun Devils', 'Devils'],
  BYU: ['Cougars'],
  Baylor: ['Bears'],
  Cincinnati: ['Bearcats', 'Cincy'],
  Colorado: ['Buffs', 'Buffaloes', 'CU'],
  Houston: ['Coogs', 'Cougars'],
  'Iowa State': ['Cyclones', 'Clones'],
  Kansas: ['Jayhawks', 'KU'],
  'Kansas State': ['K-State', 'Wildcats'],
  'Oklahoma State': ['Pokes', 'Cowboys', 'OSU'],
  TCU: ['Horned Frogs', 'Frogs'],
  'Texas Tech': ['Red Raiders', 'Raiders'],
  UCF: ['Knights'],
  Utah: ['Utes'],
  'West Virginia': ['Mountaineers', 'Eers'],
};

let cachedIndex: TeamIndexEntry[] | null = null;

export const loadTeamIndex = async (): Promise<TeamIndexEntry[]> => {
  if (cachedIndex) return cachedIndex;

  const cfbdTeams = await getTeamsFromCfbd({ classification: 'fbs' });

  cachedIndex = cfbdTeams.map((t) => {
    const cfbdAlts = (t as unknown as { alternateNames?: string[] }).alternateNames ?? [];
    const extras = SUPPLEMENTAL_ALIASES[t.school ?? ''] ?? [];
    return {
      id: t.id ?? 0,
      school: t.school ?? '',
      mascot: t.mascot ?? null,
      abbreviation: t.abbreviation ?? '',
      alternateNames: [...cfbdAlts, ...extras],
      conference: t.conference ?? null,
    };
  });

  return cachedIndex;
};

export const getTeamMatcher = async () => {
  const index = await loadTeamIndex();
  return createTeamMatcher(index);
};
