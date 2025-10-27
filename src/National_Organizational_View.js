import React from 'react';
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

const National_Organizational_View = ({ 
  onSelectState, 
  onSelectCounty, 
  onViewOrganizations, 
  onViewMetrics 
}) => {
  return (
    <div className="min-h-screen  flex flex-col">
      {/* Header */}
      <div className=" border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center relative">
          <h1
            className="text-3xl sm:text-4xl text-gray-900"
            className="font-nexa"
          >
            United States of America
          </h1>
          <p className="text-gray-700 mt-1">
            Explore foster care data where you live
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
              onChange={(e) => onSelectState(e.target.value)} 
              className="w-full border border-gray-300 rounded p-2 text-sm"
            >
              <option>Jump to a State</option>
              <option value="alabama">Alabama</option>
              <option value="new-york">New York</option>
            </select>
            <select 
              onChange={(e) => onSelectCounty(e.target.value)} 
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
            <select className="w-full border border-gray-300 rounded p-2 text-sm">
              <option>Count of Family Preservation Cases</option>
              <option>Ratio of Licensed Homes to Children in Care</option>
              <option>Count of Children Waiting For Adoption</option>
              <option>Biological Family Reunification Rate</option>
            </select>
          </div>

          {/* Trends */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Trends</h3>
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Interpret This Trend</span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium mb-2">
                Number of Family Preservation Cases in the U.S. (by 000s)
              </div>
              <div className="h-24 bg-white rounded flex items-end justify-between px-2 pb-2">
                <div className="bg-orange-500 w-8 h-20"></div>
                <div className="bg-orange-500 w-8 h-16"></div>
                <div className="bg-orange-500 w-8 h-12"></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>2022</span>
                <span>2023</span>
                <span>2024</span>
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

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <img src={BiologicalFamilyIcon} alt="Family" className="w-10 h-10 mx-auto mb-3" />
              <div className="text-2xl font-bold">{nationalStats.childrenInCare.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mb-3">Children in Out-of-Home Care</div>
              <div className="text-sm text-gray-600">
                {nationalStats.childrenInFamilyFoster.toLocaleString()} Children in Family-Like Foster Care
              </div>
              <div className="text-sm text-gray-600">
                {nationalStats.childrenInKinship.toLocaleString()} Children in Kinship Care
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-10 h-10 mx-auto mb-3" />
              <div className="text-2xl font-bold">{nationalStats.childrenWaitingAdoption.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mb-3">Children Waiting For Adoption</div>
              <div className="text-sm text-gray-600">
                {nationalStats.childrenAdopted2023.toLocaleString()} Children Adopted FY 2023
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <img src={ChurchIcon} alt="Churches" className="w-10 h-10 mx-auto mb-3" />
              <div className="text-2xl font-bold">{(nationalStats.totalChurches / 1000).toFixed(0)}K</div>
              <div className="text-sm text-gray-600 mb-3">Churches</div>
              <div className="text-sm text-gray-600">
                {(nationalStats.churchesWithMinistry / 1000).toFixed(0)}K Churches with a Foster Care Ministry
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

export default National_Organizational_View;
