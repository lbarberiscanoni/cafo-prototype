import React from "react";

// Assets
import ChartsIcon from "./assets/Charts.png";
import ChurchIcon from "./assets/church_icon.png";
import HistoryIcon from "./assets/HistoryArrow.png";
import DownloadIcon from "./assets/download_icon.png";

export default function TopNav({ currentView, currentRegion, selectedRegion, onSelectRegion, onSwitchView }) {
  const navButtons = [
    { id: "metric", label: "Metrics", icon: ChartsIcon },
    { id: "organizational", label: "Organizations", icon: ChurchIcon },
    { id: "historic", label: "Historic Data", icon: HistoryIcon },
    { id: "download", label: "Download Data", icon: DownloadIcon },
  ];

  // Hide historic button on national view
  const visibleNavButtons = currentRegion === "national" 
    ? navButtons.filter(btn => btn.id !== "historic")
    : navButtons;

  const handleNationalView = () => {
    onSelectRegion({ level: "national", id: "usa", name: "United States" });
    onSwitchView("organizational");
  };

  const handleStateView = () => {
    // Determine which state to navigate to based on current region
    let stateId = "alabama"; // default fallback
    let stateName = "Alabama";
    let stateCode = "AL";
    
    if (currentRegion === "county" && selectedRegion?.id) {
      // Extract state code from county ID (format: "countyname-statecode")
      const parts = selectedRegion.id.split('-');
      stateCode = parts[parts.length - 1]?.toUpperCase();
      
      // Complete map of state codes to state names and IDs
      const stateCodeToName = {
        'AL': { name: 'Alabama', id: 'alabama' },
        'AK': { name: 'Alaska', id: 'alaska' },
        'AZ': { name: 'Arizona', id: 'arizona' },
        'AR': { name: 'Arkansas', id: 'arkansas' },
        'CA': { name: 'California', id: 'california' },
        'CO': { name: 'Colorado', id: 'colorado' },
        'CT': { name: 'Connecticut', id: 'connecticut' },
        'DE': { name: 'Delaware', id: 'delaware' },
        'FL': { name: 'Florida', id: 'florida' },
        'GA': { name: 'Georgia', id: 'georgia' },
        'HI': { name: 'Hawaii', id: 'hawaii' },
        'ID': { name: 'Idaho', id: 'idaho' },
        'IL': { name: 'Illinois', id: 'illinois' },
        'IN': { name: 'Indiana', id: 'indiana' },
        'IA': { name: 'Iowa', id: 'iowa' },
        'KS': { name: 'Kansas', id: 'kansas' },
        'KY': { name: 'Kentucky', id: 'kentucky' },
        'LA': { name: 'Louisiana', id: 'louisiana' },
        'ME': { name: 'Maine', id: 'maine' },
        'MD': { name: 'Maryland', id: 'maryland' },
        'MA': { name: 'Massachusetts', id: 'massachusetts' },
        'MI': { name: 'Michigan', id: 'michigan' },
        'MN': { name: 'Minnesota', id: 'minnesota' },
        'MS': { name: 'Mississippi', id: 'mississippi' },
        'MO': { name: 'Missouri', id: 'missouri' },
        'MT': { name: 'Montana', id: 'montana' },
        'NE': { name: 'Nebraska', id: 'nebraska' },
        'NV': { name: 'Nevada', id: 'nevada' },
        'NH': { name: 'New Hampshire', id: 'new-hampshire' },
        'NJ': { name: 'New Jersey', id: 'new-jersey' },
        'NM': { name: 'New Mexico', id: 'new-mexico' },
        'NY': { name: 'New York', id: 'new-york' },
        'NC': { name: 'North Carolina', id: 'north-carolina' },
        'ND': { name: 'North Dakota', id: 'north-dakota' },
        'OH': { name: 'Ohio', id: 'ohio' },
        'OK': { name: 'Oklahoma', id: 'oklahoma' },
        'OR': { name: 'Oregon', id: 'oregon' },
        'PA': { name: 'Pennsylvania', id: 'pennsylvania' },
        'RI': { name: 'Rhode Island', id: 'rhode-island' },
        'SC': { name: 'South Carolina', id: 'south-carolina' },
        'SD': { name: 'South Dakota', id: 'south-dakota' },
        'TN': { name: 'Tennessee', id: 'tennessee' },
        'TX': { name: 'Texas', id: 'texas' },
        'UT': { name: 'Utah', id: 'utah' },
        'VT': { name: 'Vermont', id: 'vermont' },
        'VA': { name: 'Virginia', id: 'virginia' },
        'WA': { name: 'Washington', id: 'washington' },
        'WV': { name: 'West Virginia', id: 'west-virginia' },
        'WI': { name: 'Wisconsin', id: 'wisconsin' },
        'WY': { name: 'Wyoming', id: 'wyoming' },
      };
      
      const stateInfo = stateCodeToName[stateCode];
      if (stateInfo) {
        stateId = stateInfo.id;
        stateName = stateInfo.name;
      }
    } else if (currentRegion === "state" && selectedRegion?.id) {
      // Already at state level, use current state
      stateId = selectedRegion.id;
      stateName = selectedRegion.name;
    }
    
    onSelectRegion({ level: "state", id: stateId, name: stateName, code: stateCode });
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
        {visibleNavButtons.map((btn) => (
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