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
        const state = stateData[regionId] || stateData.alabama; // fallback to alabama
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
        const county = countyData[regionId] || countyData['butler-al']; // fallback to butler
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
  const showStateDetails = regionLevel === "state";
  const showStateContext = regionLevel === "county";
  const showPopulation = regionLevel === "county";
  const showAlabamaMap = regionLevel === "county";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`relative ${showAlabamaMap ? '' : 'border-b'}`}>
        <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 pb-2 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4">
            {data.name}
          </h1>
          {data.subtitle && (
            <p className="text-sm md:text-base text-mte-charcoal text-center mt-1 md:mt-2 px-4">{data.subtitle}</p>
          )}
          {showPopulation && (
            <p className="text-sm md:text-base text-mte-charcoal text-center mt-1 md:mt-2 px-4">
              Population: {data.population.toLocaleString()}
            </p>
          )}
        </div>

        {/* Alabama map (top-right) - County only - Hidden on mobile */}
        {showAlabamaMap && (
          <div className="hidden md:block absolute top-4 right-4 text-center">
            <img src={AlabamaMap} alt="Alabama Map" className="w-20 h-auto mx-auto" />
            <div className="text-sm text-mte-charcoal mt-1">
              {data.name.split(",")[0]}
            </div>
          </div>
        )}
      </header>

      {/* National Map Section */}
      {showMap && (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Sidebar - National only - Stacks on mobile */}
          <div className="w-full lg:w-1/4 space-y-3 md:space-y-4">
            {/* Jump selectors */}
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

            {/* Metrics */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-h4 font-bold uppercase mb-1 text-mte-black">Metrics</h3>
              <p className="text-sm text-mte-charcoal mb-2">
                Filter by metric type to see what is happening across the country
              </p>
              <select className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal">
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
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-h4 font-bold uppercase text-mte-black">Trends</h3>
              </div>
              <p className="text-sm text-mte-charcoal mb-2">
                See trends for your selected metric over the past five years
              </p>
              <div className="bg-mte-subdued-white p-3 rounded relative">
                <div className="text-base font-medium mb-2 font-lato text-mte-black">
                  Number of Family Preservation Cases in the U.S. (by 1000s)
                </div>
                <div className="h-24 bg-white rounded flex items-end justify-between px-2 pb-2 relative">
                  <div className="flex flex-col items-center relative group">
                    <div className="bg-mte-orange w-8 rounded mb-1 cursor-pointer hover:bg-mte-orange-80 transition-colors relative" style={{ height: "80px" }}>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-mte-charcoal text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">140,000 Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, 2022</div>
                        <div className="text-mte-subdued-white mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-mte-charcoal">2022</span>
                  </div>
                  <div className="flex flex-col items-center relative group">
                    <div className="bg-mte-orange w-8 rounded mb-1 cursor-pointer hover:bg-mte-orange-80 transition-colors relative" style={{ height: "60px" }}>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-mte-charcoal text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">105,000 Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, 2023</div>
                        <div className="text-mte-subdued-white mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-mte-charcoal">2023</span>
                  </div>
                  <div className="flex flex-col items-center relative group">
                    <div className="bg-mte-orange w-8 rounded mb-1 cursor-pointer hover:bg-mte-orange-80 transition-colors relative" style={{ height: "62px" }}>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-mte-charcoal text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">110,000 Cases</div>
                        <div>Family Preservation Cases on</div>
                        <div>December 31, 2024</div>
                        <div className="text-mte-subdued-white mt-1">Source: AFCARS</div>
                      </div>
                    </div>
                    <span className="text-xs text-mte-charcoal">2024</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-mte-charcoal">
                  Source: AFCARS 2022–2024
                </div>
              </div>
            </div>
          </div>

          {/* Main Area - National only */}
          <div className="w-full lg:w-3/4">
            {/* Interactive Map */}
            <div className="bg-white rounded-lg shadow-mte-card p-4 mb-6">
              <InteractiveUSMap 
                selectedMetric="Count of Family Preservation Cases"
                onStateClick={(stateCode, stateData) => {
                  console.log('State clicked:', stateCode, stateData);
                }}
              />
            </div>

            {/* Bottom Stats - National */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card text-center">
                <img src={BiologicalFamilyIcon} alt="Family" className="w-10 h-10 mx-auto mb-3" />
                <div className="relative group">
                  <div className="text-2xl md:text-2xl md:text-3xl font-black text-mte-blue cursor-pointer hover:text-mte-blue-80 transition-colors">
                    {data.childrenInCare.toLocaleString()}
                  </div>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-mte-charcoal text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="font-semibold">{data.childrenInCare.toLocaleString()} Children</div>
                    <div>in Out-of-Home Care on</div>
                    <div>September 30, 2023</div>
                    <div className="text-mte-subdued-white mt-1">Source: AFCARS FY 2023</div>
                  </div>
                </div>
                <div className="text-base text-mte-charcoal mb-3 font-lato">Children in Out-of-Home Care</div>
                <div className="text-base text-mte-charcoal relative group cursor-pointer hover:text-mte-blue transition-colors font-lato">
                  {data.childrenInFamilyFoster.toLocaleString()} Children in Family-Like Foster Care
                </div>
                <div className="text-base text-mte-charcoal relative group cursor-pointer hover:text-mte-blue transition-colors font-lato">
                  {data.childrenInKinship.toLocaleString()} Children in Kinship Care
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-mte-card text-center">
                <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-10 h-10 mx-auto mb-3" />
                <div className="relative group">
                  <div className="text-2xl md:text-3xl font-black text-mte-blue cursor-pointer hover:text-mte-blue-80 transition-colors">
                    {data.waitingForAdoption.toLocaleString()}
                  </div>
                </div>
                <div className="text-base text-mte-charcoal mb-3 font-lato">Children Waiting For Adoption</div>
                <div className="text-base text-mte-charcoal relative group cursor-pointer hover:text-mte-blue transition-colors font-lato">
                  {data.childrenAdopted.toLocaleString()} Children Adopted FY 2023
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-mte-card text-center">
                <img src={ChurchIcon} alt="Churches" className="w-10 h-10 mx-auto mb-3" />
                <div className="relative group">
                  <div className="text-2xl md:text-3xl font-black text-mte-blue cursor-pointer hover:text-mte-blue-80 transition-colors">
                    {(data.totalChurches / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="text-base text-mte-charcoal mb-3 font-lato">Churches</div>
                <div className="text-base text-mte-charcoal relative group cursor-pointer hover:text-mte-blue transition-colors font-lato">
                  {(data.churchesWithMinistry / 1000).toFixed(0)}K Churches with a Foster Care Ministry
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State Stats Section */}
      {showStateDetails && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Children in Care */}
            <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
              <img src={BiologicalFamilyIcon} alt="Children" className="w-16 h-16 mx-auto mb-4" />
              <div className="text-2xl md:text-3xl font-black text-mte-blue mb-2">
                {data.totalChildren?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-base text-mte-charcoal font-lato">Children in Care</div>
            </div>

            {/* Licensed Homes */}
            <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
              <img src={FosterKinshipIcon} alt="Homes" className="w-16 h-16 mx-auto mb-4" />
              <div className="text-xl md:text-2xl font-black text-mte-blue mb-2">
                {data.licensedHomes?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-base text-mte-charcoal font-lato">Licensed Homes</div>
            </div>

            {/* Waiting for Adoption */}
            <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
              <img src={AdoptiveFamilyIcon} alt="Adoption" className="w-16 h-16 mx-auto mb-4" />
              <div className="text-xl md:text-2xl font-black text-mte-blue mb-2">
                {data.waitingForAdoption?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-base text-mte-charcoal font-lato">Children Waiting For Adoption</div>
            </div>

            {/* Reunification Rate */}
            <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
              <img src={BiologicalFamilyIcon} alt="Reunification" className="w-16 h-16 mx-auto mb-4" />
              <div className="text-xl md:text-2xl font-black text-mte-blue mb-2">
                {data.reunificationRate}%
              </div>
              <div className="text-base text-mte-charcoal font-lato">Reunification Rate</div>
            </div>

            {/* Family Preservation */}
            <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
              <img src={WrapAroundIcon} alt="Preservation" className="w-16 h-16 mx-auto mb-4" />
              <div className="text-xl md:text-2xl font-black text-mte-blue mb-2">
                {data.familyPreservationCases?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-base text-mte-charcoal font-lato">Family Preservation Cases</div>
            </div>
          </div>
        </div>
      )}

      {/* County-specific: Church stat bar */}
      {showCountyDetails && (
        <section className="mt-6">
          <div className="bg-white max-w-5xl mx-auto text-center py-6 shadow-mte-card rounded-2xl">
            <img src={ChurchIcon} alt="Church" className="mx-auto w-20 h-20 mb-2" />
            <p className="text-2xl md:text-3xl font-black text-mte-blue">{data.totalChurches}</p>
            <p className="text-body text-mte-charcoal font-lato tracking-wide">
              TOTAL CHURCHES IN {data.name.toUpperCase()}
            </p>
          </div>
        </section>
      )}

      {/* Cards - County only (for now, can be extended to state) */}
      {showCountyDetails && (
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Foster & Kinship */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={FosterKinshipIcon} alt="Foster & Kinship" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="text-h4 font-bold uppercase mb-6 text-mte-black">Foster and Kinship Families</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.licensedHomesPerChild}</div>
              <div className="text-base text-mte-charcoal font-lato">Licensed Homes Per Child in Care</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-base">
              <div className="text-left text-mte-charcoal font-lato">Children in Care</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenInCare}</div>

              <div className="text-left text-mte-charcoal font-lato">Children in Family</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenInFamily}</div>

              <div className="text-left text-mte-charcoal font-lato">Children in Kinship Care</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenInKinship}</div>

              <div className="text-left text-mte-charcoal font-lato">Children Out-of-County</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenOutOfCounty}</div>

              <div className="text-left text-mte-charcoal font-lato">Licensed Homes</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.licensedHomes}</div>
            </div>
          </div>

          {/* Adoptive Families */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={AdoptiveFamilyIcon} alt="Adoptive Families" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="text-h4 font-bold uppercase mb-6 text-mte-black">Adoptive Families</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.waitingForAdoption}</div>
              <div className="text-base text-mte-charcoal font-lato">Children Waiting For Adoption</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-base">
              <div className="text-left text-mte-charcoal font-lato">Children Adopted in 2024</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenAdopted2024}</div>

              <div className="text-left text-mte-charcoal font-lato">Average Months to Adoption</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.avgMonthsToAdoption}</div>
            </div>
          </div>

          {/* Support for Biological Families */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={BiologicalFamilyIcon} alt="Biological Families" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="text-h4 font-bold uppercase mb-6 text-mte-black">Support for Biological Families</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.familyPreservationCases}</div>
              <div className="text-base text-mte-charcoal font-lato">Family Preservation Cases</div>
            </div>

            <div className="flex justify-center items-baseline gap-3">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.reunificationRate}%</div>
              <div className="text-base text-mte-charcoal font-lato">Biological Family Reunification Rate</div>
            </div>
          </div>

          {/* Wraparound Support */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={WrapAroundIcon} alt="Wraparound Support" className="mx-auto w-20 h-20 mb-3" />
            <h3 className="text-h4 font-bold uppercase mb-6 text-mte-black">Wraparound Support</h3>

            <div className="flex justify-center items-baseline gap-3 mb-6">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.supportPercentage}%</div>
              <div className="text-base text-mte-charcoal font-lato">Churches Providing Support</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-base">
              <div className="text-left text-mte-charcoal font-lato">Churches Providing Support</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.churchesProvidingSupport}</div>

              <div className="text-left text-mte-charcoal font-lato">Total Churches</div>
              <div className="text-right font-semibold text-mte-black font-lato">{data.totalChurches}</div>
            </div>
          </div>
        </main>
      )}

      {/* Statewide summary - County only */}
      {showStateContext && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-mte-card px-6 py-6 text-center">
            <h4 className="text-2xl font-source-serif italic text-mte-black mb-4">
              Statewide Data Summary for {data.state}
            </h4>

            <div className="flex flex-wrap justify-around gap-6 md:gap-10 text-center">
              <div>
                <p className="text-xl md:text-2xl font-black text-mte-blue">
                  {stateData.alabama.totalChildren.toLocaleString()}
                </p>
                <p className="text-base text-mte-charcoal font-lato">Children in Care</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-mte-blue">{stateData.alabama.licensedHomes}</p>
                <p className="text-base text-mte-charcoal font-lato">Licensed Homes</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-mte-blue">{stateData.alabama.waitingForAdoption}</p>
                <p className="text-base text-mte-charcoal font-lato">Children Waiting For Adoption</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-mte-blue">{stateData.alabama.reunificationRate}%</p>
                <p className="text-base text-mte-charcoal font-lato">Biological Family Reunification Rate</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-mte-blue">{stateData.alabama.familyPreservationCases}</p>
                <p className="text-base text-mte-charcoal font-lato">Family Preservation Cases</p>
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