import React, { useState, useMemo } from "react";
import { countyData } from "../mock-data";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

const years = [2020, 2021, 2022, 2023, 2024];

// Function to generate historical data based on current value
const generateHistoricalData = (currentValue, years = 5) => {
  const data = [];
  const variance = 0.15; // 15% variance year over year
  
  for (let i = years - 1; i >= 0; i--) {
    const yearFactor = 1 + (i * variance * (Math.random() - 0.5));
    data.push(Math.round(currentValue * yearFactor));
  }
  
  return data;
};

// Available metrics for each category - will be populated with actual data
const getCategoryMetrics = (regionKey, regionId) => {
  // Get actual county data if available
  let baseData = {};
  
  if (regionKey === 'county' && regionId && countyData[regionId]) {
    const county = countyData[regionId];
    baseData = {
      childrenInCare: county.childrenInCare,
      licensedHomes: county.licensedHomes,
      kinshipPlacements: county.childrenInKinship,
      waitingAdoption: county.waitingForAdoption,
      finalizedAdoptions: county.childrenAdopted2024,
      avgMonthsAdoption: county.avgMonthsToAdoption,
      familyPreservation: county.familyPreservationCases,
      reunificationRate: county.reunificationRate,
      supportServices: Math.round(county.familyPreservationCases * 1.5)
    };
  } else {
    // Default/placeholder data for national/state
    baseData = {
      childrenInCare: 100,
      licensedHomes: 120,
      kinshipPlacements: 95,
      waitingAdoption: 50,
      finalizedAdoptions: 52,
      avgMonthsAdoption: 14,
      familyPreservation: 105,
      reunificationRate: 78,
      supportServices: 180
    };
  }

  return {
    kinship: [
      { 
        id: 'children_in_care', 
        label: 'Children in Care', 
        data: generateHistoricalData(baseData.childrenInCare)
      },
      { 
        id: 'licensed_homes', 
        label: 'Licensed Homes', 
        data: generateHistoricalData(baseData.licensedHomes)
      },
      { 
        id: 'kinship_placements', 
        label: 'Kinship Placements', 
        data: generateHistoricalData(baseData.kinshipPlacements)
      }
    ],
    adoption: [
      { 
        id: 'waiting_adoption', 
        label: 'Children Waiting for Adoption', 
        data: generateHistoricalData(baseData.waitingAdoption)
      },
      { 
        id: 'finalized_adoptions', 
        label: 'Finalized Adoptions', 
        data: generateHistoricalData(baseData.finalizedAdoptions)
      },
      { 
        id: 'avg_months_adoption', 
        label: 'Avg Months to Adoption', 
        data: generateHistoricalData(baseData.avgMonthsAdoption)
      }
    ],
    biological: [
      { 
        id: 'family_preservation', 
        label: 'Family Preservation Cases', 
        data: generateHistoricalData(baseData.familyPreservation)
      },
      { 
        id: 'reunification_rate', 
        label: 'Reunification Rate (%)', 
        data: generateHistoricalData(baseData.reunificationRate)
      },
      { 
        id: 'support_services', 
        label: 'Support Services Provided', 
        data: generateHistoricalData(baseData.supportServices)
      }
    ],
    wraparound: [
      { 
        id: 'wraparound_cases', 
        label: 'Wraparound Support Cases', 
        data: generateHistoricalData(Math.round(baseData.childrenInCare * 0.15))
      },
      { 
        id: 'community_support', 
        label: 'Community Support Programs', 
        data: generateHistoricalData(Math.round(baseData.childrenInCare * 0.12))
      },
      { 
        id: 'respite_services', 
        label: 'Respite Services Hours', 
        data: generateHistoricalData(Math.round(baseData.childrenInCare * 0.20))
      }
    ]
  };
};

const mockTrendsData = {
  national: {
    childrenInCare: -8,
    licensedHomes: 12,
    waitingForAdoption: -15,
    reunificationRate: 8,
    familyPreservationCases: -25
  },
  state: {
    childrenInCare: -15,
    licensedHomes: 10,
    waitingForAdoption: -12,
    reunificationRate: 6,
    familyPreservationCases: -20
  },
  county: {
    childrenInCare: -30,
    licensedHomes: 5,
    waitingForAdoption: -10,
    reunificationRate: 10,
    familyPreservationCases: -5
  }
};

export default function HistoricView({ regionLevel, regionId, onSelectRegion }) {
  // State for selected metrics in each category - each card tracks independently
  const [selectedKinshipMetric, setSelectedKinshipMetric] = useState('children_in_care');
  const [selectedAdoptionMetric, setSelectedAdoptionMetric] = useState('waiting_adoption');
  const [selectedBiologicalMetric, setSelectedBiologicalMetric] = useState('family_preservation');
  const [selectedWraparoundMetric, setSelectedWraparoundMetric] = useState('wraparound_cases');

  // Get dynamic category metrics based on current region
  // Use useMemo to prevent regenerating random data on every state change
  const categoryMetrics = useMemo(() => {
    return getCategoryMetrics(regionLevel, regionId);
  }, [regionLevel, regionId]);

  // Get current state code from regionId
  const getCurrentStateCode = () => {
    if (!regionId) return 'AL';
    const parts = regionId.split('-');
    return parts[parts.length - 1].toUpperCase();
  };

  // Get counties for the current state from countyData
  const getCountiesForCurrentState = () => {
    const stateCode = getCurrentStateCode().toLowerCase();
    
    // Filter counties from mock-data that match the current state
    const countiesInState = Object.entries(countyData)
      .filter(([countyId, data]) => {
        // County IDs are formatted as "countyname-statecode"
        const countyStateCode = countyId.split('-').pop();
        return countyStateCode === stateCode;
      })
      .map(([countyId, data]) => {
        // Extract just the county name without state suffix
        const countyName = data.name.split(',')[0].trim();
        return {
          id: countyId,
          name: countyName
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    // If no counties found, return a fallback based on state code
    if (countiesInState.length === 0) {
      const fallbackCounties = {
        'al': [{ id: 'butler-al', name: 'Butler County' }],
        'ny': [{ id: 'nassau-ny', name: 'Nassau County' }]
      };
      return fallbackCounties[stateCode] || fallbackCounties['al'];
    }

    return countiesInState;
  };

  // Get data based on region level
  const getDisplayName = () => {
    switch (regionLevel) {
      case "national":
        return "United States of America";
      case "state":
        return "Alabama"; // Would come from regionId lookup
      case "county":
        // Extract county name from regionId or use default
        if (regionId) {
          // regionId format: "butler-al", "nassau-ny", "ada-id"
          const parts = regionId.split('-');
          const countyName = parts.slice(0, -1).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          const stateCode = parts[parts.length - 1].toUpperCase();
          
          // Map state codes to full names - ALL 50 STATES
          const stateNames = {
            'AL': 'Alabama',
            'AK': 'Alaska',
            'AZ': 'Arizona',
            'AR': 'Arkansas',
            'CA': 'California',
            'CO': 'Colorado',
            'CT': 'Connecticut',
            'DE': 'Delaware',
            'FL': 'Florida',
            'GA': 'Georgia',
            'HI': 'Hawaii',
            'ID': 'Idaho',
            'IL': 'Illinois',
            'IN': 'Indiana',
            'IA': 'Iowa',
            'KS': 'Kansas',
            'KY': 'Kentucky',
            'LA': 'Louisiana',
            'ME': 'Maine',
            'MD': 'Maryland',
            'MA': 'Massachusetts',
            'MI': 'Michigan',
            'MN': 'Minnesota',
            'MS': 'Mississippi',
            'MO': 'Missouri',
            'MT': 'Montana',
            'NE': 'Nebraska',
            'NV': 'Nevada',
            'NH': 'New Hampshire',
            'NJ': 'New Jersey',
            'NM': 'New Mexico',
            'NY': 'New York',
            'NC': 'North Carolina',
            'ND': 'North Dakota',
            'OH': 'Ohio',
            'OK': 'Oklahoma',
            'OR': 'Oregon',
            'PA': 'Pennsylvania',
            'RI': 'Rhode Island',
            'SC': 'South Carolina',
            'SD': 'South Dakota',
            'TN': 'Tennessee',
            'TX': 'Texas',
            'UT': 'Utah',
            'VT': 'Vermont',
            'VA': 'Virginia',
            'WA': 'Washington',
            'WV': 'West Virginia',
            'WI': 'Wisconsin',
            'WY': 'Wyoming'
          };
          
          return `${countyName} County, ${stateNames[stateCode] || stateCode}`;
        }
        return "Butler County, Alabama"; // Default fallback
      default:
        return "";
    }
  };

  const handleCountyChange = (e) => {
    const countyId = e.target.value;
    
    // Extract county name and state code from countyId
    const parts = countyId.split('-');
    const countyName = parts.slice(0, -1).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    const stateCode = parts[parts.length - 1].toUpperCase();
    
    // Map state codes to full names - ALL 50 STATES
    const stateNames = {
      'AL': 'Alabama',
      'AK': 'Alaska',
      'AZ': 'Arizona',
      'AR': 'Arkansas',
      'CA': 'California',
      'CO': 'Colorado',
      'CT': 'Connecticut',
      'DE': 'Delaware',
      'FL': 'Florida',
      'GA': 'Georgia',
      'HI': 'Hawaii',
      'ID': 'Idaho',
      'IL': 'Illinois',
      'IN': 'Indiana',
      'IA': 'Iowa',
      'KS': 'Kansas',
      'KY': 'Kentucky',
      'LA': 'Louisiana',
      'ME': 'Maine',
      'MD': 'Maryland',
      'MA': 'Massachusetts',
      'MI': 'Michigan',
      'MN': 'Minnesota',
      'MS': 'Mississippi',
      'MO': 'Missouri',
      'MT': 'Montana',
      'NE': 'Nebraska',
      'NV': 'Nevada',
      'NH': 'New Hampshire',
      'NJ': 'New Jersey',
      'NM': 'New Mexico',
      'NY': 'New York',
      'NC': 'North Carolina',
      'ND': 'North Dakota',
      'OH': 'Ohio',
      'OK': 'Oklahoma',
      'OR': 'Oregon',
      'PA': 'Pennsylvania',
      'RI': 'Rhode Island',
      'SC': 'South Carolina',
      'SD': 'South Dakota',
      'TN': 'Tennessee',
      'TX': 'Texas',
      'UT': 'Utah',
      'VT': 'Vermont',
      'VA': 'Virginia',
      'WA': 'Washington',
      'WV': 'West Virginia',
      'WI': 'Wisconsin',
      'WY': 'Wyoming'
    };
    
    const fullName = `${countyName} County, ${stateNames[stateCode] || stateCode}`;
    
    // Call parent's onSelectRegion to update the app state
    if (onSelectRegion) {
      onSelectRegion({
        level: 'county',
        id: countyId,
        name: fullName,
        code: stateCode
      });
    }
  };

  const getTrends = () => {
    switch (regionLevel) {
      case "national":
        return mockTrendsData.national;
      case "state":
        return mockTrendsData.state;
      case "county":
        return mockTrendsData.county;
      default:
        return mockTrendsData.county;
    }
  };

  const name = getDisplayName();
  const trends = getTrends();

  // Get selected metric data for each category
  const getMetricData = (category) => {
    let metricId;
    switch(category) {
      case 'kinship':
        metricId = selectedKinshipMetric;
        break;
      case 'adoption':
        metricId = selectedAdoptionMetric;
        break;
      case 'biological':
        metricId = selectedBiologicalMetric;
        break;
      case 'wraparound':
        metricId = selectedWraparoundMetric;
        break;
      default:
        metricId = null;
    }
    const metric = categoryMetrics[category].find(m => m.id === metricId);
    return metric ? metric.data : [];
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Context Navigation Bar - Specific to Historic View */}
      <div className="py-3 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap gap-3 md:gap-4">
            <button 
              onClick={() => onSelectRegion && onSelectRegion({ level: regionLevel, id: regionId, name: getDisplayName(), view: 'metric' })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-mte-light-grey rounded-lg text-sm md:text-base font-lato text-mte-black hover:bg-mte-blue-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              {regionLevel === 'county' ? 'Return to County Metrics' : 
               regionLevel === 'state' ? 'Return to State Metrics' : 
               'Return to National Metrics'}
            </button>
            <button 
              onClick={() => onSelectRegion && onSelectRegion({ level: regionLevel, id: regionId, name: getDisplayName(), view: 'organizational' })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-mte-light-grey rounded-lg text-sm md:text-base font-lato text-mte-black hover:bg-mte-blue-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"/>
              </svg>
              Explore the Map
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-mte-light-grey rounded-lg text-sm md:text-base font-lato text-mte-black hover:bg-mte-blue-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Download Data
            </button>
          </div>
          
          {/* County Selector - Moved to navigation bar (County view only) */}
          {regionLevel === "county" && (
            <div className="flex items-center gap-3 bg-white rounded-lg border border-mte-light-grey shadow-mte-card px-4 py-2">
              <svg className="w-5 h-5 text-mte-charcoal" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <select 
                className="appearance-none bg-transparent border-none outline-none font-lato text-mte-black font-semibold text-sm md:text-base pr-6 cursor-pointer focus:ring-0"
                value={regionId || "butler-al"}
                onChange={handleCountyChange}
              >
                {getCountiesForCurrentState().map(county => (
                  <option key={county.id} value={county.id}>
                    {county.name}
                  </option>
                ))}
              </select>
              <svg className="w-4 h-4 text-mte-charcoal -ml-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-nexa text-mte-black text-center">
            {name}
          </h1>
          <p className="text-sm md:text-base text-mte-charcoal mt-2 font-lato">
            {regionLevel === "county" && regionId && countyData[regionId] && (
              <>Population: {countyData[regionId].population.toLocaleString()}</>
            )}
          </p>
        </div>
      </div>

      {/* Metrics Grid - Fully Responsive */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow">
        {/* Foster & Kinship */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={FosterKinshipIcon} alt="Kinship" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
            <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Foster and Kinship Families</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric</label>
            <select 
              value={selectedKinshipMetric}
              onChange={(e) => setSelectedKinshipMetric(e.target.value)}
              className="w-full bg-mte-blue-20 border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.kinship.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey overflow-hidden">
              {(() => {
                const data = getMetricData('kinship');
                const maxValue = Math.max(...data, 1);
                const containerHeight = 192; // h-48 = 192px (12rem)
                const maxBarHeight = containerHeight * 0.75; // Use 75% of container height
                
                return data.map((value, idx) => {
                  const heightPercent = (value / maxValue) * 100;
                  const heightPx = (heightPercent / 100) * maxBarHeight;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-mte-green w-full rounded transition-all hover:opacity-80"
                        style={{ 
                          height: `${Math.max(heightPx, 20)}px`,
                          maxWidth: '50px',
                          maxHeight: `${maxBarHeight}px`
                        }}
                      ></div>
                      <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Adoptive */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={AdoptiveFamilyIcon} alt="Adoptive" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
            <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Adoptive Families</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric</label>
            <select 
              value={selectedAdoptionMetric}
              onChange={(e) => setSelectedAdoptionMetric(e.target.value)}
              className="w-full bg-mte-blue-20 border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.adoption.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey overflow-hidden">
              {(() => {
                const data = getMetricData('adoption');
                const maxValue = Math.max(...data, 1);
                const containerHeight = 192; // h-48 = 192px
                const maxBarHeight = containerHeight * 0.75; // Use 75% of container height
                
                return data.map((value, idx) => {
                  const heightPercent = (value / maxValue) * 100;
                  const heightPx = (heightPercent / 100) * maxBarHeight;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-mte-yellow w-full rounded transition-all hover:opacity-80"
                        style={{ 
                          height: `${Math.max(heightPx, 20)}px`,
                          maxWidth: '50px',
                          maxHeight: `${maxBarHeight}px`
                        }}
                      ></div>
                      <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Biological */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={BiologicalFamilyIcon} alt="Biological" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
            <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Support for Biological Families</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric</label>
            <select 
              value={selectedBiologicalMetric}
              onChange={(e) => setSelectedBiologicalMetric(e.target.value)}
              className="w-full bg-mte-blue-20 border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.biological.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey overflow-hidden">
              {(() => {
                const data = getMetricData('biological');
                const maxValue = Math.max(...data, 1);
                const containerHeight = 192; // h-48 = 192px
                const maxBarHeight = containerHeight * 0.75; // Use 75% of container height
                
                return data.map((value, idx) => {
                  const heightPercent = (value / maxValue) * 100;
                  const heightPx = (heightPercent / 100) * maxBarHeight;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-mte-orange w-full rounded transition-all hover:opacity-80"
                        style={{ 
                          height: `${Math.max(heightPx, 20)}px`,
                          maxWidth: '50px',
                          maxHeight: `${maxBarHeight}px`
                        }}
                      ></div>
                      <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Wraparound */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={WrapAroundIcon} alt="Wraparound" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
            <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Wraparound Support</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric</label>
            <select 
              value={selectedWraparoundMetric}
              onChange={(e) => setSelectedWraparoundMetric(e.target.value)}
              className="w-full bg-mte-blue-20 border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.wraparound.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey overflow-hidden">
              {(() => {
                const data = getMetricData('wraparound');
                const maxValue = Math.max(...data, 1);
                const containerHeight = 192; // h-48 = 192px
                const maxBarHeight = containerHeight * 0.75; // Use 75% of container height
                
                return data.map((value, idx) => {
                  const heightPercent = (value / maxValue) * 100;
                  const heightPx = (heightPercent / 100) * maxBarHeight;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-mte-purple w-full rounded transition-all hover:opacity-80"
                        style={{ 
                          height: `${Math.max(heightPx, 20)}px`,
                          maxWidth: '50px',
                          maxHeight: `${maxBarHeight}px`
                        }}
                      ></div>
                      <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Change - Responsive Grid - Changed title to Nexa Rust font */}
      <div className="bg-white max-w-5xl mx-auto rounded-lg shadow-mte-card p-4 md:p-6 mb-6 md:mb-8 mx-4">
        <h3 className="text-2xl md:text-3xl font-nexa mb-3 md:mb-4 text-mte-black text-center">
          Historical Change (2020 to 2024)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-sm md:text-base font-lato">
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.childrenInCare < 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.childrenInCare > 0 ? '+' : ''}{trends.childrenInCare}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Children in Care</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.licensedHomes > 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.licensedHomes > 0 ? '+' : ''}{trends.licensedHomes}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Licensed Homes</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.waitingForAdoption < 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.waitingForAdoption > 0 ? '+' : ''}{trends.waitingForAdoption}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Waiting for Adoption</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.reunificationRate > 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.reunificationRate > 0 ? '+' : ''}{trends.reunificationRate}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Reunification Rate</div>
          </div>
          <div className="text-center col-span-2 md:col-span-1">
            <div className={`font-bold text-lg md:text-xl ${trends.familyPreservationCases < 0 ? 'text-mte-orange' : 'text-mte-green'}`}>
              {trends.familyPreservationCases > 0 ? '+' : ''}{trends.familyPreservationCases}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Family Preservation</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-right pr-6">
        <img src={MTELogo} alt="More Than Enough" className="h-6 md:h-8 inline-block" />
      </div>
    </div>
  );
}