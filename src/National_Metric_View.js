import React, { useState } from 'react';
import { nationalStats } from './mock-data';

// Import asset icons
import BiologicalFamilyIcon from './assets/BiologicalFamily_icon.png';
import AdoptiveFamilyIcon from './assets/Adoptive_family_icon.png';
import ChurchIcon from './assets/church_icon.png';
import HandIcon from './assets/front_hand.png';
import PointerIcon from './assets/Mouse pointer.png';
import RecoloredMap from './assets/RecoloredMap.png';
import KeyForMap from './assets/KeyForMap.png';
import MTELogo from './assets/MTE_Logo.png';

// Metric definitions for tooltips
const METRIC_DEFINITIONS = {
  "Ratio of Licensed Homes to Children in Care": {
    title: "Ratio of Licensed Homes to Children in Care",
    definition: "The number of licensed foster homes divided by the number of children currently in out-of-home care",
    source: "AFCARS",
    calculation: "Licensed Foster Homes ÷ Children in Care",
    interpretation: "Higher ratios indicate more placement options available for children"
  },
  "Count of Children Waiting For Adoption": {
    title: "Children Waiting For Adoption",
    definition: "Number of children in foster care whose parental rights have been terminated and are legally available for adoption",
    source: "AFCARS",
    calculation: "Count of children with TPR (Termination of Parental Rights) status",
    interpretation: "Lower numbers indicate more efficient adoption processes"
  },
  "Count of Family Preservation Cases": {
    title: "Family Preservation Cases",
    definition: "Number of cases where services are provided to families to prevent removal of children from the home",
    source: "AFCARS",
    calculation: "Count of active family preservation service cases",
    interpretation: "Higher numbers may indicate stronger prevention efforts"
  },
  "Biological Family Reunification Rate": {
    title: "Biological Family Reunification Rate",
    definition: "Percentage of children who exit foster care by returning to their biological family",
    source: "AFCARS",
    calculation: "(Children reunified ÷ Total children exiting care) × 100",
    interpretation: "Higher rates may indicate effective family support services"
  }
};

// Trends data for the selected metric
const TRENDS_DATA = {
  "Count of Family Preservation Cases": [
    { year: 2022, value: 140 },
    { year: 2023, value: 105 },
    { year: 2024, value: 110 }
  ]
};

