// Mock data for the Foster Care App

export const stateData = {
  alabama: {
    name: 'Alabama',
    totalChildren: 5809,
    licensedHomes: 2474,
    waitingForAdoption: 486,
    reunificationRate: 79.2,
    familyPreservationCases: 50
  },
  "new-york": {
    name: 'New York',
    totalChildren: 18045, // fake values
    licensedHomes: 7420,
    waitingForAdoption: 934,
    reunificationRate: 76.3,
    familyPreservationCases: 320
  }
};


export const countyData = {
  'butler-al': {
    name: 'Butler County, Alabama',
    state: 'Alabama',
    population: 18832,
    totalChurches: 5,
    childrenInCare: 21,
    childrenInFamily: 34,
    childrenInKinship: 28,
    childrenOutOfCounty: 4,
    licensedHomes: 43,
    licensedHomesPerChild: 2.04,
    waitingForAdoption: 5,
    childrenAdopted2024: 6,
    avgMonthsToAdoption: 8.4,
    familyPreservationCases: 12,
    reunificationRate: 85,
    churchesProvidingSupport: 4,
    supportPercentage: 80,
    trends: {
      childrenInCare: -30,
      licensedHomes: 5,
      waitingForAdoption: -10,
      reunificationRate: 10,
      familyPreservationCases: -5
    },
    history: {
      kinship: [60, 55, 50, 40, 30],
      adoption: [2, 2, 3, 4, 6],
      biological: [30, 35, 32, 25, 20],
      wraparound: [1, 2, 3, 3, 4]
    }
  },
  'nassau-ny': {
    name: 'Nassau County, New York',
    state: 'New York',
    population: 1395774,
    totalChurches: 127,
    childrenInCare: 543,
    childrenInFamily: 234,
    childrenInKinship: 189,
    childrenOutOfCounty: 15,
    licensedHomes: 289,
    licensedHomesPerChild: 0.53,
    waitingForAdoption: 67,
    childrenAdopted2024: 45,
    avgMonthsToAdoption: 12.3,
    familyPreservationCases: 156,
    reunificationRate: 72,
    churchesProvidingSupport: 89,
    supportPercentage: 70,
    trends: {
      childrenInCare: -12,
      licensedHomes: 8,
      waitingForAdoption: -7,
      reunificationRate: 4,
      familyPreservationCases: -3
    },
    history: {
      kinship: [200, 210, 205, 198, 189],
      adoption: [30, 35, 38, 42, 45],
      biological: [180, 175, 170, 165, 156],
      wraparound: [70, 75, 80, 85, 89]
    }
  }
};


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

export const nationalStats = {
  childrenInCare: 343077,
  childrenInFamilyFoster: 52483,
  childrenInKinship: 74208,
  childrenWaitingAdoption: 48459,
  childrenAdopted2023: 50193,
  totalChurches: 370000,
  churchesWithMinistry: 30000
};