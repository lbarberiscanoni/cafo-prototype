import React, { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import data from real-data
import { countyData, countyCoordinatesByState, stateCoordinates, stateNameToCode, organizations, fmt, getGeographyLabel } from "../real-data.js";

// Assets
import MTELogo from "../assets/MTE_Logo.png";

// Impact Area Icons
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";

// Helper function to filter out invalid/error descriptions
const getValidDescription = (org) => {
  const desc = org.description || org.generatedDescription || '';
  
  // Filter out common error messages or AI failure indicators
  const invalidPhrases = [
    'could not',
    'couldn\'t',
    'cannot',
    'can\'t',
    'unable to',
    'failed to',
    'don\'t see',
    'don\'t have',
    'doesn\'t contain',
    'doesn\'t include',
    'i cannot',
    'i could not',
    'i don\'t',
    'error',
    'no description',
    'description not found',
    'ai could not',
    'ai couldn\'t',
    'ai cannot',
    'not available',
    'n/a',
    'based on the limited information',
    'looking at the website content',
    'without specific details',
    'would need to include',
    'appears incomplete',
    'no clear indication',
    'no specific information'
  ];
  
  const lowerDesc = desc.toLowerCase();
  
  // If description contains any invalid phrase, return empty string
  if (invalidPhrases.some(phrase => lowerDesc.includes(phrase))) {
    return '';
  }
  
  // If description is too short (likely placeholder), return empty
  if (desc.trim().length < 10) {
    return '';
  }
  
  return desc;
};

// Helper function to consolidate organizations with multiple locations
const consolidateOrganizations = (orgs) => {
  // Group organizations by name
  const orgsByName = {};
  
  orgs.forEach(org => {
    if (!orgsByName[org.name]) {
      orgsByName[org.name] = [];
    }
    orgsByName[org.name].push(org);
  });
  
  // Consolidate each group
  const consolidated = Object.values(orgsByName).map(locations => {
    if (locations.length === 1) {
      // Single location - return as-is
      return locations[0];
    }
    
    // Multiple locations - consolidate
    const primary = locations[0]; // Use first as base
    
    // Collect all unique locations
    const uniqueLocations = [...new Set(
      locations
        .map(loc => loc.location || loc.city)
        .filter(Boolean)
    )];
    
    // Format location field
    let locationText;
    if (uniqueLocations.length === 0) {
      locationText = 'Multiple Locations';
    } else if (uniqueLocations.length <= 3) {
      // List them if 3 or fewer
      locationText = uniqueLocations.join('; ');
    } else {
      // Just indicate count if more than 3
      locationText = `Multiple Locations (${locations.length})`;
    }
    
    return {
      ...primary,
      location: locationText,
      locations: locations, // Store all locations for reference
      isConsolidated: true,
      locationCount: locations.length
    };
  });
  
  return consolidated;
};

// Organization category color mapping - matches actual categories in data
const CATEGORY_COLORS = {
  "Bridge Ministry": { bg: "bg-mte-yellow-20", text: "text-mte-black", border: "border-mte-yellow", dot: "#e7d151" },
  "Bridge Organization": { bg: "bg-mte-yellow-20", text: "text-mte-black", border: "border-mte-yellow", dot: "#e7d151" },
  "Service Organization": { bg: "bg-mte-green-20", text: "text-mte-black", border: "border-mte-green", dot: "#4aa456" },
  "Church Foster Care Ministry": { bg: "bg-mte-charcoal-20", text: "text-mte-black", border: "border-mte-charcoal", dot: "#5c5d5f" },
  "Placement Agency": { bg: "bg-mte-purple-20", text: "text-mte-black", border: "border-mte-purple", dot: "#882781" },
  "Child Placement Agency": { bg: "bg-mte-purple-20", text: "text-mte-black", border: "border-mte-purple", dot: "#882781" },
  "Local Network": { bg: "bg-mte-orange-20", text: "text-mte-black", border: "border-mte-orange", dot: "#dc6a42" },
  "State/Regional Network": { bg: "bg-mte-orange-20", text: "text-mte-black", border: "border-mte-orange", dot: "#dc6a42" },
  "Regional Network": { bg: "bg-mte-orange-20", text: "text-mte-black", border: "border-mte-orange", dot: "#dc6a42" },
  "Other": { bg: "bg-mte-blue-20", text: "text-mte-black", border: "border-mte-blue", dot: "#02ADEE" },
};

// Filter groups that combine similar categories for the UI
const FILTER_GROUPS = {
  "Bridge": ["Bridge Ministry", "Bridge Organization"],
  "Service Organization": ["Service Organization"],
  "Church Ministry": ["Church Foster Care Ministry"],
  "Placement Agency": ["Placement Agency", "Child Placement Agency"],
  "Network": ["Local Network", "State/Regional Network", "Regional Network"],
  "Other": ["Other"],
};

// Display names for categories (shorter/cleaner versions)
const CATEGORY_DISPLAY_NAMES = {
  "Church Foster Care Ministry": "Church Ministry",
  "Child Placement Agency": "Placement Agency",
  "State/Regional Network": "Regional Network",
};

// Get display name for a category
const getCategoryDisplayName = (category) => {
  return CATEGORY_DISPLAY_NAMES[category] || category;
};

// Get filter group for a category
const getCategoryFilterGroup = (category) => {
  for (const [group, categories] of Object.entries(FILTER_GROUPS)) {
    if (categories.includes(category)) return group;
  }
  return "Other"; // Default unmapped categories to Other
};

// Generate curved arc points between two coordinates
// This ensures connection lines are visible even when orgs are close together
// direction: 1 = curve left, -1 = curve right (alternate to avoid overlap)
const generateArcPoints = (from, to, numPoints = 20, minArcHeight = 2, direction = 1) => {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  
  // Calculate distance between points
  const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  
  // Arc height scales with distance but has a minimum for visibility
  // At national zoom, we need a LARGE minimum to see arcs between nearby orgs
  const arcHeight = Math.max(distance * 0.5, minArcHeight);
  
  // Midpoint
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  
  // Perpendicular direction for the arc bulge
  const dx = lat2 - lat1;
  const dy = lng2 - lng1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Control point offset (perpendicular to the line) - direction determines which side
  const perpLat = -dy / len * arcHeight * direction;
  const perpLng = dx / len * arcHeight * direction;
  
  // Control point for quadratic bezier
  const ctrlLat = midLat + perpLat;
  const ctrlLng = midLng + perpLng;
  
  // Generate points along quadratic bezier curve
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const invT = 1 - t;
    
    // Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const lat = invT * invT * lat1 + 2 * invT * t * ctrlLat + t * t * lat2;
    const lng = invT * invT * lng1 + 2 * invT * t * ctrlLng + t * t * lng2;
    
    points.push([lat, lng]);
  }
  
  return points;
};

// Haversine distance in meters between two [lat, lng] points
const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  const [selectedCategories, setSelectedCategories] = useState(Object.keys(FILTER_GROUPS));
  const [selectedImpactAreas, setSelectedImpactAreas] = useState(["Foster and Kinship Families", "Adoptive", "Biological", "Wraparound"]);
  const [showConnectionLines, setShowConnectionLines] = useState(false);
  const [showLocalNetworks, setShowLocalNetworks] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map remount when region changes
  const [selectedEmptyCounty, setSelectedEmptyCounty] = useState(null); // Track counties with no orgs
  const [selectedOrg, setSelectedOrg] = useState(null); // Track selected organization from map click
  const cardContainerRef = useRef(null); // Ref for scrolling to org cards
  const countySearchRef = useRef(null); // Ref for click-outside on county search
  const [countySearchQuery, setCountySearchQuery] = useState("");
  const [isCountyDropdownOpen, setIsCountyDropdownOpen] = useState(false);

  // Close county search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countySearchRef.current && !countySearchRef.current.contains(event.target)) {
        setIsCountyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter counties based on search query
  const filteredCounties = React.useMemo(() => {
    return Object.keys(countyData)
      .filter(countyId => {
        if (!countySearchQuery.trim()) return true;
        const countyName = countyData[countyId].name.split(',')[0].trim();
        return countyName.toLowerCase().includes(countySearchQuery.toLowerCase());
      })
      .sort((a, b) => {
        const aName = countyData[a].name.split(',')[0].trim().toLowerCase();
        const bName = countyData[b].name.split(',')[0].trim().toLowerCase();
        const query = countySearchQuery.toLowerCase();
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return countyData[a].name.localeCompare(countyData[b].name);
      })
      .slice(0, 50);
  }, [countySearchQuery]);

  // Handle clicking on an organization marker
  const handleOrgMarkerClick = (org) => {
    setSelectedOrg(org.name);
    // Scroll to the card after a brief delay to ensure render
    setTimeout(() => {
      const cardElement = document.getElementById(`org-card-${org.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  };

  // Update map when region changes
  React.useEffect(() => {
    setMapKey(prev => prev + 1);
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
          const parts = selectedRegion.name.split(',');
          if (parts.length >= 2) {
            const statePart = parts.slice(1).join(',').trim();
            const geoLabel = getGeographyLabel(statePart);
            const namePart = parts[0].trim();
            // Only append label if it's not already in the name
            if (!namePart.includes('County') && !namePart.includes('Region') && 
                !namePart.includes('District') && !namePart.includes('Office')) {
              return `${namePart} ${geoLabel},${parts.slice(1).join(',')}`;
            }
          }
          return selectedRegion.name;
        }
        return "Unknown Location";
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
    setMapKey(k => k + 1); // Force map remount to clear stale markers
  };

  const handleImpactAreaToggle = (impactArea) => {
    setSelectedImpactAreas(prev =>
      prev.includes(impactArea)
        ? prev.filter(area => area !== impactArea)
        : [...prev, impactArea]
    );
    setMapKey(k => k + 1); // Force map remount to clear stale markers
  };

  const handleConnectionLinesToggle = () => {
    setShowConnectionLines(prev => !prev);
  };

  // Handler for when a state marker is clicked - preserve current view
  const handleStateMarkerClick = (stateName) => {
    console.log('State marker clicked:', stateName);
    const stateId = stateName.toLowerCase().replace(/\s+/g, '-');
    const stateCode = stateNameToCode[stateName];
    
    if (onSelectRegion) {
      onSelectRegion({ 
        level: 'state', 
        id: stateId,
        name: stateName,
        code: stateCode
        // No view specified - preserves current view
      });
    }
  };

  // Handler for when a county marker is clicked - preserve current view
  const handleCountyMarkerClick = (countyName) => {
    console.log('County marker clicked:', countyName);
    const displayName = getDisplayName();
    const stateCode = stateNameToCode[displayName];
    const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode?.toLowerCase()}`;
    const label = getGeographyLabel(stateCode);
    
    if (onSelectRegion) {
      onSelectRegion({ 
        level: 'county', 
        id: countyId,
        name: `${countyName} ${label}, ${displayName}`
        // No view specified - preserves current view
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
          
          // First, check if we have orgs with coords - prefer centering on those
          const countyNameForFilter = countyName.replace(/-/g, ' ');
          const orgsInCounty = organizations.filter(org => 
            org.county && 
            org.county.toLowerCase().replace(/\s+county.*$/, '').trim() === countyNameForFilter &&
            org.state?.toLowerCase() === stateCode.toLowerCase() &&
            org.coords
          );
          
          if (orgsInCounty.length > 0) {
            // Calculate centroid of all org coords - this is where the action is
            const avgLat = orgsInCounty.reduce((sum, org) => sum + org.coords[0], 0) / orgsInCounty.length;
            const avgLng = orgsInCounty.reduce((sum, org) => sum + org.coords[1], 0) / orgsInCounty.length;
            return { center: [avgLat, avgLng], zoom: 12 };
          }
          
          // Fallback to county centroid if no orgs with coords
          const foundStateName = Object.keys(stateNameToCode).find(
            name => stateNameToCode[name]?.toLowerCase() === stateCode.toLowerCase()
          );
          
          if (foundStateName) {
            const stateId = foundStateName.toLowerCase().replace(/\s+/g, '-');
            const countyCoords = countyCoordinatesByState[stateId];
            
            if (countyCoords && Object.keys(countyCoords).length > 0) {
              const county = Object.keys(countyCoords).find(
                name => name.toLowerCase().replace(/\s+/g, '-') === countyName
              );
              
              if (county && countyCoords[county]) {
                return { center: countyCoords[county].coords, zoom: 10 };
              }
            }
          }
        }
        
        // Final fallback
        return { center: [39.8283, -98.5795], zoom: 8 };
      default:
        return { center: [39.8283, -98.5795], zoom: 4 };
    }
  };

  const mapConfig = getMapConfig();
  
  // Generate organizations dynamically for county level
  // Get organizations from real data based on region level
  const countyOrgs = React.useMemo(() => {
    if (regionLevel !== 'county') return [];
    
    const displayName = getDisplayName();
    // Extract county name without state
    const countyName = displayName.split(',')[0]?.trim() || displayName;
    
    // Extract state code from regionId
    let stateCode = '';
    if (regionId && regionId.includes('-')) {
      const parts = regionId.split('-');
      stateCode = parts[parts.length - 1].toUpperCase();
    }
    
    // Filter real organizations by county and state
    return organizations.filter(org => 
      org.county && 
      org.county.toLowerCase().replace(/\s+county.*$/, '').trim() === countyName.toLowerCase().replace(/\s+county.*$/, '').trim() &&
      org.state === stateCode &&
      org.onMap === true &&
      org.coords
    );
  }, [regionLevel, regionId, getDisplayName]);

  // Get state organizations
  const stateOrgs = React.useMemo(() => {
    if (regionLevel !== 'state') return [];
    
    const displayName = getDisplayName();
    const stateCode = stateNameToCode[displayName];
    
    // Filter real organizations by state
    return organizations.filter(org => 
      org.state === stateCode &&
      org.onMap === true &&
      org.coords
    );
  }, [regionLevel, getDisplayName]);

  // Derive county coordinates from organizations (for state view)
  const derivedCountyCoords = React.useMemo(() => {
    if (regionLevel !== 'state') return {};
    
    // Group orgs by county
    const countyGroups = {};
    stateOrgs.forEach(org => {
      if (org.county && org.coords) {
        const countyName = org.county.replace(/\s+County.*$/i, '').trim();
        if (!countyGroups[countyName]) {
          countyGroups[countyName] = { coords: [], orgCount: 0 };
        }
        countyGroups[countyName].coords.push(org.coords);
        countyGroups[countyName].orgCount++;
      }
    });
    
    // Calculate centroid for each county
    const result = {};
    Object.entries(countyGroups).forEach(([countyName, data]) => {
      const avgLat = data.coords.reduce((sum, c) => sum + c[0], 0) / data.coords.length;
      const avgLng = data.coords.reduce((sum, c) => sum + c[1], 0) / data.coords.length;
      result[countyName] = {
        coords: [avgLat, avgLng],
        orgCount: data.orgCount
      };
    });
    
    return result;
  }, [regionLevel, stateOrgs]);

  // Get national organizations
  const nationalOrgs = React.useMemo(() => {
    if (regionLevel !== 'national') return [];
    
    // Filter all organizations marked for map display
    return organizations.filter(org => 
      org.onMap === true &&
      org.coords
    );
  }, [regionLevel]);

  // Get current organizations based on region level
  const currentOrgs = regionLevel === 'county' ? countyOrgs : 
                     regionLevel === 'state' ? stateOrgs : 
                     nationalOrgs;

  // Filter organizations based on selected categories and impact areas
  const filteredOrgs = React.useMemo(() => {
    return currentOrgs.filter(org => {
      const filterGroup = getCategoryFilterGroup(org.category);
      const categoryMatch = selectedCategories.includes(filterGroup);
      
      // Impact area matching: if no impact areas selected, nothing matches
      // If org has no areas defined, it matches any selected impact area
      const impactAreaMatch = selectedImpactAreas.length > 0 && (
        !org.areas || 
        org.areas.length === 0 || 
        org.areas.some(area => selectedImpactAreas.includes(area))
      );
      
      return categoryMatch && impactAreaMatch;
    });
  }, [currentOrgs, selectedCategories, selectedImpactAreas]);

  // Consolidate organizations with multiple locations for card display
  // Keep original filteredOrgs for map markers (shows all physical locations)
  const consolidatedOrgs = React.useMemo(() => {
    return consolidateOrganizations(filteredOrgs);
  }, [filteredOrgs]);

  // Generate connection lines between organizations in the same network
  // Uses hub-and-spoke model: first org connects to all others (cleaner than all-pairs)
  const generateConnectionLines = () => {
    const connectionLines = [];
    
    // Group organizations by network
    const networks = {};
    filteredOrgs.forEach(org => {
      if (org.networkName && org.networkMember) {
        if (!networks[org.networkName]) {
          networks[org.networkName] = [];
        }
        networks[org.networkName].push(org);
      }
    });
    
    // Create hub-and-spoke connections within each network
    // First org is the hub, connects to all others
    Object.values(networks).forEach(networkOrgs => {
      if (networkOrgs.length < 2) return;
      
      const hub = networkOrgs[0];
      for (let i = 1; i < networkOrgs.length; i++) {
        connectionLines.push({
          from: hub.coords,
          to: networkOrgs[i].coords,
          fromName: hub.name,
          toName: networkOrgs[i].name,
          category: hub.category,
          network: hub.networkName
        });
      }
    });
    
    return connectionLines;
  };

  const connectionLines = showConnectionLines ? generateConnectionLines() : [];

  // ==================== LOCAL NETWORK BUBBLES ====================
  // Compute semi-transparent circle overlays for each network.
  // Centroid = average of member coords; radius = max member distance + padding.
  const networkBubbles = React.useMemo(() => {
    if (!showLocalNetworks) return [];

    // Group filtered orgs by network
    const networkGroups = {};
    filteredOrgs.forEach(org => {
      if (org.networkName && org.networkMember && org.coords) {
        if (!networkGroups[org.networkName]) {
          networkGroups[org.networkName] = [];
        }
        networkGroups[org.networkName].push(org);
      }
    });

    return Object.entries(networkGroups)
      .filter(([, orgs]) => orgs.length >= 1)
      .map(([networkName, orgs]) => {
        // Centroid of all members
        const avgLat = orgs.reduce((sum, o) => sum + o.coords[0], 0) / orgs.length;
        const avgLng = orgs.reduce((sum, o) => sum + o.coords[1], 0) / orgs.length;

        // Max distance from centroid to any member (meters)
        let maxDist = 0;
        orgs.forEach(org => {
          const dist = haversineMeters(avgLat, avgLng, org.coords[0], org.coords[1]);
          if (dist > maxDist) maxDist = dist;
        });

        // Radius: max distance + 30% padding, with a 5 km floor so
        // single-org networks and tightly clustered groups still show a visible bubble
        const radius = Math.max(maxDist * 1.3, 5000);

        return {
          name: networkName,
          center: [avgLat, avgLng],
          radius,
          members: orgs.map(o => o.name),
          memberCount: orgs.length,
          color: CATEGORY_COLORS["Local Network"]?.dot || "#dc6a42"
        };
      });
  }, [showLocalNetworks, filteredOrgs]);

  // Conditional rendering
  const showNationalMap = regionLevel === "national";
  const showStateMap = regionLevel === "state";
  const showCountyMap = regionLevel === "county";
  const showSidebar = true;

  // Helper to format website URL for display and linking
  const getWebsiteUrl = (website) => {
    if (!website) return null;
    // Add https:// if no protocol specified
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      return `https://${website}`;
    }
    return website;
  };

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
                
                {/* Jump to County - Type to Search */}
                <div className="relative" ref={countySearchRef}>
                  <input
                    type="text"
                    placeholder="Type to search counties..."
                    value={countySearchQuery}
                    onChange={(e) => {
                      setCountySearchQuery(e.target.value);
                      setIsCountyDropdownOpen(true);
                    }}
                    onFocus={() => setIsCountyDropdownOpen(true)}
                    className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue focus:border-mte-blue"
                  />
                  {isCountyDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-mte-light-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCounties.length > 0 ? (
                        filteredCounties.map(countyId => (
                          <div
                            key={countyId}
                            className="px-3 py-2 text-sm font-lato text-mte-charcoal hover:bg-mte-blue-20 cursor-pointer"
                            onClick={() => {
                              const county = countyData[countyId];
                              if (county && onSelectRegion) {
                                onSelectRegion({ 
                                  level: 'county', 
                                  id: countyId,
                                  name: county.name,
                                  fips: county.fips
                                });
                              }
                              setCountySearchQuery("");
                              setIsCountyDropdownOpen(false);
                            }}
                          >
                            {countyData[countyId].name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm font-lato text-mte-charcoal">No counties found</div>
                      )}
                      {filteredCounties.length === 50 && countySearchQuery.trim() && (
                        <div className="px-3 py-2 text-xs font-lato text-mte-charcoal border-t border-mte-light-grey">
                          Showing first 50 results. Type more to narrow search.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Organization Categories */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-bold mb-1 text-mte-black font-lato">Organization Categories</h3>
              <p className="text-sm text-mte-charcoal mb-3 font-lato">Check categories to explore who is working in your community</p>
              <div className="space-y-2 text-base font-lato">
                {Object.entries(FILTER_GROUPS).map(([groupName, categories]) => {
                  // Get color from first category in the group
                  const colors = CATEGORY_COLORS[categories[0]] || CATEGORY_COLORS["Other"];
                  return (
                    <label key={groupName} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(groupName)}
                        onChange={() => handleCategoryToggle(groupName)}
                      />
                      <div
                        className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`}
                      ></div>
                      <span className="text-mte-charcoal">{groupName}</span>
                    </label>
                  );
                })}
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
                  <span className="text-center text-mte-charcoal text-sm">Foster and Kinship Families</span>
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
                  <span className="text-center text-mte-charcoal text-sm">Adoptive Families</span>
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
                  <span className="text-center text-mte-charcoal text-sm">Support for Biological Families</span>
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
                  <span className="text-center text-mte-charcoal text-sm">Wraparound Support</span>
                </label>
              </div>
            </div>

            {/* Relationships - Now shown for County, State, AND National */}
            {(showCountyMap || showStateMap || showNationalMap) && (
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
                      <span>View Connection Lines</span>
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
                        onChange={() => setShowLocalNetworks(prev => !prev)}
                      />
                      {showLocalNetworks && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>View Local Networks</span>
                    </div>
                  </label>
                </div>
                {/* Show network count when connection lines are enabled */}
                {showConnectionLines && connectionLines.length > 0 && (
                  <div className="mt-3 text-sm text-mte-charcoal font-lato">
                    <span className="font-semibold">{connectionLines.length}</span> network connection{connectionLines.length !== 1 ? 's' : ''} displayed
                  </div>
                )}
                {/* Show bubble count when local networks are enabled */}
                {showLocalNetworks && networkBubbles.length > 0 && (
                  <div className="mt-3 text-sm text-mte-charcoal font-lato">
                    <span className="font-semibold">{networkBubbles.length}</span> local network{networkBubbles.length !== 1 ? 's' : ''} displayed
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Map + Organizations */}
        <div className="w-full lg:w-3/4 flex flex-col gap-4 md:gap-6">
          {/* Leaflet Map for All Levels */}
          <div className="bg-white rounded-lg shadow-mte-card p-4">
            <MapContainer
              key={`${mapKey}-${selectedCategories.join(',')}-${selectedImpactAreas.join(',')}`}
              center={mapConfig.center}
              zoom={mapConfig.zoom}
              style={{ height: "500px", width: "100%", borderRadius: "8px" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              
              {/* National Level: State Text Labels + Organization Dots + Connection Lines */}
              {showNationalMap && (
                <>
                  {/* State Labels - all states shown (clickable) */}
                  {Object.entries(stateCoordinates).map(([stateName, data]) => (
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
                          {fmt(data.orgCount)} Organizations
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}

                  {/* Connection Lines - curved arcs for visibility */}
                  {connectionLines.map((connection, index) => (
                    <Polyline
                      key={`national-connection-${index}`}
                      positions={generateArcPoints(connection.from, connection.to, 20, 3, index % 2 === 0 ? 1 : -1)}
                      pathOptions={{
                        color: CATEGORY_COLORS[connection.category]?.dot || "#02ADEE",
                        weight: 3,
                        opacity: 0.7
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{connection.network}</strong><br/>
                          {connection.fromName} ↔ {connection.toName}
                        </div>
                      </Tooltip>
                    </Polyline>
                  ))}

                  {/* Organization Dots - only render if we have filtered orgs */}
                  {filteredOrgs.length > 0 && filteredOrgs.map((org, idx) => (
                    <Marker 
                      key={org.name} 
                      position={org.coords} 
                      icon={createDotIcon(org.category, "20px")}
                      eventHandlers={{
                        click: () => handleOrgMarkerClick(org)
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{org.name}</strong><br/>
                          {org.category}<br/>
                          {org.state}
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}

                  {/* Local Network Bubbles */}
                  {networkBubbles.map((bubble) => (
                    <Circle
                      key={`bubble-national-${bubble.name}`}
                      center={bubble.center}
                      radius={bubble.radius}
                      pathOptions={{
                        color: bubble.color,
                        fillColor: bubble.color,
                        fillOpacity: 0.15,
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '6 4'
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{bubble.name}</strong><br/>
                          {bubble.memberCount} member{bubble.memberCount !== 1 ? 's' : ''}<br/>
                          <span className="text-xs">{bubble.members.join(', ')}</span>
                        </div>
                      </Tooltip>
                    </Circle>
                  ))}
                </>
              )}

              {/* State Level: County Text Labels + Organization Dots + Connection Lines */}
              {showStateMap && (() => {
                // Use derived county coordinates from orgs (more reliable than countyCoordinatesByState)
                const countyCoords = derivedCountyCoords;
                const stateGeoLabel = getGeographyLabel(getDisplayName());
                
                return (
                  <>
                    {/* County Labels - derived from org locations, all clickable */}
                    {Object.entries(countyCoords).map(([countyName, data]) => (
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
                            <strong>{countyName} {stateGeoLabel}</strong><br/>
                            {fmt(data.orgCount)} Organizations
                          </div>
                        </Tooltip>
                      </Marker>
                    ))}

                    {/* Connection Lines - curved arcs */}
                    {connectionLines.map((connection, index) => (
                      <Polyline
                        key={`state-connection-${index}`}
                        positions={generateArcPoints(connection.from, connection.to, 20, 0.5, index % 2 === 0 ? 1 : -1)}
                        pathOptions={{
                          color: CATEGORY_COLORS[connection.category]?.dot || "#02ADEE",
                          weight: 3,
                          opacity: 0.7
                        }}
                      >
                        <Tooltip>
                          <div className="font-lato text-sm">
                            <strong>{connection.network}</strong><br/>
                            {connection.fromName} ↔ {connection.toName}
                          </div>
                        </Tooltip>
                      </Polyline>
                    ))}

                    {/* Organization Dots - only render if we have filtered orgs */}
                    {filteredOrgs.length > 0 && filteredOrgs.map((org) => (
                      <Marker 
                        key={org.name} 
                        position={org.coords} 
                        icon={createDotIcon(org.category, "20px")}
                        eventHandlers={{
                          click: () => handleOrgMarkerClick(org)
                        }}
                      >
                        <Tooltip>
                          <div className="font-lato text-sm">
                            <strong>{org.name}</strong><br/>
                            {org.category}<br/>
                            {org.city}
                          </div>
                        </Tooltip>
                      </Marker>
                    ))}

                    {/* Local Network Bubbles */}
                    {networkBubbles.map((bubble) => (
                      <Circle
                        key={`bubble-state-${bubble.name}`}
                        center={bubble.center}
                        radius={bubble.radius}
                        pathOptions={{
                          color: bubble.color,
                          fillColor: bubble.color,
                          fillOpacity: 0.15,
                          weight: 2,
                          opacity: 0.6,
                          dashArray: '6 4'
                        }}
                      >
                        <Tooltip>
                          <div className="font-lato text-sm">
                            <strong>{bubble.name}</strong><br/>
                            {bubble.memberCount} member{bubble.memberCount !== 1 ? 's' : ''}<br/>
                            <span className="text-xs">{bubble.members.join(', ')}</span>
                          </div>
                        </Tooltip>
                      </Circle>
                    ))}
                  </>
                );
              })()}

              {/* County Level: Organization Markers with Connection Lines */}
              {showCountyMap && (
                <>
                  {/* Connection Lines - curved arcs */}
                  {connectionLines.map((connection, index) => (
                    <Polyline
                      key={`county-connection-${index}`}
                      positions={generateArcPoints(connection.from, connection.to, 20, 0.05, index % 2 === 0 ? 1 : -1)}
                      pathOptions={{
                        color: CATEGORY_COLORS[connection.category]?.dot || "#02ADEE",
                        weight: 4,
                        opacity: 0.9
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{connection.network}</strong><br/>
                          {connection.fromName} ↔ {connection.toName}
                        </div>
                      </Tooltip>
                    </Polyline>
                  ))}
                  
                  {/* Organization Markers - only render if we have filtered orgs */}
                  {filteredOrgs.length > 0 && filteredOrgs.map((org) => (
                    <Marker 
                      key={org.name} 
                      position={org.coords} 
                      icon={createDotIcon(org.category)}
                      eventHandlers={{
                        click: () => handleOrgMarkerClick(org)
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{org.name}</strong><br/>
                          {org.category}
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}

                  {/* Local Network Bubbles */}
                  {networkBubbles.map((bubble) => (
                    <Circle
                      key={`bubble-county-${bubble.name}`}
                      center={bubble.center}
                      radius={bubble.radius}
                      pathOptions={{
                        color: bubble.color,
                        fillColor: bubble.color,
                        fillOpacity: 0.15,
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '6 4'
                      }}
                    >
                      <Tooltip>
                        <div className="font-lato text-sm">
                          <strong>{bubble.name}</strong><br/>
                          {bubble.memberCount} member{bubble.memberCount !== 1 ? 's' : ''}<br/>
                          <span className="text-xs">{bubble.members.join(', ')}</span>
                        </div>
                      </Tooltip>
                    </Circle>
                  ))}
                </>
              )}
            </MapContainer>
            
            {/* Status indicators */}
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-lato">
              {showNationalMap && consolidatedOrgs.length > 0 && (
                <>
                  <span className="px-2 py-1 bg-mte-blue-20 text-mte-charcoal rounded">
                    {fmt(consolidatedOrgs.length)} National Organizations
                  </span>
                  {filteredOrgs.length !== consolidatedOrgs.length && (
                    <span className="px-2 py-1 bg-mte-purple-20 text-mte-charcoal rounded">
                      {fmt(filteredOrgs.length)} Total Locations
                    </span>
                  )}
                  {showConnectionLines && connectionLines.length > 0 && (
                    <span className="px-2 py-1 bg-mte-green-20 text-mte-charcoal rounded">
                      {fmt(connectionLines.length)} Connections
                    </span>
                  )}
                </>
              )}
              {showStateMap && consolidatedOrgs.length > 0 && (
                <>
                  <span className="px-2 py-1 bg-mte-blue-20 text-mte-charcoal rounded">
                    {fmt(consolidatedOrgs.length)} Organizations
                  </span>
                  {filteredOrgs.length !== consolidatedOrgs.length && (
                    <span className="px-2 py-1 bg-mte-purple-20 text-mte-charcoal rounded">
                      {fmt(filteredOrgs.length)} Total Locations
                    </span>
                  )}
                  {showConnectionLines && connectionLines.length > 0 && (
                    <span className="px-2 py-1 bg-mte-green-20 text-mte-charcoal rounded">
                      {fmt(connectionLines.length)} Connections
                    </span>
                  )}
                </>
              )}
              {showCountyMap && filteredOrgs.length !== currentOrgs.length && (
                <span className="px-2 py-1 bg-mte-yellow-20 text-mte-charcoal rounded">
                  {fmt(consolidatedOrgs.length)} of {fmt(currentOrgs.length)} organizations shown
                </span>
              )}
            </div>
          </div>

          {/* CTA for counties with no organizations - State Level Only */}
          {showStateMap && selectedEmptyCounty && (
            <div className="bg-mte-blue-20 border-2 border-mte-blue rounded-lg shadow-mte-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-mte-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-lato font-bold text-mte-black mb-2">
                    No Organizations Mapped in {selectedEmptyCounty.name} {getGeographyLabel(selectedEmptyCounty.state)}
                  </h3>
                  <p className="text-base text-mte-charcoal mb-4 font-lato">
                    We don't have any organizations mapped for {selectedEmptyCounty.name} {getGeographyLabel(selectedEmptyCounty.state)}, {selectedEmptyCounty.state} yet. 
                    You can help us build a more complete picture of foster care support in your area!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => setSelectedEmptyCounty(null)}
                      className="px-4 py-2 bg-mte-blue text-white rounded-lg font-lato font-medium hover:bg-mte-blue-80 transition-colors"
                    >
                      Back to Map
                    </button>
                    <a 
                      href={`mailto:data@morethanenough.org?subject=${encodeURIComponent(`Add Organization Data for ${selectedEmptyCounty.name} ${getGeographyLabel(selectedEmptyCounty.state)}, ${selectedEmptyCounty.state}`)}&body=${encodeURIComponent(`I would like to help add organization data for ${selectedEmptyCounty.name} ${getGeographyLabel(selectedEmptyCounty.state)}, ${selectedEmptyCounty.state}.\n\nPlease let me know what information you need and how I can assist.`)}`}
                      className="px-4 py-2 bg-white border-2 border-mte-blue text-mte-blue rounded-lg font-lato font-medium hover:bg-mte-blue-20 transition-colors"
                    >
                      Contact Us to Add Data
                    </a>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEmptyCounty(null)}
                  className="flex-shrink-0 text-mte-charcoal hover:text-mte-black transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Organization Cards - National, State, and County Level */}
          {(showNationalMap || showStateMap || showCountyMap) && !selectedEmptyCounty && (
            <div 
              key={`cards-${selectedCategories.join(',')}-${selectedImpactAreas.join(',')}`}
              className="bg-white rounded-lg shadow-mte-card p-4"
            >
              <h3 className="text-h4 font-bold uppercase mb-4 text-mte-black font-lato">
                Organizations ({fmt(consolidatedOrgs.length)})
              </h3>
              {consolidatedOrgs.length > 0 ? (
                <div className="overflow-x-auto" ref={cardContainerRef}>
                  <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                    {consolidatedOrgs.map((org) => {
                    const colors = CATEGORY_COLORS[org.category];
                    const isSelected = selectedOrg === org.name;
                    const cardId = `org-card-${org.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
                    const websiteUrl = getWebsiteUrl(org.website);
                    const validDescription = getValidDescription(org);
                    return (
                      <div
                        key={org.name}
                        id={cardId}
                        className={`p-4 rounded-lg shadow-mte-card border-l-4 ${colors?.border || 'border-mte-blue'} flex-shrink-0 transition-all duration-300 flex flex-col ${
                          isSelected 
                            ? 'bg-mte-blue-20 ring-2 ring-mte-blue scale-105' 
                            : 'bg-white hover:shadow-lg'
                        }`}
                        style={{ minWidth: "300px", maxWidth: "300px", minHeight: "220px" }}
                        onClick={() => setSelectedOrg(isSelected ? null : org.name)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors?.bg || 'bg-mte-blue-20'} ${colors?.border || 'border-mte-blue'} border mt-1`}></div>
                          <h4 className={`font-semibold ${colors?.text || 'text-mte-black'} font-lato leading-tight`}>{org.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 mb-2 overflow-x-auto">
                          <span className={`text-sm px-2 py-1 rounded whitespace-nowrap border ${colors?.bg || 'bg-mte-blue-20'} ${colors?.border || 'border-mte-blue'} ${colors?.text || 'text-mte-black'} font-lato`}>
                            {getCategoryDisplayName(org.category)}
                          </span>
                          {org.networkName && org.networkMember && (
                            <span className="text-sm px-2 py-1 rounded whitespace-nowrap border bg-mte-green-20 border-mte-green text-mte-black font-lato">
                              🔗 {org.networkName}
                            </span>
                          )}
                          {org.isConsolidated && org.locationCount > 1 && (
                            <span className="text-sm px-2 py-1 rounded whitespace-nowrap border bg-mte-purple-20 border-mte-purple text-mte-black font-lato">
                              📍 {org.locationCount} Locations
                            </span>
                          )}
                        </div>
                        {validDescription && (
                          <p className="text-base text-mte-charcoal mb-2 font-lato line-clamp-3">{validDescription}</p>
                        )}
                        <div className="text-sm text-mte-charcoal mb-2 font-lato">
                          <strong>Impact Areas:</strong> {org.areas?.join(", ") || 'N/A'}
                        </div>
                        {showNationalMap && (
                          <div className="text-sm text-mte-charcoal font-lato">
                            <strong>Location:</strong> {org.city}, {org.state}
                          </div>
                        )}
                        {showStateMap && (
                          <div className="text-sm text-mte-charcoal font-lato">
                            <strong>Location:</strong> {org.city}, {org.county}
                          </div>
                        )}
                        {showCountyMap && org.location && (
                          <>
                            <div className="text-sm text-mte-charcoal font-lato">
                              <strong>Location{org.isConsolidated && org.locationCount > 1 ? 's' : ''}:</strong> {org.location}
                            </div>
                            {org.phone && <div className="text-sm text-mte-charcoal font-lato">Phone: {org.phone}</div>}
                            {org.email && <div className="text-sm text-mte-charcoal font-lato">Email: {org.email}</div>}
                          </>
                        )}
                        {websiteUrl ? (
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-auto px-3 py-2 text-base bg-mte-blue text-white rounded hover:bg-mte-blue-80 w-full font-lato font-medium transition-colors inline-block text-center"
                          >
                            View Full Profile
                          </a>
                        ) : (
                          <button 
                            disabled
                            className="mt-auto px-3 py-2 text-base bg-mte-light-grey text-mte-charcoal rounded w-full font-lato font-medium cursor-not-allowed"
                          >
                            No Website Available
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              ) : (
                <div className="text-center py-8 text-mte-charcoal font-lato">
                  <p className="text-lg mb-2">No organizations match the selected filters</p>
                  <p className="text-sm">Try selecting different categories or impact areas above</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-right pr-6 border-t border-mte-light-grey mt-auto">
        <a href="https://cafo.org/morethanenough/" target="_blank" rel="noopener noreferrer" className="self-center">
          <img src={MTELogo} alt="More Than Enough" className="h-8 inline-block" /> 
        </a>
      </div>
    </div>
  );
}