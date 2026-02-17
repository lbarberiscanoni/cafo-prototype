import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { countyData, fmt } from './real-data.js';

// Metric configuration: maps metric names to data fields and formatting
// Field names match real-data.js countyData structure
const COUNTY_METRIC_CONFIG = {
  "Ratio of Licensed Homes to Children in Care": {
    isRatio: true,
    isPercent: false,
    getValue: (data) => {
      // licensedHomesPerChild is pre-calculated in real-data.js
      const val = data?.licensedHomesPerChild;
      return (val !== null && val !== undefined) ? parseFloat(val) : null;
    },
    format: (v) => v !== null && v !== undefined ? v.toFixed(2) : 'N/A',
    legendFormat: (v) => v !== null && v !== undefined ? v.toFixed(2) : 'N/A'
  },
  "Count of Children Waiting For Adoption": {
    isRatio: false,
    isPercent: false,
    getValue: (data) => data?.waitingForAdoption ?? null,
    format: fmt,
    legendFormat: fmt
  },
  "Count of Family Preservation Cases": {
    isRatio: false,
    isPercent: false,
    getValue: (data) => data?.familyPreservationCases ?? null,
    format: fmt,
    legendFormat: fmt
  },
  "Biological Family Reunification Rate": {
    isRatio: false,
    isPercent: true,
    getValue: (data) => data?.reunificationRate ?? null,
    // reunificationRate is stored as decimal (0.45 = 45%)
    format: (v) => {
      if (v === null || v === undefined) return 'N/A';
      return `${(v * 100).toFixed(1)}%`;
    },
    legendFormat: (v) => {
      if (v === null || v === undefined) return 'N/A';
      return `${(v * 100).toFixed(1)}%`;
    }
  }
};

// Helper function to convert county data to state-based lookup
const getCountyDataByState = (stateCode, metricConfig) => {
  const stateCounties = {};
  
  Object.entries(countyData).forEach(([countyId, data]) => {
    const countyStateCode = countyId.split('-').pop()?.toUpperCase();
    
    if (countyStateCode === stateCode) {
      const countyName = data.countyName;
      const value = metricConfig.getValue(data);
      stateCounties[countyName] = {
        value: value,
        fips: countyId,
        ...data
      };
    }
  });
  
  return stateCounties;
};

// State FIPS codes
const stateFips = {
  'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06',
  'CO': '08', 'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13',
  'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18', 'IA': '19',
  'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24',
  'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29',
  'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
  'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
  'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45',
  'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49', 'VT': '50',
  'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56'
};

