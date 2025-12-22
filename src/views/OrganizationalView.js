import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import data from mock-data
import { countyData, countyCoordinatesByState, stateCoordinates, stateNameToCode } from "../real-data.js";

// Assets
import MTELogo from "../assets/MTE_Logo.png";

// Impact Area Icons
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";

// Organization category color mapping
const CATEGORY_COLORS = {
  "Bridge Ministry": { bg: "bg-mte-yellow-20", text: "text-mte-black", border: "border-mte-yellow", dot: "#e7d151" },
  "Service Organization": { bg: "bg-mte-green-20", text: "text-mte-black", border: "border-mte-green", dot: "#4aa456" },
  "Church Ministry": { bg: "bg-mte-charcoal-20", text: "text-mte-black", border: "border-mte-charcoal", dot: "#5c5d5f" },
  "Government": { bg: "bg-mte-orange-20", text: "text-mte-black", border: "border-mte-orange", dot: "#dc6a42" },
  "Placement Agency": { bg: "bg-mte-purple-20", text: "text-mte-black", border: "border-mte-purple", dot: "#882781" },
};

// Local network definitions
const LOCAL_NETWORKS = {
  network1: {
    name: "Local Network 1",
    organizations: ["Bridge Ministry", "Hope Family Services", "Grace Church Foster Ministry"],
    color: "#882781",
    center: [0.002, -0.005],
    radius: 800
  },
  network2: {
    name: "Local Network 2",
    organizations: ["Community Support Network", "Children First Placement", "Family Connect Services"],
    color: "#dc6a42",
    center: [-0.003, -0.001],
    radius: 600
  }
};

// Function to generate mock organizations dynamically based on county location
const generateCountyOrgs = (centerCoords, countyName = "County", stateCode = "XX") => {
  const [centerLat, centerLng] = centerCoords;
  
  // Helper to generate coordinates near the center
  const offsetCoord = (base, offsetLat, offsetLng) => [
    base[0] + offsetLat,
    base[1] + offsetLng
  ];
  
  // Generate a pseudo-random but consistent zip code based on coordinates
  const generateZip = (lat, lng, index) => {
    const hash = Math.abs(Math.floor((lat + lng) * 10000 + index));
    return String(hash).slice(-5).padStart(5, '0');
  };
  
  // Generate area code based on state code (simplified)
  const getAreaCode = (stateCode) => {
    const areaCodes = {
      'NY': '516', 'AL': '334', 'CA': '415', 'TX': '512', 'FL': '305',
      'PA': '215', 'OH': '216', 'IL': '312', 'MI': '313', 'GA': '404',
    };
    return areaCodes[stateCode] || '555';
  };
  
  const areaCode = getAreaCode(stateCode);
  const cleanCountyName = countyName.replace(/\s+County.*$/, '').trim();
  
  return [
    {
      name: "Bridge Ministry",
      category: "Bridge Ministry",
      description: "Supporting foster families through faith-based community connections and practical assistance.",
      focus: ["Foster and Kinship Families", "Wraparound"],
      location: `${countyName} - ${generateZip(centerLat, centerLng, 0)}`,
      phone: `${areaCode}-456-7891`,
      email: `info@${cleanCountyName.toLowerCase().replace(/\s+/g, '')}bridgeministry.org`,
      coords: offsetCoord(centerCoords, 0.00061, -0.000242),
      connections: ["Hope Family Services", "Grace Church Foster Ministry"],
    },
    {
      name: "Hope Family Services",
      category: "Service Organization",
      description: "Comprehensive family support organization providing resources and counseling for all family types.",
      focus: ["Adoptive", "Wraparound", "Biological"],
      location: `${countyName} - ${generateZip(centerLat, centerLng, 1)}`,
      phone: `${areaCode}-456-7892`,
      email: `info@${cleanCountyName.toLowerCase().replace(/\s+/g, '')}hope.org`,
      coords: offsetCoord(centerCoords, 0.002, -0.005),
      connections: ["Community Support Network", "Family Connect Services"],
    },
    {
      name: "Community Support Network",
      category: "Government",
      description: "Government-funded community organization providing wraparound services and family support.",
      focus: ["Foster and Kinship Families", "Wraparound"],
      location: `${countyName} - ${generateZip(centerLat, centerLng, 2)}`,
      phone: `${areaCode}-456-7893`,
      email: `info@${cleanCountyName.toLowerCase().replace(/\s+/g, '')}community.org`,
      coords: offsetCoord(centerCoords, -0.002, -0.005),
      connections: ["Children First Placement"],
    },
    {
      name: "Grace Church Foster Ministry",
      category: "Church Ministry",
      description: "Local church providing comprehensive support for foster families in the community.",
      focus: ["Foster and Kinship Families", "Wraparound"],
      location: `${countyName} - ${generateZip(centerLat, centerLng, 3)}`,
      phone: `${areaCode}-555-0123`,
      email: `foster@gracechurch.org`,
      coords: offsetCoord(centerCoords, 0.005, 0.01),
      connections: ["Family Connect Services"],
    },
    {
      name: "Children First Placement",
      category: "Placement Agency",
      description: "Licensed placement agency specializing in matching children with loving families.",
      focus: ["Adoptive", "Foster and Kinship Families"],
      location: `${countyName} - ${generateZip(centerLat, centerLng, 4)}`,
      phone: `${areaCode}-555-0456`,
      email: `placements@childrenfirst.org`,
      coords: offsetCoord(centerCoords, 0.010, 0.015),
      connections: ["Hope Family Services"],
    },
    {
      name: "Family Connect Services",
      category: "Service Organization",
      description: "Comprehensive family support services including counseling and resources.",
      focus: ["Biological", "Wraparound"],
      location: `${countyName} - ${generateZip(centerLat, centerLng, 5)}`,
      phone: `${areaCode}-555-0789`,
      email: `connect@familyservices.org`,
      coords: offsetCoord(centerCoords, -0.005, -0.01),
      connections: [],
    },
  ];
};

