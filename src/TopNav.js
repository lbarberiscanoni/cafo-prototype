import React from "react";
import Region_Menu from "./Region_Menu";

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

  return (
    <div className="py-3 px-4 flex justify-between items-center relative ]">

      {/* Region Menu */}
      <Region_Menu onSelectRegion={onSelectRegion} onSwitchView={onSwitchView} />

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {navButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onSwitchView(btn.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm shadow 
              ${
                currentView === btn.id
                  ? "bg-gray-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            <img src={btn.icon} alt={btn.label} className="w-5 h-5" />
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
