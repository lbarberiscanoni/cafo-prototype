import React from "react";
import { countyData, stateData, nationalStats } from "../mock-data";

// Assets
import ChurchIcon from "../assets/church_icon.png";
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import AlabamaMap from "../assets/Alabama.png";
import MTELogo from "../assets/MTE_Logo.png";
import InteractiveUSMap from "../InteractiveUSMap";

const MetricView = ({ regionLevel, regionId }) => {
  // Get data based on region level
  const getData = () => {
    switch (regionLevel) {
      case "national":
        return {
          name: "United States of America",
          subtitle: "Understand foster care trends across the country",
          totalChurches: nationalStats.totalChurches,
          childrenInCare: nationalStats.childrenInCare,
          childrenInFamilyFoster: nationalStats.childrenInFamilyFoster,
          childrenInKinship: nationalStats.childrenInKinship,
          waitingForAdoption: nationalStats.childrenWaitingAdoption,
          childrenAdopted: nationalStats.childrenAdopted2023,
          churchesWithMinistry: nationalStats.churchesWithMinistry,
        };
      case "state":
        const state = stateData[regionId];
        return {
          name: state.name,
          subtitle: "Explore foster care data in this state",
          totalChildren: state.totalChildren,
          licensedHomes: state.licensedHomes,
          waitingForAdoption: state.waitingForAdoption,
          reunificationRate: state.reunificationRate,
          familyPreservationCases: state.familyPreservationCases,
        };
      case "county":
        const county = countyData[regionId];
        return {
          name: county.name,
          subtitle: "",
          population: county.population,
          totalChurches: county.totalChurches,
          childrenInCare: county.childrenInCare,
          childrenInFamily: county.childrenInFamily,
          childrenInKinship: county.childrenInKinship,
          childrenOutOfCounty: county.childrenOutOfCounty,
          licensedHomes: county.licensedHomes,
          licensedHomesPerChild: county.licensedHomesPerChild,
          waitingForAdoption: county.waitingForAdoption,
          childrenAdopted2024: county.childrenAdopted2024,
          avgMonthsToAdoption: county.avgMonthsToAdoption,
          familyPreservationCases: county.familyPreservationCases,
          reunificationRate: county.reunificationRate,
          churchesProvidingSupport: county.churchesProvidingSupport,
          supportPercentage: county.supportPercentage,
          state: county.state,
        };
      default:
        return {};
    }
  };

  const data = getData();

  // Conditional rendering helpers
  const showMap = regionLevel === "national";
  const showCountyDetails = regionLevel === "county";
  const showStateContext = regionLevel === "county";
  const showPopulation = regionLevel === "county";
  const showAlabamaMap = regionLevel === "county";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`relative ${showAlabamaMap ? '' : 'border-b'}`}>
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-2 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl text-gray-900 text-center font-nexa">
            {data.name}
          </h1>
          {data.subtitle && (
            <p className="text-gray-600 text-center mt-2">{data.subtitle}</p>
          )}
          {showPopulation && (
            <p className="text-gray-600 text-center mt-2">
              Population: {data.population.toLocaleString()}
            </p>
          )}
        </div>

        {/* Alabama map (top-right) - County only */}
        {showAlabamaMap && (
          <div className="absolute top-4 right-4 text-center">
            <img src={AlabamaMap} alt="Alabama Map" className="w-20 h-auto mx-auto" />
            <div className="text-xs text-gray-600 mt-1">
              {data.name.split(",")[0]}
            </div>
          </div>
        )}
      </header>

      {/* National Map Section */}
      {showMap && (
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
          {/* Sidebar - National only */}
          <div className="col-span-3 space-y-4">
            {/* Jump selectors */}
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
              <select className="w-full border border-gray-300 rounded p-2 text-sm">
                <option>Jump to a State</option>
                <option value="alabama">Alabama</option>
                <option value="new-york">New York</option>
              </select>
              <select className="w-full border border-gray-300 rounded p-2 text-sm">
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
                <option value="Ratio of Licensed Homes to Children in Care">
                  Ratio of Licensed Homes to Children in Care
                </option>
                <option value="Count of Children Waiting For Adoption">
                  Count of Children Waiting For Adoption
                </option>
                <option value="Count of Family Preservation Cases">
                  Count of Family Preservation Cases
                </option>
                <option value="Biological Family Reunification Rate">
                  Biological Family Reunification Rate
                </option>
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
              <div className="bg-gray-50 p-3 rounded relative">
                <div className="text-sm font-medium mb-2">
                  Number of Family Preservation Cases in the U.S. (by 1000s)
                </div>
                <div className="h-24 bg-white rounded flex items-end justify-between px-2 pb-2 relative">
                  <div className="flex flex-col items-center relative group">
                    <div className="bg-orange-500 w-8 rounded mb-1 cursor-pointer hover:bg-orange-600 transition-colors relative" style={{ height: "80px" }}>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">140,000 Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, 2022</div>
                        <div className="text-gray-300 mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">2022</span>
                  </div>
                  <div className="flex flex-col items-center relative group">
                    <div className="bg-orange-500 w-8 rounded mb-1 cursor-pointer hover:bg-orange-600 transition-colors relative" style={{ height: "60px" }}>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">105,000 Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, 2023</div>
                        <div className="text-gray-300 mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">2023</span>
                  </div>
                  <div className="flex flex-col items-center relative group">
                    <div className="bg-orange-500 w-8 rounded mb-1 cursor-pointer hover:bg-orange-600 transition-colors relative" style={{ height: "62px" }}>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">110,000 Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, 2024</div>
                        <div className="text-gray-300 mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">2024</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Source: AFCARS 2022–2024
                </div>
              </div>
            </div>
          </div>

          {/* Main Area - National only */}
          <div className="col-span-9">
            {/* Interactive Map */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <InteractiveUSMap 
                selectedMetric="Count of Family Preservation Cases"
                onStateClick={(stateCode, stateData) => {
                  console.log('State clicked:', stateCode, stateData);
                }}
              />
            </div>

            {/* Bottom Stats - National */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <img src={BiologicalFamilyIcon} alt="Family" className="w-10 h-10 mx-auto mb-3" />
                <div className="relative group">
                  <div className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
                    {data.childrenInCare.toLocaleString()}
                  </div>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="font-semibold">{data.childrenInCare.toLocaleString()} Children</div>
                    <div>in Out-of-Home Care on</div>
                    <div>September 30, 2023</div>
                    <div className="text-gray-300 mt-1">Source: AFCARS FY 2023</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">Children in Out-of-Home Care</div>
                <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                  {data.childrenInFamilyFoster.toLocaleString()} Children in Family-Like Foster Care
                </div>
                <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                  {data.childrenInKinship.toLocaleString()} Children in Kinship Care
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-10 h-10 mx-auto mb-3" />
                <div className="relative group">
                  <div className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
                    {data.waitingForAdoption.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">Children Waiting For Adoption</div>
                <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                  {data.childrenAdopted.toLocaleString()} Children Adopted FY 2023
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <img src={ChurchIcon} alt="Churches" className="w-10 h-10 mx-auto mb-3" />
                <div className="relative group">
                  <div className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
                    {(data.totalChurches / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">Churches</div>
                <div className="text-sm text-gray-600 relative group cursor-pointer hover:text-blue-600 transition-colors">
                  {(data.churchesWithMinistry / 1000).toFixed(0)}K Churches with a Foster Care Ministry
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* County-specific: Church stat bar */}
      {showCountyDetails && (
        <section className="mt-6">
          <div className="bg-white max-w-5xl mx-auto text-center py-6 shadow rounded-2xl">
            <img src={ChurchIcon} alt="Church" className="mx-auto w-20 h-20 mb-2" />
            <p className="text-3xl font-bold text-blue-500">{data.totalChurches}</p>
            <p className="text-gray-700 text-sm tracking-wide">
              TOTAL CHURCHES IN {data.name.toUpperCase()}
            </p>
          </div>
        </section>
      )}

      {/* Cards - County only (for now, can be extended to state) */}
      {showCountyDetails && (
        <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Foster & Kinship */}
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <img src={FosterKinshipIcon} alt="Foster & Kinship" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="font-semibold text-lg mb-6">Foster and Kinship Families</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-3xl font-bold text-blue-500">{data.licensedHomesPerChild}</div>
              <div className="text-sm text-gray-600">Licensed Homes Per Child in Care</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-left text-gray-600">Children in Care</div>
              <div className="text-right font-semibold text-gray-900">{data.childrenInCare}</div>

              <div className="text-left text-gray-600">Children in Family</div>
              <div className="text-right font-semibold text-gray-900">{data.childrenInFamily}</div>

              <div className="text-left text-gray-600">Children in Kinship Care</div>
              <div className="text-right font-semibold text-gray-900">{data.childrenInKinship}</div>

              <div className="text-left text-gray-600">Children Out-of-County</div>
              <div className="text-right font-semibold text-gray-900">{data.childrenOutOfCounty}</div>

              <div className="text-left text-gray-600">Licensed Homes</div>
              <div className="text-right font-semibold text-gray-900">{data.licensedHomes}</div>
            </div>
          </div>

          {/* Adoptive Families */}
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <img src={AdoptiveFamilyIcon} alt="Adoptive Families" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="font-semibold text-lg mb-6">Adoptive Families</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-3xl font-bold text-blue-500">{data.waitingForAdoption}</div>
              <div className="text-sm text-gray-600">Children Waiting For Adoption</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-left text-gray-600">Children Adopted in 2024</div>
              <div className="text-right font-semibold text-gray-900">{data.childrenAdopted2024}</div>

              <div className="text-left text-gray-600">Average Months to Adoption</div>
              <div className="text-right font-semibold text-gray-900">{data.avgMonthsToAdoption}</div>
            </div>
          </div>

          {/* Support for Biological Families */}
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <img src={BiologicalFamilyIcon} alt="Biological Families" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="font-semibold text-lg mb-6">Support for Biological Families</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-3xl font-bold text-blue-500">{data.familyPreservationCases}</div>
              <div className="text-sm text-gray-600">Family Preservation Cases</div>
            </div>

            <div className="flex justify-center items-baseline gap-3">
              <div className="text-3xl font-bold text-blue-500">{data.reunificationRate}%</div>
              <div className="text-sm text-gray-600">Biological Family Reunification Rate</div>
            </div>
          </div>

          {/* Wraparound Support */}
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <img src={WrapAroundIcon} alt="Wraparound Support" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="font-semibold text-lg mb-6">Wraparound Support</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-3xl font-bold text-blue-500">{data.supportPercentage}%</div>
              <div className="text-sm text-gray-600">Churches Providing Support</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-left text-gray-600">Churches Providing Support</div>
              <div className="text-right font-semibold text-gray-900">{data.churchesProvidingSupport}</div>

              <div className="text-left text-gray-600">Total Churches</div>
              <div className="text-right font-semibold text-gray-900">{data.totalChurches}</div>
            </div>
          </div>
        </main>
      )}

      {/* Statewide summary - County only */}
      {showStateContext && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow px-6 py-6 text-center">
            <h4 className="font-pacifico italic text-2xl text-gray-900 mb-4">
              Statewide Data Summary for {data.state}
            </h4>

            <div className="flex flex-wrap justify-around gap-6 md:gap-10 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-500">
                  {stateData.alabama.totalChildren.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Children in Care</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stateData.alabama.licensedHomes}</p>
                <p className="text-sm text-gray-600">Licensed Homes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stateData.alabama.waitingForAdoption}</p>
                <p className="text-sm text-gray-600">Children Waiting For Adoption</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stateData.alabama.reunificationRate}%</p>
                <p className="text-sm text-gray-600">Biological Family Reunification Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stateData.alabama.familyPreservationCases}</p>
                <p className="text-sm text-gray-600">Family Preservation Cases</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-6 pr-6 flex justify-end">
        <img src={MTELogo} alt="More Than Enough Logo" className="h-8" />
      </footer>
    </div>
  );
};

export default MetricView;