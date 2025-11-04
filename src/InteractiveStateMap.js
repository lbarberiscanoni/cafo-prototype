import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

// Mock county data for states
const countyData = {
  // Alabama counties
  'AL': {
    'Autauga': { value: 45, fips: '01001' },
    'Baldwin': { value: 120, fips: '01003' },
    'Barbour': { value: 32, fips: '01005' },
    'Bibb': { value: 28, fips: '01007' },
    'Blount': { value: 55, fips: '01009' },
    'Bullock': { value: 18, fips: '01011' },
    'Butler': { value: 21, fips: '01013' },
    'Calhoun': { value: 95, fips: '01015' },
    // Add more Alabama counties as needed
  },
  // New York counties
  'NY': {
    'Albany': { value: 180, fips: '36001' },
    'Allegany': { value: 35, fips: '36003' },
    'Bronx': { value: 450, fips: '36005' },
    'Broome': { value: 120, fips: '36007' },
    'Cattaraugus': { value: 55, fips: '36009' },
    'Cayuga': { value: 68, fips: '36011' },
    'Chautauqua': { value: 85, fips: '36013' },
    'Nassau': { value: 543, fips: '36059' },
    // Add more New York counties as needed
  }
};

// Color scale - same as US map for consistency
const getCountyColor = (value) => {
  if (!value) return '#e5e7eb';
  if (value < 50) return '#dcfce7';
  if (value < 100) return '#bbf7d0';
  if (value < 200) return '#86efac';
  if (value < 300) return '#4ade80';
  if (value < 400) return '#22c55e';
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

    const width = 800;
    const height = 500;
    
    svg.attr("width", width).attr("height", height);

    const fips = stateFips[stateCode];
    if (!fips) {
      setError(`State code ${stateCode} not found`);
      return;
    }

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

        // Calculate bounds for this state
        const bounds = d3.geoBounds({
          type: "FeatureCollection",
          features: stateCounties
        });

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
            const counties = countyData[stateCode] || {};
            const data = counties[countyName];
            return getCountyColor(data?.value);
          })
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseenter", function(event, d) {
            const countyName = d.properties.name;
            const counties = countyData[stateCode] || {};
            const data = counties[countyName];
            
            d3.select(this)
              .attr("stroke", "#00ADEE")
              .attr("stroke-width", 2);
              
            const [x, y] = d3.pointer(event, svg.node());
            setMousePosition({ x, y });
            setHoveredCounty({
              name: countyName,
              value: data?.value || 0,
              fips: d.id
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
            const counties = countyData[stateCode] || {};
            const data = counties[countyName];
            if (onCountyClick) {
              onCountyClick(d.id, countyName, data);
            }
          });

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
          <span>Hover over a county to display the data</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
          </svg>
          <span>Click to view detailed county data</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-lg z-10">
        <div className="text-sm font-semibold mb-2">
          {selectedMetric}
        </div>
        <div className="text-xs text-gray-600 mb-2">{stateName} Counties</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#16a34a'}}></div>
            <span>400+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#22c55e'}}></div>
            <span>300-400</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#4ade80'}}></div>
            <span>200-300</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#86efac'}}></div>
            <span>100-200</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#bbf7d0'}}></div>
            <span>50-100</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3" style={{backgroundColor: '#dcfce7'}}></div>
            <span>&lt;50</span>
          </div>
        </div>
      </div>

      {/* D3 SVG Map */}
      <div className="w-full overflow-hidden">
        <svg ref={mapRef} className="w-full h-auto"></svg>
      </div>

      {/* Hover Tooltip */}
      {hoveredCounty && (
        <div 
          className="absolute z-20 bg-gray-800 text-white p-3 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: mousePosition.x,
            top: mousePosition.y - 10
          }}
        >
          <div className="font-semibold">{hoveredCounty.name} County</div>
          <div>{hoveredCounty.value.toLocaleString()} {selectedMetric}</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveStateMap;