import React, { useState, useMemo, useCallback } from "react";
import { countyData, stateData, historicalData, fmt, hasValue, getGeographyLabel, stateNameToCode, getSourceLabel } from "../real-data.js";
import CountySelect from "../CountySelect";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

// Get years array from historical data based on region level
// parse-data.js format: { "2021": {...}, "2022": {...}, ... }
// AFCARS provides yearly data for states/national (currently 2021–2024)
// Metrics files provide annual snapshots for counties (currently 2024–2025)
const AFCARS_MIN_YEAR = 2021;
const COUNTY_METRICS_MIN_YEAR = 2024;

const getYearsForRegion = (regionLevel, regionId) => {
  if (!historicalData) return [];

  // For county level, take any year >= COUNTY_METRICS_MIN_YEAR that has this county
  if (regionLevel === 'county') {
    return Object.keys(historicalData)
      .map(y => parseInt(y))
      .filter(y => !isNaN(y) && y >= COUNTY_METRICS_MIN_YEAR && historicalData[y]?.counties?.[regionId])
      .sort((a, b) => a - b);
  }

  // For state/national, use any AFCARS year (>= AFCARS_MIN_YEAR) present in the data
  const years = Object.keys(historicalData)
    .map(y => parseInt(y))
    .filter(y => !isNaN(y) && y >= AFCARS_MIN_YEAR && historicalData[y]?.states)
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
      progress: [],
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

    // Compute progress ratio: licensedHomes / childrenInCare per year
    const progressRatio = childrenInCare.map((cic, i) => {
      const homes = licensedHomes[i];
      return (homes != null && cic != null && cic > 0) ? homes / cic : null;
    });

    return {
      progress: [
        progressRatio.some(v => v !== null) && {
          id: 'progress_ratio',
          label: 'Licensed Homes / Children in Care',
          data: progressRatio
        }
      ].filter(Boolean),
      kinship: [
        childrenInCare.some(v => v !== null) && { 
          id: 'children_in_care', 
          label: 'Number of Children in Care',
          data: childrenInCare
        },
        childrenInFoster.some(v => v !== null) && {
          id: 'children_in_foster',
          label: 'Number of Children in Foster Care',
          data: childrenInFoster
        },
        childrenInKinship.some(v => v !== null) && {
          id: 'children_in_kinship',
          label: 'Number of Children in Kinship Care',
          data: childrenInKinship
        },
        licensedHomes.some(v => v !== null) && {
          id: 'licensed_homes',
          label: 'Number of Licensed Homes',
          data: licensedHomes
        }
      ].filter(Boolean),
      adoption: [
        waitingAdoption.some(v => v !== null) && {
          id: 'waiting_adoption',
          label: 'Number of Children Waiting for Adoption',
          data: waitingAdoption
        },
        childrenAdopted.some(v => v !== null) && {
          id: 'children_adopted',
          label: 'Number of Children Adopted',
          data: childrenAdopted
        }
      ].filter(Boolean),
      biological: [
        reunificationRate.some(v => v !== null) && {
          id: 'reunification_rate',
          label: 'Biological Family Reunification Rate (%)',
          data: reunificationRate,
          isPercentage: true
        },
        familyPreservation.some(v => v !== null) && {
          id: 'family_preservation',
          label: 'Number of Family Preservation Cases',
          data: familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: getSourceLabel(years)
    };
  }

  // For national level, aggregate from historicalData[year].national
  if (regionLevel === 'national') {
    const childrenInCare = years.map(year => historicalData[year]?.national?.childrenInCare ?? null);
    const childrenInFoster = years.map(year => historicalData[year]?.national?.childrenInFamilyFoster ?? null);
    const childrenInKinship = years.map(year => historicalData[year]?.national?.childrenInKinship ?? null);
    const waitingAdoption = years.map(year => historicalData[year]?.national?.childrenWaitingAdoption ?? null);
    const childrenAdopted = years.map(year => historicalData[year]?.national?.childrenAdopted ?? null);

    // National doesn't have licensedHomes in historical data, so progress is empty
    return {
      progress: [],
      kinship: [
        childrenInCare.some(v => v !== null) && {
          id: 'children_in_care',
          label: 'Number of Children in Care',
          data: childrenInCare
        },
        childrenInFoster.some(v => v !== null) && {
          id: 'children_in_foster',
          label: 'Number of Children in Foster Care',
          data: childrenInFoster
        },
        childrenInKinship.some(v => v !== null) && {
          id: 'children_in_kinship',
          label: 'Number of Children in Kinship Care',
          data: childrenInKinship
        }
      ].filter(Boolean),
      adoption: [
        waitingAdoption.some(v => v !== null) && {
          id: 'waiting_adoption',
          label: 'Number of Children Waiting for Adoption',
          data: waitingAdoption
        },
        childrenAdopted.some(v => v !== null) && {
          id: 'children_adopted',
          label: 'Number of Children Adopted',
          data: childrenAdopted
        }
      ].filter(Boolean),
      biological: [],
      wraparound: [],
      source: getSourceLabel(years)
    };
  }

  // For county level, use metrics CSV data (2024-2025)
  if (regionLevel === 'county') {
    // Derive state source agency from county ID
    const countyParts = regionId.split('-');
    const countyStateCode = countyParts[countyParts.length - 1]?.toLowerCase();
    const countyStateKey = Object.keys(stateData).find(k => stateData[k].abbreviation?.toLowerCase() === countyStateCode);
    const countyStateSource = countyStateKey ? stateData[countyStateKey].sourceAgency : null;
    const childrenInCare = getCountyMetricArray(regionId, 'childrenInCare', years);
    const childrenInFoster = getCountyMetricArray(regionId, 'childrenInFoster', years);
    const childrenInKinship = getCountyMetricArray(regionId, 'childrenInKinship', years);
    const licensedHomes = getCountyMetricArray(regionId, 'licensedHomes', years);
    const waitingAdoption = getCountyMetricArray(regionId, 'waitingAdoption', years);
    const childrenAdopted = getCountyMetricArray(regionId, 'childrenAdopted', years);
    const reunificationRate = getCountyMetricArray(regionId, 'reunificationRate', years);
    const familyPreservation = getCountyMetricArray(regionId, 'familyPreservation', years);
    const childrenOutOfCounty = getCountyMetricArray(regionId, 'childrenOutOfCounty', years);

    // Compute progress ratio: licensedHomes / childrenInCare per year
    const progressRatio = childrenInCare.map((cic, i) => {
      const homes = licensedHomes[i];
      return (homes != null && cic != null && cic > 0) ? homes / cic : null;
    });

    return {
      progress: [
        progressRatio.some(v => v !== null) && {
          id: 'progress_ratio',
          label: 'Licensed Homes / Children in Care',
          data: progressRatio
        }
      ].filter(Boolean),
      kinship: [
        childrenInCare.some(v => v !== null) && {
          id: 'children_in_care',
          label: 'Number of Children in Care',
          data: childrenInCare
        },
        childrenInFoster.some(v => v !== null) && {
          id: 'children_in_foster',
          label: 'Number of Children in Foster Care',
          data: childrenInFoster
        },
        childrenInKinship.some(v => v !== null) && {
          id: 'children_in_kinship',
          label: 'Number of Children in Kinship Care',
          data: childrenInKinship
        },
        licensedHomes.some(v => v !== null) && {
          id: 'licensed_homes',
          label: 'Number of Licensed Homes',
          data: licensedHomes
        },
        childrenOutOfCounty.some(v => v !== null) && {
          id: 'children_out_of_county',
          label: 'Number of Children Placed Out-of-County',
          data: childrenOutOfCounty
        }
      ].filter(Boolean),
      adoption: [
        waitingAdoption.some(v => v !== null) && {
          id: 'waiting_adoption',
          label: 'Number of Children Waiting for Adoption',
          data: waitingAdoption
        },
        childrenAdopted.some(v => v !== null) && {
          id: 'children_adopted',
          label: 'Number of Children Adopted',
          data: childrenAdopted
        }
      ].filter(Boolean),
      biological: [
        reunificationRate.some(v => v !== null) && {
          id: 'reunification_rate',
          label: 'Biological Family Reunification Rate (%)',
          data: reunificationRate,
          isPercentage: true
        },
        familyPreservation.some(v => v !== null) && {
          id: 'family_preservation',
          label: 'Number of Family Preservation Cases',
          data: familyPreservation
        }
      ].filter(Boolean),
      wraparound: [],
      source: countyStateSource || getSourceLabel(years)
    };
  }
  
  return {
    progress: [],
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
  // Detect embed mode from URL parameter
  const isEmbed = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('embed') === 'true' || window.location.href.includes('embed=true');
  }, []);

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



  // Get all states sorted alphabetically
  const getAllStates = () => {
    return Object.entries(stateData)
      .map(([stateId, data]) => ({
        id: stateId,
        name: data.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Build state options for searchable dropdown
  const stateOptions = useMemo(() => {
    return getAllStates().map(s => ({ id: s.id, label: s.name }));
  }, []);

  // Handler for state select
  const handleStateSelect = useCallback((opt) => {
    if (opt && onSelectRegion) {
      onSelectRegion({ level: 'state', id: opt.id, name: opt.label });
    }
  }, [onSelectRegion]);

  // Derive current state code for geography label and county filtering
  const currentStateCode = useMemo(() => {
    if (!regionId) return 'al';
    if (regionLevel === 'county') {
      const parts = regionId.split('-');
      return parts[parts.length - 1].toLowerCase();
    }
    if (regionLevel === 'state' && stateData[regionId]) {
      return (stateNameToCode[stateData[regionId].name] || '').toLowerCase();
    }
    return 'al';
  }, [regionLevel, regionId]);

  const geoLabel = getGeographyLabel(currentStateCode.toUpperCase());

  // Build county options for searchable dropdown (filtered to current state)
  const countyOptionsForState = useMemo(() => {
    return Object.entries(countyData)
      .filter(([id]) => id.split('-').pop() === currentStateCode)
      .map(([id, d]) => {
        const base = d.name.split(',')[0].trim();
        const geoLabel = getGeographyLabel(d.state);
        return { id, label: `${base} ${geoLabel}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [currentStateCode]);

  // Handler for county select
  const handleCountySelect = useCallback((opt) => {
    if (opt && onSelectRegion) {
      onSelectRegion({ level: 'county', id: opt.id, name: countyData[opt.id]?.name || opt.label });
    }
  }, [onSelectRegion]);

  // Get display name based on region
  const getDisplayName = () => {
    if (regionLevel === 'national') return 'United States';
    if (regionLevel === 'state' && stateData[regionId]) {
      return stateData[regionId].name;
    }
    if (regionLevel === 'county' && countyData[regionId]) {
      const parts = countyData[regionId].name.split(',');
      if (parts.length >= 2) {
        const namePart = parts[0].trim();
        const geoLabel = countyData[regionId].geographyLabel || 'County';
        const alreadyHasLabel = namePart.toLowerCase().includes(geoLabel.toLowerCase());
        return `${namePart}${alreadyHasLabel ? '' : ` ${geoLabel}`},${parts.slice(1).join(',')}`;
      }
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
      if (value === null) return '--';
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
            const barHeight = isNull ? 0 : Math.max(24, (value / yMax) * chartHeight);

            return (
              <div key={year} className="flex-1 max-w-[80px] flex flex-col items-center justify-end">
                {isNull ? (
                  <span className="text-sm font-bold text-mte-light-grey mb-1">--</span>
                ) : (
                  <div
                    className={`w-full ${bgColor} rounded-t flex items-center justify-center transition-all duration-300`}
                    style={{ height: `${barHeight}px` }}
                  >
                    <span className="text-white text-sm font-bold font-lato drop-shadow-sm">
                      {formatValue(value)}
                    </span>
                  </div>
                )}
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
          <h1 className="text-center font-nexa text-mte-black px-4 leading-none">
            <span className="block text-sm md:text-base text-mte-charcoal font-lato font-normal">
              Historical foster care data in
            </span>
            <span className="block text-2xl md:text-4xl font-nexa">{getDisplayName()}</span>
          </h1>
          {isEmbed && (
            <p className="text-xs md:text-sm text-mte-charcoal text-center px-4 font-lato mt-1">
              Brought to you by More Than Enough, CAFO's US Foster Care Initiative.{' '}
              <a href="https://fostercaredata.cafo.org/" target="_blank" rel="noopener noreferrer" className="text-mte-blue hover:underline">
                Visit the full dashboard for more data.
              </a>
            </p>
          )}
        </div>
      </header>

      {/* Region Navigation - Only show at state level (hidden in embed mode) */}
      {!isEmbed && regionLevel === 'state' && (
        <div className="py-3 mb-4 md:mb-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {/* State Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">State:</label>
              <div className="w-48">
                <CountySelect
                  options={stateOptions}
                  placeholder="Jump to a State"
                  searchPlaceholder="Search state…"
                  onChange={handleStateSelect}
                />
              </div>
            </div>

            {/* County Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">{geoLabel}:</label>
              <div className="w-48">
                <CountySelect
                  options={countyOptionsForState}
                  placeholder={`Select a ${geoLabel.toLowerCase()}`}
                  searchPlaceholder={`Search ${geoLabel.toLowerCase()}…`}
                  onChange={handleCountySelect}
                  emptyMessage={`No ${geoLabel.toLowerCase()} historical data available`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Region Navigation - National level (hidden in embed mode) */}
      {!isEmbed && regionLevel === 'national' && (
        <div className="py-3 mb-4 md:mb-6">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4">
            {/* State Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-lato text-mte-charcoal">Jump to State:</label>
              <div className="w-48">
                <CountySelect
                  options={stateOptions}
                  placeholder="Select a state"
                  searchPlaceholder="Search state…"
                  onChange={handleStateSelect}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Region Navigation - County level (hidden in embed mode) */}
      {!isEmbed && regionLevel === 'county' && (
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
              <div className="w-48">
                <CountySelect
                  options={countyOptionsForState}
                  placeholder="Switch county"
                  searchPlaceholder="Search county…"
                  onChange={handleCountySelect}
                  emptyMessage="No county historical data available"
                />
              </div>
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

      {/* Foster Care Progress Indicator Card */}
      {years.length > 0 && categoryMetrics.progress.length > 0 && (() => {
        const progressMetric = categoryMetrics.progress[0];
        const ratioData = progressMetric.data;
        const validRatioData = ratioData.filter(v => v !== null);
        if (validRatioData.length === 0) return null;
        const maxValue = Math.max(...validRatioData);
        const chartHeight = 140;
        const yMax = maxValue > 0 ? maxValue : 1;

        return (
          <div className="max-w-5xl mx-auto px-4 mb-4 md:mb-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
              <h3 className="text-lg md:text-xl font-bold text-mte-black font-lato mb-1" style={{ textAlign: 'center' }}>Foster Care Progress Indicator</h3>
              <p className="text-sm text-mte-charcoal font-lato mb-2" style={{ textAlign: 'center', maxWidth: 'none' }}>Ratio of licensed foster homes to children in care</p>

              <div className="mt-4">
                <div className="flex items-end justify-around gap-4 px-4" style={{ height: `${chartHeight}px` }}>
                  {years.map((year, index) => {
                    const value = ratioData[index];
                    const isNull = value === null;
                    const barHeight = isNull ? 0 : Math.max(24, (value / yMax) * chartHeight);
                    return (
                      <div key={year} className="flex-1 max-w-[80px] flex flex-col items-center justify-end">
                        {isNull ? (
                          <span className="text-sm font-bold text-mte-light-grey mb-1">--</span>
                        ) : (
                          <div
                            className="w-full bg-mte-blue rounded-t flex items-center justify-center transition-all duration-300"
                            style={{ height: `${barHeight}px` }}
                          >
                            <span className="text-white text-sm font-bold font-lato drop-shadow-sm">
                              {value.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-around gap-4 px-4 mt-2">
                  {years.map((year) => (
                    <div key={year} className="flex-1 max-w-[80px] text-center">
                      <div className="text-xs font-semibold text-mte-charcoal font-lato">End of Year {year - 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              {categoryMetrics.source && <div className="mt-3 text-xs text-mte-charcoal font-lato">Source: {categoryMetrics.source}</div>}
            </div>
          </div>
        );
      })()}

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
                {categoryMetrics.source && <div className="mt-3 text-xs text-mte-charcoal font-lato">Source: {categoryMetrics.source}</div>}
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
                {categoryMetrics.source && <div className="mt-3 text-xs text-mte-charcoal font-lato">Source: {categoryMetrics.source}</div>}
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
                {categoryMetrics.source && <div className="mt-3 text-xs text-mte-charcoal font-lato">Source: {categoryMetrics.source}</div>}
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
                {categoryMetrics.source && <div className="mt-3 text-xs text-mte-charcoal font-lato">Source: {categoryMetrics.source}</div>}
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
                {hasValue(trends.childrenInCare) ? `${trends.childrenInCare > 0 ? '+' : ''}${trends.childrenInCare}%` : '--'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Number of Children in Care</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.licensedHomes) ? (trends.licensedHomes > 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.licensedHomes) ? `${trends.licensedHomes > 0 ? '+' : ''}${trends.licensedHomes}%` : '--'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Number of Licensed Homes</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.waitingForAdoption) ? (trends.waitingForAdoption < 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.waitingForAdoption) ? `${trends.waitingForAdoption > 0 ? '+' : ''}${trends.waitingForAdoption}%` : '--'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Number of Children Waiting for Adoption</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.reunificationRate) ? (trends.reunificationRate > 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.reunificationRate) ? `${trends.reunificationRate > 0 ? '+' : ''}${trends.reunificationRate}%` : '--'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Biological Family Reunification Rate (%)</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className={`font-bold text-lg md:text-xl ${hasValue(trends.familyPreservationCases) ? (trends.familyPreservationCases > 0 ? 'text-mte-green' : 'text-mte-orange') : 'text-mte-charcoal'}`}>
                {hasValue(trends.familyPreservationCases) ? `${trends.familyPreservationCases > 0 ? '+' : ''}${trends.familyPreservationCases}%` : '--'}
              </div>
              <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Number of Family Preservation Cases</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`py-4 px-6 ${isEmbed ? 'flex flex-col md:flex-row items-start md:items-center justify-between gap-3' : 'text-right'}`}>
        <a href="https://cafo.org/morethanenough/" target="_blank" rel="noopener noreferrer" className={isEmbed ? '' : 'self-center'}>
          <img src={MTELogo} alt="More Than Enough" className="h-6 md:h-8 inline-block" />  
        </a>
      </div>
    </div>
  );
}