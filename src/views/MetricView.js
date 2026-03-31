import React, { useState, useCallback, useMemo } from "react";
import { countyData, stateData, nationalStats, historicalData, stateNameToCode, fmt, fmtPct, fmtCompact, getGeographyLabel } from "../real-data.js";

// Assets
import ChurchIcon from "../assets/church_icon.png";
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";
import InteractiveUSMap, { getAvailableMetrics } from "../InteractiveUSMap";
import InteractiveStateMap from "../InteractiveStateMap";
import CountySelect from "../CountySelect";

const REQUEST_DATA_URL = "https://cafo.org/morethanenough/share-your-data/";

const hasNA = (...values) => values.some(v => v === null || v === undefined);

const RequestDataLink = () => (
  <a
    href={REQUEST_DATA_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs font-lato text-mte-orange hover:text-mte-orange underline transition-colors"
  >
    Some data is missing for your county. Learn how you can help add it.
  </a>
);

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

const MetricRow = ({ label, value, tooltip, source }) => (
  <div className="relative group flex justify-between items-center px-2 py-1.5 rounded-md transition-colors duration-200 hover:bg-mte-blue-20">
    <div className="text-left text-mte-charcoal font-lato whitespace-nowrap">{label}</div>
    <div className="text-right font-semibold text-mte-black font-lato">{value}</div>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-mte-charcoal text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
      {tooltip}
      {source && value !== 'N/A' && <div className="mt-1 pt-1 border-t border-gray-500 text-gray-300">Source: {source}</div>}
    </div>
  </div>
);

const MetricView = ({ regionLevel, regionId, onSelectRegion }) => {
  // Get available metrics (only those with data)
  const availableMetrics = getAvailableMetrics();
  
  // State for selected metric - default to first available or fallback
  const [selectedMetric, setSelectedMetric] = useState(
    availableMetrics.length > 0 ? availableMetrics[0] : "Number of Children Waiting For Adoption"
  );

  // Embed state
  const isEmbed = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('embed') === 'true' || window.location.href.includes('embed=true');
  }, []);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Build county options for CountySelect (same shape as Landing_Page)
  const countyOptions = useMemo(() => {
    return Object.entries(countyData)
      .map(([id, c]) => {
        const base = c.name.includes(",") ? c.name.split(",")[0].trim() : c.name;
        const geoLabel = getGeographyLabel(c.state);
        const label = base === c.state ? base : `${base} ${geoLabel}, ${c.state}`;
        return { id, label, data: c, state: c.state };
      })
      .sort((a, b) => {
        const stateCompare = a.state.localeCompare(b.state);
        if (stateCompare !== 0) return stateCompare;
        return a.label.localeCompare(b.label);
      });
  }, []);

  // Handler for CountySelect
  const handleCountySelect = useCallback((opt) => {
    if (opt && onSelectRegion) {
      onSelectRegion({ level: 'county', id: opt.id, name: opt.data.name });
    }
  }, [onSelectRegion]);

  // Build state options for searchable dropdown
  const stateOptions = useMemo(() => {
    return Object.keys(stateNameToCode).sort().map(stateName => ({
      id: stateName.toLowerCase().replace(/\s+/g, '-'),
      label: stateName,
    }));
  }, []);

  // Handler for state select
  const handleStateSelect = useCallback((opt) => {
    if (opt && onSelectRegion) {
      const stateName = opt.label;
      onSelectRegion({ level: 'state', id: opt.id, name: stateName, code: stateNameToCode[stateName] });
    }
  }, [onSelectRegion]);

  // Build county options filtered to the current state (for county-level nav)
  const countyOptionsForState = useMemo(() => {
    if (regionLevel !== 'county') return [];
    const county = countyData[regionId];
    if (!county) return [];
    const stateName = county.state;
    return countyOptions.filter(o => o.state === stateName);
  }, [regionLevel, regionId, countyOptions]);

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
          subtitle: "Explore foster care data and trends in",
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
        const countyNamePart = countyParts[0].trim();
        const alreadyHasLabel = countyNamePart.toLowerCase().includes(geoLabel.toLowerCase());
        const formattedCountyName = countyParts.length >= 2
          ? `${countyNamePart}${alreadyHasLabel ? '' : ` ${geoLabel}`},${countyParts.slice(1).join(',')}`
          : county.name;
        return {
          name: formattedCountyName,
          subtitle: "Foster care data in",
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
          sourceAgency: stateData[county.state?.toLowerCase().replace(/\s+/g, '-')]?.sourceAgency || null,
          sourceUrl: stateData[county.state?.toLowerCase().replace(/\s+/g, '-')]?.sourceUrl || null,
          dataYear: stateData[county.state?.toLowerCase().replace(/\s+/g, '-')]?.dataYear || county.year || null,
        };
      default:
        return {};
    }
  };

  const data = getData();

  // ==================== PROGRESS INDICATOR DATA ====================
  const progressData = useMemo(() => {
    if (regionLevel !== 'county') return null;

    const countyRatio = data.licensedHomesPerChild != null
      ? parseFloat(data.licensedHomesPerChild)
      : null;

    // State average
    const stateKey = data.state?.toLowerCase().replace(/\s+/g, '-');
    const st = stateKey ? stateData[stateKey] : null;
    const stateRatio = (st?.licensedHomes && st?.totalChildren && st.totalChildren > 0)
      ? st.licensedHomes / st.totalChildren
      : null;

    // National average
    const nationalRatio = (nationalStats.licensedHomes && nationalStats.childrenInCare && nationalStats.childrenInCare > 0)
      ? nationalStats.licensedHomes / nationalStats.childrenInCare
      : null;

    return { countyRatio, stateRatio, nationalRatio };
  }, [regionLevel, data.licensedHomesPerChild, data.state]);

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
          case "Number of Children Waiting For Adoption":
            return nd.childrenWaitingAdoption ?? null;
          case "Number of Family Preservation Cases":
            return nd.familyPreservationCases ?? null;
          case "Number of Licensed Homes to Children in Care":
            return (nd.licensedHomes && nd.childrenInCare && nd.childrenInCare > 0)
              ? nd.licensedHomes / nd.childrenInCare
              : null;
          case "Biological Family Reunification Rate (%)":
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
          case "Number of Children Waiting For Adoption":
            return sd.waitingForAdoption ?? null;
          case "Number of Family Preservation Cases":
            return sd.familyPreservationCases ?? null;
          case "Number of Licensed Homes to Children in Care":
            return (sd.licensedHomes && sd.totalChildren && sd.totalChildren > 0)
              ? sd.licensedHomes / sd.totalChildren
              : null;
          case "Biological Family Reunification Rate (%)":
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

    const isRatio = selectedMetric === "Number of Licensed Homes to Children in Care";
    const isPercent = selectedMetric === "Biological Family Reunification Rate (%)";

    const formatLabel = (v) => {
      if (v === null || v === undefined) return 'N/A';
      if (isRatio) return `${v.toFixed(2)} Homes per Child`;
      if (isPercent) return fmtPct(v); // fmtPct handles decimal→% conversion
      return fmt(Math.round(v));
    };

    // Build a descriptive title
    let title;
    switch (selectedMetric) {
      case "Number of Children Waiting For Adoption":
        title = `Children Waiting For Adoption in ${regionName}`;
        break;
      case "Number of Family Preservation Cases":
        title = `Family Preservation Cases in ${regionName}`;
        break;
      case "Number of Licensed Homes to Children in Care":
        title = `Licensed Homes per Child in Care in ${regionName}`;
        break;
      case "Biological Family Reunification Rate (%)":
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
      <div className="bg-mte-subdued-white p-3 rounded relative overflow-visible">
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
                    <div>End of Year {trendData.years[index]}</div>
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
          {regionLevel !== "national" && data.subtitle && <p className="text-sm md:text-base text-mte-charcoal text-center px-4 font-lato mb-0">{data.subtitle}</p>}
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4 leading-tight mb-0">{data.name}</h1>
          {regionLevel === "national" && data.subtitle && <p className="text-sm md:text-base text-mte-charcoal text-center px-4 font-lato mt-1">{data.subtitle}</p>}
          {showCountyDetails && (data.population != null || data.totalChurches != null) && (
            <p className="text-sm text-mte-charcoal font-lato mt-1">
              {data.population != null && <>Population: <span className="font-semibold">{fmt(data.population)}</span></>}
              {data.population != null && data.totalChurches != null && <span className="mx-2">|</span>}
              {data.totalChurches != null && <>Churches: <span className="font-semibold">{fmt(data.totalChurches)}</span></>}
            </p>
          )}
          {showCountyDetails && (
            <div className="mt-2 w-48">
              <CountySelect
                options={countyOptionsForState}
                placeholder="Switch county"
                searchPlaceholder="Search county…"
                onChange={handleCountySelect}
              />
            </div>
          )}
          {isEmbed && (
            <p className="text-xs md:text-sm text-mte-charcoal text-center px-4 font-lato mt-1">
              This snapshot is powered by More Than Enough, CAFO's US Foster Care Initiative.{' '}
              <a href="https://fostercaredata.cafo.org/" target="_blank" rel="noopener noreferrer" className="text-mte-blue hover:underline">
                Visit the full dashboard
              </a>{' '}
              for more data — including data for other counties and states.
            </p>
          )}
        </div>
      </header>

      {/* National Map Section */}
      {showMap && (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="w-full lg:w-1/4 space-y-3 md:space-y-4">
            {/* Jump selectors */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card space-y-3">
              <CountySelect
                options={stateOptions}
                placeholder="Jump to a State"
                searchPlaceholder="Search state…"
                onChange={handleStateSelect}
              />
              <CountySelect
                options={countyOptions}
                placeholder="Jump to a County"
                onChange={handleCountySelect}
              />
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
                    <div><span className="text-xl font-black text-mte-blue">{fmt(data.waitingForAdoption)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Children Waiting for Adoption</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.childrenAdopted)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Children Adopted in FY 2023</div>
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
            <div className="bg-white p-4 rounded-lg shadow-mte-card space-y-3">
              <CountySelect
                options={stateOptions}
                placeholder="Jump to a State"
                searchPlaceholder="Search state…"
                onChange={handleStateSelect}
              />
              <CountySelect
                options={countyOptions}
                placeholder="Jump to a County"
                searchPlaceholder="Search county…"
                onChange={handleCountySelect}
              />
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
                    <div><span className="text-xl font-black text-mte-blue">{fmt(data.waitingForAdoption)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Children Waiting for Adoption</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
                <h4 className="text-base font-lato font-bold text-mte-black mb-4 text-center">Biological Family Data</h4>
                <div className="flex items-start gap-4">
                  <img src={BiologicalFamilyIcon} alt="Reunification" className="w-16 h-16 flex-shrink-0" />
                  <div className="space-y-2">
                    <div><span className="text-xl font-black text-mte-blue">{fmtPct(data.reunificationRate)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Biological Family Reunification Rate (%)</div>
                    <div className="pt-2"><span className="text-xl font-black text-mte-blue">{fmt(data.familyPreservationCases)}</span></div>
                    <div className="text-sm text-mte-charcoal font-lato">Family Preservation Cases</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* County-specific: Progress Indicator */}
      {showCountyDetails && progressData?.countyRatio != null && (() => {
        const maxRatio = 1.5;
        const barPct = (r) => Math.min(r / maxRatio, 1) * 100;
        const countyPct = barPct(progressData.countyRatio);
        const statePct = progressData.stateRatio != null ? barPct(progressData.stateRatio) : null;
        const nationalPct = progressData.nationalRatio != null ? barPct(progressData.nationalRatio) : null;
        const labelInside = countyPct > 12;

        return (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="bg-white rounded-2xl shadow-mte-card p-6 md:p-8">
              {/* Title */}
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-lato font-bold text-mte-black">
                  Foster Care Progress Indicator
                </h2>
                <p className="text-sm md:text-base text-mte-charcoal font-lato mt-1">
                  Tracking progress toward <em className="font-source-serif">more than enough</em>
                </p>
              </div>

              {/* SVG Progress Bar */}
              <div className="w-full overflow-visible">
                <svg viewBox="-10 0 820 120" className="w-full" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                  {/* Scale labels above bar */}
                  <text x={800 * (0.5 / maxRatio)} y="14" textAnchor="middle" className="fill-mte-charcoal" style={{ fontSize: '12px', fontFamily: 'Lato, sans-serif' }}>.50 to 1</text>
                  <text x={800 * (1.0 / maxRatio)} y="14" textAnchor="middle" className="fill-mte-charcoal" style={{ fontSize: '12px', fontFamily: 'Lato, sans-serif' }}>1 to 1</text>
                  <text x={800 * (1.5 / maxRatio)} y="14" textAnchor="middle" className="fill-mte-charcoal" style={{ fontSize: '12px', fontFamily: 'Lato, sans-serif' }}>1.5 to 1</text>

                  {/* Gray arrow track */}
                  <polygon points="0,24 760,24 800,52 760,80 0,80" fill="#e0e0e0" rx="8" />
                  {/* Rounded left edge */}
                  <rect x="0" y="24" width="16" height="56" rx="8" fill="#e0e0e0" />

                  {/* Blue filled portion */}
                  <clipPath id="barClip">
                    <rect x="0" y="24" width={Math.max(760 * (countyPct / 100), 16)} height="56" rx="8" />
                  </clipPath>
                  <polygon points="0,24 760,24 800,52 760,80 0,80" fill="#02ADEE" clipPath="url(#barClip)" />
                  <rect x="0" y="24" width="16" height="56" rx="8" fill="#02ADEE" clipPath="url(#barClip)" />

                  {/* County ratio label */}
                  {labelInside ? (
                    <text
                      x={Math.max(760 * (countyPct / 100) / 2, 30)}
                      y="58"
                      textAnchor="middle"
                      fill="white"
                      style={{ fontSize: '22px', fontFamily: 'Lato, sans-serif', fontWeight: 900 }}
                    >
                      {progressData.countyRatio < 1 ? '.' + progressData.countyRatio.toFixed(2).split('.')[1] : progressData.countyRatio.toFixed(2)}
                    </text>
                  ) : (
                    <text
                      x={760 * (countyPct / 100) + 10}
                      y="58"
                      textAnchor="start"
                      fill="#02ADEE"
                      style={{ fontSize: '22px', fontFamily: 'Lato, sans-serif', fontWeight: 900 }}
                    >
                      {progressData.countyRatio < 1 ? '.' + progressData.countyRatio.toFixed(2).split('.')[1] : progressData.countyRatio.toFixed(2)}
                    </text>
                  )}

                  {/* Scale tick marks */}
                  {[0.5, 1.0, 1.5].map(tick => (
                    <line key={tick} x1={760 * (tick / maxRatio)} y1="24" x2={760 * (tick / maxRatio)} y2="80" stroke="white" strokeWidth="2" />
                  ))}

                  {/* "more than enough" label */}
                  <text x="800" y="100" textAnchor="end" style={{ fontSize: '14px', fontFamily: 'Source Serif Pro, Georgia, serif', fontStyle: 'italic', fontWeight: 600 }} className="fill-mte-black">
                    more than enough
                  </text>

                  {/* State average dashed line */}
                  {statePct != null && (
                    <g>
                      <line x1={760 * (statePct / 100)} y1="20" x2={760 * (statePct / 100)} y2="84" stroke="#4aa456" strokeWidth="2.5" strokeDasharray="6,4" />
                    </g>
                  )}

                  {/* National average dashed line */}
                  {nationalPct != null && (
                    <g>
                      <line x1={760 * (nationalPct / 100)} y1="20" x2={760 * (nationalPct / 100)} y2="84" stroke="#882781" strokeWidth="2.5" strokeDasharray="6,4" />
                    </g>
                  )}
                </svg>

                {/* Average legends below bar */}
                <div className="flex justify-center gap-6 md:gap-10 mt-2 flex-wrap">
                  {statePct != null && (
                    <div className="flex items-center gap-2">
                      <svg width="32" height="2" className="flex-shrink-0"><line x1="0" y1="1" x2="32" y2="1" stroke="#4aa456" strokeWidth="2.5" strokeDasharray="6,4" /></svg>
                      <span className="text-xs md:text-sm text-mte-charcoal font-lato">Statewide avg.={progressData.stateRatio.toFixed(2)}</span>
                    </div>
                  )}
                  {nationalPct != null && (
                    <div className="flex items-center gap-2">
                      <svg width="32" height="2" className="flex-shrink-0"><line x1="0" y1="1" x2="32" y2="1" stroke="#882781" strokeWidth="2.5" strokeDasharray="6,4" /></svg>
                      <span className="text-xs md:text-sm text-mte-charcoal font-lato">National avg.={progressData.nationalRatio.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs md:text-sm text-mte-charcoal font-lato mt-4 text-center max-w-3xl mx-auto leading-relaxed">
                This metric shows the ratio of children in foster care to licensed homes. Because a positive change in any metrics listed below can meaningfully increase this overall ratio, it is a helpful indicator of your community's progress toward <em className="font-source-serif">more than enough</em>.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Cards - County only */}
      {showCountyDetails && (() => {
        const src = data.sourceAgency ? `${data.sourceAgency}${data.dataYear ? ` (${data.dataYear})` : ''}` : null;
        return (
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={FosterKinshipIcon} alt="Foster & Kinship" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Families who provide temporary care for children through formal foster care or informal kinship arrangements with relatives">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Foster and Kinship Families</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.licensedHomesPerChild)}</div>
              <HoverableText tooltip="The ratio of available licensed foster homes to children currently in out-of-home care">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Licensed Foster Homes Per Child in Care</div>
              </HoverableText>
            </div>
            <div className="max-w-sm mx-auto">
              <MetricRow label="Number of Children in Care" value={fmt(data.childrenInCare)} tooltip="Total number of children in the foster care system" source={src} />
              <MetricRow label="Children in Family-based Foster Care" value={fmt(data.childrenInFamily)} tooltip="Children placed with licensed foster families" source={src} />
              <MetricRow label="Children in Kinship Care" value={fmt(data.childrenInKinship)} tooltip="Children placed with relatives or family friends" source={src} />
              <MetricRow label="Children Placed Out-of-County" value={fmt(data.childrenOutOfCounty)} tooltip="Children from this county placed in care outside county boundaries" source={src} />
              <MetricRow label="Number of Licensed Foster Homes" value={fmt(data.licensedHomes)} tooltip="Total number of state-licensed foster homes in this county" source={src} />
            </div>
            <div className="mt-4 text-center space-y-1">
              <div>
                <a href="https://docs.google.com/document/d/1h4nw_B2xA2sPHO7jODee_geUKeEbwk3oV3nzL32emZ0/export?format=pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-lato text-mte-blue hover:text-mte-blue-80 underline transition-colors">
                  Download our data guide
                </a>
              </div>
              {hasNA(data.licensedHomesPerChild, data.childrenInCare, data.childrenInFamily, data.childrenInKinship, data.childrenOutOfCounty, data.licensedHomes) && (
                <div><RequestDataLink /></div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={AdoptiveFamilyIcon} alt="Adoptive Families" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Families who have completed or are in the process of legally adopting children from foster care">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Adoptive Families</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmt(data.waitingForAdoption)}</div>
              <HoverableText tooltip="Children whose parental rights have been terminated and are legally free for adoption">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Number of Children Waiting For Adoption</div>
              </HoverableText>
            </div>
            <div className="max-w-md mx-auto">
              <MetricRow label="Children Adopted in 2024" value={fmt(data.childrenAdopted2024)} tooltip="Number of finalized adoptions in the current year" source={src} />
              <MetricRow label="Average Months to Adoption" value={fmt(data.avgMonthsToAdoption)} tooltip="Average time from termination of parental rights to finalized adoption" source={src} />
            </div>
            <div className="mt-4 text-center space-y-1">
              <div>
                <a href="https://docs.google.com/document/d/1h4nw_B2xA2sPHO7jODee_geUKeEbwk3oV3nzL32emZ0/export?format=pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-lato text-mte-blue hover:text-mte-blue-80 underline transition-colors">
                  Download our data guide
                </a>
              </div>
              {hasNA(data.waitingForAdoption, data.childrenAdopted2024, data.avgMonthsToAdoption) && (
                <div><RequestDataLink /></div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={BiologicalFamilyIcon} alt="Biological Families" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Services and support provided to birth parents working toward reunification with their children">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Support for Biological Families</h3>
            </HoverableText>
            <div className="max-w-sm mx-auto">
              <MetricRow label="Number of Family Preservation Cases" value={fmt(data.familyPreservationCases)} tooltip="Active cases providing intensive services to prevent foster care placement" source={src} />
              <MetricRow label="Biological Family Reunification Rate" value={fmtPct(data.reunificationRate)} tooltip="Percentage of children who successfully return to their birth families" source={src} />
            </div>
            <div className="mt-4 text-center space-y-1">
              <div>
                <a href="https://docs.google.com/document/d/1h4nw_B2xA2sPHO7jODee_geUKeEbwk3oV3nzL32emZ0/export?format=pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-lato text-mte-blue hover:text-mte-blue-80 underline transition-colors">
                  Download our data guide
                </a>
              </div>
              {hasNA(data.familyPreservationCases, data.reunificationRate) && (
                <div><RequestDataLink /></div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={WrapAroundIcon} alt="Wraparound Support" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Comprehensive community-based support services for all families involved in foster care">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Wraparound Support</h3>
            </HoverableText>
            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{fmtPct(data.supportPercentage)}</div>
              <HoverableText tooltip="Percentage of local churches actively engaged in foster care ministry">
                <div className="text-base text-mte-charcoal font-lato whitespace-nowrap">Churches Providing Support</div>
              </HoverableText>
            </div>
            <div className="max-w-md mx-auto">
              <MetricRow label="Churches Providing Support" value={fmt(data.churchesProvidingSupport)} tooltip="Number of churches with active foster care support programs" source="DM Databases" />
              <MetricRow label="Total Churches" value={fmt(data.totalChurches)} tooltip="Total number of churches in this county" source="DM Databases" />
            </div>
            <div className="mt-4 text-center space-y-1">
              <div>
                <a href="https://docs.google.com/document/d/1h4nw_B2xA2sPHO7jODee_geUKeEbwk3oV3nzL32emZ0/export?format=pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-lato text-mte-blue hover:text-mte-blue-80 underline transition-colors">
                  Download our data guide
                </a>
              </div>
              {hasNA(data.supportPercentage, data.churchesProvidingSupport, data.totalChurches) && (
                <div><RequestDataLink /></div>
              )}
            </div>
          </div>
        </main>
        );
      })()}

      {/* Statewide summary - County only */}
      {showStateContext && (() => {
        const stateInfo = getStateDataForCounty();
        if (!stateInfo) return null;
        return (
          <section className="max-w-7xl mx-auto px-4 mb-6">
            <div className="bg-white rounded-2xl shadow-mte-card px-6 py-6 text-center">
              <h3 className="text-2xl font-nexa text-mte-black mb-4">Statewide Data Summary for {data.state}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 text-center">
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.totalChildren)}</p><p className="text-sm text-mte-charcoal font-lato">Number of Children in Care</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.licensedHomes)}</p><p className="text-sm text-mte-charcoal font-lato">Number of Licensed Foster Homes</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.waitingForAdoption)}</p><p className="text-sm text-mte-charcoal font-lato">Number of Children Waiting For Adoption</p></div>
                <div><p className="text-xl md:text-2xl font-black text-mte-blue">{fmtPct(stateInfo.reunificationRate)}</p><p className="text-sm text-mte-charcoal font-lato">Biological Family Reunification Rate (%)</p></div>
                <div className="col-span-2 md:col-span-1"><p className="text-xl md:text-2xl font-black text-mte-blue">{fmt(stateInfo.familyPreservationCases)}</p><p className="text-sm text-mte-charcoal font-lato">Number of Family Preservation Cases</p></div>
              </div>
              <div className="mt-4 text-xs text-mte-charcoal font-lato">Source: AFCARS</div>
            </div>
          </section>
        );
      })()}

      {/* Embed Button - hidden in embed mode */}
      {!isEmbed && (
        <div className="max-w-7xl mx-auto px-4 mt-6 mb-6">
          <button
            onClick={() => { setShowEmbedModal(true); setEmbedCopied(false); }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-white border-2 border-mte-blue rounded-lg text-mte-blue font-lato font-medium hover:bg-mte-blue hover:text-white transition-colors shadow-mte-card"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Embed This Page
          </button>
        </div>
      )}

      {/* Embed Modal */}
      {showEmbedModal && (() => {
        const baseUrl = 'https://fostercaredata.cafo.org';
        let hash = '';
        if (regionLevel === 'national') {
          hash = '#/national/metric';
        } else if (regionLevel === 'state') {
          hash = `#/state/${regionId}/metric`;
        } else if (regionLevel === 'county') {
          hash = `#/county/${regionId}/metric`;
        }
        const embedUrl = `${baseUrl}/?embed=true${hash}`;
        const iframeCode = `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;" title="More Than Enough - ${data.name} Metrics"></iframe>`;

        const handleCopy = () => {
          navigator.clipboard.writeText(iframeCode).then(() => {
            setEmbedCopied(true);
            setTimeout(() => setEmbedCopied(false), 2500);
          });
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowEmbedModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-lato text-mte-black">Embed Metrics View</h3>
                <button onClick={() => setShowEmbedModal(false)} className="text-mte-charcoal hover:text-mte-black transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-mte-charcoal font-lato mb-4">
                Copy the code below and paste it into your website's HTML to embed the metrics view for <strong>{data.name}</strong>.
              </p>
              <div className="bg-gray-100 rounded-lg p-3 mb-4 relative">
                <pre className="text-xs text-mte-charcoal font-mono whitespace-pre-wrap break-all leading-relaxed">{iframeCode}</pre>
              </div>
              <button
                onClick={handleCopy}
                className={`w-full py-2.5 rounded-lg font-lato font-medium transition-colors ${
                  embedCopied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-mte-blue text-white hover:bg-mte-blue-80'
                }`}
              >
                {embedCopied ? '✓ Copied to Clipboard' : 'Copy Embed Code'}
              </button>
            </div>
          </div>
        );
      })()}

      <footer className={`py-4 px-6 ${isEmbed ? 'flex flex-col md:flex-row items-start md:items-center justify-between gap-3' : 'flex justify-end'}`}>
        <a href="https://cafo.org/morethanenough/" target="_blank" rel="noopener noreferrer">
          <img src={MTELogo} alt="More Than Enough Logo" className="h-6 md:h-8 inline-block" />
        </a>
      </footer>
    </div>
  );
};

export default MetricView;