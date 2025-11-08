// Mock data for the Foster Care App - All 50 States with County Data
// County data is algorithmically generated for efficiency

// ==================== UTILITY FUNCTIONS ====================

// Deterministic random number generator using string seed
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generate county metrics based on population and state data
function generateCountyMetrics(countyName, stateName, population, stateData) {
  const seed = hashString(countyName + stateName);
  const random = (offset = 0) => seededRandom(seed + offset);
  
  // Calculate base metrics from population and state averages
  const statePopulation = 5000000; // Approximate average state population
  const populationRatio = population / statePopulation;
  
  const totalChurches = Math.round(population / 1000 * (0.8 + random(1) * 0.4));
  const childrenInCare = Math.round(stateData.totalChildren * populationRatio * (0.8 + random(2) * 0.4));
  const childrenInFamily = Math.round(childrenInCare * (0.35 + random(3) * 0.20));
  const childrenInKinship = Math.round(childrenInCare * (0.25 + random(4) * 0.15));
  const childrenOutOfCounty = Math.round(childrenInCare * (0.03 + random(5) * 0.04));
  const licensedHomes = Math.round(childrenInCare * (0.35 + random(6) * 0.15));
  const licensedHomesPerChild = parseFloat((licensedHomes / childrenInCare).toFixed(2));
  const waitingForAdoption = Math.round(childrenInCare * (0.08 + random(7) * 0.06));
  const childrenAdopted2024 = Math.round(waitingForAdoption * (0.65 + random(8) * 0.25));
  const avgMonthsToAdoption = parseFloat((11 + random(9) * 4).toFixed(1));
  const familyPreservationCases = Math.round(childrenInCare * (0.12 + random(10) * 0.08));
  const reunificationRate = Math.round(stateData.reunificationRate * (0.95 + random(11) * 0.10));
  const churchesProvidingSupport = Math.round(totalChurches * (0.68 + random(12) * 0.10));
  const supportPercentage = Math.round((churchesProvidingSupport / totalChurches) * 100);
  
  return {
    name: countyName,
    state: stateName,
    population,
    totalChurches,
    childrenInCare,
    childrenInFamily,
    childrenInKinship,
    childrenOutOfCounty,
    licensedHomes,
    licensedHomesPerChild,
    waitingForAdoption,
    childrenAdopted2024,
    avgMonthsToAdoption,
    familyPreservationCases,
    reunificationRate,
    churchesProvidingSupport,
    supportPercentage
  };
}

// ==================== STATE DATA ====================

