import React from "react";
import { nationalStats, stateData, countyData } from "./real-data.js";

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
      
      // Extract state code from county ID (format: "countyname-statecode")
      const parts = countyId?.split('-') || [];
      const stateCode = parts[parts.length - 1]?.toLowerCase();
      const stateName = county?.state || stateCode || 'state';
      regionName = stateName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '_all_counties';
      
      // Get all counties in this state
      const stateCounties = Object.entries(countyData)
        .filter(([id]) => id.split('-').pop() === stateCode)
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));
      
      if (stateCounties.length > 0) {
        rows.push([
          '"County"', '"Population"', '"Total Churches"', '"Children in Care"',
          '"Children in Family Foster"', '"Children in Kinship"', '"Children Out of County"',
          '"Licensed Homes"', '"Licensed Homes per Child"', '"Children Waiting for Adoption"',
          '"Children Adopted (2024)"', '"Avg Months to Adoption"', '"Family Preservation Cases"',
          '"Reunification Rate (%)"', '"Churches Providing Support"'
        ].join(','));
        
        stateCounties.forEach(([id, c]) => {
          rows.push([
            `"${c.name}"`,
            c.population ?? 'N/A',
            c.totalChurches ?? 'N/A',
            c.childrenInCare ?? 'N/A',
            c.childrenInFamily ?? 'N/A',
            c.childrenInKinship ?? 'N/A',
            c.childrenOutOfCounty ?? 'N/A',
            c.licensedHomes ?? 'N/A',
            c.licensedHomesPerChild ?? 'N/A',
            c.waitingForAdoption ?? 'N/A',
            c.childrenAdopted2024 ?? 'N/A',
            c.avgMonthsToAdoption ?? 'N/A',
            c.familyPreservationCases ?? 'N/A',
            c.reunificationRate ?? 'N/A',
            c.churchesProvidingSupport ?? 'N/A'
          ].join(','));
        });
      } else {
        rows.push(['Error', 'No county data found for this state'].join(','));
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
    <div className="py-2 md:py-3 px-2 md:px-4 flex justify-between items-center gap-2 relative">
      {/* Left side: Home + Region Buttons */}
      <div className="flex gap-1 md:gap-2 flex-shrink-0">
        {/* Home button - icon only on mobile */}
        <button
          onClick={handleReturnHome}
          className="p-2 md:px-3 md:py-2 bg-white text-mte-charcoal border border-mte-blue rounded shadow-mte-card hover:bg-mte-blue-20 text-sm md:text-base font-lato transition-colors flex items-center gap-1.5"
          title="Home"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 text-mte-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="hidden md:inline">Home</span>
        </button>
        {/* National - icon + abbreviated text on mobile */}
        <button
          onClick={handleNationalView}
          className="p-2 md:px-3 md:py-2 bg-white border border-mte-light-grey rounded shadow-mte-card hover:bg-mte-blue-20 text-sm md:text-base font-lato text-mte-charcoal transition-colors flex items-center gap-1.5"
          title="National Map View"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">National</span>
          <span className="hidden md:inline">&nbsp;Map View</span>
        </button>
        {/* State - icon + abbreviated text on mobile */}
        <button
          onClick={handleStateView}
          className="p-2 md:px-3 md:py-2 bg-white border border-mte-light-grey rounded shadow-mte-card hover:bg-mte-blue-20 text-sm md:text-base font-lato text-mte-charcoal transition-colors flex items-center gap-1.5"
          title="State Map View"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="hidden sm:inline">State</span>
          <span className="hidden md:inline">&nbsp;Map View</span>
        </button>
      </div>

      {/* Right side: View Toggle Buttons - icon-only on mobile */}
      <div className="flex gap-1 md:gap-3">
        {visibleNavButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleNavClick(btn.id)}
            className={`flex items-center gap-1.5 p-2 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-lato font-medium shadow-mte-card transition-colors
              ${
                currentView === btn.id
                  ? "bg-mte-blue text-white hover:bg-mte-blue-80"
                  : "bg-white text-mte-charcoal hover:bg-mte-blue-20"
              }`}
            title={btn.label}
          >
            <img src={btn.icon} alt={btn.label} className="w-5 h-5" style={{
              filter: currentView === btn.id ? 'brightness(0) invert(1)' : 'none'
            }} />
            <span className="hidden md:inline">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}