// Create custom dot icons based on category
const createDotIcon = (category, size = "16px") => {
  const color = CATEGORY_COLORS[category]?.dot || "#00ADEE";
  return new L.DivIcon({
    className: "custom-dot",
    html: `<div style="width:${size}; height:${size}; background:${color}; border:2px solid white; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor:pointer;"></div>`,
    iconSize: [parseInt(size), parseInt(size)],
  });
};

// Create clickable state text label - embedded style for national map
const createStateTextLabel = (stateCode) => {
  // Responsive scaling based on screen width
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  let fontSize;
  
  if (isMobile) {
    fontSize = '11px';
  } else if (isTablet) {
    fontSize = '13px';
  } else {
    fontSize = '15px';
  }
  
  return new L.DivIcon({
    className: "state-text-label-embedded",
    html: `<div style="
      font-family: 'Lato', sans-serif;
      font-weight: 700;
      font-size: ${fontSize};
      color: #5c5d5f;
      text-align: center;
      cursor: pointer;
      user-select: none;
      text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8);
      transition: all 0.15s ease;
    " onmouseover="this.style.color='#02ADEE'; this.style.transform='scale(1.1)';" onmouseout="this.style.color='#5c5d5f'; this.style.transform='scale(1)';">${stateCode}</div>`,
    iconSize: [40, 20],
    iconAnchor: [20, 10],
  });
};

// Create clickable county text label with elevated card design - FULL NAME
const createCountyTextLabel = (countyName) => {
  // Display full county name
  const displayName = countyName;
  
  // Responsive scaling based on screen width
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  // Calculate font size based on name length and device
  let fontSize, padding, borderWidth;
  
  if (isMobile) {
    // Mobile: smaller overall
    fontSize = countyName.length > 12 ? '7px' : countyName.length > 8 ? '8px' : '9px';
    padding = '3px 5px 5px 5px';
    borderWidth = '2px';
  } else if (isTablet) {
    // Tablet: medium
    fontSize = countyName.length > 12 ? '8px' : countyName.length > 8 ? '9px' : '10px';
    padding = '3px 6px 6px 6px';
    borderWidth = '2.5px';
  } else {
    // Desktop: full size
    fontSize = countyName.length > 12 ? '9px' : countyName.length > 8 ? '10px' : '11px';
    padding = '4px 8px 8px 8px';
    borderWidth = '3px';
  }
  
  return new L.DivIcon({
    className: "county-text-label",
    html: `<div style="
      font-family: 'Lato', sans-serif;
      font-weight: 600;
      font-size: ${fontSize};
      color: #5c5d5f;
      text-align: center;
      cursor: pointer;
      user-select: none;
      padding: ${padding};
      background: #ffffff;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      white-space: nowrap;
      transition: all 0.15s ease;
      border-bottom: ${borderWidth} solid #02ADEE;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 10px rgba(0, 0, 0, 0.18)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.12)';">${displayName}</div>`,
    iconSize: null, // Auto-size to content
    iconAnchor: null, // Auto-center
  });
};

