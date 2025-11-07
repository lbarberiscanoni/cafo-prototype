import React from "react";

// Assets
import ChartsIcon from "./assets/Charts.png";
import ChurchIcon from "./assets/church_icon.png";
import HistoryIcon from "./assets/HistoryArrow.png";
import DownloadIcon from "./assets/download_icon.png";

export default function TopNav({ currentView, onSelectRegion, onSwitchView }) {
  const navButtons = [
    { id: "metric", label: "Metrics", icon: ChartsIcon },
    { id: "organizational", label: "Organizations", icon: ChurchIcon },
    { id: "historic", label: "Historic Data", icon: HistoryIcon },
    { id: "download", label: "Download Data", icon: DownloadIcon },
  ];

  const handleNationalView = () => {
    onSelectRegion({ level: "national", id: "usa", name: "United States" });
    onSwitchView("organizational"); // or whatever default view you prefer
  };

  const handleStateView = () => {
    // You might want to make this dynamic based on current context
    // For now, defaulting to Alabama, but you could pass current state
    onSelectRegion({ level: "state", id: "alabama", name: "Alabama" });
    onSwitchView("organizational");
  };

  return (
    <div className="py-2 md:py-3 px-2 md:px-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-0 relative">
      {/* Map View Buttons */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={handleNationalView}
          className="px-3 py-2 bg-white border border-mte-light-grey rounded shadow-mte-card hover:bg-mte-blue-20 text-sm md:text-base font-lato text-mte-charcoal transition-colors whitespace-nowrap"
        >
          National Map View
        </button>
        <button
          onClick={handleStateView}
          className="px-3 py-2 bg-white border border-mte-light-grey rounded shadow-mte-card hover:bg-mte-blue-20 text-sm md:text-base font-lato text-mte-charcoal transition-colors whitespace-nowrap"
        >
          State Map View
        </button>
      </div>

      {/* Navigation Buttons - Horizontal scroll on mobile */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0">
        {navButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onSwitchView(btn.id)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-lato font-medium shadow-mte-card transition-colors whitespace-nowrap
              ${
                currentView === btn.id
                  ? "bg-mte-blue text-white hover:bg-mte-blue-80"
                  : "bg-white text-mte-charcoal hover:bg-mte-blue-20"
              }`}
          >
            <img src={btn.icon} alt={btn.label} className="w-4 h-4 md:w-5 md:h-5" style={{
              filter: currentView === btn.id ? 'brightness(0) invert(1)' : 'none'
            }} />
            <span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}