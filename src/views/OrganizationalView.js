import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Assets
import MTELogo from "../assets/MTE_Logo.png";

// Impact Area Icons
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";

// National view assets
import HandIcon from "../assets/front_hand.png";
import PointerIcon from "../assets/Mouse pointer.png";
import RecoloredMap from "../assets/RecoloredMap.png";
import KeyForMap from "../assets/KeyForMap.png";

// Organization category color mapping
const CATEGORY_COLORS = {
  "Bridge Ministry": { bg: "bg-mte-yellow-20", text: "text-mte-black", border: "border-mte-yellow", dot: "#e7d151" },
  "Service Organization": { bg: "bg-mte-green-20", text: "text-mte-black", border: "border-mte-green", dot: "#4aa456" },
  "Church Ministry": { bg: "bg-mte-blue-20", text: "text-mte-black", border: "border-mte-blue", dot: "#00ADEE" },
  "Government": { bg: "bg-mte-orange-20", text: "text-mte-black", border: "border-mte-orange", dot: "#dc6a42" },
  "Placement Agency": { bg: "bg-mte-purple-20", text: "text-mte-black", border: "border-mte-purple", dot: "#882781" },
};

// Mock organization data (would come from props in real app)
const orgData = [
  {
    name: "Bridge Ministry",
    category: "Bridge Ministry",
    description: "Supporting foster families through faith-based community connections and practical assistance.",
    focus: ["Foster and Kinship Families", "Wraparound"],
    location: "Nassau County - 10100",
    phone: "516-456-7891",
    email: "info@nassaubridgeministry.org",
    coords: [40.73061, -73.935242],
    connections: ["Hope Family Services", "Grace Church Foster Ministry"],
  },
  {
    name: "Hope Family Services",
    category: "Service Organization",
    description: "Supporting foster families through faith-based community connections and practical assistance.",
    focus: ["Adoptive", "Wraparound", "Biological"],
    location: "Nassau County - 10100",
    phone: "516-456-7891",
    email: "info@nassauhope.org",
    coords: [40.732, -73.94],
    connections: ["Community Support Network", "Family Connect Services"],
  },
  {
    name: "Community Support Network",
    category: "Government",
    description: "Supporting foster families through faith-based community connections and practical assistance.",
    focus: ["Foster and Kinship Families", "Wraparound"],
    location: "Nassau County - 10100",
    phone: "516-456-7891",
    email: "info@nassaucommunity.org",
    coords: [40.728, -73.93],
    connections: ["Children First Placement"],
  },
  {
    name: "Grace Church Foster Ministry",
    category: "Church Ministry",
    description: "Local church providing comprehensive support for foster families in the community.",
    focus: ["Foster and Kinship Families", "Wraparound"],
    location: "Nassau County - 10101",
    phone: "516-555-0123",
    email: "foster@gracechurch.org",
    coords: [40.735, -73.925],
    connections: ["Family Connect Services"],
  },
  {
    name: "Children First Placement",
    category: "Placement Agency",
    description: "Licensed placement agency specializing in matching children with loving families.",
    focus: ["Adoptive", "Foster and Kinship Families"],
    location: "Nassau County - 10102",
    phone: "516-555-0456",
    email: "placements@childrenfirst.org",
    coords: [40.740, -73.920],
    connections: ["Hope Family Services"],
  },
  {
    name: "Family Connect Services",
    category: "Service Organization",
    description: "Comprehensive family support services including counseling and resources.",
    focus: ["Biological", "Wraparound"],
    location: "Nassau County - 10103",
    phone: "516-555-0789",
    email: "connect@familyservices.org",
    coords: [40.725, -73.945],
    connections: [],
  },
];

// Create custom dot icons based on category
const createDotIcon = (category) => {
  const color = CATEGORY_COLORS[category]?.dot || "#00ADEE";
  return new L.DivIcon({
    className: "custom-dot",
    html: `<div style="width:12px; height:12px; background:${color}; border:2px solid white; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  });
};

export default function OrganizationalView({ regionLevel, regionId }) {
  const [selectedCategories, setSelectedCategories] = useState(Object.keys(CATEGORY_COLORS));
  const [selectedImpactAreas, setSelectedImpactAreas] = useState(["Foster and Kinship Families", "Adoptive", "Biological", "Wraparound"]);
  const [showConnectionLines, setShowConnectionLines] = useState(true);
  const [showLocalNetworks, setShowLocalNetworks] = useState(true);

  // Get display name based on region level
  const getDisplayName = () => {
    switch (regionLevel) {
      case "national":
        return "United States of America";
      case "state":
        return "Alabama"; // Would come from regionId lookup in real app
      case "county":
        return "Nassau County, New York"; // Would come from regionId lookup
      default:
        return "";
    }
  };

  const getSubtitle = () => {
    switch (regionLevel) {
      case "national":
        return "Explore foster care data where you live";
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

  const filteredOrgs = orgData.filter(org => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(org.category);
    const impactAreaMatch = selectedImpactAreas.length === 0 || 
      org.focus.some(focus => selectedImpactAreas.includes(focus));
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

  // Generate network clusters for local networks
  const generateNetworkClusters = () => {
    if (!showLocalNetworks) return [];
    
    const clusters = {};
    
    filteredOrgs.forEach(org => {
      org.focus.forEach(focusArea => {
        if (!clusters[focusArea]) {
          clusters[focusArea] = [];
        }
        clusters[focusArea].push(org);
      });
    });
    
    return Object.entries(clusters)
      .filter(([_, orgs]) => orgs.length > 1)
      .map(([focusArea, orgs]) => ({
        focusArea,
        organizations: orgs,
        center: [
          orgs.reduce((sum, org) => sum + org.coords[0], 0) / orgs.length,
          orgs.reduce((sum, org) => sum + org.coords[1], 0) / orgs.length
        ],
        radius: Math.max(...orgs.map(org => 
          Math.sqrt(
            Math.pow(org.coords[0] - (orgs.reduce((sum, o) => sum + o.coords[0], 0) / orgs.length), 2) +
            Math.pow(org.coords[1] - (orgs.reduce((sum, o) => sum + o.coords[1], 0) / orgs.length), 2)
          )
        )) * 111000
      }));
  };

  const networkClusters = generateNetworkClusters();

  // Conditional rendering
  const showNationalMap = regionLevel === "national";
  const showInteractiveMap = regionLevel === "county";
  const showSidebar = true; // Show for all levels

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-mte-light-grey">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 text-center">
          <h1 className="text-2xl md:text-4xl font-nexa text-mte-black">
            {getDisplayName()}
          </h1>
          <p className="text-sm md:text-base text-mte-charcoal mt-1 px-4">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6 flex-grow">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-full lg:w-1/4 space-y-4 md:space-y-6">
            {/* National: Jump selectors */}
            {showNationalMap && (
              <div className="bg-white p-4 rounded-lg shadow-mte-card space-y-3">
                <select className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal">
                  <option>Jump to a State</option>
                  <option value="alabama">Alabama</option>
                  <option value="new-york">New York</option>
                </select>
                <select className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal">
                  <option>Jump to a County</option>
                  <option value="butler-al">Butler County, AL</option>
                  <option value="nassau-ny">Nassau County, NY</option>
                </select>
              </div>
            )}

            {/* Organization Categories */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-h4 font-bold uppercase mb-1 text-mte-black">Organization Categories</h3>
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
              <h3 className="text-h4 font-bold uppercase mb-1 text-mte-black">Impact Areas</h3>
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
                  <span className="text-center text-mte-charcoal">Foster & Kinship</span>
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
                  <span className="text-center text-mte-charcoal">Adoptive</span>
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
                  <span className="text-center text-mte-charcoal">Support for Biological Families</span>
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
                  <span className="text-center text-mte-charcoal">Wraparound Support</span>
                </label>
              </div>
            </div>

            {/* Relationships - County only */}
            {showInteractiveMap && (
              <div className="bg-white p-4 rounded-lg shadow-mte-card">
                <h3 className="text-h4 font-bold uppercase mb-1 text-mte-black">Relationships</h3>
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
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
                      <span>View Local Networks</span>
                    </div>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map + Organizations */}
        <div className="w-full lg:w-3/4 flex flex-col gap-6">
          {/* National Static Map */}
          {showNationalMap && (
            <div className="bg-white rounded-lg shadow-mte-card p-4">
              <div className="text-mte-blue p-2 rounded mb-4 text-base font-lato space-y-2">
                <div className="flex items-center gap-2">
                  <img src={HandIcon} alt="Hover hand" className="w-5 h-5" />
                  <span>Hover over a state to display the data</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={PointerIcon} alt="Click pointer" className="w-5 h-5" />
                  <span>Click to deep-dive into a particular state</span>
                </div>
              </div>
              <div className="relative overflow-hidden">
                <img
                  src={RecoloredMap}
                  alt="Recolored US map"
                  className="w-[95%] mx-auto rounded transform scale-105"
                />
                <img
                  src={KeyForMap}
                  alt="Map Legend"
                  className="absolute bottom-4 right-4 w-40"
                />
              </div>
            </div>
          )}

          {/* County Interactive Map */}
          {showInteractiveMap && (
            <div className="bg-white rounded-lg shadow-mte-card p-4">
              <MapContainer
                center={[40.73, -73.935]}
                zoom={12}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Connection Lines */}
                {connectionLines.map((connection, index) => (
                  <Polyline
                    key={`connection-${index}`}
                    positions={[connection.from, connection.to]}
                    pathOptions={{
                      color: "#00ADEE",
                      weight: 2,
                      opacity: 0.7,
                      dashArray: "5, 10"
                    }}
                  >
                    <Tooltip>
                      <div>
                        <strong>Connection:</strong><br/>
                        {connection.fromName} ↔ {connection.toName}
                      </div>
                    </Tooltip>
                  </Polyline>
                ))}
                
                {/* Organization Markers */}
                {filteredOrgs.map((org) => (
                  <Marker key={org.name} position={org.coords} icon={createDotIcon(org.category)}>
                    <Tooltip>
                      <div>
                        <strong>{org.name}</strong><br/>
                        <span className="text-base">{org.category}</span><br/>
                        <span className="text-sm">{org.focus.join(", ")}</span>
                        {org.connections && org.connections.length > 0 && (
                          <>
                            <br/><span className="text-sm font-semibold">Connected to:</span><br/>
                            <span className="text-sm">{org.connections.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </Tooltip>
                  </Marker>
                ))}
              </MapContainer>
              
              {/* Status indicators */}
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-lato">
                {showConnectionLines && connectionLines.length > 0 && (
                  <span className="px-2 py-1 bg-mte-blue-20 text-mte-charcoal rounded">
                    {connectionLines.length} Connection Lines Active
                  </span>
                )}
                {showLocalNetworks && networkClusters.length > 0 && (
                  <span className="px-2 py-1 bg-mte-green-20 text-mte-charcoal rounded">
                    {networkClusters.length} Local Networks Visible
                  </span>
                )}
                {filteredOrgs.length !== orgData.length && (
                  <span className="px-2 py-1 bg-mte-yellow-20 text-mte-charcoal rounded">
                    {filteredOrgs.length} of {orgData.length} organizations shown
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Organization Cards - Horizontal Scrolling */}
          <div className="bg-white rounded-lg shadow-mte-card p-4">
            <h3 className="text-h4 font-bold uppercase mb-4 text-mte-black">Organizations ({filteredOrgs.length})</h3>
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
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`}></div>
                        <h4 className={`font-semibold ${colors.text} font-lato`}>{org.name}</h4>
                      </div>
                      <div className={`text-sm px-2 py-1 rounded ${colors.bg} ${colors.text} inline-block mb-2 font-lato`}>
                        {org.category}
                      </div>
                      <p className="text-base text-mte-charcoal mb-2 font-lato">{org.description}</p>
                      <div className="text-sm text-mte-charcoal mb-2 font-lato">
                        <strong>Focus Areas:</strong> {org.focus.join(", ")}
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
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-right pr-6">
        <img src={MTELogo} alt="More Than Enough" className="h-8 inline-block" />
      </div>
    </div>
  );
}