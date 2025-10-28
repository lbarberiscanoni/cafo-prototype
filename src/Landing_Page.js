import React, { useMemo, useState } from "react";
import MTELogo from "./assets/MTE_Logo.png";
import USMap from "./assets/United_States.png";
import MapPin from "./assets/Map_Pin_icon.png";
import CountySelect from "./CountySelect";
import { countyData, stateData } from "./mock-data";

const STATE_ABBR = { Alabama: "AL", "New York": "NY" };

export default function LandingPage({ onSelectRegion, onExploreMap }) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const countyOptions = useMemo(() => {
    return Object.entries(countyData)
      .map(([id, c]) => {
        const abbr = STATE_ABBR[c.state] ?? c.state;
        const base = c.name.includes(",") ? c.name.split(",")[0].trim() : c.name;
        return { id, label: `${base}, ${abbr}`, data: c };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
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
      style={{ backgroundColor: "rgba(2,173,238,0.16)" }}
    >
      {/* Map with better definition and state outlines visible */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-20" />
        <img
          src={USMap}
          alt="US map background"
          className="absolute left-1/2 top-[7.5rem] -translate-x-1/2 object-contain"
          style={{
            width: "110%",
            height: "110%",
            filter: "grayscale(100%) brightness(1.3) contrast(0.9)",
          }}
        />
        <div className="absolute inset-0 bg-white/20" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-28 pt-6">
        {/* Logo */}
        <img src={MTELogo} alt="More Than Enough logo" className="h-9 w-auto object-contain mt-1 self-center" />

        {/* Main Content Area - Centered on Map */}
        <div className="flex-1 flex flex-col justify-center items-center min-h-0">
          {/* Title - Centered responsively */}
          <h1 className="text-center text-[1.6rem] md:text-[1.9rem] font-extrabold leading-tight tracking-tight text-gray-900">
            Foster Care <span className="text-[#02ADEE]">Where You Live</span>
          </h1>

          <p className="mt-2 text-center text-lg text-gray-800">
            Explore the data and connect to local organizations
          </p>

          {/* County Selection */}
          <div className="mt-10 w-full max-w-2xl">
            <div className="mb-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <img src={MapPin} alt="" className="h-9 w-9 opacity-90" aria-hidden />
                <div className="text-[1.5rem] font-semibold text-gray-900 text-center">
                  What county do you live in?
                </div>
              </div>
              <div className="text-sm text-gray-600 text-center">
                County or county equivalent
              </div>
            </div>

            <CountySelect
              options={countyOptions}
              placeholder="Select a county"
              onChange={handleCountyChange}
              containerClassName="w-full"
              controlClassName="w-full rounded-xl border border-black/10 bg-white/80 backdrop-blur px-4 py-3 text-left shadow-sm focus-within:ring-2 focus-within:ring-[#02ADEE]"
              menuClassName="rounded-xl border border-black/10 bg-white/95 shadow-lg overflow-hidden"
              optionClassName="px-4 py-2 text-left hover:bg-[#02ADEE] hover:text-white"
              inputClassName="text-left"
            />

            {/* Advanced Options Toggle */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-gray-600 hover:text-[#02ADEE] underline"
              >
                {showAdvancedOptions ? "Hide" : "Show"} state and national options
              </button>
            </div>

            {/* Advanced Region Selection */}
            {showAdvancedOptions && (
              <div className="mt-4 space-y-3">
                <div className="bg-white/80 backdrop-blur rounded-xl border border-black/10 p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                    Or explore by region:
                  </h3>
                  
                  {/* National Option */}
                  <button
                    onClick={handleNationalSelect}
                    className="w-full mb-3 px-4 py-3 bg-white rounded-lg border border-gray-200 text-left hover:bg-gray-50 hover:border-[#02ADEE] transition-colors"
                  >
                    <div className="font-medium text-gray-900">United States</div>
                    <div className="text-sm text-gray-600">View national statistics</div>
                  </button>

                  {/* State Options */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Select a state:</div>
                    {Object.entries(stateData).map(([stateId, state]) => (
                      <button
                        key={stateId}
                        onClick={() => handleStateSelect(stateId, state.name)}
                        className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 text-left hover:bg-gray-50 hover:border-[#02ADEE] transition-colors"
                      >
                        <div className="font-medium text-gray-900">{state.name}</div>
                        <div className="text-xs text-gray-500">
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

        {/* CTA */}
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-4 rounded-2xl bg-white/90 backdrop-blur p-4 shadow-lg ring-1 ring-black/5">
            <div className="flex items-center gap-3 text-gray-800">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path fill="currentColor" d="M9 3 4 5v16l5-2 6 2 5-2V3l-5 2-6-2ZM9 5l6 2v12l-6-2V5Z" />
              </svg>
              <span className="text-sm sm:text-base">
                Want to explore multiple counties or states?
              </span>
            </div>
            <button
              type="button"
              onClick={() => onExploreMap?.()}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: "#02ADEE" }}
            >
              Explore the map <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}