const National_Metric_View = ({ 
  onSelectState, 
  onSelectCounty, 
  onViewOrganizations, 
  onViewMetrics 
}) => {
  const [selectedMetric, setSelectedMetric] = useState("Count of Family Preservation Cases");
  const [hoveredState, setHoveredState] = useState(null);

  const currentTrends = TRENDS_DATA[selectedMetric] || [];
  const maxValue = Math.max(...currentTrends.map(d => d.value));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center relative">
          <h1 className="text-3xl sm:text-4xl text-gray-900 font-nexa">
            United States of America
          </h1>
          <p className="text-gray-700 mt-1">
            Understand foster care trends across the country
          </p>
          <div className="absolute right-4 top-6 flex gap-2">
            <button
              onClick={onViewOrganizations}
              className="px-3 py-1 border border-blue-500 text-blue-600 rounded text-sm bg-white hover:bg-blue-50 shadow-sm"
            >
              Organization View
            </button>
            <button
              onClick={onViewMetrics}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 shadow-sm"
            >
              Metrics View
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6 flex-grow">
        {/* Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* Jump selectors */}
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
            <select 
              onChange={(e) => onSelectState && onSelectState(e.target.value)} 
              className="w-full border border-gray-300 rounded p-2 text-sm"
            >
              <option>Jump to a State</option>
              <option value="alabama">Alabama</option>
              <option value="new-york">New York</option>
            </select>
            <select 
              onChange={(e) => onSelectCounty && onSelectCounty(e.target.value)} 
              className="w-full border border-gray-300 rounded p-2 text-sm"
            >
              <option>Jump to a County</option>
              <option value="butler-al">Butler County, AL</option>
              <option value="nassau-ny">Nassau County, NY</option>
            </select>
          </div>

          {/* Metrics */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-1">Metrics</h3>
            <p className="text-xs text-gray-500 mb-2">
              Filter by metric type to see what is happening across the country
            </p>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            >
              <option value="Ratio of Licensed Homes to Children in Care">Ratio of Licensed Homes to Children in Care</option>
              <option value="Count of Children Waiting For Adoption">Count of Children Waiting For Adoption</option>
              <option value="Count of Family Preservation Cases">Count of Family Preservation Cases</option>
              <option value="Biological Family Reunification Rate">Biological Family Reunification Rate</option>
            </select>
          </div>

          {/* Trends */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Trends</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              See trends for your selected metric over the past five years
            </p>
            
            {/* Trend Chart */}
            <div className="bg-gray-50 p-3 rounded relative">
              <div className="text-sm font-medium mb-2">
                Number of {selectedMetric} in the U.S. (by 1000s)
              </div>
              <div className="h-24 bg-white rounded flex items-end justify-between px-2 pb-2 relative">
                {currentTrends.map((data, index) => (
                  <div key={index} className="flex flex-col items-center relative group">
                    <div 
                      className="bg-orange-500 w-8 rounded mb-1 cursor-pointer hover:bg-orange-600 transition-colors relative"
                      style={{ height: `${(data.value / maxValue) * 80}px` }}
                    >
                      {/* Hover tooltip for individual bar */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">{data.value.toLocaleString()} Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, {data.year}</div>
                        <div className="text-gray-300 mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">{data.year}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Source: AFCARS 2022–2024
              </div>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="col-span-9">
          {/* Map + Legend */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 relative">
            <div className="text-blue-700 p-2 rounded mb-4 text-sm space-y-2">
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
                alt="US map showing metric data by state"
                className="w-[95%] mx-auto rounded transform scale-105"
                onMouseMove={(e) => {
                  // Simple hover detection - in real implementation you'd use proper map regions
                  const rect = e.target.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Example: detect New York area (you'd implement proper state detection)
                  if (x > 600 && x < 700 && y > 100 && y < 200) {
                    setHoveredState({
                      name: "NEW YORK",
                      value: "2000 Family Preservation Cases",
                      x: x,
                      y: y
                    });
                  } else {
                    setHoveredState(null);
                  }
                }}
              />
              <img
                src={KeyForMap}
                alt="Map Legend"
                className="absolute bottom-4 right-4 w-40"
              />
              
              {/* State Hover Tooltip */}
              {hoveredState && (
                <div 
                  className="absolute z-10 bg-gray-800 text-white text-sm p-2 rounded shadow-lg pointer-events-none"
                  style={{ 
                    left: hoveredState.x + 10, 
                    top: hoveredState.y - 40 
                  }}
                >
                  <div className="font-semibold">{hoveredState.name}</div>
                  <div>{hoveredState.value}</div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <img src={BiologicalFamilyIcon} alt="Family" className="w-10 h-10 mx-auto mb-3" />
              <div className="relative group">
                <div className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
                  {nationalStats.childrenInCare.toLocaleString()}
                </div>
                {/* Hover tooltip for main number */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">{nationalStats.childrenInCare.toLocaleString()} Children</div>
                  <div>in Out-of-Home Care on</div>
                  <div>September 30, 2023</div>
                  <div className="text-gray-300 mt-1">Source: AFCARS FY 2023</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-3">Children in Out-of-Home Care</div>
              <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                {nationalStats.childrenInFamilyFoster.toLocaleString()} Children in Family-Like Foster Care
                {/* Hover tooltip for sub-stat */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">Family-Like Foster Care</div>
                  <div>Children placed with non-relative foster families</div>
                  <div className="text-gray-300">Source: AFCARS FY 2023</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                {nationalStats.childrenInKinship.toLocaleString()} Children in Kinship Care
                {/* Hover tooltip for sub-stat */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">Kinship Care</div>
                  <div>Children placed with relatives or family friends</div>
                  <div className="text-gray-300">Source: AFCARS FY 2023</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-10 h-10 mx-auto mb-3" />
              <div className="relative group">
                <div className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
                  {nationalStats.childrenWaitingAdoption.toLocaleString()}
                </div>
                {/* Hover tooltip for main number */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">{nationalStats.childrenWaitingAdoption.toLocaleString()} Children</div>
                  <div>waiting for adoption on</div>
                  <div>September 30, 2023</div>
                  <div className="text-gray-300 mt-1">Source: AFCARS FY 2023</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-3">Children Waiting For Adoption</div>
              <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                {nationalStats.childrenAdopted2023.toLocaleString()} Children Adopted FY 2023
                {/* Hover tooltip for sub-stat */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">Children Adopted FY 2023</div>
                  <div>Children who finalized adoption during fiscal year 2023</div>
                  <div className="text-gray-300">Source: AFCARS FY 2023</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <img src={ChurchIcon} alt="Churches" className="w-10 h-10 mx-auto mb-3" />
              <div className="relative group">
                <div className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
                  {(nationalStats.totalChurches / 1000).toFixed(0)}K
                </div>
                {/* Hover tooltip for main number */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">{nationalStats.totalChurches.toLocaleString()} Churches</div>
                  <div>in the United States</div>
                  <div>as of 2024</div>
                  <div className="text-gray-300 mt-1">Source: Hartford Institute</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-3">Churches</div>
              <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                {(nationalStats.churchesWithMinistry / 1000).toFixed(0)}K Churches with a Foster Care Ministry
                {/* Hover tooltip for sub-stat */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">Churches with Foster Care Ministry</div>
                  <div>Estimated churches with active foster care programs</div>
                  <div className="text-gray-300">Source: More Than Enough 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-4 text-right pr-6">
        <img src={MTELogo} alt="More Than Enough" className="h-8 inline-block" />
      </div>
    </div>
  );
};

export default National_Metric_View;