import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Assets
import MTELogo from "./assets/MTE_Logo.png";

// Impact Area Icons
import FosterKinshipIcon from "./assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "./assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "./assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "./assets/WrapAround_icon.png";

// Organization category color mapping
const CATEGORY_COLORS = {
  "Bridge Ministry": { bg: "bg-yellow-200", text: "text-yellow-800", border: "border-yellow-300", dot: "#facc15" },
  "Service Organization": { bg: "bg-green-200", text: "text-green-800", border: "border-green-300", dot: "#22c55e" },
  "Church Ministry": { bg: "bg-blue-200", text: "text-blue-800", border: "border-blue-300", dot: "#3b82f6" },
  "Government": { bg: "bg-red-200", text: "text-red-800", border: "border-red-300", dot: "#ef4444" },
  "Placement Agency": { bg: "bg-purple-200", text: "text-purple-800", border: "border-purple-300", dot: "#a855f7" },
};

// Expanded organization data with more examples
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
  },
];

// Create custom dot icons based on category
const createDotIcon = (category) => {
  const color = CATEGORY_COLORS[category]?.dot || "#1d4ed8";
  return new L.DivIcon({
    className: "custom-dot",
    html: `<div style="width:12px; height:12px; background:${color}; border:2px solid white; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  });
};

export default function County_Organizational_View({ countyName = "Nassau County, New York" }) {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredOrgs = selectedCategories.length === 0
    ? orgData
    : orgData.filter(org => selectedCategories.includes(org.category));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl sm:text-4xl text-gray-900 font-nexa">
            {countyName}
          </h1>
          <p className="text-gray-700 mt-1">
            Explore local organizations and connections near you
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4 space-y-6">
          {/* Organization Categories with Colors */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Organization Categories</h3>
            <div className="space-y-2 text-sm">
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
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Impact Areas */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Impact Areas</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col items-center">
                <img src={FosterKinshipIcon} alt="Foster Kinship" className="w-10 h-10 mb-1" />
                <span className="text-center">Foster & Kinship</span>
              </div>
              <div className="flex flex-col items-center">
                <img src={AdoptiveFamilyIcon} alt="Adoptive" className="w-10 h-10 mb-1" />
                <span className="text-center">Adoptive</span>
              </div>
              <div className="flex flex-col items-center">
                <img src={BiologicalFamilyIcon} alt="Biological" className="w-10 h-10 mb-1" />
                <span className="text-center">Biological</span>
              </div>
              <div className="flex flex-col items-center">
                <img src={WrapAroundIcon} alt="Wraparound" className="w-10 h-10 mb-1" />
                <span className="text-center">Wraparound</span>
              </div>
            </div>
          </div>

          {/* Relationships */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Relationships</h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> <span>View Connection Lines</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> <span>View Local Networks</span>
              </label>
            </div>
          </div>
        </div>

        {/* Map + Organizations */}
        <div className="w-full lg:w-3/4 flex flex-col gap-6">
          {/* Interactive Map */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <MapContainer
              center={[40.73, -73.935]} // Nassau County area
              zoom={12}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredOrgs.map((org) => (
                <Marker key={org.name} position={org.coords} icon={createDotIcon(org.category)}>
                  <Tooltip>{org.name}</Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Organization Cards - Horizontal Scrolling */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-4">Organizations ({filteredOrgs.length})</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                {filteredOrgs.map((org) => {
                  const colors = CATEGORY_COLORS[org.category];
                  return (
                    <div
                      key={org.name}
                      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${colors.border} flex-shrink-0`}
                      style={{ minWidth: "300px", maxWidth: "300px" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`}></div>
                        <h4 className={`font-semibold ${colors.text}`}>{org.name}</h4>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text} inline-block mb-2`}>
                        {org.category}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{org.description}</p>
                      <div className="text-xs text-gray-500 mb-2">
                        <strong>Focus Areas:</strong> {org.focus.join(", ")}
                      </div>
                      <div className="text-xs text-gray-500">Location: {org.location}</div>
                      <div className="text-xs text-gray-500">Phone: {org.phone}</div>
                      <div className="text-xs text-gray-500">Email: {org.email}</div>
                      <button className="mt-3 px-3 py-1 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 w-full">
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