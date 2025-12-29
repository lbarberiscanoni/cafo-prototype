import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { countyData, fmt } from './real-data.js';

// Helper function to convert county data to state-based lookup
const getCountyDataByState = (stateCode) => {
  const stateCounties = {};
  
  // Iterate through all counties and filter by state code
  Object.entries(countyData).forEach(([countyId, data]) => {
    // County IDs are formatted as "countyname-statecode" (e.g., "butler-al")
    const countyStateCode = countyId.split('-').pop()?.toUpperCase();
    
    if (countyStateCode === stateCode) {
      // Extract county name from the full name (e.g., "Butler County, Alabama" -> "Butler")
      const countyName = data.name.split(' County')[0];
      stateCounties[countyName] = {
        value: data.childrenInCare,
        fips: countyId
      };
    }
  });
  
  return stateCounties;
};

// Color scale - updated to match MTE brand colors
const getCountyColor = (value) => {
  if (value === null || value === undefined || !value) return '#f1f1f1'; // MTE Light Grey for no data
  if (value < 50) return '#dcfce7';
  if (value < 100) return '#bbf7d0';
  if (value < 200) return '#86efac';
  if (value < 500) return '#4ade80';
  if (value < 1000) return '#22c55e';
  return '#16a34a';
};

// State FIPS codes
const stateFips = {
  'AL': '01',
  'AK': '02',
  'AZ': '04',
  'AR': '05',
  'CA': '06',
  'CO': '08',
  'CT': '09',
  'DE': '10',
  'FL': '12',
  'GA': '13',
  'HI': '15',
  'ID': '16',
  'IL': '17',
  'IN': '18',
  'IA': '19',
  'KS': '20',
  'KY': '21',
  'LA': '22',
  'ME': '23',
  'MD': '24',
  'MA': '25',
  'MI': '26',
  'MN': '27',
  'MS': '28',
  'MO': '29',
  'MT': '30',
  'NE': '31',
  'NV': '32',
  'NH': '33',
  'NJ': '34',
  'NM': '35',
  'NY': '36',
  'NC': '37',
  'ND': '38',
  'OH': '39',
  'OK': '40',
  'OR': '41',
  'PA': '42',
  'RI': '44',
  'SC': '45',
  'SD': '46',
  'TN': '47',
  'TX': '48',
  'UT': '49',
  'VT': '50',
  'VA': '51',
  'WA': '53',
  'WV': '54',
  'WI': '55',
  'WY': '56'
};