const InteractiveStateMap = ({ stateCode, stateName, selectedMetric = "Ratio of Licensed Homes to Children in Care", onCountyClick }) => {
  const mapRef = useRef();
  const containerRef = useRef();
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [legendExpanded, setLegendExpanded] = useState(false);

  // Get metric configuration, fallback to ratio if metric not found
  const metricConfig = COUNTY_METRIC_CONFIG[selectedMetric] || COUNTY_METRIC_CONFIG["Ratio of Licensed Homes to Children in Care"];

  // Get county data for this state based on selected metric
  const stateCountyData = useMemo(() => 
    getCountyDataByState(stateCode, metricConfig), 
    [stateCode, metricConfig]
  );

  // Calculate dynamic color scale based on actual data distribution (quantiles)
  const { colorScale, legendBreaks, hasData } = useMemo(() => {
    const values = Object.values(stateCountyData)
      .map(d => d?.value)
      .filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
    
    if (values.length === 0) {
      return { colorScale: () => '#f2efe9', legendBreaks: [], hasData: false };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const getQuantile = (p) => sortedValues[Math.floor(p * (sortedValues.length - 1))];
    
    // For ratios/percents, keep decimal precision; for counts, round
    const roundValue = (v) => {
      if (metricConfig.isRatio || metricConfig.isPercent) {
        return Math.round(v * 100) / 100; // 2 decimal places
      }
      return Math.round(v);
    };

    const breaks = [
      roundValue(getQuantile(0)),
      roundValue(getQuantile(0.2)),
      roundValue(getQuantile(0.4)),
      roundValue(getQuantile(0.6)),
      roundValue(getQuantile(0.8)),
      roundValue(getQuantile(1))
    ];

    const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
    const colors = ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'];
    
    const scale = (value) => {
      if (value === null || value === undefined || isNaN(value) || value === 0) return '#f2efe9';
      for (let i = uniqueBreaks.length - 1; i >= 0; i--) {
        if (value >= uniqueBreaks[i]) return colors[Math.min(i, colors.length - 1)];
      }
      return colors[0];
    };

    return { colorScale: scale, legendBreaks: uniqueBreaks, hasData: true };
  }, [stateCountyData, metricConfig]);

  // Format value for display
  const formatDisplayValue = (value) => metricConfig.format(value);
  const formatLegendValue = (value) => metricConfig.legendFormat(value);

  useEffect(() => {
    let cancelled = false;
    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 700;
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "#d4dadc");

    const fips = stateFips[stateCode];
    if (!fips) {
      setError(`State code ${stateCode} not found`);
      return;
    }

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
      .then(us => {
        if (cancelled) return;
        const stateCounties = topojson.feature(us, us.objects.counties).features
          .filter(d => d.id.toString().startsWith(fips));

        if (stateCounties.length === 0) {
          setError(`No counties found for state ${stateCode}`);
          return;
        }

        const projection = d3.geoMercator()
          .fitSize([width, height], { type: "FeatureCollection", features: stateCounties });

        const path = d3.geoPath().projection(projection);

        svg.selectAll("path")
          .data(stateCounties)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", d => {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            return colorScale(data?.value);
          })
          .attr("stroke", "#ccc")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseenter", function(event, d) {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            
            d3.select(this).attr("stroke", "#00ADEE").attr("stroke-width", 2);
            // Use container-relative coords (CSS pixels) not SVG viewBox coords
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
            }
            setHoveredCounty({
              name: countyName,
              value: data?.value,
              fips: d.id,
              hasData: !!data && data.value !== null && data.value !== undefined
            });
          })
          .on("mouseleave", function() {
            d3.select(this).attr("stroke", "#ccc").attr("stroke-width", 0.5);
            setHoveredCounty(null);
          })
          .on("click", function(event, d) {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            if (onCountyClick && data) {
              const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode.toLowerCase()}`;
              onCountyClick(countyId, countyName, data);
            }
          });

        // Drop shadow filter
        const defs = svg.append("defs");
        const dropShadow = defs.append("filter")
          .attr("id", "county-drop-shadow")
          .attr("x", "-50%").attr("y", "-50%")
          .attr("width", "200%").attr("height", "200%");
        
        dropShadow.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 3);
        dropShadow.append("feOffset").attr("dx", 0).attr("dy", 2).attr("result", "offsetblur");
        dropShadow.append("feComponentTransfer").append("feFuncA").attr("type", "linear").attr("slope", 0.15);
        const feMerge = dropShadow.append("feMerge");
        feMerge.append("feMergeNode");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Responsive sizing
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        const getResponsiveParams = (countyName) => {
          const textLength = countyName.length;
          if (isMobile) return { fontSize: textLength > 12 ? '8px' : '9px', yOffset: -12, borderHeight: 2 };
          if (isTablet) return { fontSize: textLength > 12 ? '9px' : '10px', yOffset: -14, borderHeight: 2 };
          return { fontSize: textLength > 12 ? '10px' : '11px', yOffset: -16, borderHeight: 3 };
        };

        // County labels - only show for counties with data for the selected metric
        const labelGroups = svg.selectAll("g.county-label")
          .data(stateCounties.filter(d => {
            const data = stateCountyData[d.properties.name];
            return data?.value !== null && data?.value !== undefined;
          }))
          .enter()
          .append("g")
          .attr("class", "county-label")
          .attr("transform", d => {
            const centroid = path.centroid(d);
            return `translate(${centroid[0]}, ${centroid[1]})`;
          })
          .style("cursor", "pointer")
          .on("mouseenter", function(event, d) {
            const centroid = path.centroid(d);
            d3.select(this).transition().duration(150)
              .attr("transform", `translate(${centroid[0]}, ${centroid[1]}) scale(1.05)`);
            d3.select(this).select("rect.card-bg").transition().duration(150).attr("fill-opacity", 1);
          })
          .on("mouseleave", function(event, d) {
            const centroid = path.centroid(d);
            d3.select(this).transition().duration(150)
              .attr("transform", `translate(${centroid[0]}, ${centroid[1]}) scale(1)`);
            d3.select(this).select("rect.card-bg").transition().duration(150).attr("fill-opacity", 0.95);
          })
          .on("click", function(event, d) {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            if (onCountyClick && data) {
              const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode.toLowerCase()}`;
              onCountyClick(countyId, countyName, data);
            }
          });

        // Card background
        labelGroups.append("rect")
          .attr("class", "card-bg")
          .attr("x", d => {
            const textLength = d.properties.name.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            return -(textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16)) / 2;
          })
          .attr("y", d => getResponsiveParams(d.properties.name).yOffset)
          .attr("width", d => {
            const textLength = d.properties.name.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            return textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16);
          })
          .attr("height", isMobile ? 18 : isTablet ? 20 : 22)
          .attr("rx", 6).attr("ry", 6)
          .attr("fill", "#ffffff").attr("fill-opacity", 0.95);

        // Blue bottom border
        labelGroups.append("rect")
          .attr("class", "card-border")
          .attr("x", d => {
            const textLength = d.properties.name.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            return -(textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16)) / 2;
          })
          .attr("y", d => {
            const params = getResponsiveParams(d.properties.name);
            const cardHeight = isMobile ? 18 : isTablet ? 20 : 22;
            return params.yOffset + cardHeight - params.borderHeight;
          })
          .attr("width", d => {
            const textLength = d.properties.name.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            return textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16);
          })
          .attr("height", d => getResponsiveParams(d.properties.name).borderHeight)
          .attr("fill", "#02ADEE");

        // County name text
        labelGroups.append("text")
          .attr("x", 0)
          .attr("y", d => {
            const params = getResponsiveParams(d.properties.name);
            const cardHeight = isMobile ? 18 : isTablet ? 20 : 22;
            return params.yOffset + ((cardHeight - params.borderHeight) / 2);
          })
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-family", "'Lato', sans-serif")
          .attr("font-size", d => getResponsiveParams(d.properties.name).fontSize)
          .attr("font-weight", "600")
          .attr("fill", "#5c5d5f")
          .attr("pointer-events", "none")
          .text(d => d.properties.name);

        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        console.error("Error loading county map:", err);
        setError(`Error loading map: ${err.message}`);
      });

    return () => { cancelled = true; };
  }, [stateCode, stateName, selectedMetric, onCountyClick, colorScale, stateCountyData]);

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Unable to load map</p>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">State: {stateName} ({stateCode})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Instructions - HIDDEN on mobile, visible on md+ */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow-lg text-sm z-10 hidden md:block">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="font-lato text-mte-charcoal">Hover over a county to display the data</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
          </svg>
          <span className="font-lato text-mte-charcoal">Click to view detailed county data</span>
        </div>
      </div>

      {/* Map Legend - Collapsible on mobile, always open on md+ */}
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-white p-2 md:p-3 rounded shadow-lg z-10 max-w-[160px] md:max-w-none">
        {/* Legend header - clickable on mobile to expand/collapse */}
        <button 
          className="w-full text-left flex items-center justify-between md:cursor-default"
          onClick={() => setLegendExpanded(prev => !prev)}
        >
          <div className="text-xs md:text-sm font-semibold font-lato text-mte-black leading-tight">
            {selectedMetric}
          </div>
          {/* Chevron - only on mobile */}
          <svg className={`w-4 h-4 ml-1 flex-shrink-0 text-mte-charcoal md:hidden transition-transform ${legendExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {/* Legend body - hidden on mobile unless expanded, always visible on md+ */}
        <div className={`${legendExpanded ? 'block' : 'hidden'} md:block mt-1 md:mt-2`}>
          <div className="text-xs text-mte-charcoal mb-1 md:mb-2 font-lato">{stateName} Counties</div>
          <div className="space-y-1 text-xs font-lato">
            {hasData && legendBreaks.length > 1 ? (
              <>
                {legendBreaks.length >= 5 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 flex-shrink-0" style={{backgroundColor: '#16a34a'}}></div>
                    <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[4])}+</span>
                  </div>
                )}
                {legendBreaks.length >= 4 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 flex-shrink-0" style={{backgroundColor: '#22c55e'}}></div>
                    <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[3])} – {formatLegendValue(legendBreaks[Math.min(4, legendBreaks.length - 1)])}</span>
                  </div>
                )}
                {legendBreaks.length >= 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 flex-shrink-0" style={{backgroundColor: '#4ade80'}}></div>
                    <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[2])} – {formatLegendValue(legendBreaks[Math.min(3, legendBreaks.length - 1)])}</span>
                  </div>
                )}
                {legendBreaks.length >= 2 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 flex-shrink-0" style={{backgroundColor: '#86efac'}}></div>
                    <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[1])} – {formatLegendValue(legendBreaks[Math.min(2, legendBreaks.length - 1)])}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 flex-shrink-0" style={{backgroundColor: '#bbf7d0'}}></div>
                  <span className="text-mte-charcoal">&lt; {formatLegendValue(legendBreaks[1])}</span>
                </div>
              </>
            ) : (
              <div className="text-mte-charcoal">No data available for this metric</div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 flex-shrink-0" style={{backgroundColor: '#f2efe9'}}></div>
              <span className="text-mte-charcoal">No Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* D3 SVG Map */}
      <div className="w-full overflow-hidden flex justify-center items-center max-w-5xl mx-auto">
        <svg ref={mapRef}></svg>
      </div>

      {/* Hover Tooltip */}
      {hoveredCounty && (
        <div 
          className="absolute z-20 bg-mte-charcoal text-white p-3 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full font-lato"
          style={{ left: mousePosition.x, top: mousePosition.y - 10 }}
        >
          <div className="font-semibold">{hoveredCounty.name} County</div>
          {hoveredCounty.hasData ? (
            <div>{formatDisplayValue(hoveredCounty.value)} {selectedMetric}</div>
          ) : (
            <div className="text-mte-subdued-white">No data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveStateMap;