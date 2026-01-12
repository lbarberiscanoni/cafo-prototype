import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { stateData, fmt, fmtPct, stateNameToCode } from './real-data.js';

// State name to abbreviation mapping
const stateNameToAbbreviation = {
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

// State name to key mapping (for looking up in stateData)
const stateNameToKey = {
  'Alabama': 'alabama', 'Alaska': 'alaska', 'Arizona': 'arizona', 'Arkansas': 'arkansas',
  'California': 'california', 'Colorado': 'colorado', 'Connecticut': 'connecticut',
  'Delaware': 'delaware', 'Florida': 'florida', 'Georgia': 'georgia', 'Hawaii': 'hawaii',
  'Idaho': 'idaho', 'Illinois': 'illinois', 'Indiana': 'indiana', 'Iowa': 'iowa',
  'Kansas': 'kansas', 'Kentucky': 'kentucky', 'Louisiana': 'louisiana', 'Maine': 'maine',
  'Maryland': 'maryland', 'Massachusetts': 'massachusetts', 'Michigan': 'michigan',
  'Minnesota': 'minnesota', 'Mississippi': 'mississippi', 'Missouri': 'missouri',
  'Montana': 'montana', 'Nebraska': 'nebraska', 'Nevada': 'nevada', 'New Hampshire': 'new-hampshire',
  'New Jersey': 'new-jersey', 'New Mexico': 'new-mexico', 'New York': 'new-york',
  'North Carolina': 'north-carolina', 'North Dakota': 'north-dakota', 'Ohio': 'ohio',
  'Oklahoma': 'oklahoma', 'Oregon': 'oregon', 'Pennsylvania': 'pennsylvania',
  'Rhode Island': 'rhode-island', 'South Carolina': 'south-carolina', 'South Dakota': 'south-dakota',
  'Tennessee': 'tennessee', 'Texas': 'texas', 'Utah': 'utah', 'Vermont': 'vermont',
  'Virginia': 'virginia', 'Washington': 'washington', 'West Virginia': 'west-virginia',
  'Wisconsin': 'wisconsin', 'Wyoming': 'wyoming'
};

// Metric configuration: maps metric names to data fields and formatting
// Field names match real-data.js: totalChildren, licensedHomes, waitingForAdoption, reunificationRate, familyPreservationCases
const METRIC_CONFIG = {
  "Ratio of Licensed Homes to Children in Care": {
    isRatio: true,
    isPercent: false,
    format: (v) => v !== null && v !== undefined ? v.toFixed(2) : 'N/A',
    legendFormat: (v) => v !== null && v !== undefined ? v.toFixed(2) : 'N/A',
    getFromState: (state) => {
      if (!state) return null;
      // Calculate from licensedHomes / totalChildren
      if (state.licensedHomes != null && state.totalChildren != null && state.totalChildren > 0) {
        return state.licensedHomes / state.totalChildren;
      }
      return null;
    }
  },
  "Count of Children Waiting For Adoption": {
    isRatio: false,
    isPercent: false,
    format: fmt,
    legendFormat: fmt,
    getFromState: (state) => state?.waitingForAdoption ?? null
  },
  "Count of Family Preservation Cases": {
    isRatio: false,
    isPercent: false,
    format: fmt,
    legendFormat: fmt,
    getFromState: (state) => state?.familyPreservationCases ?? null
  },
  "Biological Family Reunification Rate": {
    isRatio: false,
    isPercent: true,
    // reunificationRate is stored as a number like 47 (meaning 47%)
    format: (v) => v !== null && v !== undefined ? `${v}%` : 'N/A',
    legendFormat: (v) => v !== null && v !== undefined ? `${v}%` : 'N/A',
    getFromState: (state) => state?.reunificationRate ?? null
  }
};

// Get available metrics (ones that have data for at least some states)
const getAvailableMetrics = () => {
  const available = [];
  
  for (const [metricName, config] of Object.entries(METRIC_CONFIG)) {
    // Check if at least one state has data for this metric
    const hasData = Object.values(stateData).some(state => {
      const value = config.getFromState(state);
      return value !== null && value !== undefined && !isNaN(value);
    });
    
    if (hasData) {
      available.push(metricName);
    }
  }
  
  return available;
};

const InteractiveUSMap = ({ selectedMetric = "Count of Children Waiting For Adoption", onStateClick }) => {
  const mapRef = useRef();
  const containerRef = useRef();
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Get metric configuration, fallback to a default if metric not found
  const metricConfig = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG["Count of Children Waiting For Adoption"];

  // Build map data based on selected metric
  const mapData = useMemo(() => {
    const data = {};
    
    Object.entries(stateNameToKey).forEach(([fullName, key]) => {
      const state = stateData[key];
      if (state) {
        const value = metricConfig.getFromState(state);
        data[fullName] = {
          value: value,
          code: stateNameToAbbreviation[fullName],
          name: fullName,
          ...state // Include all state data for click handler
        };
      }
    });
    
    return data;
  }, [selectedMetric, metricConfig]);

  // Calculate dynamic color scale based on actual data distribution (quantiles)
  const { colorScale, legendBreaks, hasData } = useMemo(() => {
    const values = Object.values(mapData)
      .map(d => d?.value)
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length === 0) {
      return {
        colorScale: () => '#f1f1f1',
        legendBreaks: [],
        hasData: false
      };
    }

    // Sort values for quantile calculation
    const sortedValues = [...values].sort((a, b) => a - b);
    const getQuantile = (p) => sortedValues[Math.floor(p * (sortedValues.length - 1))];
    
    // For ratios, keep decimal precision; for counts/percents, round
    const roundValue = (v) => {
      if (metricConfig.isRatio) {
        return Math.round(v * 100) / 100; // 2 decimal places for ratios
      }
      return Math.round(v);
    };
    
    // Create quantile breaks (0%, 20%, 40%, 60%, 80%, 100%)
    const breaks = [
      roundValue(getQuantile(0)),
      roundValue(getQuantile(0.2)),
      roundValue(getQuantile(0.4)),
      roundValue(getQuantile(0.6)),
      roundValue(getQuantile(0.8)),
      roundValue(getQuantile(1))
    ];

    // Remove duplicate breaks (can happen with small datasets or clustered data)
    const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
    
    // Green color palette (light to dark)
    const colors = ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'];
    
    const scale = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '#f1f1f1';
      
      // Find which bucket this value falls into
      for (let i = uniqueBreaks.length - 1; i >= 0; i--) {
        if (value >= uniqueBreaks[i]) {
          return colors[Math.min(i, colors.length - 1)];
        }
      }
      return colors[0];
    };

    return {
      colorScale: scale,
      legendBreaks: uniqueBreaks,
      hasData: true
    };
  }, [mapData, metricConfig]);

  useEffect(() => {
    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = 975;
    const height = 610;
    
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto");

    const projection = d3.geoAlbersUsa()
      .scale(1250)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    ]).then(([world, us]) => {
      const countries = topojson.feature(world, world.objects.countries);
      const states = topojson.feature(us, us.objects.states);

      // Draw Canada and Mexico first (background layer)
      svg.selectAll("path.neighbor-country")
        .data(countries.features.filter(d => d.id === "124" || d.id === "484"))
        .enter()
        .append("path")
        .attr("class", "neighbor-country")
        .attr("d", path)
        .attr("fill", "#f5f5f5")
        .attr("stroke", "#d4d4d4")
        .attr("stroke-width", 1)
        .style("pointer-events", "none");

      // Draw US state paths
      svg.selectAll("path.us-state")
        .data(states.features)
        .enter()
        .append("path")
        .attr("class", "us-state")
        .attr("d", path)
        .attr("fill", d => {
          const stateName = d.properties.name;
          const data = mapData[stateName];
          return colorScale(data?.value);
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseenter", function(event, d) {
          const stateName = d.properties.name;
          const data = mapData[stateName];
          
          d3.select(this)
            .attr("stroke", "#00ADEE")
            .attr("stroke-width", 2);
            
          const [x, y] = d3.pointer(event, svg.node());
          setMousePosition({ x, y });
          setHoveredState({
            name: stateName.toUpperCase(),
            value: data?.value,
            code: data?.code
          });
        })
        .on("mouseleave", function() {
          d3.select(this)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5);
          setHoveredState(null);
        })
        .on("click", function(event, d) {
          const stateName = d.properties.name;
          const data = mapData[stateName];
          if (data && onStateClick) {
            onStateClick(data.code, stateName, data);
          }
        });

      // Responsive sizing
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      const getFontSize = (isSmallState) => {
        if (isMobile) return isSmallState ? '8px' : '9px';
        if (isTablet) return isSmallState ? '10px' : '11px';
        return isSmallState ? '11px' : '12px';
      };

      // Add embedded text labels
      const labelGroups = svg.selectAll("g.state-label-embedded")
        .data(states.features)
        .enter()
        .append("g")
        .attr("class", "state-label-embedded")
        .attr("transform", d => {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1]})`;
        })
        .style("cursor", "pointer")
        .on("mouseenter", function(event, d) {
          d3.select(this)
            .select("text")
            .transition()
            .duration(150)
            .attr("fill", "#02ADEE")
            .attr("font-size", d => {
              const stateName = d.properties.name;
              const smallStates = ['Rhode Island', 'Delaware', 'Connecticut', 'New Jersey', 'Maryland'];
              const isSmall = smallStates.includes(stateName);
              const baseFontSize = parseFloat(getFontSize(isSmall));
              return `${baseFontSize * 1.1}px`;
            });
        })
        .on("mouseleave", function(event, d) {
          d3.select(this)
            .select("text")
            .transition()
            .duration(150)
            .attr("fill", "#5c5d5f")
            .attr("font-size", d => {
              const stateName = d.properties.name;
              const smallStates = ['Rhode Island', 'Delaware', 'Connecticut', 'New Jersey', 'Maryland'];
              const isSmall = smallStates.includes(stateName);
              return getFontSize(isSmall);
            });
        })
        .on("click", function(event, d) {
          const stateName = d.properties.name;
          const data = mapData[stateName];
          if (data && onStateClick) {
            onStateClick(data.code, stateName, data);
          }
        });

      // State abbreviation text
      labelGroups.append("text")
        .attr("class", "embedded-label")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-family", "'Lato', sans-serif")
        .attr("font-size", d => {
          const stateName = d.properties.name;
          const smallStates = ['Rhode Island', 'Delaware', 'Connecticut', 'New Jersey', 'Maryland'];
          const isSmall = smallStates.includes(stateName);
          return getFontSize(isSmall);
        })
        .attr("font-weight", "700")
        .attr("fill", "#5c5d5f")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", "2.5")
        .attr("stroke-opacity", "0.8")
        .attr("paint-order", "stroke")
        .attr("pointer-events", "none")
        .style("user-select", "none")
        .text(d => stateNameToAbbreviation[d.properties.name] || "");
    })
    .catch(error => {
      console.error("Error loading map data:", error);
    });

  }, [selectedMetric, onStateClick, colorScale, mapData]);

  // Format value for display in tooltip
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return metricConfig.format(value);
  };

  // Format legend value
  const formatLegendValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return metricConfig.legendFormat(value);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow-lg text-sm z-10">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="font-lato text-mte-charcoal">Hover over a state to display the data</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
          </svg>
          <span className="font-lato text-mte-charcoal">Click to deep-dive into a particular state</span>
        </div>
      </div>

      {/* Map Legend - Dynamic based on actual data quantiles */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-lg z-10">
        <div className="text-sm font-semibold mb-2 font-lato text-mte-black">
          {selectedMetric}
        </div>
        <div className="space-y-1 text-xs font-lato">
          {hasData && legendBreaks.length > 1 ? (
            <>
              {legendBreaks.length >= 5 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3" style={{backgroundColor: '#16a34a'}}></div>
                  <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[4])}+</span>
                </div>
              )}
              {legendBreaks.length >= 4 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3" style={{backgroundColor: '#22c55e'}}></div>
                  <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[3])} – {formatLegendValue(legendBreaks[Math.min(4, legendBreaks.length - 1)])}</span>
                </div>
              )}
              {legendBreaks.length >= 3 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3" style={{backgroundColor: '#4ade80'}}></div>
                  <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[2])} – {formatLegendValue(legendBreaks[Math.min(3, legendBreaks.length - 1)])}</span>
                </div>
              )}
              {legendBreaks.length >= 2 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3" style={{backgroundColor: '#86efac'}}></div>
                  <span className="text-mte-charcoal">{formatLegendValue(legendBreaks[1])} – {formatLegendValue(legendBreaks[Math.min(2, legendBreaks.length - 1)])}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-3" style={{backgroundColor: '#bbf7d0'}}></div>
                <span className="text-mte-charcoal">&lt; {formatLegendValue(legendBreaks[1])}</span>
              </div>
            </>
          ) : (
            <div className="text-mte-charcoal">No data available</div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#f1f1f1'}}></div>
            <span className="text-mte-charcoal">No Data</span>
          </div>
        </div>
      </div>

      {/* D3 SVG Map */}
      <div className="w-full overflow-hidden">
        <svg ref={mapRef}></svg>
      </div>

      {/* Hover Tooltip */}
      {hoveredState && (
        <div 
          className="absolute z-20 bg-mte-charcoal text-white p-3 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full font-lato"
          style={{
            left: mousePosition.x,
            top: mousePosition.y - 10
          }}
        >
          <div className="font-semibold">{hoveredState.name}</div>
          <div>{formatDisplayValue(hoveredState.value)}</div>
        </div>
      )}
    </div>
  );
};

// Export the available metrics helper for use in MetricView
export { getAvailableMetrics, METRIC_CONFIG };
export default InteractiveUSMap;