export default function OrganizationalView({ regionLevel, regionId, onSelectRegion, selectedRegion }) {
  const [selectedCategories, setSelectedCategories] = useState(Object.keys(CATEGORY_COLORS));
  const [selectedImpactAreas, setSelectedImpactAreas] = useState(["Foster and Kinship Families", "Adoptive", "Biological", "Wraparound"]);
  const [showConnectionLines, setShowConnectionLines] = useState(true);
  const [showLocalNetworks, setShowLocalNetworks] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState(null); // null = show all, 'network1' or 'network2' = show only that network
  const [mapKey, setMapKey] = useState(0); // Force map remount when region changes

  // Update map when region changes
  React.useEffect(() => {
    setMapKey(prev => prev + 1);
    setSelectedNetwork(null); // Reset network selection when region changes
  }, [regionLevel, regionId]);

  // Get display name based on region level - wrapped in useCallback
  const getDisplayName = useCallback(() => {
    switch (regionLevel) {
      case "national":
        return "United States of America";
      case "state":
        // Look up state name from regionId
        // regionId format: "alabama", "new-york", "california"
        const stateName = Object.keys(stateNameToCode).find(
          name => name.toLowerCase().replace(/\s+/g, '-') === regionId
        );
        return stateName || "Unknown State";
      case "county":
        // For county, extract from full name or use regionId
        // regionId format: "nassau-ny", "butler-al"
        if (selectedRegion?.name) {
          return selectedRegion.name;
        }
        return "Unknown County";
      default:
        return "";
    }
  }, [regionLevel, regionId, selectedRegion]);

  const getSubtitle = () => {
    switch (regionLevel) {
      case "national":
        return "Explore foster care organizations across the country";
      case "state":
        return "Explore local organizations in this state";
      case "county":
        return "Explore local organizations and connections near you";
      default:
        return "";
    }
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleImpactAreaToggle = (impactArea) => {
    setSelectedImpactAreas(prev =>
      prev.includes(impactArea)
        ? prev.filter(area => area !== impactArea)
        : [...prev, impactArea]
    );
  };

  const handleConnectionLinesToggle = () => {
    setShowConnectionLines(prev => !prev);
  };

  const handleLocalNetworksToggle = () => {
    setShowLocalNetworks(prev => !prev);
  };

  const handleNetworkClick = (networkId) => {
    // Toggle network selection: if already selected, deselect; otherwise select it
    setSelectedNetwork(prev => prev === networkId ? null : networkId);
  };

  // Handler for when a state marker is clicked - STAY IN ORGANIZATIONAL VIEW
  const handleStateMarkerClick = (stateName) => {
    console.log('State marker clicked:', stateName);
    const stateId = stateName.toLowerCase().replace(/\s+/g, '-');
    const stateCode = stateNameToCode[stateName];
    
    if (onSelectRegion) {
      onSelectRegion({ 
        level: 'state', 
        id: stateId,
        name: stateName,
        code: stateCode,
        view: 'organizational' // Tell parent to stay in organizational view
      });
    }
  };

  // Handler for when a county marker is clicked - STAY IN ORGANIZATIONAL VIEW
  const handleCountyMarkerClick = (countyName) => {
    console.log('County marker clicked:', countyName);
    const displayName = getDisplayName();
    const stateCode = stateNameToCode[displayName];
    const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode?.toLowerCase()}`;
    
    if (onSelectRegion) {
      onSelectRegion({ 
        level: 'county', 
        id: countyId,
        name: `${countyName} County, ${displayName}`,
        view: 'organizational' // Tell parent to stay in organizational view
      });
    }
  };

  // Get appropriate map center and zoom based on level
  const getMapConfig = () => {
    switch (regionLevel) {
      case "national":
        return { center: [39.8283, -98.5795], zoom: 4 }; // Center of USA
      case "state":
        // Look up the state from regionId and get its coordinates
        const stateName = Object.keys(stateNameToCode).find(
          name => name.toLowerCase().replace(/\s+/g, '-') === regionId
        );
        const stateCoords = stateName ? stateCoordinates[stateName] : null;
        if (stateCoords) {
          return { center: stateCoords.coords, zoom: 7 };
        }
        // Fallback to Alabama if not found
        return { center: [32.806671, -86.791130], zoom: 7 };
      case "county":
        // Extract county name and state code from regionId (format: "nassau-ny", "butler-al")
        if (regionId && regionId.includes('-')) {
          const parts = regionId.split('-');
          const stateCode = parts[parts.length - 1]; // Last part is state code
          const countyName = parts.slice(0, -1).join('-'); // Everything before last part is county name
          
          // Find the state by code
          const stateName = Object.keys(stateNameToCode).find(
            name => stateNameToCode[name]?.toLowerCase() === stateCode.toLowerCase()
          );
          
          if (stateName) {
            const stateId = stateName.toLowerCase().replace(/\s+/g, '-');
            const countyCoords = countyCoordinatesByState[stateId];
            
            if (countyCoords) {
              // Find the county in this state's data
              const county = Object.keys(countyCoords).find(
                name => name.toLowerCase().replace(/\s+/g, '-') === countyName
              );
              
              if (county && countyCoords[county]) {
                return { center: countyCoords[county].coords, zoom: 13 }; // Increased from 11 to 13 for closer view
              }
            }
          }
        }
        
        // Fallback to Nassau County if lookup fails
        return { center: [40.73, -73.935], zoom: 13 }; // Increased from 11 to 13 for closer view
      default:
        return { center: [39.8283, -98.5795], zoom: 4 };
    }
  };

  const mapConfig = getMapConfig();
  
  // Generate organizations dynamically for county level
  const countyOrgs = React.useMemo(() => {
    if (regionLevel !== 'county') return [];
    
    const displayName = getDisplayName();
    // Extract county name without state
    const countyName = displayName.split(',')[0] || displayName;
    
    // Extract state code from regionId
    let stateCode = 'XX';
    if (regionId && regionId.includes('-')) {
      const parts = regionId.split('-');
      stateCode = parts[parts.length - 1].toUpperCase();
    }
    
    return generateCountyOrgs(mapConfig.center, countyName, stateCode);
  }, [regionLevel, regionId, mapConfig.center, getDisplayName]);

  // Filter organizations based on selected categories, impact areas, AND selected network
  const filteredOrgs = countyOrgs.filter(org => {
    const categoryMatch = selectedCategories.includes(org.category);
    const impactAreaMatch = org.focus.some(focus => selectedImpactAreas.includes(focus));
    
    // If a network is selected, only show organizations in that network
    if (selectedNetwork) {
      const networkOrgs = LOCAL_NETWORKS[selectedNetwork].organizations;
      const networkMatch = networkOrgs.includes(org.name);
      return categoryMatch && impactAreaMatch && networkMatch;
    }
    
    return categoryMatch && impactAreaMatch;
  });

  // Generate connection lines between organizations
  const generateConnectionLines = () => {
    const connectionLines = [];
    
    filteredOrgs.forEach(org => {
      if (org.connections && org.connections.length > 0) {
        org.connections.forEach(connectionName => {
          const targetOrg = filteredOrgs.find(target => target.name === connectionName);
          if (targetOrg) {
            connectionLines.push({
              from: org.coords,
              to: targetOrg.coords,
              fromName: org.name,
              toName: targetOrg.name,
              category: org.category
            });
          }
        });
      }
    });
    
    return connectionLines;
  };

  const connectionLines = showConnectionLines ? generateConnectionLines() : [];

  // Conditional rendering
  const showNationalMap = regionLevel === "national";
  const showStateMap = regionLevel === "state";
  const showCountyMap = regionLevel === "county";
  const showSidebar = true;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 pb-2 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4">
            {getDisplayName()}
          </h1>
          <p className="text-sm md:text-base text-mte-charcoal text-center mt-1 md:mt-2 px-4 font-lato">
            {getSubtitle()}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6 flex-grow w-full">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-full lg:w-1/4 space-y-4 md:space-y-4">
            {/* National: Jump selectors */}
            {showNationalMap && (
              <div className="bg-white p-4 rounded-lg shadow-mte-card space-y-3">
                {/* Jump to State Dropdown */}
                <select 
                  className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal"
                  value=""
                  onChange={(e) => {
                    if (e.target.value && onSelectRegion) {
                      const stateId = e.target.value;
                      const stateName = Object.keys(stateNameToCode).find(
                        name => name.toLowerCase().replace(/\s+/g, '-') === stateId
                      );
                      const stateCode = stateNameToCode[stateName];
                      onSelectRegion({ 
                        level: 'state', 
                        id: stateId,
                        name: stateName,
                        code: stateCode
                      });
                    }
                  }}
                >
                  <option value="">Jump to a State</option>
                  {Object.keys(stateNameToCode).sort().map(stateName => {
                    const stateId = stateName.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <option key={stateId} value={stateId}>
                        {stateName}
                      </option>
                    );
                  })}
                </select>
                
                {/* Jump to County Dropdown */}
                <select 
                  className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal"
                  value=""
                  onChange={(e) => {
                    if (e.target.value && onSelectRegion) {
                      const countyId = e.target.value;
                      const county = countyData[countyId];
                      if (county) {
                        onSelectRegion({ 
                          level: 'county', 
                          id: countyId,
                          name: county.name,
                          fips: county.fips
                        });
                      }
                    }
                  }}
                >
                  <option value="">Jump to a County</option>
                  {Object.keys(countyData).sort((a, b) => {
                    const nameA = countyData[a].name;
                    const nameB = countyData[b].name;
                    return nameA.localeCompare(nameB);
                  }).map(countyId => (
                    <option key={countyId} value={countyId}>
                      {countyData[countyId].name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Organization Categories */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-bold mb-1 text-mte-black font-lato">Organization Categories</h3>
              <p className="text-sm text-mte-charcoal mb-3 font-lato">Check categories to explore who is working in your community</p>
              <div className="space-y-2 text-base font-lato">
                {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    <div
                      className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`}
                    ></div>
                    <span className="text-mte-charcoal">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Impact Areas */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-bold mb-1 text-mte-black font-lato">Impact Areas</h3>
              <p className="text-sm text-mte-charcoal mb-3 font-lato">Check images to identify who is working in MTE's four impact areas</p>
              <div className="grid grid-cols-2 gap-3 text-base font-lato">
                <label className="flex flex-col items-center cursor-pointer">
                  <div className="relative">
                    <img src={FosterKinshipIcon} alt="Foster Kinship" className="w-10 h-10 mb-1" />
                    <input
                      type="checkbox"
                      checked={selectedImpactAreas.includes("Foster and Kinship Families")}
                      onChange={() => handleImpactAreaToggle("Foster and Kinship Families")}
                      className="absolute -top-1 -right-1 w-4 h-4"
                    />
                  </div>
                  <span className="text-center text-mte-charcoal text-sm">Foster & Kinship</span>
                </label>
                <label className="flex flex-col items-center cursor-pointer">
                  <div className="relative">
                    <img src={AdoptiveFamilyIcon} alt="Adoptive" className="w-10 h-10 mb-1" />
                    <input
                      type="checkbox"
                      checked={selectedImpactAreas.includes("Adoptive")}
                      onChange={() => handleImpactAreaToggle("Adoptive")}
                      className="absolute -top-1 -right-1 w-4 h-4"
                    />
                  </div>
                  <span className="text-center text-mte-charcoal text-sm">Adoptive</span>
                </label>
                <label className="flex flex-col items-center cursor-pointer">
                  <div className="relative">
                    <img src={BiologicalFamilyIcon} alt="Biological" className="w-10 h-10 mb-1" />
                    <input
                      type="checkbox"
                      checked={selectedImpactAreas.includes("Biological")}
                      onChange={() => handleImpactAreaToggle("Biological")}
                      className="absolute -top-1 -right-1 w-4 h-4"
                    />
                  </div>
                  <span className="text-center text-mte-charcoal text-sm">Biological</span>
                </label>
                <label className="flex flex-col items-center cursor-pointer">
                  <div className="relative">
                    <img src={WrapAroundIcon} alt="Wraparound" className="w-10 h-10 mb-1" />
                    <input
                      type="checkbox"
                      checked={selectedImpactAreas.includes("Wraparound")}
                      onChange={() => handleImpactAreaToggle("Wraparound")}
                      className="absolute -top-1 -right-1 w-4 h-4"
                    />
                  </div>
                  <span className="text-center text-mte-charcoal text-sm">Wraparound</span>
                </label>
              </div>
            </div>

            {/* Relationships - County only */}
            {showCountyMap && (
              <div className="bg-white p-4 rounded-lg shadow-mte-card">
                <h3 className="text-base font-bold mb-1 text-mte-black font-lato">Relationships</h3>
                <p className="text-sm text-mte-charcoal mb-3 font-lato">Display collaborations to see how organizations work together</p>
                <div className="space-y-2">
                  <label className={`w-full flex items-center justify-between px-3 py-2 rounded text-base font-lato cursor-pointer transition-colors ${
                    showConnectionLines ? 'bg-mte-blue text-white' : 'bg-mte-light-grey text-mte-charcoal hover:bg-mte-blue-20'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={showConnectionLines}
                        onChange={handleConnectionLinesToggle}
                      />
                      {showConnectionLines && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Connection Lines</span>
                    </div>
                  </label>
                  
                  <label className={`w-full flex items-center justify-between px-3 py-2 rounded text-base font-lato cursor-pointer transition-colors ${
                    showLocalNetworks ? 'bg-mte-blue text-white' : 'bg-mte-light-grey text-mte-charcoal hover:bg-mte-blue-20'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={showLocalNetworks}
                        onChange={handleLocalNetworksToggle}
                      />
                      {showLocalNetworks && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <span>Local Networks</span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map + Organizations */}
        <div className="w-full lg:w-3/4 flex flex-col gap-4 md:gap-6">
          {/* Leaflet Map for All Levels */}
          <div className="bg-white rounded-lg shadow-mte-card p-4">
            <MapContainer
              key={mapKey}
              center={mapConfig.center}
              zoom={mapConfig.zoom}
              style={{ height: "500px", width: "100%", borderRadius: "8px" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              
              {/* National Level: State Text Labels */}
              {showNationalMap && Object.entries(stateCoordinates).map(([stateName, data]) => (
                <Marker 
                  key={stateName}
                  position={data.coords}
                  icon={createStateTextLabel(stateNameToCode[stateName])}
                  eventHandlers={{
                    click: () => handleStateMarkerClick(stateName)
                  }}
                >
                  <Tooltip>
                    <div className="font-lato text-sm">
                      <strong>{stateName}</strong><br/>
                      {data.orgCount} Organizations
                    </div>
                  </Tooltip>
                </Marker>
              ))}

              {/* State Level: County Text Labels */}
              {showStateMap && (() => {
                const countyCoords = countyCoordinatesByState[regionId] || {};
                return Object.entries(countyCoords).map(([countyName, data]) => (
                  <Marker 
                    key={countyName}
                    position={data.coords}
                    icon={createCountyTextLabel(countyName)}
                    eventHandlers={{
                      click: () => handleCountyMarkerClick(countyName)
                    }}
                  >
                    <Tooltip>
                      <div className="font-lato text-sm">
                        <strong>{countyName} County</strong><br/>
                        {data.orgCount} Organizations
                      </div>
                    </Tooltip>
                  </Marker>
                ));
              })()}

              {/* County Level: Organization Markers with Connection Lines */}
              {showCountyMap && (
                <>
                  {/* Local Network Circles - Now clickable */}
                  {showLocalNetworks && (
                    <>
                      {Object.entries(LOCAL_NETWORKS).map(([networkId, network]) => {
                        const isSelected = selectedNetwork === networkId;
                        return (
                          <Circle
                            key={networkId}
                            center={[mapConfig.center[0] + network.center[0], mapConfig.center[1] + network.center[1]]}
                            radius={network.radius}
                            pathOptions={{
                              color: network.color,
                              weight: isSelected ? 6 : 4,
                              opacity: isSelected ? 1 : 0.8,
                              fillColor: network.color,
                              fillOpacity: isSelected ? 0.25 : 0.15,
                              dashArray: "10, 10"
                            }}
                            eventHandlers={{
                              click: () => handleNetworkClick(networkId)
                            }}
                          >
                            <Tooltip>
                              <div className="font-lato text-sm">
                                <strong>{network.name}</strong><br/>
                                {network.organizations.map((org, idx) => (
                                  <div key={idx}>{org}</div>
                                ))}
                                <br/>
                                <span>Click to {isSelected ? 'show all' : 'filter'} organizations</span>
                              </div>
                            </Tooltip>
                          </Circle>
                        );
                      })}
                    </>
                  )}
                  
                  {/* Connection Lines - HIDDEN FOR NOW */}
                  {/* {connectionLines.map((connection, index) => (
                    <Polyline
                      key={`connection-${index}`}
                      positions={[connection.from, connection.to]}
                      pathOptions={{
                        color: "#00ADEE",
                        weight: 4,
                        opacity: 0.9
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>Connection:</strong><br/>
                          {connection.fromName} ↔ {connection.toName}
                        </div>
                      </Tooltip>
                    </Polyline>
                  ))} */}
                  
                  {/* Organization Markers - HIDDEN FOR NOW */}
                  {/* {filteredOrgs.map((org) => (
                    <Marker key={org.name} position={org.coords} icon={createDotIcon(org.category)}>
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{org.name}</strong><br/>
                          {org.category}
                        </div>
                      </Tooltip>
                    </Marker>
                  ))} */}
                </>
              )}
            </MapContainer>
            
            {/* Status indicators - County only */}
            {showCountyMap && (
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-lato">
                {showLocalNetworks && (
                  <span className="px-2 py-1 bg-mte-green-20 text-mte-charcoal rounded">
                    2 Local Networks Visible
                  </span>
                )}
                {selectedNetwork && (
                  <span className="px-2 py-1 bg-mte-purple-20 text-mte-charcoal rounded font-semibold">
                    Filtered: {LOCAL_NETWORKS[selectedNetwork].name}
                  </span>
                )}
                {filteredOrgs.length !== countyOrgs.length && (
                  <span className="px-2 py-1 bg-mte-yellow-20 text-mte-charcoal rounded">
                    {filteredOrgs.length} of {countyOrgs.length} organizations shown
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Organization Cards - County Level Only */}
          {showCountyMap && (
            <div className="bg-white rounded-lg shadow-mte-card p-4">
              <h3 className="text-h4 font-bold uppercase mb-4 text-mte-black font-lato">Organizations ({filteredOrgs.length})</h3>
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                  {filteredOrgs.map((org) => {
                    const colors = CATEGORY_COLORS[org.category];
                    return (
                      <div
                        key={org.name}
                        className={`bg-white p-4 rounded-lg shadow-mte-card border-l-4 ${colors.border} flex-shrink-0`}
                        style={{ minWidth: "300px", maxWidth: "300px" }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.bg} ${colors.border} border mt-1`}></div>
                          <h4 className={`font-semibold ${colors.text} font-lato leading-tight`}>{org.name}</h4>
                        </div>
                        <div className={`text-sm px-2 py-1 rounded ${colors.bg} ${colors.text} inline-block mb-2 font-lato`}>
                          {org.category}
                        </div>
                        <p className="text-base text-mte-charcoal mb-2 font-lato">{org.description}</p>
                        <div className="text-sm text-mte-charcoal mb-2 font-lato">
                          <strong>Impact Areas:</strong> {org.focus.join(", ")}
                        </div>
                        <div className="text-sm text-mte-charcoal font-lato">Location: {org.location}</div>
                        <div className="text-sm text-mte-charcoal font-lato">Phone: {org.phone}</div>
                        <div className="text-sm text-mte-charcoal font-lato">Email: {org.email}</div>
                        <button className="mt-3 px-3 py-1 text-base bg-mte-blue text-white rounded hover:bg-mte-blue-80 w-full font-lato font-medium transition-colors">
                          View Full Profile
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-right pr-6 border-t border-mte-light-grey mt-auto">
        <img src={MTELogo} alt="More Than Enough" className="h-8 inline-block" />
      </div>
    </div>
  );
}