import { TEAM_LOCATIONS, type TeamLocation } from './team-locations';
import { haversineDistance } from './haversine';

const US_STATE_CENTERS: Record<string, [number, number]> = {
  AL: [32.806671, -86.79113],
  AK: [61.370716, -152.404419],
  AZ: [33.729759, -111.431221],
  AR: [34.969704, -92.373123],
  CA: [36.116203, -119.681564],
  CO: [39.059811, -105.311104],
  CT: [41.597782, -72.755371],
  DE: [39.318523, -75.507141],
  FL: [27.766279, -81.686783],
  GA: [33.040619, -83.643074],
  HI: [21.094318, -157.498337],
  ID: [44.240459, -114.478828],
  IL: [40.349457, -88.986137],
  IN: [39.849426, -86.258278],
  IA: [42.011539, -93.210526],
  KS: [38.5266, -96.726486],
  KY: [37.66814, -84.670067],
  LA: [31.169546, -91.867805],
  ME: [44.693947, -69.381927],
  MD: [39.063946, -76.802101],
  MA: [42.230171, -71.530106],
  MI: [43.326618, -84.536095],
  MN: [45.694454, -93.900192],
  MS: [32.741646, -89.678696],
  MO: [38.456085, -92.288368],
  MT: [46.921925, -110.454353],
  NE: [41.12537, -98.268082],
  NV: [38.313515, -117.055374],
  NH: [43.452492, -71.563896],
  NJ: [40.298904, -74.521011],
  NM: [34.840515, -106.248482],
  NY: [42.165726, -74.948051],
  NC: [35.630066, -79.806419],
  ND: [47.528912, -99.784012],
  OH: [40.388783, -82.764915],
  OK: [35.565342, -96.928917],
  OR: [44.572021, -122.070938],
  PA: [40.590752, -77.209755],
  RI: [41.680893, -71.51178],
  SC: [33.856892, -80.945007],
  SD: [44.299782, -99.438828],
  TN: [35.747845, -86.692345],
  TX: [31.054487, -97.563461],
  UT: [40.150032, -111.862434],
  VT: [44.045876, -72.710686],
  VA: [37.769337, -78.169968],
  WA: [47.400902, -121.490494],
  WV: [38.491226, -80.954453],
  WI: [44.268543, -89.616508],
  WY: [42.755966, -107.30249],
  DC: [38.897438, -77.026817],
};

const findUserState = (lat: number, lon: number): string | null => {
  let closest: string | null = null;
  let minDist = Infinity;
  for (const [state, [sLat, sLon]] of Object.entries(US_STATE_CENTERS)) {
    const d = haversineDistance(lat, lon, sLat, sLon);
    if (d < minDist) {
      minDist = d;
      closest = state;
    }
  }
  return closest;
};

export const findNearestTeam = (
  lat: number,
  lon: number,
  conferenceFilter?: string
): TeamLocation | null => {
  const candidates = conferenceFilter
    ? TEAM_LOCATIONS.filter((t) => t.conference === conferenceFilter)
    : TEAM_LOCATIONS;

  if (candidates.length === 0) return null;

  const userState = findUserState(lat, lon);

  const sameState = userState ? candidates.filter((t) => t.state === userState) : [];
  const pool = sameState.length > 0 ? sameState : candidates;

  let closest: TeamLocation | null = null;
  let minDistance = Infinity;

  for (const team of pool) {
    const dist = haversineDistance(lat, lon, team.latitude, team.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = team;
    }
  }

  return closest;
};
