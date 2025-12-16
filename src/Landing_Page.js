import React, { useMemo, useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import MTELogo from "./assets/MTE_Logo.png";
import MapPin from "./assets/Map_Pin_icon.png";
import CountySelect from "./CountySelect";
import { countyData, stateData } from "./mock-data";

export default function LandingPage({ onSelectRegion, onExploreMap }) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const mapRef = useRef();

  const countyOptions = useMemo(() => {
    return Object.entries(countyData)
      .map(([id, c]) => {
        const base = c.name.includes(",") ? c.name.split(",")[0].trim() : c.name;
        return { id, label: `${base}, ${c.state}`, data: c, state: c.state };
      })
      .sort((a, b) => {
        // Sort by state first, then by county name
        const stateCompare = a.state.localeCompare(b.state);
        if (stateCompare !== 0) return stateCompare;
        return a.label.localeCompare(b.label);
      });
  }, []);

  // D3.js map rendering
  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 700;
    
    svg.attr("width", width).attr("height", height);
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.attr("preserveAspectRatio", "xMidYMid meet");

    // US AlbersUSA projection
    const projection = d3.geoAlbersUsa()
      .scale(1400)
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
          .attr("fill", "#f8f8f8")
          .attr("stroke", "#d0d0d0")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.9);
      })
      .catch(error => {
        console.error("Error loading map data:", error);
      });

  }, []);

  const handleCountyChange = (opt) => {
    onSelectRegion?.({ level: "county", id: opt.id, name: opt.data.name });
  };

  const handleNationalSelect = () => {
    onSelectRegion?.({ level: "national", id: "usa", name: "United States" });
  };

  const handleStateSelect = (stateId, stateName) => {
    onSelectRegion?.({ level: "state", id: stateId, name: stateName });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden font-lato"
      style={{ backgroundColor: 'rgba(2, 173, 238, 0.2)' }}
    >
      {/* D3.js generated map with visible state boundaries */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-20" />
        <div className="absolute left-1/2 top-[4rem] -translate-x-1/2 w-full h-full flex items-center justify-center overflow-hidden">
          <svg ref={mapRef} className="w-full h-auto max-w-[110%]" style={{ opacity: 0.6 }}></svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-28 pt-6">
        {/* Logo */}
        <img src={MTELogo} alt="More Than Enough logo" className="h-9 w-auto object-contain mt-1 self-center" />

        {/* Main Content Area - Centered on Map */}
        <div className="flex-1 flex flex-col justify-center items-center min-h-0">
          {/* Title - Responsive: 28px mobile, 40px desktop */}
          <h1 className="text-center font-lato font-black leading-tight text-mte-black text-[28px] md:text-[40px]" style={{ lineHeight: '1.2' }}>
            Foster Care <span className="text-mte-blue">Where You Live</span>
          </h1>

          {/* Subtitle - Responsive: 14px mobile, 16px desktop */}
          <p className="mt-2 md:mt-3 text-center text-sm md:text-base font-lato text-mte-charcoal px-4">
            Explore the data and connect to local organizations
          </p>

          {/* County Selection */}
          <div className="mt-6 md:mt-10 w-full max-w-2xl px-4 md:px-0">
            <div className="mb-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <img src={MapPin} alt="" className="h-7 w-7 md:h-9 md:w-9 opacity-90" aria-hidden />
                <div className="text-lg md:text-2xl font-lato font-bold text-mte-black text-center">
                  What county do you live in?
                </div>
              </div>
            </div>

            <CountySelect
              options={countyOptions}
              placeholder="Select a county"
              onChange={handleCountyChange}
              containerClassName="w-full"
              controlClassName="w-full rounded-xl border border-mte-light-grey bg-white/80 backdrop-blur px-4 py-3 text-left shadow-mte-card focus-within:ring-2 focus-within:ring-mte-blue"
              menuClassName="rounded-xl border border-mte-light-grey bg-white/95 shadow-lg overflow-hidden"
              optionClassName="px-4 py-2 text-left hover:bg-mte-blue hover:text-white transition-colors"
              inputClassName="text-left font-lato"
            />

            {/* Advanced Options Toggle */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-base font-lato text-mte-charcoal hover:text-mte-blue underline transition-colors"
              >
                {showAdvancedOptions ? "Hide" : "View state and national-level data"}
              </button>
            </div>

            {/* Advanced Region Selection - SIMPLIFIED: No nested USA dropdown */}
            {showAdvancedOptions && (
              <div className="mt-4 space-y-3">
                <div className="bg-white/80 backdrop-blur rounded-xl border border-mte-light-grey p-4 shadow-mte-card">
                  <h3 className="text-base font-lato font-bold text-mte-black mb-3 text-center">
                    Or explore by region:
                  </h3>
                  
                  {/* National Option */}
                  <button
                    onClick={handleNationalSelect}
                    className="w-full mb-3 px-4 py-3 bg-white rounded-lg border border-mte-light-grey text-left hover:bg-mte-blue-20 hover:border-mte-blue transition-colors"
                  >
                    <div className="font-lato font-semibold text-mte-black">United States</div>
                    <div className="text-sm font-lato text-mte-charcoal">View national statistics</div>
                  </button>

                  {/* State Options - Direct list, no nesting */}
                  <div className="space-y-2">
                    <div className="text-sm font-lato font-semibold text-mte-charcoal mb-2">Select a state:</div>
                    {Object.entries(stateData).map(([stateId, state]) => (
                      <button
                        key={stateId}
                        onClick={() => handleStateSelect(stateId, state.name)}
                        className="w-full px-4 py-2 bg-white rounded-lg border border-mte-light-grey text-left hover:bg-mte-blue-20 hover:border-mte-blue transition-colors"
                      >
                        <div className="font-lato font-semibold text-mte-black">{state.name}</div>
                        <div className="text-sm font-lato text-mte-charcoal">
                          {state.totalChildren.toLocaleString()} children in care
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA - Single Button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 md:bottom-6 z-10 flex justify-center px-2 md:px-4">
          <button
            type="button"
            onClick={() => onSelectRegion?.({ level: 'national', id: 'usa', name: 'United States', view: 'organizational' })}
            className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base md:text-lg font-lato font-semibold text-white bg-mte-blue shadow-mte-card hover:bg-mte-blue-80 focus:outline-none focus:ring-2 focus:ring-mte-blue focus:ring-offset-2 transition-colors"
          >
            Explore the map <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}