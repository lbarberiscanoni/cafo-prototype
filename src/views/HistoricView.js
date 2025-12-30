import React, { useState, useMemo } from "react";
import { countyData, stateData, historicalData, fmt, hasValue } from "../real-data.js";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

// Get years array from historical data
// parse-data.js format: { "2021": {...}, "2022": {...}, "2023": {...} }
const getYearsForRegion = (regionLevel, regionId) => {
  if (!historicalData) return [];
  // Extract years from object keys and sort them
  const years = Object.keys(historicalData)
    .map(y => parseInt(y))
    .filter(y => !isNaN(y))
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
          data: reunificationRate
        },
        familyPreservation.some(v => v !== null) && { 
          id: 'family_preservation', 
          label: 'Family Preservation Cases', 
          data: familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: `AFCARS ${years[0]}-${years[years.length - 1]}`
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
      source: `AFCARS ${years[0]}-${years[years.length - 1]}`
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
    const childrenInKinship = years.map(year => historicalData[year]?.national?.childrenInKinship ?? null);
    const waitingAdoption = years.map(year => historicalData[year]?.national?.childrenWaitingAdoption ?? null);
    const childrenAdopted = years.map(year => historicalData[year]?.national?.childrenAdopted ?? null);
    
    return {
      childrenInCare: calcChange(childrenInCare),
      licensedHomes: null, // Not available at national level in AFCARS
      waitingForAdoption: calcChange(waitingAdoption),
      reunificationRate: null, // Can't aggregate percentages
      familyPreservationCases: null
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
    const validData = data.filter(v => v !== null);
    
    if (validData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-mte-charcoal font-lato">
          <span>No historical data available</span>
        </div>
      );
    }
    
    const maxValue = Math.max(...validData);
    const chartHeight = 140;
    
    // Generate nice Y-axis ticks
    const generateTicks = (max) => {
      if (max <= 0) return [0];
      // Round up to a nice number
      const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
      const normalized = max / magnitude;
      let niceMax;
      if (normalized <= 1) niceMax = magnitude;
      else if (normalized <= 2) niceMax = 2 * magnitude;
      else if (normalized <= 5) niceMax = 5 * magnitude;
      else niceMax = 10 * magnitude;
      
      // Create 4 ticks (0, 1/3, 2/3, max)
      return [0, Math.round(niceMax / 3), Math.round(2 * niceMax / 3), niceMax];
    };
    
    const ticks = generateTicks(maxValue);
    const yMax = ticks[ticks.length - 1];
    
    return (
      <div className="mt-4 flex">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-2 text-right" style={{ height: `${chartHeight}px` }}>
          {[...ticks].reverse().map((tick, i) => (
            <span key={i} className="text-xs text-mte-charcoal font-lato leading-none">
              {tick >= 1000 ? `${(tick / 1000).toFixed(0)}K` : tick}
            </span>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="flex-1">
          {/* Bars container with grid lines */}
          <div className="relative border-l border-b border-mte-charcoal/30" style={{ height: `${chartHeight}px` }}>
            {/* Horizontal grid lines */}
            {ticks.slice(1).map((tick, i) => (
              <div 
                key={i}
                className="absolute w-full border-t border-mte-charcoal/10"
                style={{ bottom: `${(tick / yMax) * 100}%` }}
              />
            ))}
            
            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
              {years.map((year, index) => {
                const value = data[index];
                const isNull = value === null;
                const barHeight = isNull ? 8 : Math.max(8, (value / yMax) * chartHeight);
                
                return (
                  <div 
                    key={year} 
                    className={`flex-1 max-w-[60px] ${isNull ? 'bg-mte-light-grey' : bgColor} rounded-t transition-all duration-300`}
                    style={{ height: `${barHeight}px` }}
                    title={isNull ? 'N/A' : fmt(value)}
                  />
                );
              })}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-around gap-2 px-2 mt-2">
            {years.map((year, index) => {
              const value = data[index];
              const isNull = value === null;
              
              return (
                <div key={year} className="flex-1 max-w-[60px] text-center">
                  <div className="text-xs font-semibold text-mte-charcoal font-lato">{year}</div>
                  <div className="text-xs text-mte-charcoal font-lato">
                    {isNull ? 'N/A' : fmt(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 pb-2 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4">
            {getDisplayName()}
          </h1>
          <p className="text-sm md:text-base text-mte-charcoal text-center mt-1 md:mt-2 px-4 font-lato">
            Historical trends and data analysis
          </p>
        </div>
      </header>

      {/* Region Navigation - Only show at state level */}
      {regionLevel === 'state' && (
        <div className="bg-mte-blue-20 py-3 mb-4 md:mb-6">
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
        <div className="bg-mte-blue-20 py-3 mb-4 md:mb-6">
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

      {/* No Data Message - Only show if we have no years */}
      {years.length === 0 && (
        <div className="max-w-5xl mx-auto px-4 mb-6 md:mb-8">
          <div className="bg-mte-blue-20 rounded-lg p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-nexa text-mte-black mb-3">Historical Data Coming Soon</h3>
            <p className="text-sm md:text-base text-mte-charcoal font-lato">
              Year-over-year trend data is not yet available for this region. Check back soon as we continue to add historical AFCARS data.
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