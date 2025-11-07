import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getStateMapData } from './mock-data';

// Get state data from mock-data
const stateData = getStateMapData();

// Color scale
const getStateColor = (value) => {
  if (!value) return '#f1f1f1'; // MTE Light Grey
  if (value < 200) return '#dcfce7';
  if (value < 500) return '#bbf7d0';
  if (value < 1000) return '#86efac';
  if (value < 1500) return '#4ade80';
  if (value < 2000) return '#22c55e';
  return '#16a34a';
};

const InteractiveUSMap = ({ selectedMetric = "Family Preservation Cases", onStateClick }) => {
  const mapRef = useRef();
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 800;
    const height = 500;
    
    svg.attr("width", width).attr("height", height);

    // US AlbersUSA projection
    const projection = d3.geoAlbersUsa()
      .scale(1000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Load US states TopoJSON
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(us => {
        const states = topojson.feature(us, us.objects.states);

        svg.selectAll("path")
          .data(states.features)
          .enter()
          .append("path")
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
      })
      .catch(error => {
        console.error("Error loading map data:", error);
      });

  }, [selectedMetric, onStateClick]);

  return (
    <div className="relative">
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

      {/* D3 SVG Map */}
      <div className="w-full overflow-hidden">
        <svg ref={mapRef} className="w-full h-auto"></svg>
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
          <div>{hoveredState.value.toLocaleString()} {selectedMetric}</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveUSMap;