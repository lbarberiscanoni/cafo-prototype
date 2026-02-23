import React, { useState, useRef, useEffect, useCallback } from "react";
import { countyData, stateData, nationalStats, historicalData, fmt, fmtPct, fmtCompact, getGeographyLabel } from "../real-data.js";

// Assets
import ChurchIcon from "../assets/church_icon.png";
import PeopleIcon from "../assets/people.svg";
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";
import InteractiveUSMap, { getAvailableMetrics } from "../InteractiveUSMap";
import InteractiveStateMap from "../InteractiveStateMap";

// Hoverable text with tooltip
const HoverableText = ({ children, tooltip }) => (
  <div className="relative inline-flex items-center group">
    <span>
      {children}
    </span>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-mte-charcoal text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
      {tooltip}
    </div>
  </div>
);

const MetricRow = ({ label, value, tooltip }) => (
  <div className="relative group flex justify-between items-center px-2 py-1.5 rounded-md transition-colors duration-200 hover:bg-mte-blue-20">
    <div className="text-left text-mte-charcoal font-lato whitespace-nowrap">{label}</div>
    <div className="text-right font-semibold text-mte-black font-lato">{value}</div>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-mte-charcoal text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
      {tooltip}
    </div>
  </div>
);

// Convert state names to codes
const stateNameToCode = {
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

const MetricView = ({ regionLevel, regionId, onSelectRegion }) => {
  // Get available metrics (only those with data)
  const availableMetrics = getAvailableMetrics();
  
  // State for selected metric - default to first available or fallback
  const [selectedMetric, setSelectedMetric] = useState(
    availableMetrics.length > 0 ? availableMetrics[0] : "Count of Children Waiting For Adoption"
  );

  // State for county search
  const [countySearchQuery, setCountySearchQuery] = useState("");
  const [isCountyDropdownOpen, setIsCountyDropdownOpen] = useState(false);
  const countySearchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countySearchRef.current && !countySearchRef.current.contains(event.target)) {
        setIsCountyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter counties based on search query (search county name only, not state)
  const filteredCounties = Object.keys(countyData)
    .filter(countyId => {
      if (!countySearchQuery.trim()) return true;
      // Get just the county name (before the comma)
      const countyName = countyData[countyId].name.split(',')[0].trim();
      return countyName.toLowerCase().includes(countySearchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Prioritize matches that start with the search term
      const aName = countyData[a].name.split(',')[0].trim().toLowerCase();
      const bName = countyData[b].name.split(',')[0].trim().toLowerCase();
      const query = countySearchQuery.toLowerCase();
      const aStarts = aName.startsWith(query);
      const bStarts = bName.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return countyData[a].name.localeCompare(countyData[b].name);
    })
    .slice(0, 50); // Limit to 50 results for performance

  // Get data based on region level
  const getData = () => {
    switch (regionLevel) {
      case "national":
        return {
          name: "United States of America",
          subtitle: "Understand foster care trends across the country",
          totalChurches: nationalStats.totalChurches,
          childrenInCare: nationalStats.childrenInCare,
          childrenInFamilyFoster: nationalStats.childrenInFamilyFoster,
          childrenInKinship: nationalStats.childrenInKinship,
          waitingForAdoption: nationalStats.childrenWaitingAdoption,
          childrenAdopted: nationalStats.childrenAdopted2023,
          churchesWithMinistry: nationalStats.churchesWithMinistry,
        };
      case "state":
        let state = stateData[regionId];
        if (!state) {
          console.warn('State not found for regionId:', regionId);
          state = Object.values(stateData)[0];
        }
        return {
          name: state.name,
          subtitle: "Explore foster care data in this state",
          totalChildren: state.totalChildren,
          licensedHomes: state.licensedHomes,
          waitingForAdoption: state.waitingForAdoption,
          reunificationRate: state.reunificationRate,
          familyPreservationCases: state.familyPreservationCases,
        };
      case "county":
        const county = countyData[regionId] || countyData['butler-al'];
        const countyParts = county.name.split(',');
        const geoLabel = county.geographyLabel || 'County';
        const formattedCountyName = countyParts.length >= 2 
          ? `${countyParts[0].trim()} ${geoLabel},${countyParts.slice(1).join(',')}` 
          : county.name;
        return {
          name: formattedCountyName,
          subtitle: "",
          population: county.population,
          totalChurches: county.totalChurches,
          childrenInCare: county.childrenInCare,
          childrenInFamily: county.childrenInFamily,
          childrenInKinship: county.childrenInKinship,
          childrenOutOfCounty: county.childrenOutOfCounty,
          licensedHomes: county.licensedHomes,
          licensedHomesPerChild: county.licensedHomesPerChild,
          waitingForAdoption: county.waitingForAdoption,
          childrenAdopted2024: county.childrenAdopted2024,
          avgMonthsToAdoption: county.avgMonthsToAdoption,
          familyPreservationCases: county.familyPreservationCases,
          reunificationRate: county.reunificationRate,
          churchesProvidingSupport: county.churchesProvidingSupport,
          supportPercentage: county.supportPercentage,
          state: county.state,
        };
      default:
        return {};
    }
  };

  const data = getData();

  // ==================== REAL TREND DATA ====================
  // Pull from historicalData (AFCARS 2021-2023) based on region + selected metric.
  // Returns null when no data is available (county level, or missing metric).

  const getTrendData = () => {
    if (!historicalData) return null;

    const regionName = regionLevel === 'national' ? 'the U.S.' : (data.name || 'Unknown');
    let years, getValueForYear;

    if (regionLevel === 'national') {
      years = Object.keys(historicalData)
        .map(Number)
        .filter(y => !isNaN(y) && historicalData[y]?.national)
        .sort((a, b) => a - b);

      getValueForYear = (year) => {
        const nd = historicalData[year]?.national;
        if (!nd) return null;
        switch (selectedMetric) {
          case "Count of Children Waiting For Adoption":
            return nd.childrenWaitingAdoption ?? null;
          case "Count of Family Preservation Cases":
            return nd.familyPreservationCases ?? null;
          case "Ratio of Licensed Homes to Children in Care":
            return (nd.licensedHomes && nd.childrenInCare && nd.childrenInCare > 0)
              ? nd.licensedHomes / nd.childrenInCare
              : null;
          case "Biological Family Reunification Rate":
            return null; // Not aggregated at national level
          default:
            return null;
        }
      };
    } else if (regionLevel === 'state') {
      const stateKey = regionId; // e.g. "california", "new-york"
      years = Object.keys(historicalData)
        .map(Number)
        .filter(y => !isNaN(y) && historicalData[y]?.states?.[stateKey])
        .sort((a, b) => a - b);

      getValueForYear = (year) => {
        const sd = historicalData[year]?.states?.[stateKey];
        if (!sd) return null;
        switch (selectedMetric) {
          case "Count of Children Waiting For Adoption":
            return sd.waitingForAdoption ?? null;
          case "Count of Family Preservation Cases":
            return sd.familyPreservationCases ?? null;
          case "Ratio of Licensed Homes to Children in Care":
            return (sd.licensedHomes && sd.totalChildren && sd.totalChildren > 0)
              ? sd.licensedHomes / sd.totalChildren
              : null;
          case "Biological Family Reunification Rate":
            return sd.reunificationRate ?? null;
          default:
            return null;
        }
      };
    } else {
      // County level — no AFCARS trend data
      return null;
    }

    if (years.length === 0) return null;

    const values = years.map(getValueForYear);
    // Need at least one non-null value to show anything useful
    if (values.every(v => v === null)) return null;

    const isRatio = selectedMetric === "Ratio of Licensed Homes to Children in Care";
    const isPercent = selectedMetric === "Biological Family Reunification Rate";

    const formatLabel = (v) => {
      if (v === null || v === undefined) return 'N/A';
      if (isRatio) return `${v.toFixed(2)} Homes per Child`;
      if (isPercent) return fmtPct(v); // fmtPct handles decimal→% conversion
      return fmt(Math.round(v));
    };

    // Build a descriptive title
    let title;
    switch (selectedMetric) {
      case "Count of Children Waiting For Adoption":
        title = `Children Waiting For Adoption in ${regionName}`;
        break;
      case "Count of Family Preservation Cases":
        title = `Family Preservation Cases in ${regionName}`;
        break;
      case "Ratio of Licensed Homes to Children in Care":
        title = `Licensed Homes per Child in Care in ${regionName}`;
        break;
      case "Biological Family Reunification Rate":
        title = `Reunification Rate in ${regionName}`;
        break;
      default:
        title = `${selectedMetric} in ${regionName}`;
    }

    return {
      title,
      values,
      years,
      labels: values.map(formatLabel),
      source: `AFCARS ${years[0]}–${years[years.length - 1]}`
    };
  };

  const trendData = getTrendData();

  const handleStateClick = (stateCode, stateName, clickedStateData) => {
    const stateId = stateName.toLowerCase().replace(/\s+/g, '-');
    if (onSelectRegion) {
      onSelectRegion({ level: 'state', id: stateId, name: stateName, code: stateCode });
    }
  };

  const handleCountyClick = useCallback((fips, countyName, clickedCountyData) => {
    const stateCode = stateNameToCode[data.name];
    const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode?.toLowerCase()}`;
    const label = getGeographyLabel(stateCode);
    if (onSelectRegion) {
      onSelectRegion({ level: 'county', id: countyId, name: `${countyName} ${label}, ${data.name}`, fips: fips });
    }
  }, [data.name, onSelectRegion]);

  const showMap = regionLevel === "national";
  const showCountyDetails = regionLevel === "county";
  const showStateDetails = regionLevel === "state";
  const showStateContext = regionLevel === "county";

  const getStateDataForCounty = () => {
    if (!data.state) return null;
    const stateKey = data.state.toLowerCase().replace(/\s+/g, '-');
    return stateData[stateKey];
  };

  // ==================== TREND BAR CHART RENDERER ====================
  // Shared by national and state sidebars. Handles null values gracefully.
  const renderTrendChart = () => {
    if (!trendData) {
      return (
        <div className="bg-mte-subdued-white p-3 rounded">
          <div className="h-28 flex items-center justify-center text-sm text-mte-charcoal font-lato">
            No trend data available for this metric
          </div>
        </div>
      );
    }

    // Filter to non-null for max calculation
    const validValues = trendData.values.filter(v => v !== null && v !== undefined);
    const maxValue = validValues.length > 0 ? Math.max(...validValues) : 1;

    return (
      <div className="bg-mte-subdued-white p-3 rounded relative overflow-hidden">
        <div className="text-sm font-medium mb-2 font-lato text-mte-black">{trendData.title}</div>
        <div className="h-28 bg-white rounded flex items-end justify-between px-3 pb-2 relative overflow-visible">
          {trendData.values.map((value, index) => {
            const isNull = value === null || value === undefined;
            const heightPx = isNull ? 24 : Math.max(24, Math.round((value / maxValue) * 72));
            return (
              <div key={index} className="flex flex-col items-center relative group flex-1 max-w-[60px]">
                <div
                  className={`${isNull ? 'bg-mte-light-grey' : 'bg-mte-orange'} w-full max-w-[32px] rounded mb-1 cursor-pointer hover:opacity-80 transition-colors relative`}
                  style={{ height: `${heightPx}px`, maxHeight: "72px" }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-mte-charcoal text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    <div className="font-semibold">{trendData.labels[index]}</div>
                    <div>{selectedMetric}</div>
                    <div>End of Year {trendData.years[index] - 1}</div>
                    <div className="text-mte-subdued-white mt-1">Source: AFCARS</div>
                  </div>
                </div>
                <span className="text-xs text-mte-charcoal font-lato whitespace-nowrap">{trendData.years[index]}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-mte-charcoal font-lato">Source: {trendData.source}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-6 pb-2 flex flex-col items-center gap-0">
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4 leading-tight mb-0">{data.name}</h1>
          {data.subtitle && <p className="text-sm md:text-base text-mte-charcoal text-center px-4 font-lato mt-1">{data.subtitle}</p>}
        </div>
      </header>

      {/* National Map Section */}
      {showMap && (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="w-full lg:w-1/4 space-y-3 md:space-y-4">
            {/* Jump selectors */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card space-y-3">
              <select className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal" value="" onChange={(e) => {
                if (e.target.value && onSelectRegion) {
                  const stateId = e.target.value;
                  const stateName = Object.keys(stateNameToCode).find(name => name.toLowerCase().replace(/\s+/g, '-') === stateId);
                  onSelectRegion({ level: 'state', id: stateId, name: stateName, code: stateNameToCode[stateName] });
                }
              }}>
                <option value="">Jump to a State</option>
                {Object.keys(stateNameToCode).sort().map(stateName => (
                  <option key={stateName} value={stateName.toLowerCase().replace(/\s+/g, '-')}>{stateName}</option>
                ))}
              </select>
              <div className="relative" ref={countySearchRef}>
                <input
                  type="text"
                  placeholder="Type to search counties..."
                  value={countySearchQuery}
                  onChange={(e) => {
                    setCountySearchQuery(e.target.value);
                    setIsCountyDropdownOpen(true);
                  }}
                  onFocus={() => setIsCountyDropdownOpen(true)}
                  className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue focus:border-mte-blue"
                />
                {isCountyDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-mte-light-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCounties.length > 0 ? (
                      filteredCounties.map(countyId => (
                        <div
                          key={countyId}
                          className="px-3 py-2 text-sm font-lato text-mte-charcoal hover:bg-mte-blue-20 cursor-pointer"
                          onClick={() => {
                            const county = countyData[countyId];
                            if (county && onSelectRegion) {
                              onSelectRegion({ level: 'county', id: countyId, name: county.name, fips: county.fips });
                            }
                            setCountySearchQuery("");
                            setIsCountyDropdownOpen(false);
                          }}
                        >
                          {countyData[countyId].name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm font-lato text-mte-charcoal">No counties found</div>
                    )}
                    {filteredCounties.length === 50 && countySearchQuery.trim() && (
                      <div className="px-3 py-2 text-xs font-lato text-mte-charcoal border-t border-mte-light-grey">
                        Showing first 50 results. Type more to narrow search.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics - Dynamic dropdown */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-lato font-bold mb-1 text-mte-black">Metrics</h3>
              <p className="text-sm text-mte-charcoal mb-2 font-lato">Filter by metric type to see what is happening across the country</p>
              <div className="relative">
                <select className="w-full border-2 border-mte-light-grey rounded-lg p-2 pr-8 text-xs font-lato text-mte-charcoal cursor-pointer appearance-none bg-white hover:border-mte-blue focus:border-mte-blue focus:ring-2 focus:ring-mte-blue-20 focus:outline-none transition-colors" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
                  {availableMetrics.map(metric => (
                    <option key={metric} value={metric}>{metric}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-mte-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Trends - Now uses real data */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-lato font-bold text-mte-black mb-1">Trends</h3>
              <p className="text-sm text-mte-charcoal mb-3 font-lato">See trends for your selected metric over the past several years</p>
              {renderTrendChart()}
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-lg shadow-mte-card p-4 mb-6">
              <InteractiveUSMap selectedMetric={selectedMetric} onStateClick={handleStateClick} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Foster and Kinship Data in the U.S.</h4>
                <div className="flex items-start gap-4">
                  <img src={FosterKinshipIcon} alt="Family" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmt(data.childrenInCare)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">in Out-of-Home Care</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.childrenInFamilyFoster)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">in Family-based Foster Care</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.childrenInKinship)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">in Kinship Care</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Adoption Data in the U.S.</h4>
                <div className="flex items-start gap-4">
                  <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmt(data.waitingForAdoption)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Waiting For Adoption</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.childrenAdopted)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Adopted FY 2023</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Church Data in the U.S.</h4>
                <div className="flex items-start gap-4">
                  <img src={ChurchIcon} alt="Churches" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmtCompact(data.totalChurches)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Churches</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmtCompact(data.churchesWithMinistry)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Churches with a Known Foster Care Ministry</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State Stats Section */}
      {showStateDetails && (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="w-full lg:w-1/4 space-y-3 md:space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-lato font-bold mb-1 text-mte-black">Metrics</h3>
              <p className="text-sm text-mte-charcoal mb-2 font-lato">Filter by metric type to see what is happening in {data.name}</p>
              <div className="relative">
                <select className="w-full border-2 border-mte-light-grey rounded-lg p-2 pr-8 text-xs font-lato text-mte-charcoal cursor-pointer appearance-none bg-white hover:border-mte-blue focus:border-mte-blue focus:ring-2 focus:ring-mte-blue-20 focus:outline-none transition-colors" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
                  {availableMetrics.map(metric => (
                    <option key={metric} value={metric}>{metric}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-mte-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Trends - Now uses real data */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-lato font-bold text-mte-black mb-1">Trends</h3>
              <p className="text-sm text-mte-charcoal mb-3 font-lato">See trends for your selected metric in {data.name}</p>
              {renderTrendChart()}
            </div>
          </div>
          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-lg shadow-mte-card p-4 mb-6">
              <InteractiveStateMap stateCode={stateNameToCode[data.name] || 'AL'} stateName={data.name} selectedMetric={selectedMetric} onCountyClick={handleCountyClick} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Foster and Kinship Data</h4>
                <div className="flex items-start gap-4">
                  <img src={FosterKinshipIcon} alt="Children" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmt(data.totalChildren)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">in Care</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.licensedHomes)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Licensed Foster Homes</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Adoption Data</h4>
                <div className="flex items-start gap-4">
                  <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmt(data.waitingForAdoption)}</span> <span className="text-sm text-mte-charcoal font-lato">Children</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Waiting for Adoption</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Biological Family Data</h4>
                <div className="flex items-start gap-4">
                  <img src={BiologicalFamilyIcon} alt="Reunification" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmtPct(data.reunificationRate)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Reunification Rate</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.familyPreservationCases)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Family Preservation Cases</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* County-specific: Total Churches + Population Card */}
      {showCountyDetails && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center mx-auto" style={{ maxWidth: '800px' }}>
            <div className="flex justify-center gap-12">
              <div className="flex flex-col items-center">
                <img src={ChurchIcon} alt="Church" className="w-20 h-20 mb-3" />
                <div className="flex items-center gap-1">
                  <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.totalChurches)}</div>
                  <div className="text-base text-mte-charcoal font-lato">Churches</div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <img src={PeopleIcon} alt="Population" className="w-20 h-20 mb-3" />
                <div className="flex items-center gap-1">
                  <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.population)}</div>
                  <div className="text-base text-mte-charcoal font-lato">Population</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards - County only */}
      {showCountyDetails && (
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={FosterKinshipIcon} alt="Foster & Kinship" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Families who provide temporary care for children through formal foster care or informal kinship arrangements with relatives.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Foster and Kinship Families</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.licensedHomesPerChild)}</div>
              <HoverableText tooltip="The ratio of available licensed foster homes to children currently in out-of-home care.">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Licensed Foster Homes Per Child in Care</div>
              </HoverableText>
            </div>
            <div className="max-w-sm mx-auto">
              <MetricRow label="Children in Care" value={fmt(data.childrenInCare)} tooltip="Total number of children in the foster care system." />
              <MetricRow label="Children in Family-based Foster Care" value={fmt(data.childrenInFamily)} tooltip="Children placed with licensed foster families." />
              <MetricRow label="Children in Kinship Care" value={fmt(data.childrenInKinship)} tooltip="Children placed with relatives or family friends." />
              <MetricRow label="Children Placed Out-of-County" value={fmt(data.childrenOutOfCounty)} tooltip="Children from this county placed in care outside county boundaries." />
              <MetricRow label="Licensed Foster Homes" value={fmt(data.licensedHomes)} tooltip="Total number of state-licensed foster homes in this county." />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={AdoptiveFamilyIcon} alt="Adoptive Families" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Families who have completed or are in the process of legally adopting children from foster care.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Adoptive Families</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.waitingForAdoption)}</div>
              <HoverableText tooltip="Children whose parental rights have been terminated and are legally free for adoption.">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Children Waiting For Adoption</div>
              </HoverableText>
            </div>
            <div className="max-w-md mx-auto">
              <MetricRow label="Children Adopted in 2024" value={fmt(data.childrenAdopted2024)} tooltip="Number of finalized adoptions in the current year." />
              <MetricRow label="Average Months to Adoption" value={fmt(data.avgMonthsToAdoption)} tooltip="Average time from termination of parental rights to finalized adoption." />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={BiologicalFamilyIcon} alt="Biological Families" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Services and support provided to birth parents working toward reunification with their children.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Support for Biological Families</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.familyPreservationCases)}</div>
              <HoverableText tooltip="Active cases providing intensive services to prevent foster care placement.">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Family Preservation Cases</div>
              </HoverableText>
            </div>
            <div className="flex justify-center items-center gap-1">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmtPct(data.reunificationRate)}</div>
              <HoverableText tooltip="Percentage of children who successfully return to their birth families.">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Biological Family Reunification Rate</div>
              </HoverableText>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={WrapAroundIcon} alt="Wraparound Support" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Comprehensive community-based support services for all families involved in foster care.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Wraparound Support</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmtPct(data.supportPercentage)}</div>
              <HoverableText tooltip="Percentage of local churches actively engaged in foster care ministry.">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Churches Providing Support</div>
              </HoverableText>
            </div>
            <div className="max-w-md mx-auto">
              <MetricRow label="Churches Providing Support" value={fmt(data.churchesProvidingSupport)} tooltip="Number of churches with active foster care support programs." />
              <MetricRow label="Total Churches" value={fmt(data.totalChurches)} tooltip="Total number of churches in this county." />
            </div>
          </div>
        </main>
      )}

      {/* Statewide summary - County only */}
      {showStateContext && (() => {
        const stateInfo = getStateDataForCounty();
        if (!stateInfo) return null;
        return (
          <section className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-mte-card px-6 py-6 text-center">
              <h3 className="text-2xl font-nexa text-mte-black mb-4">Statewide Data Summary for {data.state}</h3>
              <div className="flex flex-wrap justify-around gap-6 md:gap-10 text-center">
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.totalChildren)}</p><p className="text-base text-mte-charcoal font-lato">Children in Care</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.licensedHomes)}</p><p className="text-base text-mte-charcoal font-lato">Licensed Foster Homes</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.waitingForAdoption)}</p><p className="text-base text-mte-charcoal font-lato">Children Waiting For Adoption</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmtPct(stateInfo.reunificationRate)}</p><p className="text-base text-mte-charcoal font-lato">Biological Family Reunification Rate</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.familyPreservationCases)}</p><p className="text-base text-mte-charcoal font-lato">Family Preservation Cases</p></div>
              </div>
            </div>
          </section>
        );
      })()}

      <footer className="py-6 pr-6 flex justify-end">
        <a href="https://cafo.org/morethanenough/" target="_blank" rel="noopener noreferrer" className="self-center">
          <img src={MTELogo} alt="More Than Enough Logo" className="h-8" /> 
        </a>
      </footer>
    </div>
  );
};

export default MetricView;