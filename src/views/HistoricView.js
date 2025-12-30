import React, { useState, useMemo } from "react";
import { countyData, stateData, historicalData, fmt, hasValue } from "../real-data.js";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

// Get years array from historical data
const getYearsForRegion = (regionLevel, regionId) => {
  if (!historicalData?.years?.length) return [];
  return historicalData.years;
};

// Get category metrics from historical data
const getCategoryMetrics = (regionLevel, regionId, years) => {
  if (!historicalData || years.length === 0) {
    return {
      kinship: [],
      adoption: [],
      biological: [],
      wraparound: [],
      source: null
    };
  }
  
  // For state level, use the state's historical data
  if (regionLevel === 'state' && historicalData.states?.[regionId]?.metrics) {
    const metrics = historicalData.states[regionId].metrics;
    return {
      kinship: [
        metrics.childrenInCare?.some(v => v !== null) && { 
          id: 'children_in_care', 
          label: 'Children in Care', 
          data: metrics.childrenInCare
        },
        metrics.childrenInFoster?.some(v => v !== null) && { 
          id: 'children_in_foster', 
          label: 'Children in Foster Care', 
          data: metrics.childrenInFoster
        },
        metrics.childrenInKinship?.some(v => v !== null) && { 
          id: 'children_in_kinship', 
          label: 'Children in Kinship Care', 
          data: metrics.childrenInKinship
        },
        metrics.licensedHomes?.some(v => v !== null) && { 
          id: 'licensed_homes', 
          label: 'Licensed Homes', 
          data: metrics.licensedHomes
        }
      ].filter(Boolean),
      adoption: [
        metrics.waitingAdoption?.some(v => v !== null) && { 
          id: 'waiting_adoption', 
          label: 'Waiting for Adoption', 
          data: metrics.waitingAdoption
        }
      ].filter(Boolean),
      biological: [
        metrics.reunificationRate?.some(v => v !== null) && { 
          id: 'reunification_rate', 
          label: 'Reunification Rate (%)', 
          data: metrics.reunificationRate
        },
        metrics.familyPreservation?.some(v => v !== null) && { 
          id: 'family_preservation', 
          label: 'Family Preservation Cases', 
          data: metrics.familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: `MTE Data ${years[0]}-${years[years.length - 1]}`
    };
  }
  
  // For national level, aggregate from all states
  if (regionLevel === 'national' && historicalData.states) {
    const states = Object.values(historicalData.states);
    const numYears = years.length;
    
    // Aggregate metrics across all states for each year
    const aggregate = (metricKey) => {
      const totals = Array(numYears).fill(0);
      const hasCounts = Array(numYears).fill(0);
      
      states.forEach(state => {
        const values = state.metrics?.[metricKey];
        if (values) {
          values.forEach((val, idx) => {
            if (val !== null) {
              totals[idx] += val;
              hasCounts[idx]++;
            }
          });
        }
      });
      
      // Only return values where we have at least some data
      return totals.map((total, idx) => hasCounts[idx] > 0 ? total : null);
    };
    
    const childrenInCare = aggregate('childrenInCare');
    const licensedHomes = aggregate('licensedHomes');
    const waitingAdoption = aggregate('waitingAdoption');
    const familyPreservation = aggregate('familyPreservation');
    
    return {
      kinship: [
        childrenInCare.some(v => v !== null) && { 
          id: 'children_in_care', 
          label: 'Children in Care', 
          data: childrenInCare
        },
        licensedHomes.some(v => v !== null) && { 
          id: 'licensed_homes', 
          label: 'Licensed Homes', 
          data: licensedHomes
        }
      ].filter(Boolean),
      adoption: [
        waitingAdoption.some(v => v !== null) && { 
          id: 'waiting_adoption', 
          label: 'Waiting for Adoption', 
          data: waitingAdoption
        }
      ].filter(Boolean),
      biological: [
        familyPreservation.some(v => v !== null) && { 
          id: 'family_preservation', 
          label: 'Family Preservation Cases', 
          data: familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: `MTE Data ${years[0]}-${years[years.length - 1]} (${states.length} states)`
    };
  }
  
  return {
    kinship: [],
    adoption: [],
    biological: [],
    wraparound: [],
    source: null
  };
};

// Calculate trends from historical data
const calculateTrends = (regionLevel, regionId) => {
  if (!historicalData?.years?.length) return null;
  
  const calcChange = (arr) => {
    if (!arr || arr.length < 2) return null;
    const first = arr[0];
    const last = arr[arr.length - 1];
    if (!hasValue(first) || !hasValue(last) || first === 0) return null;
    return Math.round(((last - first) / first) * 100);
  };
  
  // For state level
  if (regionLevel === 'state' && historicalData.states?.[regionId]?.metrics) {
    const m = historicalData.states[regionId].metrics;
    return {
      childrenInCare: calcChange(m.childrenInCare),
      licensedHomes: calcChange(m.licensedHomes),
      waitingForAdoption: calcChange(m.waitingAdoption),
      reunificationRate: calcChange(m.reunificationRate),
      familyPreservationCases: calcChange(m.familyPreservation)
    };
  }
  
  // For national level, aggregate from states
  if (regionLevel === 'national' && historicalData.states) {
    const states = Object.values(historicalData.states);
    const numYears = historicalData.years.length;
    
    const aggregate = (metricKey) => {
      const totals = Array(numYears).fill(0);
      states.forEach(state => {
        const values = state.metrics?.[metricKey];
        if (values) {
          values.forEach((val, idx) => {
            if (val !== null) totals[idx] += val;
          });
        }
      });
      return totals;
    };
    
    return {
      childrenInCare: calcChange(aggregate('childrenInCare')),
      licensedHomes: calcChange(aggregate('licensedHomes')),
      waitingForAdoption: calcChange(aggregate('waitingAdoption')),
      reunificationRate: null, // Can't aggregate percentages
      familyPreservationCases: calcChange(aggregate('familyPreservation'))
    };
  }
  
  return null;
};

export default function HistoricView({ regionLevel, regionId, onSelectRegion }) {
  // State for selected metrics in each category - each card tracks independently
  const [selectedKinshipMetric, setSelectedKinshipMetric] = useState('children_in_care');
  const [selectedAdoptionMetric, setSelectedAdoptionMetric] = useState('waiting_adoption');
  const [selectedBiologicalMetric, setSelectedBiologicalMetric] = useState('reunification_rate');
  const [selectedWraparoundMetric, setSelectedWraparoundMetric] = useState(regionLevel === 'national' ? 'churches_ministry' : 'wraparound_cases');

  // Get dynamic years based on region
  const years = useMemo(() => {
    return getYearsForRegion(regionLevel, regionId);
  }, [regionLevel, regionId]);

  // Get dynamic category metrics based on current region
  const categoryMetrics = useMemo(() => {
    return getCategoryMetrics(regionLevel, regionId, years);
  }, [regionLevel, regionId, years]);

  // Calculate trends from real data
  const trends = useMemo(() => {
    return calculateTrends(regionLevel, regionId);
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
        // Look up state name from stateData
        const state = stateData[regionId];
        return state?.name || "Unknown State";
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

  const name = getDisplayName();

  // Download data as CSV
  const handleDownloadData = () => {
    // Build CSV content
    const rows = [];
    
    // Header row with years
    rows.push(['Metric', 'Category', ...years.map(y => y.toString())].join(','));
    
    // Add all metrics from each category
    const categories = [
      { name: 'Foster & Kinship', metrics: categoryMetrics.kinship },
      { name: 'Adoption', metrics: categoryMetrics.adoption },
      { name: 'Biological Family', metrics: categoryMetrics.biological },
      { name: 'Wraparound', metrics: categoryMetrics.wraparound }
    ];
    
    categories.forEach(cat => {
      cat.metrics.forEach(metric => {
        const values = metric.data.map(v => v !== null ? v : 'N/A');
        rows.push([`"${metric.label}"`, `"${cat.name}"`, ...values].join(','));
      });
    });
    
    // Create and download the file
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Generate filename based on region
    const regionName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    link.setAttribute('download', `mte_historical_data_${regionName}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  // Get population for county view
  const getPopulation = () => {
    if (regionLevel === 'county' && regionId && countyData[regionId]) {
      return countyData[regionId].population;
    }
    return null;
  };

  // Render a bar chart with null handling
  const renderBarChart = (category, color) => {
    const data = getMetricData(category);
    const validData = data.filter(v => hasValue(v));
    
    // If all data is null, show a message
    if (validData.length === 0) {
      return (
        <div className="h-48 md:h-64 flex items-center justify-center text-mte-charcoal font-lato">
          <span>No historical data available</span>
        </div>
      );
    }
    
    const maxValue = Math.max(...validData, 1);
    const containerHeight = 192; // h-48 = 192px (12rem)
    const maxBarHeight = containerHeight * 0.75; // Use 75% of container height
    
    return (
      <div className="relative h-48 md:h-64 flex">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
          <span>{Math.round(maxValue)}</span>
          <span>{Math.round(maxValue * 0.66)}</span>
          <span>{Math.round(maxValue * 0.33)}</span>
          <span>0</span>
        </div>
        {/* Y-axis line */}
        <div className="w-px bg-mte-light-grey"></div>
        {/* Chart area */}
        <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey overflow-hidden">
          {data.map((value, idx) => {
            // Handle null values
            if (!hasValue(value)) {
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group relative">
                  <div
                    className="bg-mte-light-grey w-full rounded relative flex items-center justify-center"
                    style={{ 
                      height: '20px',
                      maxWidth: '50px'
                    }}
                  >
                    <span className="text-xs text-mte-charcoal">N/A</span>
                  </div>
                  <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                </div>
              );
            }
            
            const heightPercent = (value / maxValue) * 100;
            const heightPx = (heightPercent / 100) * maxBarHeight;
            
            return (
              <div key={idx} className="flex flex-col items-center flex-1 group relative">
                <div
                  className={`${color} w-full rounded transition-all hover:opacity-80 relative`}
                  style={{ 
                    height: `${Math.max(heightPx, 20)}px`,
                    maxWidth: '50px',
                    maxHeight: `${maxBarHeight}px`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white bg-mte-black bg-opacity-75 px-2 py-1 rounded">{fmt(value)}</span>
                  </div>
                </div>
                <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
              onClick={handleDownloadData}
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
          {regionLevel === "county" && (
            <p className="text-sm md:text-base text-mte-charcoal mt-1 font-lato">
              Population: {fmt(getPopulation())}
            </p>
          )}
        </div>
      </div>

      {/* Metrics Grid - Fully Responsive */}
      {years.length === 0 ? (
        /* No Historical Data Available */
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-16 flex-grow">
          <div className="bg-white rounded-lg shadow-mte-card p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-nexa text-mte-black mb-4">
              Historical Data Coming Soon
            </h3>
            <p className="text-mte-charcoal font-lato mb-6">
              Year-over-year trend data is not yet available for this region. 
              Check back soon as we continue to add historical AFCARS data.
            </p>
            <button 
              onClick={() => onSelectRegion && onSelectRegion({ level: regionLevel, id: regionId, name: name, view: 'metric' })}
              className="px-6 py-3 bg-mte-blue text-white rounded-lg font-lato hover:bg-mte-blue-80 transition-colors"
            >
              View Current Metrics
            </button>
          </div>
        </div>
      ) : (
        /* Historical Data Charts */
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow">
          {/* Foster & Kinship - PURPLE */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <img src={FosterKinshipIcon} alt="Kinship" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
              <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Foster and Kinship Families</h3>
            </div>
            
            {categoryMetrics.kinship.length > 0 ? (
              <>
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
                {renderBarChart('kinship', 'bg-mte-purple')}
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
                <span>No data available</span>
              </div>
            )}
          </div>

          {/* Adoptive - GREEN */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <img src={AdoptiveFamilyIcon} alt="Adoptive" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
              <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Adoptive Families</h3>
            </div>
            
            {categoryMetrics.adoption.length > 0 ? (
              <>
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
                {renderBarChart('adoption', 'bg-mte-green')}
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
                <span>No data available</span>
              </div>
            )}
          </div>

          {/* Biological - ORANGE */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <img src={BiologicalFamilyIcon} alt="Biological" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
              <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Support for Biological Families</h3>
            </div>
            
            {categoryMetrics.biological.length > 0 ? (
              <>
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
                {renderBarChart('biological', 'bg-mte-orange')}
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
                <span>No data available</span>
              </div>
            )}
          </div>

          {/* Wraparound - YELLOW */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <img src={WrapAroundIcon} alt="Wraparound" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
              <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato text-center mb-3 md:mb-4">Wraparound Support</h3>
            </div>
            
            {categoryMetrics.wraparound.length > 0 ? (
              <>
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
                {renderBarChart('wraparound', 'bg-mte-yellow')}
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
                <span>No data available</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Change - Only show if we have data */}
      {years.length > 0 && trends && (
        <div className="bg-white max-w-5xl mx-auto rounded-lg shadow-mte-card p-4 md:p-6 mb-6 md:mb-8 mx-4">
          <h3 className="text-2xl md:text-3xl font-nexa mb-3 md:mb-4 text-mte-black text-center">
            Historical Change ({years[0]} to {years[years.length - 1]})
          </h3>
          <p className="text-xs text-mte-charcoal text-center mb-3">
            Source: {categoryMetrics.source || 'AFCARS'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-sm md:text-base font-lato">
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.childrenInCare) ? (trends.childrenInCare < 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.childrenInCare) ? `${trends.childrenInCare > 0 ? '+' : ''}${trends.childrenInCare}%` : 'N/A'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Children in Care</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.licensedHomes) ? (trends.licensedHomes > 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.licensedHomes) ? `${trends.licensedHomes > 0 ? '+' : ''}${trends.licensedHomes}%` : 'N/A'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Licensed Homes</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.waitingForAdoption) ? (trends.waitingForAdoption < 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.waitingForAdoption) ? `${trends.waitingForAdoption > 0 ? '+' : ''}${trends.waitingForAdoption}%` : 'N/A'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Waiting for Adoption</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.reunificationRate) ? (trends.reunificationRate > 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.reunificationRate) ? `${trends.reunificationRate > 0 ? '+' : ''}${trends.reunificationRate}%` : 'N/A'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Reunification Rate</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.familyPreservationCases) ? (trends.familyPreservationCases > 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.familyPreservationCases) ? `${trends.familyPreservationCases > 0 ? '+' : ''}${trends.familyPreservationCases}%` : 'N/A'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Family Preservation</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-4 text-right pr-6">
        <img src={MTELogo} alt="More Than Enough" className="h-6 md:h-8 inline-block" />
      </div>
    </div>
  );
}