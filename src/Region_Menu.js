import React, { useState, useRef, useEffect } from "react";
import { stateData, countyData } from "./mock-data";

export default function Region_Menu({ onSelectRegion, onSwitchView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openState, setOpenState] = useState(null);
  const menuRef = useRef(null);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setOpenState(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFinalSelect = (level, id, name) => {
    if (level === "national") {
      onSelectRegion({ level, id, name: "United States" });
      onSwitchView("metric");
    } else {
      onSelectRegion({ level, id, name });
      onSwitchView("metric");
    }
    setMenuOpen(false);
    setOpenState(null);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="px-3 py-2 bg-white border rounded shadow-sm hover:bg-gray-50"
      >
        Choose Region
      </button>

      {menuOpen && (
        <ul className="absolute mt-2 bg-white border rounded-md shadow-lg z-20 min-w-[220px] text-left">
          {/* National/All States Option */}
          <li
            className="px-4 py-2 cursor-pointer hover:bg-blue-100 rounded"
            onClick={() => handleFinalSelect("national", "usa", "United States")}
          >
            All States
          </li>

          {/* Individual States */}
          {Object.entries(stateData).map(([stateId, state]) => (
            <li key={stateId}>
              <div
                className="px-4 py-2 cursor-pointer hover:bg-blue-100 flex justify-between items-center rounded"
                onClick={() =>
                  setOpenState(openState === stateId ? null : stateId)
                }
              >
                {state.name}
                <span
                  className={`ml-2 text-gray-500 transform transition-transform ${
                    openState === stateId ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </div>

              {/* Counties for this state */}
              {openState === stateId && (
                <ul className="bg-white border-t border-gray-200 rounded-md ml-4">
                  <li
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100 rounded"
                    onClick={() =>
                      handleFinalSelect("state", stateId, state.name)
                    }
                  >
                    All Counties
                  </li>
                  {Object.entries(countyData)
                    .filter(([, county]) => county.state === state.name)
                    .map(([countyId, county]) => (
                      <li
                        key={countyId}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-100 rounded"
                        onClick={() =>
                          handleFinalSelect("county", countyId, county.name)
                        }
                      >
                        {county.name}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}