export const stateData = {
  alabama: { name: 'Alabama', totalChildren: 5809, licensedHomes: 2474, waitingForAdoption: 486, reunificationRate: 79.2, familyPreservationCases: 50 },
  alaska: { name: 'Alaska', totalChildren: 2156, licensedHomes: 892, waitingForAdoption: 178, reunificationRate: 71.5, familyPreservationCases: 28 },
  arizona: { name: 'Arizona', totalChildren: 14567, licensedHomes: 5823, waitingForAdoption: 1245, reunificationRate: 68.9, familyPreservationCases: 189 },
  arkansas: { name: 'Arkansas', totalChildren: 4892, licensedHomes: 2156, waitingForAdoption: 398, reunificationRate: 77.8, familyPreservationCases: 67 },
  california: { name: 'California', totalChildren: 58341, licensedHomes: 24567, waitingForAdoption: 4892, reunificationRate: 69.4, familyPreservationCases: 823 },
  colorado: { name: 'Colorado', totalChildren: 6234, licensedHomes: 2789, waitingForAdoption: 534, reunificationRate: 74.6, familyPreservationCases: 98 },
  connecticut: { name: 'Connecticut', totalChildren: 4123, licensedHomes: 1876, waitingForAdoption: 356, reunificationRate: 73.2, familyPreservationCases: 72 },
  delaware: { name: 'Delaware', totalChildren: 1234, licensedHomes: 567, waitingForAdoption: 98, reunificationRate: 75.8, familyPreservationCases: 23 },
  florida: { name: 'Florida', totalChildren: 23456, licensedHomes: 9876, waitingForAdoption: 2134, reunificationRate: 70.3, familyPreservationCases: 345 },
  georgia: { name: 'Georgia', totalChildren: 13567, licensedHomes: 5678, waitingForAdoption: 1234, reunificationRate: 72.9, familyPreservationCases: 267 },
  hawaii: { name: 'Hawaii', totalChildren: 2345, licensedHomes: 987, waitingForAdoption: 189, reunificationRate: 68.7, familyPreservationCases: 45 },
  idaho: { name: 'Idaho', totalChildren: 2789, licensedHomes: 1234, waitingForAdoption: 234, reunificationRate: 76.5, familyPreservationCases: 52 },
  illinois: { name: 'Illinois', totalChildren: 17234, licensedHomes: 7234, waitingForAdoption: 1567, reunificationRate: 71.8, familyPreservationCases: 298 },
  indiana: { name: 'Indiana', totalChildren: 11234, licensedHomes: 4789, waitingForAdoption: 987, reunificationRate: 74.2, familyPreservationCases: 189 },
  iowa: { name: 'Iowa', totalChildren: 5678, licensedHomes: 2456, waitingForAdoption: 456, reunificationRate: 78.3, familyPreservationCases: 89 },
  kansas: { name: 'Kansas', totalChildren: 6789, licensedHomes: 2890, waitingForAdoption: 578, reunificationRate: 75.6, familyPreservationCases: 102 },
  kentucky: { name: 'Kentucky', totalChildren: 8234, licensedHomes: 3456, waitingForAdoption: 723, reunificationRate: 76.9, familyPreservationCases: 134 },
  louisiana: { name: 'Louisiana', totalChildren: 7892, licensedHomes: 3234, waitingForAdoption: 689, reunificationRate: 70.4, familyPreservationCases: 145 },
  maine: { name: 'Maine', totalChildren: 2123, licensedHomes: 945, waitingForAdoption: 178, reunificationRate: 77.2, familyPreservationCases: 42 },
  maryland: { name: 'Maryland', totalChildren: 4567, licensedHomes: 2012, waitingForAdoption: 389, reunificationRate: 72.8, familyPreservationCases: 87 },
  massachusetts: { name: 'Massachusetts', totalChildren: 9876, licensedHomes: 4234, waitingForAdoption: 834, reunificationRate: 73.5, familyPreservationCases: 167 },
  michigan: { name: 'Michigan', totalChildren: 12456, licensedHomes: 5234, waitingForAdoption: 1098, reunificationRate: 74.7, familyPreservationCases: 223 },
  minnesota: { name: 'Minnesota', totalChildren: 7456, licensedHomes: 3234, waitingForAdoption: 634, reunificationRate: 76.4, familyPreservationCases: 128 },
  mississippi: { name: 'Mississippi', totalChildren: 5234, licensedHomes: 2178, waitingForAdoption: 445, reunificationRate: 75.3, familyPreservationCases: 89 },
  missouri: { name: 'Missouri', totalChildren: 13234, licensedHomes: 5567, waitingForAdoption: 1156, reunificationRate: 73.6, familyPreservationCases: 234 },
  montana: { name: 'Montana', totalChildren: 2567, licensedHomes: 1123, waitingForAdoption: 212, reunificationRate: 74.9, familyPreservationCases: 48 },
  nebraska: { name: 'Nebraska', totalChildren: 4123, licensedHomes: 1789, waitingForAdoption: 345, reunificationRate: 77.1, familyPreservationCases: 72 },
  nevada: { name: 'Nevada', totalChildren: 5678, licensedHomes: 2345, waitingForAdoption: 478, reunificationRate: 69.8, familyPreservationCases: 98 },
  "new-hampshire": { name: 'New Hampshire', totalChildren: 1456, licensedHomes: 634, waitingForAdoption: 123, reunificationRate: 78.5, familyPreservationCases: 28 },
  "new-jersey": { name: 'New Jersey', totalChildren: 6789, licensedHomes: 2956, waitingForAdoption: 578, reunificationRate: 72.3, familyPreservationCases: 112 },
  "new-mexico": { name: 'New Mexico', totalChildren: 3456, licensedHomes: 1478, waitingForAdoption: 289, reunificationRate: 71.7, familyPreservationCases: 67 },
  "new-york": { name: 'New York', totalChildren: 18045, licensedHomes: 7420, waitingForAdoption: 934, reunificationRate: 76.3, familyPreservationCases: 320 },
  "north-carolina": { name: 'North Carolina', totalChildren: 10234, licensedHomes: 4321, waitingForAdoption: 867, reunificationRate: 75.8, familyPreservationCases: 178 },
  "north-dakota": { name: 'North Dakota', totalChildren: 1789, licensedHomes: 756, waitingForAdoption: 145, reunificationRate: 76.9, familyPreservationCases: 34 },
  ohio: { name: 'Ohio', totalChildren: 15678, licensedHomes: 6543, waitingForAdoption: 1345, reunificationRate: 73.4, familyPreservationCases: 278 },
  oklahoma: { name: 'Oklahoma', totalChildren: 9234, licensedHomes: 3876, waitingForAdoption: 789, reunificationRate: 72.6, familyPreservationCases: 167 },
  oregon: { name: 'Oregon', totalChildren: 7345, licensedHomes: 3123, waitingForAdoption: 623, reunificationRate: 74.8, familyPreservationCases: 134 },
  pennsylvania: { name: 'Pennsylvania', totalChildren: 14789, licensedHomes: 6234, waitingForAdoption: 1267, reunificationRate: 74.2, familyPreservationCases: 256 },
  "rhode-island": { name: 'Rhode Island', totalChildren: 2012, licensedHomes: 867, waitingForAdoption: 167, reunificationRate: 73.9, familyPreservationCases: 39 },
  "south-carolina": { name: 'South Carolina', totalChildren: 4567, licensedHomes: 1923, waitingForAdoption: 389, reunificationRate: 74.7, familyPreservationCases: 82 },
  "south-dakota": { name: 'South Dakota', totalChildren: 1678, licensedHomes: 723, waitingForAdoption: 134, reunificationRate: 77.4, familyPreservationCases: 32 },
  tennessee: { name: 'Tennessee', totalChildren: 8456, licensedHomes: 3567, waitingForAdoption: 723, reunificationRate: 75.6, familyPreservationCases: 145 },
  texas: { name: 'Texas', totalChildren: 29876, licensedHomes: 12345, waitingForAdoption: 2567, reunificationRate: 71.2, familyPreservationCases: 489 },
  utah: { name: 'Utah', totalChildren: 2890, licensedHomes: 1234, waitingForAdoption: 245, reunificationRate: 76.8, familyPreservationCases: 56 },
  vermont: { name: 'Vermont', totalChildren: 1123, licensedHomes: 489, waitingForAdoption: 89, reunificationRate: 78.9, familyPreservationCases: 21 },
  virginia: { name: 'Virginia', totalChildren: 5678, licensedHomes: 2456, waitingForAdoption: 478, reunificationRate: 75.3, familyPreservationCases: 98 },
  washington: { name: 'Washington', totalChildren: 9345, licensedHomes: 3978, waitingForAdoption: 789, reunificationRate: 73.7, familyPreservationCases: 167 },
  "west-virginia": { name: 'West Virginia', totalChildren: 6789, licensedHomes: 2845, waitingForAdoption: 578, reunificationRate: 74.5, familyPreservationCases: 123 },
  wisconsin: { name: 'Wisconsin', totalChildren: 7234, licensedHomes: 3098, waitingForAdoption: 612, reunificationRate: 76.2, familyPreservationCases: 134 },
  wyoming: { name: 'Wyoming', totalChildren: 1345, licensedHomes: 578, waitingForAdoption: 112, reunificationRate: 77.8, familyPreservationCases: 26 }
};

// ==================== COUNTY BASE DATA ====================
// Stores only essential data: name, population, and coordinates
// All other metrics are generated algorithmically

const countyBaseData = {
  // Alabama
  'butler-al': { name: 'Butler County, Alabama', state: 'Alabama', pop: 18832, coords: [31.7532, -86.6803] },
  'jefferson-al': { name: 'Jefferson County, Alabama', state: 'Alabama', pop: 674721, coords: [33.5207, -86.8025] },
  'mobile-al': { name: 'Mobile County, Alabama', state: 'Alabama', pop: 413210, coords: [30.6954, -88.0399] },
  'montgomery-al': { name: 'Montgomery County, Alabama', state: 'Alabama', pop: 228954, coords: [32.3792, -86.3077] },

  // Alaska
  'anchorage-ak': { name: 'Anchorage Municipality, Alaska', state: 'Alaska', pop: 291247, coords: [61.2181, -149.9003] },
  'fairbanks-ak': { name: 'Fairbanks North Star Borough, Alaska', state: 'Alaska', pop: 95655, coords: [64.8378, -147.7164] },

  // Arizona
  'maricopa-az': { name: 'Maricopa County, Arizona', state: 'Arizona', pop: 4485414, coords: [33.4484, -112.0740] },
  'pima-az': { name: 'Pima County, Arizona', state: 'Arizona', pop: 1043433, coords: [32.2226, -110.9747] },
  'pinal-az': { name: 'Pinal County, Arizona', state: 'Arizona', pop: 462967, coords: [32.8439, -111.3847] },

  // Arkansas
  'pulaski-ar': { name: 'Pulaski County, Arkansas', state: 'Arkansas', pop: 399125, coords: [34.7465, -92.2896] },
  'washington-ar': { name: 'Washington County, Arkansas', state: 'Arkansas', pop: 245871, coords: [36.0653, -94.1574] },

  // California
  'los-angeles-ca': { name: 'Los Angeles County, California', state: 'California', pop: 10014009, coords: [34.0522, -118.2437] },
  'san-diego-ca': { name: 'San Diego County, California', state: 'California', pop: 3298634, coords: [32.7157, -117.1611] },
  'orange-ca': { name: 'Orange County, California', state: 'California', pop: 3186989, coords: [33.7175, -117.8311] },
  'riverside-ca': { name: 'Riverside County, California', state: 'California', pop: 2470546, coords: [33.9533, -117.3961] },

  // Colorado
  'denver-co': { name: 'Denver County, Colorado', state: 'Colorado', pop: 715522, coords: [39.7392, -104.9903] },
  'el-paso-co': { name: 'El Paso County, Colorado', state: 'Colorado', pop: 730395, coords: [38.8339, -104.8214] },

  // Connecticut
  'hartford-ct': { name: 'Hartford County, Connecticut', state: 'Connecticut', pop: 899498, coords: [41.7658, -72.6734] },
  'new-haven-ct': { name: 'New Haven County, Connecticut', state: 'Connecticut', pop: 864835, coords: [41.3083, -72.9279] },

  // Delaware
  'new-castle-de': { name: 'New Castle County, Delaware', state: 'Delaware', pop: 570719, coords: [39.6626, -75.6006] },
  'sussex-de': { name: 'Sussex County, Delaware', state: 'Delaware', pop: 237378, coords: [38.6926, -75.4008] },

  // Florida
  'miami-dade-fl': { name: 'Miami-Dade County, Florida', state: 'Florida', pop: 2716940, coords: [25.7617, -80.1918] },
  'broward-fl': { name: 'Broward County, Florida', state: 'Florida', pop: 1952778, coords: [26.1224, -80.1373] },
  'palm-beach-fl': { name: 'Palm Beach County, Florida', state: 'Florida', pop: 1496770, coords: [26.7153, -80.0534] },

  // Georgia
  'fulton-ga': { name: 'Fulton County, Georgia', state: 'Georgia', pop: 1066710, coords: [33.7490, -84.3880] },
  'gwinnett-ga': { name: 'Gwinnett County, Georgia', state: 'Georgia', pop: 957062, coords: [33.9526, -83.9877] },
  'cobb-ga': { name: 'Cobb County, Georgia', state: 'Georgia', pop: 766149, coords: [33.9698, -84.5547] },

  // Hawaii
  'honolulu-hi': { name: 'Honolulu County, Hawaii', state: 'Hawaii', pop: 1016508, coords: [21.3099, -157.8581] },
  'hawaii-hi': { name: 'Hawaii County, Hawaii', state: 'Hawaii', pop: 200629, coords: [19.5429, -155.6659] },

  // Idaho
  'ada-id': { name: 'Ada County, Idaho', state: 'Idaho', pop: 481587, coords: [43.4527, -116.2417] },
  'canyon-id': { name: 'Canyon County, Idaho', state: 'Idaho', pop: 231105, coords: [43.6424, -116.6873] },

  // Illinois
  'cook-il': { name: 'Cook County, Illinois', state: 'Illinois', pop: 5275541, coords: [41.8781, -87.6298] },
  'dupage-il': { name: 'DuPage County, Illinois', state: 'Illinois', pop: 932675, coords: [41.8781, -88.0798] },
  'lake-il': { name: 'Lake County, Illinois', state: 'Illinois', pop: 714342, coords: [42.3369, -87.8450] },

  // Indiana
  'marion-in': { name: 'Marion County, Indiana', state: 'Indiana', pop: 977203, coords: [39.7684, -86.1581] },
  'lake-in': { name: 'Lake County, Indiana', state: 'Indiana', pop: 498700, coords: [41.4789, -87.4097] },

  // Iowa
  'polk-ia': { name: 'Polk County, Iowa', state: 'Iowa', pop: 492401, coords: [41.5868, -93.6250] },
  'linn-ia': { name: 'Linn County, Iowa', state: 'Iowa', pop: 230299, coords: [42.0784, -91.5987] },

  // Kansas
  'johnson-ks': { name: 'Johnson County, Kansas', state: 'Kansas', pop: 609863, coords: [38.9140, -94.7880] },
  'sedgwick-ks': { name: 'Sedgwick County, Kansas', state: 'Kansas', pop: 523824, coords: [37.6872, -97.3301] },

  // Kentucky
  'jefferson-ky': { name: 'Jefferson County, Kentucky', state: 'Kentucky', pop: 782969, coords: [38.2527, -85.7585] },
  'fayette-ky': { name: 'Fayette County, Kentucky', state: 'Kentucky', pop: 322570, coords: [38.0406, -84.5037] },

  // Louisiana
  'orleans-la': { name: 'Orleans Parish, Louisiana', state: 'Louisiana', pop: 383997, coords: [29.9511, -90.0715] },
  'jefferson-la': { name: 'Jefferson Parish, Louisiana', state: 'Louisiana', pop: 440781, coords: [29.8388, -90.1547] },

  // Maine
  'cumberland-me': { name: 'Cumberland County, Maine', state: 'Maine', pop: 303069, coords: [43.7820, -70.2562] },
  'york-me': { name: 'York County, Maine', state: 'Maine', pop: 211972, coords: [43.4554, -70.6231] },

  // Maryland
  'montgomery-md': { name: 'Montgomery County, Maryland', state: 'Maryland', pop: 1062061, coords: [39.1434, -77.1997] },
  'prince-georges-md': { name: 'Prince Georges County, Maryland', state: 'Maryland', pop: 967201, coords: [38.8127, -76.8633] },

  // Massachusetts
  'middlesex-ma': { name: 'Middlesex County, Massachusetts', state: 'Massachusetts', pop: 1632002, coords: [42.4865, -71.3824] },
  'worcester-ma': { name: 'Worcester County, Massachusetts', state: 'Massachusetts', pop: 862111, coords: [42.3515, -71.9077] },

  // Michigan
  'wayne-mi': { name: 'Wayne County, Michigan', state: 'Michigan', pop: 1793561, coords: [42.3314, -83.0458] },
  'oakland-mi': { name: 'Oakland County, Michigan', state: 'Michigan', pop: 1274395, coords: [42.6589, -83.3816] },
  'macomb-mi': { name: 'Macomb County, Michigan', state: 'Michigan', pop: 881217, coords: [42.6667, -82.9326] },

  // Minnesota
  'hennepin-mn': { name: 'Hennepin County, Minnesota', state: 'Minnesota', pop: 1281565, coords: [44.9778, -93.2650] },
  'ramsey-mn': { name: 'Ramsey County, Minnesota', state: 'Minnesota', pop: 552352, coords: [45.0153, -93.0939] },

  // Mississippi
  'hinds-ms': { name: 'Hinds County, Mississippi', state: 'Mississippi', pop: 227742, coords: [32.3068, -90.1848] },
  'harrison-ms': { name: 'Harrison County, Mississippi', state: 'Mississippi', pop: 208621, coords: [30.4155, -89.0700] },

  // Missouri
  'st-louis-mo': { name: 'St Louis County, Missouri', state: 'Missouri', pop: 1004125, coords: [38.6270, -90.1994] },
  'jackson-mo': { name: 'Jackson County, Missouri', state: 'Missouri', pop: 717204, coords: [39.0997, -94.5786] },

  // Montana
  'yellowstone-mt': { name: 'Yellowstone County, Montana', state: 'Montana', pop: 161300, coords: [45.7833, -108.5007] },
  'missoula-mt': { name: 'Missoula County, Montana', state: 'Montana', pop: 119600, coords: [46.8721, -113.9940] },

  // Nebraska
  'douglas-ne': { name: 'Douglas County, Nebraska', state: 'Nebraska', pop: 584526, coords: [41.2565, -96.0103] },
  'lancaster-ne': { name: 'Lancaster County, Nebraska', state: 'Nebraska', pop: 322343, coords: [40.8000, -96.6670] },

  // Nevada
  'clark-nv': { name: 'Clark County, Nevada', state: 'Nevada', pop: 2265461, coords: [36.1699, -115.1398] },
  'washoe-nv': { name: 'Washoe County, Nevada', state: 'Nevada', pop: 486492, coords: [39.5296, -119.8138] },

  // New Hampshire
  'hillsborough-nh': { name: 'Hillsborough County, New Hampshire', state: 'New Hampshire', pop: 422937, coords: [42.9667, -71.7000] },
  'rockingham-nh': { name: 'Rockingham County, New Hampshire', state: 'New Hampshire', pop: 314176, coords: [42.9667, -70.9500] },

  // New Jersey
  'bergen-nj': { name: 'Bergen County, New Jersey', state: 'New Jersey', pop: 955732, coords: [40.9604, -74.0776] },
  'essex-nj': { name: 'Essex County, New Jersey', state: 'New Jersey', pop: 863728, coords: [40.7943, -74.2587] },

  // New Mexico
  'bernalillo-nm': { name: 'Bernalillo County, New Mexico', state: 'New Mexico', pop: 676444, coords: [35.0844, -106.6504] },
  'dona-ana-nm': { name: 'Dona Ana County, New Mexico', state: 'New Mexico', pop: 219561, coords: [32.3199, -106.7789] },

  // New York
  'nassau-ny': { name: 'Nassau County, New York', state: 'New York', pop: 1395774, coords: [40.7391, -73.5893] },
  'suffolk-ny': { name: 'Suffolk County, New York', state: 'New York', pop: 1525920, coords: [40.9849, -72.6151] },
  'erie-ny': { name: 'Erie County, New York', state: 'New York', pop: 954236, coords: [42.8864, -78.8784] },
  'westchester-ny': { name: 'Westchester County, New York', state: 'New York', pop: 1004457, coords: [41.1220, -73.7949] },

  // North Carolina
  'mecklenburg-nc': { name: 'Mecklenburg County, North Carolina', state: 'North Carolina', pop: 1115482, coords: [35.2271, -80.8431] },
  'wake-nc': { name: 'Wake County, North Carolina', state: 'North Carolina', pop: 1129410, coords: [35.7796, -78.6382] },
  'guilford-nc': { name: 'Guilford County, North Carolina', state: 'North Carolina', pop: 541299, coords: [36.0726, -79.7920] },

  // North Dakota
  'cass-nd': { name: 'Cass County, North Dakota', state: 'North Dakota', pop: 184525, coords: [46.8772, -97.0325] },
  'burleigh-nd': { name: 'Burleigh County, North Dakota', state: 'North Dakota', pop: 98458, coords: [46.8083, -100.7837] },

  // Ohio
  'cuyahoga-oh': { name: 'Cuyahoga County, Ohio', state: 'Ohio', pop: 1264817, coords: [41.4993, -81.6944] },
  'franklin-oh': { name: 'Franklin County, Ohio', state: 'Ohio', pop: 1323807, coords: [39.9612, -82.9988] },
  'hamilton-oh': { name: 'Hamilton County, Ohio', state: 'Ohio', pop: 830639, coords: [39.1031, -84.5120] },

  // Oklahoma
  'oklahoma-ok': { name: 'Oklahoma County, Oklahoma', state: 'Oklahoma', pop: 796292, coords: [35.4676, -97.5164] },
  'tulsa-ok': { name: 'Tulsa County, Oklahoma', state: 'Oklahoma', pop: 669279, coords: [36.1540, -95.9928] },

  // Oregon
  'multnomah-or': { name: 'Multnomah County, Oregon', state: 'Oregon', pop: 815428, coords: [45.5152, -122.6784] },
  'lane-or': { name: 'Lane County, Oregon', state: 'Oregon', pop: 382971, coords: [44.0521, -122.8713] },

  // Pennsylvania
  'philadelphia-pa': { name: 'Philadelphia County, Pennsylvania', state: 'Pennsylvania', pop: 1584064, coords: [39.9526, -75.1652] },
  'allegheny-pa': { name: 'Allegheny County, Pennsylvania', state: 'Pennsylvania', pop: 1250578, coords: [40.4406, -79.9959] },
  'montgomery-pa': { name: 'Montgomery County, Pennsylvania', state: 'Pennsylvania', pop: 856553, coords: [40.1754, -75.2535] },

  // Rhode Island
  'providence-ri': { name: 'Providence County, Rhode Island', state: 'Rhode Island', pop: 660741, coords: [41.8240, -71.4128] },
  'kent-ri': { name: 'Kent County, Rhode Island', state: 'Rhode Island', pop: 170363, coords: [41.6693, -71.5939] },

  // South Carolina
  'greenville-sc': { name: 'Greenville County, South Carolina', state: 'South Carolina', pop: 525534, coords: [34.8526, -82.3940] },
  'richland-sc': { name: 'Richland County, South Carolina', state: 'South Carolina', pop: 416147, coords: [34.0007, -80.8532] },

  // South Dakota
  'minnehaha-sd': { name: 'Minnehaha County, South Dakota', state: 'South Dakota', pop: 197214, coords: [43.6500, -96.7500] },
  'pennington-sd': { name: 'Pennington County, South Dakota', state: 'South Dakota', pop: 116522, coords: [44.0805, -103.2310] },

  // Tennessee
  'shelby-tn': { name: 'Shelby County, Tennessee', state: 'Tennessee', pop: 929744, coords: [35.1495, -90.0490] },
  'davidson-tn': { name: 'Davidson County, Tennessee', state: 'Tennessee', pop: 715884, coords: [36.1627, -86.7816] },

  // Texas
  'harris-tx': { name: 'Harris County, Texas', state: 'Texas', pop: 4731145, coords: [29.7604, -95.3698] },
  'dallas-tx': { name: 'Dallas County, Texas', state: 'Texas', pop: 2613539, coords: [32.7767, -96.7970] },
  'bexar-tx': { name: 'Bexar County, Texas', state: 'Texas', pop: 2009324, coords: [29.4241, -98.4936] },
  'travis-tx': { name: 'Travis County, Texas', state: 'Texas', pop: 1318652, coords: [30.2672, -97.7431] },

  // Utah
  'salt-lake-ut': { name: 'Salt Lake County, Utah', state: 'Utah', pop: 1185238, coords: [40.7608, -111.8910] },
  'utah-ut': { name: 'Utah County, Utah', state: 'Utah', pop: 665665, coords: [40.2338, -111.6585] },

  // Vermont
  'chittenden-vt': { name: 'Chittenden County, Vermont', state: 'Vermont', pop: 168323, coords: [44.4759, -73.1353] },
  'rutland-vt': { name: 'Rutland County, Vermont', state: 'Vermont', pop: 58292, coords: [43.6106, -72.9726] },

  // Virginia
  'fairfax-va': { name: 'Fairfax County, Virginia', state: 'Virginia', pop: 1150309, coords: [38.8462, -77.3064] },
  'virginia-beach-va': { name: 'Virginia Beach City, Virginia', state: 'Virginia', pop: 459470, coords: [36.8529, -75.9780] },

  // Washington
  'king-wa': { name: 'King County, Washington', state: 'Washington', pop: 2269675, coords: [47.6062, -122.3321] },
  'pierce-wa': { name: 'Pierce County, Washington', state: 'Washington', pop: 921130, coords: [47.2529, -122.4443] },
  'snohomish-wa': { name: 'Snohomish County, Washington', state: 'Washington', pop: 827957, coords: [47.9290, -122.2015] },

  // West Virginia
  'kanawha-wv': { name: 'Kanawha County, West Virginia', state: 'West Virginia', pop: 180745, coords: [38.3498, -81.6326] },
  'berkeley-wv': { name: 'Berkeley County, West Virginia', state: 'West Virginia', pop: 122076, coords: [39.4554, -77.9836] },

  // Wisconsin
  'milwaukee-wi': { name: 'Milwaukee County, Wisconsin', state: 'Wisconsin', pop: 939489, coords: [43.0389, -87.9065] },
  'dane-wi': { name: 'Dane County, Wisconsin', state: 'Wisconsin', pop: 561504, coords: [43.0731, -89.4012] },

  // Wyoming
  'laramie-wy': { name: 'Laramie County, Wyoming', state: 'Wyoming', pop: 100512, coords: [41.3114, -105.5911] },
  'natrona-wy': { name: 'Natrona County, Wyoming', state: 'Wyoming', pop: 79955, coords: [42.8666, -106.3131] }
};

// ==================== COUNTY DATA (Generated) ====================
// This object is built dynamically from countyBaseData

export const countyData = {};

// Generate full county data from base data
Object.entries(countyBaseData).forEach(([countyId, baseData]) => {
  const stateId = countyId.split('-').pop(); // Extract state abbreviation
  const stateKey = Object.keys(stateData).find(key => 
    stateData[key].name === baseData.state || 
    key === stateId || 
    key.includes(stateId)
  );
  
  if (stateKey) {
    countyData[countyId] = generateCountyMetrics(
      baseData.name,
      baseData.state,
      baseData.pop,
      stateData[stateKey]
    );
  }
});

// ==================== ORGANIZATIONS ====================

export const organizations = [
  {
    name: 'Bridge Ministry',
    type: 'Bridge Ministry',
    category: 'Faith Community Alliance',
    description: 'Supporting foster families through faith-based community connections and practical assistance.',
    areas: ['Foster and Kinship Families', 'Wraparound'],
    county: 'Nassau County - 11010',
    phone: '516-456-7891',
    email: 'info@nassaubridgeministry.org'
  },
  {
    name: 'Hope Family Services',
    type: 'Service Organization',
    category: 'Hope Family Services',
    description: 'Supporting foster families through faith-based community connections and practical assistance.',
    areas: ['Adoptive', 'Wraparound', 'Biological'],
    county: 'Nassau County - 11010',
    phone: '516-456-7891',
    email: 'info@hopefamily.org'
  },
  {
    name: 'Community Support Network',
    type: 'Government',
    category: 'Community Support Network',
    description: 'Supporting foster families through faith-based community connections and practical assistance.',
    areas: ['Foster and Kinship Families', 'Wraparound'],
    county: 'Nassau County - 11010',
    phone: '516-456-7891',
    email: 'info@nassaucommunity.org'
  }
];

// ==================== NATIONAL STATS ====================

export const nationalStats = {
  childrenInCare: 343077,
  childrenInFamilyFoster: 52483,
  childrenInKinship: 74208,
  childrenWaitingAdoption: 48459,
  childrenAdopted2023: 50193,
  totalChurches: 370000,
  churchesWithMinistry: 30000
};

// ==================== MAP COORDINATES ====================

// County coordinates by state for map visualization
export const countyCoordinatesByState = Object.entries(countyBaseData).reduce((acc, [countyId, data]) => {
  const stateKey = data.state.toLowerCase().replace(/ /g, '-');
  
  if (!acc[stateKey]) {
    acc[stateKey] = {};
  }
  
  // Extract county name without state suffix
  const countyName = data.name.split(',')[0].replace(' County', '').replace(' Parish', '').replace(' Municipality', '').replace(' Borough', '').replace(' City', '');
  
  acc[stateKey][countyName] = {
    coords: data.coords,
    orgCount: Math.round(data.pop / 10000) // Approximate org count based on population
  };
  
  return acc;
}, {});

// State coordinates for national map view
export const stateCoordinates = {
  'Alabama': { coords: [32.806671, -86.791130], orgCount: 45 },
  'Alaska': { coords: [61.370716, -152.404419], orgCount: 12 },
  'Arizona': { coords: [33.729759, -111.431221], orgCount: 67 },
  'Arkansas': { coords: [34.969704, -92.373123], orgCount: 32 },
  'California': { coords: [36.116203, -119.681564], orgCount: 198 },
  'Colorado': { coords: [39.059811, -105.311104], orgCount: 54 },
  'Connecticut': { coords: [41.597782, -72.755371], orgCount: 38 },
  'Delaware': { coords: [39.318523, -75.507141], orgCount: 15 },
  'Florida': { coords: [27.766279, -81.686783], orgCount: 145 },
  'Georgia': { coords: [33.040619, -83.643074], orgCount: 89 },
  'Hawaii': { coords: [21.094318, -157.498337], orgCount: 18 },
  'Idaho': { coords: [44.240459, -114.478828], orgCount: 23 },
  'Illinois': { coords: [40.349457, -88.986137], orgCount: 98 },
  'Indiana': { coords: [39.849426, -86.258278], orgCount: 67 },
  'Iowa': { coords: [42.011539, -93.210526], orgCount: 45 },
  'Kansas': { coords: [38.526600, -96.726486], orgCount: 38 },
  'Kentucky': { coords: [37.668140, -84.670067], orgCount: 52 },
  'Louisiana': { coords: [31.169546, -91.867805], orgCount: 58 },
  'Maine': { coords: [44.693947, -69.381927], orgCount: 21 },
  'Maryland': { coords: [39.063946, -76.802101], orgCount: 47 },
  'Massachusetts': { coords: [42.230171, -71.530106], orgCount: 64 },
  'Michigan': { coords: [43.326618, -84.536095], orgCount: 89 },
  'Minnesota': { coords: [45.694454, -93.900192], orgCount: 61 },
  'Mississippi': { coords: [32.741646, -89.678696], orgCount: 39 },
  'Missouri': { coords: [38.456085, -92.288368], orgCount: 72 },
  'Montana': { coords: [46.921925, -110.454353], orgCount: 19 },
  'Nebraska': { coords: [41.125370, -98.268082], orgCount: 28 },
  'Nevada': { coords: [38.313515, -117.055374], orgCount: 34 },
  'New Hampshire': { coords: [43.452492, -71.563896], orgCount: 16 },
  'New Jersey': { coords: [40.298904, -74.521011], orgCount: 73 },
  'New Mexico': { coords: [34.840515, -106.248482], orgCount: 31 },
  'New York': { coords: [42.165726, -74.948051], orgCount: 156 },
  'North Carolina': { coords: [35.630066, -79.806419], orgCount: 94 },
  'North Dakota': { coords: [47.528912, -99.784012], orgCount: 12 },
  'Ohio': { coords: [40.388783, -82.764915], orgCount: 103 },
  'Oklahoma': { coords: [35.565342, -96.928917], orgCount: 48 },
  'Oregon': { coords: [44.572021, -122.070938], orgCount: 52 },
  'Pennsylvania': { coords: [40.590752, -77.209755], orgCount: 118 },
  'Rhode Island': { coords: [41.680893, -71.511780], orgCount: 14 },
  'South Carolina': { coords: [33.856892, -80.945007], orgCount: 46 },
  'South Dakota': { coords: [44.299782, -99.438828], orgCount: 15 },
  'Tennessee': { coords: [35.747845, -86.692345], orgCount: 68 },
  'Texas': { coords: [31.054487, -97.563461], orgCount: 187 },
  'Utah': { coords: [40.150032, -111.862434], orgCount: 36 },
  'Vermont': { coords: [44.045876, -72.710686], orgCount: 11 },
  'Virginia': { coords: [37.769337, -78.169968], orgCount: 78 },
  'Washington': { coords: [47.400902, -121.490494], orgCount: 71 },
  'West Virginia': { coords: [38.491226, -80.954456], orgCount: 29 },
  'Wisconsin': { coords: [44.268543, -89.616508], orgCount: 64 },
  'Wyoming': { coords: [42.755966, -107.302490], orgCount: 9 }
};

// State name to code mapping for maps
export const stateNameToCode = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

// Helper to get state data in format for InteractiveUSMap
export const getStateMapData = () => {
  const mapData = {};
  
  Object.entries(stateData).forEach(([stateId, data]) => {
    mapData[data.name] = {
      value: data.totalChildren,
      code: stateNameToCode[data.name]
    };
  });
  
  return mapData;
};