const InteractiveStateMap = ({ stateCode, stateName, selectedMetric = "Children in Care", onCountyClick }) => {
  const mapRef = useRef();
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 700;
    
    svg.attr("width", width).attr("height", height);

    const fips = stateFips[stateCode];
    if (!fips) {
      setError(`State code ${stateCode} not found`);
      return;
    }

    // Get county data for this state from the imported data
    const stateCountyData = getCountyDataByState(stateCode);
    console.log(`County data for ${stateCode}:`, stateCountyData);

    // Load US counties TopoJSON
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
      .then(us => {
        // Filter counties for this state
        const stateCounties = topojson.feature(us, us.objects.counties).features
          .filter(d => d.id.toString().startsWith(fips));

        if (stateCounties.length === 0) {
          setError(`No counties found for state ${stateCode}`);
          return;
        }

        // Create projection centered on state
        const projection = d3.geoMercator()
          .fitSize([width, height], {
            type: "FeatureCollection",
            features: stateCounties
          });

        const path = d3.geoPath().projection(projection);

        // Draw counties
        svg.selectAll("path")
          .data(stateCounties)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", d => {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            return getCountyColor(data?.value);
          })
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseenter", function(event, d) {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            
            d3.select(this)
              .attr("stroke", "#00ADEE")
              .attr("stroke-width", 2);
              
            const [x, y] = d3.pointer(event, svg.node());
            setMousePosition({ x, y });
            setHoveredCounty({
              name: countyName,
              value: data?.value,
              fips: d.id,
              hasData: !!data && data.value !== null && data.value !== undefined
            });
          })
          .on("mouseleave", function() {
            d3.select(this)
              .attr("stroke", "#ffffff")
              .attr("stroke-width", 0.5);
            setHoveredCounty(null);
          })
          .on("click", function(event, d) {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            if (onCountyClick && data) {
              // Create county ID in the format expected by the app
              const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode.toLowerCase()}`;
              onCountyClick(countyId, countyName, data);
            }
          });

        // Add drop shadow filters for elevated cards
        const defs = svg.append("defs");
        
        const dropShadow = defs.append("filter")
          .attr("id", "county-drop-shadow")
          .attr("x", "-50%")
          .attr("y", "-50%")
          .attr("width", "200%")
          .attr("height", "200%");
        
        dropShadow.append("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 3);
        
        dropShadow.append("feOffset")
          .attr("dx", 0)
          .attr("dy", 2)
          .attr("result", "offsetblur");
        
        dropShadow.append("feComponentTransfer")
          .append("feFuncA")
          .attr("type", "linear")
          .attr("slope", 0.15);
        
        const feMerge = dropShadow.append("feMerge");
        feMerge.append("feMergeNode");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Hover shadow
        const dropShadowHover = defs.append("filter")
          .attr("id", "county-drop-shadow-hover")
          .attr("x", "-50%")
          .attr("y", "-50%")
          .attr("width", "200%")
          .attr("height", "200%");
        
        dropShadowHover.append("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 5);
        
        dropShadowHover.append("feOffset")
          .attr("dx", 0)
          .attr("dy", 4)
          .attr("result", "offsetblur");
        
        dropShadowHover.append("feComponentTransfer")
          .append("feFuncA")
          .attr("type", "linear")
          .attr("slope", 0.2);
        
        const feMergeHover = dropShadowHover.append("feMerge");
        feMergeHover.append("feMergeNode");
        feMergeHover.append("feMergeNode").attr("in", "SourceGraphic");

        // Responsive sizing based on screen width
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Define responsive parameters for county labels
        const getResponsiveParams = (countyName) => {
          const nameLength = countyName.length;
          
          if (isMobile) {
            return {
              fontSize: nameLength > 12 ? '7px' : nameLength > 8 ? '8px' : '9px',
              yOffset: -11,
              yOffsetHover: -13,
              borderHeight: 2
            };
          } else if (isTablet) {
            return {
              fontSize: nameLength > 12 ? '8px' : nameLength > 8 ? '9px' : '10px',
              yOffset: -12,
              yOffsetHover: -14,
              borderHeight: 2.5
            };
          } else {
            return {
              fontSize: nameLength > 12 ? '9px' : nameLength > 8 ? '10px' : '11px',
              yOffset: -12,
              yOffsetHover: -14,
              borderHeight: 3
            };
          }
        };

        // Add elevated card labels for counties - ONLY FOR COUNTIES WITH DATA
        const labelGroups = svg.selectAll("g.county-label-card")
          .data(stateCounties.filter(d => {
            const countyName = d.properties.name;
            return stateCountyData[countyName]; // Only include if county has data
          }))
          .enter()
          .append("g")
          .attr("class", "county-label-card")
          .attr("transform", d => {
            const centroid = path.centroid(d);
            return `translate(${centroid[0]}, ${centroid[1]})`;
          })
          .style("cursor", "pointer")
          .attr("filter", "url(#county-drop-shadow)")
          .on("mouseenter", function(event, d) {
            const centroid = path.centroid(d);
            
            d3.select(this)
              .attr("filter", "url(#county-drop-shadow-hover)")
              .transition()
              .duration(150)
              .attr("transform", `translate(${centroid[0]}, ${centroid[1]}) scale(1.08)`);
            
            d3.select(this)
              .select("rect.card-bg")
              .transition()
              .duration(150)
              .attr("fill-opacity", 1);
            
            d3.select(this)
              .select("rect.card-border")
              .transition()
              .duration(150)
              .attr("height", d => {
                const countyName = d.properties.name;
                const params = getResponsiveParams(countyName);
                return params.borderHeight * 2;
              });
          })
          .on("mouseleave", function(event, d) {
            const centroid = path.centroid(d);
            
            d3.select(this)
              .attr("filter", "url(#county-drop-shadow)")
              .transition()
              .duration(150)
              .attr("transform", `translate(${centroid[0]}, ${centroid[1]}) scale(1)`);
            
            d3.select(this)
              .select("rect.card-bg")
              .transition()
              .duration(150)
              .attr("fill-opacity", 0.95);
            
            d3.select(this)
              .select("rect.card-border")
              .transition()
              .duration(150)
              .attr("height", d => {
                const countyName = d.properties.name;
                const params = getResponsiveParams(countyName);
                return params.borderHeight;
              });
          })
          .on("click", function(event, d) {
            const countyName = d.properties.name;
            const data = stateCountyData[countyName];
            if (onCountyClick && data) {
              const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode.toLowerCase()}`;
              onCountyClick(countyId, countyName, data);
            }
          });

        // Card background rectangle - WHITE with high opacity
        labelGroups.append("rect")
          .attr("class", "card-bg")
          .attr("x", d => {
            const countyName = d.properties.name;
            const textLength = countyName.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            const totalWidth = textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16);
            return -totalWidth / 2;
          })
          .attr("y", d => {
            const countyName = d.properties.name;
            const params = getResponsiveParams(countyName);
            return params.yOffset;
          })
          .attr("width", d => {
            const countyName = d.properties.name;
            const textLength = countyName.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            return textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16);
          })
          .attr("height", isMobile ? 18 : isTablet ? 20 : 22)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", "#ffffff")
          .attr("fill-opacity", 0.95);

        // Blue bottom border accent
        labelGroups.append("rect")
          .attr("class", "card-border")
          .attr("x", d => {
            const countyName = d.properties.name;
            const textLength = countyName.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            const totalWidth = textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16);
            return -totalWidth / 2;
          })
          .attr("y", d => {
            const countyName = d.properties.name;
            const params = getResponsiveParams(countyName);
            const cardHeight = isMobile ? 18 : isTablet ? 20 : 22;
            return params.yOffset + cardHeight - params.borderHeight;
          })
          .attr("width", d => {
            const countyName = d.properties.name;
            const textLength = countyName.length;
            const baseWidth = isMobile ? 5 : isTablet ? 5.5 : 6;
            return textLength * baseWidth + (isMobile ? 10 : isTablet ? 12 : 16);
          })
          .attr("height", d => {
            const countyName = d.properties.name;
            const params = getResponsiveParams(countyName);
            return params.borderHeight;
          })
          .attr("rx", 0)
          .attr("ry", 0)
          .attr("fill", "#02ADEE")
          .attr("opacity", 1);

        // County name text
        labelGroups.append("text")
          .attr("class", "card-text")
          .attr("x", 0)
          .attr("y", d => {
            const countyName = d.properties.name;
            const params = getResponsiveParams(countyName);
            const cardHeight = isMobile ? 18 : isTablet ? 20 : 22;
            // Center text vertically, accounting for border at bottom
            return params.yOffset + ((cardHeight - params.borderHeight) / 2);
          })
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-family", "'Lato', sans-serif")
          .attr("font-size", d => {
            const countyName = d.properties.name;
            const params = getResponsiveParams(countyName);
            return params.fontSize;
          })
          .attr("font-weight", "600")
          .attr("fill", "#5c5d5f")
          .attr("pointer-events", "none")
          .style("user-select", "none")
          .text(d => d.properties.name);

        setError(null);
      })
      .catch(err => {
        console.error("Error loading county map:", err);
        setError(`Error loading map: ${err.message}`);
      });

  }, [stateCode, stateName, selectedMetric, onCountyClick]);

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
    <div className="relative">
      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow-lg text-sm z-10">
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

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-lg z-10">
        <div className="text-sm font-semibold mb-2 font-lato text-mte-black">
          {selectedMetric}
        </div>
        <div className="text-xs text-mte-charcoal mb-2 font-lato">{stateName} Counties</div>
        <div className="space-y-1 text-xs font-lato">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#16a34a'}}></div>
            <span className="text-mte-charcoal">1000+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#22c55e'}}></div>
            <span className="text-mte-charcoal">500-1000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#4ade80'}}></div>
            <span className="text-mte-charcoal">200-500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#86efac'}}></div>
            <span className="text-mte-charcoal">100-200</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#bbf7d0'}}></div>
            <span className="text-mte-charcoal">50-100</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#dcfce7'}}></div>
            <span className="text-mte-charcoal">&lt;50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#f1f1f1'}}></div>
            <span className="text-mte-charcoal">No Data</span>
          </div>
        </div>
      </div>

      {/* D3 SVG Map */}
      <div className="w-full overflow-hidden flex justify-center items-center">
        <svg ref={mapRef} className="w-full h-auto max-w-5xl"></svg>
      </div>

      {/* Hover Tooltip */}
      {hoveredCounty && (
        <div 
          className="absolute z-20 bg-mte-charcoal text-white p-3 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full font-lato"
          style={{
            left: mousePosition.x,
            top: mousePosition.y - 10
          }}
        >
          <div className="font-semibold">{hoveredCounty.name} County</div>
          {hoveredCounty.hasData ? (
            <div>{fmt(hoveredCounty.value)} {selectedMetric}</div>
          ) : (
            <div className="text-mte-subdued-white">No data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveStateMap;