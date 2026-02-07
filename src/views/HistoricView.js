import React, { useState, useMemo } from "react";
import { countyData, stateData, historicalData, fmt, hasValue } from "../real-data.js";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

// Get years array from historical data based on region level
// parse-data.js format: { "2021": {...}, "2022": {...}, "2023": {...} }
// AFCARS has 2021-2023 for states/national
// Metrics files have 2024-2025 for counties
const getYearsForRegion = (regionLevel, regionId) => {
  if (!historicalData) return [];
  
  // For county level, only 2024-2025 have data
  if (regionLevel === 'county') {
    const countyYears = [];
    if (historicalData['2024']?.counties?.[regionId]) countyYears.push(2024);
    if (historicalData['2025']?.counties?.[regionId]) countyYears.push(2025);
    return countyYears;
  }
  
  // For state/national, use AFCARS years (2021-2023)
  const years = Object.keys(historicalData)
    .map(y => parseInt(y))
    .filter(y => !isNaN(y) && y >= 2021 && y <= 2023) // Only AFCARS years for state/national
    .sort((a, b) => a - b);
  return years;
};

// Helper to get metric value for a state across all years
// Transforms from year-keyed to array format
const getMetricArray = (stateKey, metricName, years) => {
  return years.map(year => {
    const yearData = historicalData[year]?.states?.[stateKey];
    if (!yearData) return null;
    
    // Map metric names to the actual field names in parse-data.js output
    const fieldMap = {
      'childrenInCare': 'totalChildren',
      'childrenInFoster': 'childrenInFosterCare',
      'childrenInKinship': 'childrenInKinship',
      'licensedHomes': 'licensedHomes',
      'waitingAdoption': 'waitingForAdoption',
      'childrenAdopted': 'childrenAdopted',
      'reunificationRate': 'reunificationRate',
      'familyPreservation': 'familyPreservationCases'
    };
    
    const fieldName = fieldMap[metricName] || metricName;
    return yearData[fieldName] ?? null;
  });
};

// Helper to get metric value for a county across years
const getCountyMetricArray = (countyKey, metricName, years) => {
  return years.map(year => {
    const yearData = historicalData[year]?.counties?.[countyKey];
    if (!yearData) return null;
    
    // Map metric names to actual field names in county data
    const fieldMap = {
      'childrenInCare': 'childrenInCare',
      'childrenInFoster': 'childrenInFamily',
      'childrenInKinship': 'childrenInKinship',
      'licensedHomes': 'licensedHomes',
      'waitingAdoption': 'waitingForAdoption',
      'childrenAdopted': 'childrenAdopted',
      'reunificationRate': 'reunificationRate',
      'familyPreservation': 'familyPreservationCases',
      'totalChurches': 'totalChurches',
      'childrenOutOfCounty': 'childrenOutOfCounty'
    };
    
    const fieldName = fieldMap[metricName] || metricName;
    return yearData[fieldName] ?? null;
  });
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
  
  // For state level, extract data from year-keyed structure
  if (regionLevel === 'state') {
    const childrenInCare = getMetricArray(regionId, 'childrenInCare', years);
    const childrenInFoster = getMetricArray(regionId, 'childrenInFoster', years);
    const childrenInKinship = getMetricArray(regionId, 'childrenInKinship', years);
    const licensedHomes = getMetricArray(regionId, 'licensedHomes', years);
    const waitingAdoption = getMetricArray(regionId, 'waitingAdoption', years);
    const childrenAdopted = getMetricArray(regionId, 'childrenAdopted', years);
    const reunificationRate = getMetricArray(regionId, 'reunificationRate', years);
    const familyPreservation = getMetricArray(regionId, 'familyPreservation', years);
    
    return {
      kinship: [
        childrenInCare.some(v => v !== null) && { 
          id: 'children_in_care', 
          label: 'Children in Care', 
          data: childrenInCare
        },
        childrenInFoster.some(v => v !== null) && { 
          id: 'children_in_foster', 
          label: 'Children in Foster Care', 
          data: childrenInFoster
        },
        childrenInKinship.some(v => v !== null) && { 
          id: 'children_in_kinship', 
          label: 'Children in Kinship Care', 
          data: childrenInKinship
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
        },
        childrenAdopted.some(v => v !== null) && { 
          id: 'children_adopted', 
          label: 'Children Adopted', 
          data: childrenAdopted
        }
      ].filter(Boolean),
      biological: [
        reunificationRate.some(v => v !== null) && { 
          id: 'reunification_rate', 
          label: 'Reunification Rate (%)', 
          data: reunificationRate,
          isPercentage: true
        },
        familyPreservation.some(v => v !== null) && { 
          id: 'family_preservation', 
          label: 'Family Preservation Cases', 
          data: familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: `AFCARS End of Year ${years[0] - 1} - End of Year ${years[years.length - 1] - 1}`
    };
  }
  
  // For national level, aggregate from historicalData[year].national
  if (regionLevel === 'national') {
    const childrenInCare = years.map(year => historicalData[year]?.national?.childrenInCare ?? null);
    const childrenInFoster = years.map(year => historicalData[year]?.national?.childrenInFamilyFoster ?? null);
    const childrenInKinship = years.map(year => historicalData[year]?.national?.childrenInKinship ?? null);
    const waitingAdoption = years.map(year => historicalData[year]?.national?.childrenWaitingAdoption ?? null);
    const childrenAdopted = years.map(year => historicalData[year]?.national?.childrenAdopted ?? null);
    
    return {
      kinship: [
        childrenInCare.some(v => v !== null) && { 
          id: 'children_in_care', 
          label: 'Children in Care', 
          data: childrenInCare
        },
        childrenInFoster.some(v => v !== null) && { 
          id: 'children_in_foster', 
          label: 'Children in Foster Care', 
          data: childrenInFoster
        },
        childrenInKinship.some(v => v !== null) && { 
          id: 'children_in_kinship', 
          label: 'Children in Kinship Care', 
          data: childrenInKinship
        }
      ].filter(Boolean),
      adoption: [
        waitingAdoption.some(v => v !== null) && { 
          id: 'waiting_adoption', 
          label: 'Waiting for Adoption', 
          data: waitingAdoption
        },
        childrenAdopted.some(v => v !== null) && { 
          id: 'children_adopted', 
          label: 'Children Adopted', 
          data: childrenAdopted
        }
      ].filter(Boolean),
      biological: [],
      wraparound: [],
      source: `AFCARS End of Year ${years[0] - 1} - End of Year ${years[years.length - 1] - 1}`
    };
  }
  
  // For county level, use metrics CSV data (2024-2025)
  if (regionLevel === 'county') {
    const childrenInCare = getCountyMetricArray(regionId, 'childrenInCare', years);
    const childrenInFoster = getCountyMetricArray(regionId, 'childrenInFoster', years);
    const childrenInKinship = getCountyMetricArray(regionId, 'childrenInKinship', years);
    const licensedHomes = getCountyMetricArray(regionId, 'licensedHomes', years);
    const waitingAdoption = getCountyMetricArray(regionId, 'waitingAdoption', years);
    const childrenAdopted = getCountyMetricArray(regionId, 'childrenAdopted', years);
    const reunificationRate = getCountyMetricArray(regionId, 'reunificationRate', years);
    const familyPreservation = getCountyMetricArray(regionId, 'familyPreservation', years);
    const childrenOutOfCounty = getCountyMetricArray(regionId, 'childrenOutOfCounty', years);
    
    return {
      kinship: [
        childrenInCare.some(v => v !== null) && { 
          id: 'children_in_care', 
          label: 'Children in Care', 
          data: childrenInCare
        },
        childrenInFoster.some(v => v !== null) && { 
          id: 'children_in_foster', 
          label: 'Children in Foster Care', 
          data: childrenInFoster
        },
        childrenInKinship.some(v => v !== null) && { 
          id: 'children_in_kinship', 
          label: 'Children in Kinship Care', 
          data: childrenInKinship
        },
        licensedHomes.some(v => v !== null) && { 
          id: 'licensed_homes', 
          label: 'Licensed Homes', 
          data: licensedHomes
        },
        childrenOutOfCounty.some(v => v !== null) && { 
          id: 'children_out_of_county', 
          label: 'Children Placed Out-of-County', 
          data: childrenOutOfCounty
        }
      ].filter(Boolean),
      adoption: [
        waitingAdoption.some(v => v !== null) && { 
          id: 'waiting_adoption', 
          label: 'Waiting for Adoption', 
          data: waitingAdoption
        },
        childrenAdopted.some(v => v !== null) && { 
          id: 'children_adopted', 
          label: 'Children Adopted', 
          data: childrenAdopted
        }
      ].filter(Boolean),
      biological: [
        reunificationRate.some(v => v !== null) && { 
          id: 'reunification_rate', 
          label: 'Reunification Rate (%)', 
          data: reunificationRate,
          isPercentage: true
        },
        familyPreservation.some(v => v !== null) && { 
          id: 'family_preservation', 
          label: 'Family Preservation Cases', 
          data: familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: `MTE Metrics End of Year ${years[0] - 1} - End of Year ${years[years.length - 1] - 1}`
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
const calculateTrends = (regionLevel, regionId, years) => {
  if (!historicalData || years.length < 2) return null;
  
  const calcChange = (arr) => {
    if (!arr || arr.length < 2) return null;
    const first = arr[0];
    const last = arr[arr.length - 1];
    if (!hasValue(first) || !hasValue(last) || first === 0) return null;
    return Math.round(((last - first) / first) * 100);
  };
  
  // For state level
  if (regionLevel === 'state') {
    const childrenInCare = getMetricArray(regionId, 'childrenInCare', years);
    const licensedHomes = getMetricArray(regionId, 'licensedHomes', years);
    const waitingAdoption = getMetricArray(regionId, 'waitingAdoption', years);
    const reunificationRate = getMetricArray(regionId, 'reunificationRate', years);
    const familyPreservation = getMetricArray(regionId, 'familyPreservation', years);
    
    return {
      childrenInCare: calcChange(childrenInCare),
      licensedHomes: calcChange(licensedHomes),
      waitingForAdoption: calcChange(waitingAdoption),
      reunificationRate: calcChange(reunificationRate),
      familyPreservationCases: calcChange(familyPreservation)
    };
  }
  
  // For national level
  if (regionLevel === 'national') {
    const childrenInCare = years.map(year => historicalData[year]?.national?.childrenInCare ?? null);
    const waitingAdoption = years.map(year => historicalData[year]?.national?.childrenWaitingAdoption ?? null);
    
    return {
      childrenInCare: calcChange(childrenInCare),
      licensedHomes: null, // Not available at national level in AFCARS
      waitingForAdoption: calcChange(waitingAdoption),
      reunificationRate: null, // Can't aggregate percentages
      familyPreservationCases: null
    };
  }
  
  // For county level
  if (regionLevel === 'county') {
    const childrenInCare = getCountyMetricArray(regionId, 'childrenInCare', years);
    const licensedHomes = getCountyMetricArray(regionId, 'licensedHomes', years);
    const waitingAdoption = getCountyMetricArray(regionId, 'waitingAdoption', years);
    const reunificationRate = getCountyMetricArray(regionId, 'reunificationRate', years);
    const familyPreservation = getCountyMetricArray(regionId, 'familyPreservation', years);
    
    return {
      childrenInCare: calcChange(childrenInCare),
      licensedHomes: calcChange(licensedHomes),
      waitingForAdoption: calcChange(waitingAdoption),
      reunificationRate: calcChange(reunificationRate),
      familyPreservationCases: calcChange(familyPreservation)
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
    return calculateTrends(regionLevel, regionId, years);
  }, [regionLevel, regionId, years]);

  // Get current state code from regionId (works for both state and county level)
  const getCurrentStateCode = () => {
    if (!regionId) return 'al';
    
    // At county level, regionId is like "los-angeles-ca" - get last part
    if (regionLevel === 'county') {
      const parts = regionId.split('-');
      return parts[parts.length - 1].toLowerCase();
    }
    
    // At state level, regionId is like "california" - get state code from stateData
    if (regionLevel === 'state' && stateData[regionId]) {
      return stateData[regionId].code?.toLowerCase() || regionId.slice(0, 2);
    }
    
    return 'al'; // Default fallback
  };

  // Get counties for the current state from countyData
  const getCountiesForCurrentState = () => {
    const stateCode = getCurrentStateCode(); // Already lowercase
    
    // Filter counties that match the current state
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
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return countiesInState;
  };

  // Get all states sorted alphabetically
  const getAllStates = () => {
    return Object.entries(stateData)
      .map(([stateId, data]) => ({
        id: stateId,
        name: data.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get display name based on region
  const getDisplayName = () => {
    if (regionLevel === 'national') return 'United States';
    if (regionLevel === 'state' && stateData[regionId]) {
      return stateData[regionId].name;
    }
    if (regionLevel === 'county' && countyData[regionId]) {
      return countyData[regionId].name;
    }
    return regionId || 'Unknown Region';
  };

  // Helper function to render bar chart for each metric
  const renderBarChart = (category, bgColor) => {
    let metrics, selectedMetric;
    
    switch(category) {
      case 'kinship':
        metrics = categoryMetrics.kinship;
        selectedMetric = selectedKinshipMetric;
        break;
      case 'adoption':
        metrics = categoryMetrics.adoption;
        selectedMetric = selectedAdoptionMetric;
        break;
      case 'biological':
        metrics = categoryMetrics.biological;
        selectedMetric = selectedBiologicalMetric;
        break;
      case 'wraparound':
        metrics = categoryMetrics.wraparound;
        selectedMetric = selectedWraparoundMetric;
        break;
      default:
        return null;
    }
    
    const currentMetric = metrics.find(m => m.id === selectedMetric) || metrics[0];
    
    if (!currentMetric?.data) {
      return (
        <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
          <span>No historical data available</span>
        </div>
      );
    }
    
    const data = currentMetric.data;
    const isPercentage = currentMetric.isPercentage;
    const validData = data.filter(v => v !== null);
    
    if (validData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
          <span>No historical data available</span>
        </div>
      );
    }
    
    // For percentage metrics, convert to display values (0.2 -> 20)
    const displayData = isPercentage ? data.map(v => v !== null ? v * 100 : null) : data;
    const validDisplayData = displayData.filter(v => v !== null);
    const maxValue = Math.max(...validDisplayData);
    const chartHeight = 140;
    const yMax = maxValue > 0 ? maxValue : 1;
    
    // Format value for display
    const formatValue = (value) => {
      if (value === null) return 'N/A';
      if (isPercentage) {
        return `${Math.round(value)}%`;
      }
      return fmt(value);
    };
    
    return (
      <div className="mt-4">
        {/* Bars container */}
        <div className="flex items-end justify-around gap-4 px-4" style={{ height: `${chartHeight}px` }}>
          {years.map((year, index) => {
            const value = displayData[index];
            const isNull = value === null;
            const barHeight = isNull ? 24 : Math.max(24, (value / yMax) * chartHeight);
            
            return (
              <div key={year} className="flex-1 max-w-[80px] flex flex-col items-center">
                {/* Bar with value inside */}
                <div 
                  className={`w-full ${isNull ? 'bg-mte-light-grey' : bgColor} rounded-t flex items-center justify-center transition-all duration-300`}
                  style={{ height: `${barHeight}px` }}
                >
                  <span className="text-white text-sm font-bold font-lato drop-shadow-sm">
                    {formatValue(value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Year labels */}
        <div className="flex justify-around gap-4 px-4 mt-2">
          {years.map((year) => (
            <div key={year} className="flex-1 max-w-[80px] text-center">
              <div className="text-xs font-semibold text-mte-charcoal font-lato">End of Year {year - 1}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-2 md:pt-3 pb-1 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4 leading-none">
            {getDisplayName()}
          </h1>
          <p className="text-sm md:text-base text-mte-charcoal text-center px-4 font-lato -mt-5 md:-mt-6">
            Historical trends and data analysis
          </p>
        </div>
      </header>

      {/* Region Navigation - Only show at state level */}
      {regionLevel === 'state' && (
        <div className="py-3 mb-4 md:mb-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {/* State Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">State:</label>
              <select 
                className="bg-white border border-mte-light-grey rounded px-3 py-1 text-sm font-lato text-mte-charcoal"
                value={regionId || ''}
                onChange={(e) => {
                  const stateId = e.target.value;
                  const stateName = stateData[stateId]?.name || stateId;
                  onSelectRegion({ level: 'state', id: stateId, name: stateName });
                }}
              >
                {getAllStates().map(state => (
                  <option key={state.id} value={state.id}>{state.name}</option>
                ))}
              </select>
            </div>

            {/* County Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">County:</label>
              <select 
                className="bg-white border border-mte-light-grey rounded px-3 py-1 text-sm font-lato text-mte-charcoal"
                value=""
                onChange={(e) => {
                  const countyId = e.target.value;
                  if (countyId && countyData[countyId]) {
                    onSelectRegion({ 
                      level: 'county', 
                      id: countyId, 
                      name: countyData[countyId].name 
                    });
                  }
                }}
              >
                <option value="">Select a county</option>
                {getCountiesForCurrentState().map(county => (
                  <option key={county.id} value={county.id}>{county.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Region Navigation - National level */}
      {regionLevel === 'national' && (
        <div className="py-3 mb-4 md:mb-6">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4">
            {/* State Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">Jump to State:</label>
              <select 
                className="bg-white border border-mte-light-grey rounded px-3 py-1 text-sm font-lato text-mte-charcoal"
                value=""
                onChange={(e) => {
                  const stateId = e.target.value;
                  if (stateId && stateData[stateId]) {
                    onSelectRegion({ 
                      level: 'state', 
                      id: stateId, 
                      name: stateData[stateId].name 
                    });
                  }
                }}
              >
                <option value="">Select a state</option>
                {getAllStates().map(state => (
                  <option key={state.id} value={state.id}>{state.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Region Navigation - County level */}
      {regionLevel === 'county' && (
        <div className="py-3 mb-4 md:mb-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {/* Back to State button */}
            <button
              onClick={() => {
                const countyInfo = countyData[regionId];
                if (countyInfo) {
                  // Find the state key from county's state name
                  const stateEntry = Object.entries(stateData).find(([key, data]) => 
                    data.name === countyInfo.state
                  );
                  if (stateEntry) {
                    onSelectRegion({ level: 'state', id: stateEntry[0], name: stateEntry[1].name });
                  }
                }
              }}
              className="text-sm font-lato text-mte-blue hover:underline"
            >
              ← Back to State
            </button>

            {/* County Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">County:</label>
              <select 
                className="bg-white border border-mte-light-grey rounded px-3 py-1 text-sm font-lato text-mte-charcoal"
                value={regionId || ''}
                onChange={(e) => {
                  const countyId = e.target.value;
                  if (countyId && countyData[countyId]) {
                    onSelectRegion({ 
                      level: 'county', 
                      id: countyId, 
                      name: countyData[countyId].name 
                    });
                  }
                }}
              >
                {getCountiesForCurrentState().map(county => (
                  <option key={county.id} value={county.id}>{county.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message - Only show if we have no years */}
      {years.length === 0 && (
        <div className="max-w-5xl mx-auto px-4 mb-6 md:mb-8">
          <div className="bg-mte-blue-20 rounded-lg p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-nexa text-mte-black mb-3">Historical Data Coming Soon</h3>
            <p className="text-sm md:text-base text-mte-charcoal font-lato">
              {regionLevel === 'county' 
                ? 'Year-over-year trend data for this county is not yet available. County historical data requires both 2024 and 2025 metrics files.'
                : 'Year-over-year trend data is not yet available for this region. Check back soon as we continue to add historical data.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards - Only show if we have data */}
      {years.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
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
            Historical Change (End of Year {years[0] - 1} to End of Year {years[years.length - 1] - 1})
          </h3>
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
        <a href="https://cafo.org/morethanenough/" target="_blank" rel="noopener noreferrer" className="self-center">
          <img src={MTELogo} alt="More Than Enough" className="h-6 md:h-8 inline-block" />  
        </a>
      </div>
    </div>
  );
}