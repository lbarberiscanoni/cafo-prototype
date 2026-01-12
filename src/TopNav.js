import React from "react";
import { nationalStats, stateData, countyData } from "./real-data.js";

// Assets
import ChartsIcon from "./assets/Charts.png";
import ChurchIcon from "./assets/church_icon.png";
import HistoryIcon from "./assets/HistoryArrow.png";
import DownloadIcon from "./assets/download_icon.png";
import MTELogo from "./assets/MTE_Logo.png";

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

  // Download data as CSV based on current region
  const handleDownloadData = () => {
    const rows = [];
    let regionName = "data";
    
    if (currentRegion === 'national') {
      regionName = "united_states";
      rows.push(['Metric', 'Value'].join(','));
      rows.push(['"Children in Care"', nationalStats.childrenInCare ?? 'N/A'].join(','));
      rows.push(['"Children in Family Foster Care"', nationalStats.childrenInFamilyFoster ?? 'N/A'].join(','));
      rows.push(['"Children in Kinship Care"', nationalStats.childrenInKinship ?? 'N/A'].join(','));
      rows.push(['"Children Waiting for Adoption"', nationalStats.childrenWaitingAdoption ?? 'N/A'].join(','));
      rows.push(['"Children Adopted (2023)"', nationalStats.childrenAdopted2023 ?? 'N/A'].join(','));
      rows.push(['"Total Churches"', nationalStats.totalChurches ?? 'N/A'].join(','));
      rows.push(['"Churches with Foster Ministry"', nationalStats.churchesWithMinistry ?? 'N/A'].join(','));
    } else if (currentRegion === 'state') {
      const stateId = selectedRegion?.id;
      const state = stateData[stateId];
      regionName = (state?.name || stateId || 'state').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      if (state) {
        rows.push(['Metric', 'Value'].join(','));
        rows.push(['"State"', `"${state.name}"`].join(','));
        rows.push(['"Total Children in Care"', state.totalChildren ?? 'N/A'].join(','));
        rows.push(['"Licensed Homes"', state.licensedHomes ?? 'N/A'].join(','));
        rows.push(['"Children Waiting for Adoption"', state.waitingForAdoption ?? 'N/A'].join(','));
        rows.push(['"Reunification Rate (%)"', state.reunificationRate ?? 'N/A'].join(','));
        rows.push(['"Family Preservation Cases"', state.familyPreservationCases ?? 'N/A'].join(','));
      } else {
        rows.push(['Error', 'State data not found'].join(','));
      }
    } else if (currentRegion === 'county') {
      const countyId = selectedRegion?.id;
      const county = countyData[countyId];
      regionName = (county?.name || countyId || 'county').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      if (county) {
        rows.push(['Metric', 'Value'].join(','));
        rows.push(['"County"', `"${county.name}"`].join(','));
        rows.push(['"Population"', county.population ?? 'N/A'].join(','));
        rows.push(['"Total Churches"', county.totalChurches ?? 'N/A'].join(','));
        rows.push(['"Children in Care"', county.childrenInCare ?? 'N/A'].join(','));
        rows.push(['"Children in Family Foster"', county.childrenInFamily ?? 'N/A'].join(','));
        rows.push(['"Children in Kinship"', county.childrenInKinship ?? 'N/A'].join(','));
        rows.push(['"Children Out of County"', county.childrenOutOfCounty ?? 'N/A'].join(','));
        rows.push(['"Licensed Homes"', county.licensedHomes ?? 'N/A'].join(','));
        rows.push(['"Licensed Homes per Child"', county.licensedHomesPerChild ?? 'N/A'].join(','));
        rows.push(['"Children Waiting for Adoption"', county.waitingForAdoption ?? 'N/A'].join(','));
        rows.push(['"Children Adopted (2024)"', county.childrenAdopted2024 ?? 'N/A'].join(','));
        rows.push(['"Avg Months to Adoption"', county.avgMonthsToAdoption ?? 'N/A'].join(','));
        rows.push(['"Family Preservation Cases"', county.familyPreservationCases ?? 'N/A'].join(','));
        rows.push(['"Reunification Rate (%)"', county.reunificationRate ?? 'N/A'].join(','));
        rows.push(['"Churches Providing Support"', county.churchesProvidingSupport ?? 'N/A'].join(','));
      } else {
        rows.push(['Error', 'County data not found'].join(','));
      }
    }
    
    // Create and download the file
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mte_data_${regionName}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReturnHome = () => {
    onSelectRegion({ level: "landing", id: null, name: null });
  };

  const handleNationalView = () => {
    onSelectRegion({ level: "national", id: "usa", name: "United States" });
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
  };

  const handleNavClick = (btnId) => {
    if (btnId === "download") {
      handleDownloadData();
    } else {
      onSwitchView(btnId);
    }
  };

  return (
    <div className="py-2 md:py-3 px-2 md:px-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-0 relative">
      {/* Left side: Return Home + Map View Buttons */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={handleReturnHome}
          className="px-3 py-2 bg-mte-blue text-white border border-mte-blue rounded shadow-mte-card hover:bg-mte-blue-80 text-sm md:text-base font-lato transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <img src={MTELogo} alt="Home" className="w-4 h-4 md:w-5 md:h-5" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="hidden sm:inline">Home</span>
        </button>
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
            onClick={() => handleNavClick(btn.id)}
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