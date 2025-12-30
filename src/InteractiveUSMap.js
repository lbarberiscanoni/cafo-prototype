import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getStateMapData, fmt } from './real-data.js';

// Get state data from mock-data
const stateData = getStateMapData();

// Color scale
const getStateColor = (value) => {
  if (value === null || value === undefined || !value) return '#f1f1f1'; // MTE Light Grey
  if (value < 200) return '#dcfce7';
  if (value < 500) return '#bbf7d0';
  if (value < 1000) return '#86efac';
  if (value < 1500) return '#4ade80';
  if (value < 2000) return '#22c55e';
  return '#16a34a';
};

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

const InteractiveUSMap = ({ selectedMetric = "Family Preservation Cases", onStateClick }) => {
  const mapRef = useRef();
  const containerRef = useRef();
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Responsive dimensions - wider aspect ratio to fit full US
    const width = 975;
    const height = 610;
    
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto");

    // US AlbersUSA projection - adjusted scale and translate for full visibility
    const projection = d3.geoAlbersUsa()
      .scale(1250)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Load both world data (for Canada/Mexico) and US states data
    Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    ]).then(([world, us]) => {
      const countries = topojson.feature(world, world.objects.countries);
      const states = topojson.feature(us, us.objects.states);

      // Draw Canada and Mexico first (background layer)
      svg.selectAll("path.neighbor-country")
        .data(countries.features.filter(d => {
          // Filter for Canada (124) and Mexico (484)
          return d.id === "124" || d.id === "484";
        }))
        .enter()
        .append("path")
        .attr("class", "neighbor-country")
        .attr("d", path)
        .attr("fill", "#f5f5f5") // Very light gray
        .attr("stroke", "#d4d4d4") // Light gray border
        .attr("stroke-width", 1)
        .style("pointer-events", "none"); // Not clickable

      // Draw US state paths on top
      svg.selectAll("path.us-state")
        .data(states.features)
        .enter()
        .append("path")
        .attr("class", "us-state")
        .attr("d", path)
        .attr("fill", d => {
          const stateName = d.properties.name;
          const data = stateData[stateName];
          return getStateColor(data?.value);
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseenter", function(event, d) {
          const stateName = d.properties.name;
          const data = stateData[stateName];
          
          if (data) {
            d3.select(this)
              .attr("stroke", "#00ADEE") // MTE Blue
              .attr("stroke-width", 2);
              
            const [x, y] = d3.pointer(event, svg.node());
            setMousePosition({ x, y });
            setHoveredState({
              name: stateName.toUpperCase(),
              value: data.value,
              code: data.code
            });
          }
        })
        .on("mouseleave", function() {
          d3.select(this)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5);
          setHoveredState(null);
        })
        .on("click", function(event, d) {
          const stateName = d.properties.name;
          const data = stateData[stateName];
          if (data && onStateClick) {
            // Pass state code, name, and data to parent
            onStateClick(data.code, stateName, data);
          }
        });

      // Responsive sizing based on screen width
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      // Define responsive font sizes
      const getFontSize = (isSmallState) => {
        if (isMobile) {
          return isSmallState ? '8px' : '9px';
        } else if (isTablet) {
          return isSmallState ? '10px' : '11px';
        } else {
          return isSmallState ? '11px' : '12px';
        }
      };

      // Add embedded text labels - NO CARDS
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
          // Change text color to blue and scale up
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
          // Return to original color and size
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
          const data = stateData[stateName];
          if (data && onStateClick) {
            onStateClick(data.code, stateName, data);
          }
        });

      // State abbreviation text - embedded with white shadow
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

  }, [selectedMetric, onStateClick]);

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

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-lg z-10">
        <div className="text-sm font-semibold mb-2 font-lato text-mte-black">
          {selectedMetric}
        </div>
        <div className="text-xs text-mte-charcoal mb-2 font-lato">(per 1000 children in care)</div>
        <div className="space-y-1 text-xs font-lato">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#16a34a'}}></div>
            <span className="text-mte-charcoal">20-25%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#22c55e'}}></div>
            <span className="text-mte-charcoal">15-20%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#4ade80'}}></div>
            <span className="text-mte-charcoal">10-15%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#86efac'}}></div>
            <span className="text-mte-charcoal">5-10%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#bbf7d0'}}></div>
            <span className="text-mte-charcoal">&lt;5%</span>
          </div>
        </div>
      </div>

      {/* D3 SVG Map - using viewBox for responsiveness */}
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
          <div>{fmt(hoveredState.value)} {selectedMetric}</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveUSMap;