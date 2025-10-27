import React from "react";
import { countyData, stateData } from "./mock-data";

// Assets
import ChurchIcon from "./assets/church_icon.png";
import FosterKinshipIcon from "./assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "./assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "./assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "./assets/WrapAround_icon.png";
import DownloadIcon from "./assets/download_icon.png";
import MapIcon from "./assets/Map_icon.png";
import HistoryIcon from "./assets/HistoryArrow.png";
import AlabamaMap from "./assets/Alabama.png";
import MTELogo from "./assets/MTE_Logo.png";

const County_Metric_View = ({ county, onExploreMap }) => {
  const data = countyData[county];
  const state = stateData.alabama;

  if (!data) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-2 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl text-gray-900 text-center font-nexa">
            {data.name}
          </h1>
          <p className="text-gray-600 text-center mt-2">
            
          </p>
          <p className="text-gray-600 text-center mt-2">
            Population: {data.population.toLocaleString()}
          </p>
        </div>

        {/* Alabama map (top-right) */}
        <div className="absolute top-4 right-4 text-center">
          <img src={AlabamaMap} alt="Alabama Map" className="w-20 h-auto mx-auto" />
          <div className="text-xs text-gray-600 mt-1">{data.countyOnly || data.name.split(",")[0]}</div>
        </div>
      </header>

      {/* Stat bar (extra space before it) */}
      <section className="mt-6">
        <div className="bg-white max-w-5xl mx-auto text-center py-6 shadow rounded-2xl">
          <img src={ChurchIcon} alt="Church" className="mx-auto w-20 h-20 mb-2" />
          <p className="text-3xl font-bold text-blue-500">{data.totalChurches}</p>
          <p className="text-gray-700 text-sm tracking-wide">
            TOTAL CHURCHES IN {data.name.toUpperCase()}
          </p>
        </div>
      </section>

      {/* Cards */}
      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Foster & Kinship */}
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <img src={FosterKinshipIcon} alt="Foster & Kinship" className="mx-auto w-20 h-20 mb-3" />
          <h3 className="font-semibold text-lg mb-6">Foster and Kinship Families</h3>

          {/* Main stat */}
          <div className="flex justify-center items-baseline gap-3 mb-6">
            <div className="text-3xl font-bold text-blue-500">{data.licensedHomesPerChild}</div>
            <div className="text-sm text-gray-600">Licensed Homes Per Child in Care</div>
          </div>

          {/* Other stats: left gray label, right bold value */}
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

          {/* Main stat */}
          <div className="flex justify-center items-baseline gap-3 mb-6">
            <div className="text-3xl font-bold text-blue-500">{data.waitingForAdoption}</div>
            <div className="text-sm text-gray-600">Children Waiting For Adoption</div>
          </div>

          {/* Other stats */}
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

          {/* Main stat 1 */}
          <div className="flex justify-center items-baseline gap-3 mb-6">
            <div className="text-3xl font-bold text-blue-500">{data.familyPreservationCases}</div>
            <div className="text-sm text-gray-600">Family Preservation Cases</div>
          </div>

          {/* Main stat 2 */}
          <div className="flex justify-center items-baseline gap-3">
            <div className="text-3xl font-bold text-blue-500">{data.reunificationRate}%</div>
            <div className="text-sm text-gray-600">Biological Family Reunification Rate</div>
          </div>
        </div>

        {/* Wraparound Support */}
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <img src={WrapAroundIcon} alt="Wraparound Support" className="mx-auto w-20 h-20 mb-3" />
          <h3 className="font-semibold text-lg mb-6">Wraparound Support</h3>

          {/* Main stat */}
          <div className="flex justify-center items-baseline gap-3 mb-6">
            <div className="text-3xl font-bold text-blue-500">{data.supportPercentage}%</div>
            <div className="text-sm text-gray-600">Churches Providing Support</div>
          </div>

          {/* Other stats */}
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-left text-gray-600">Churches Providing Support</div>
            <div className="text-right font-semibold text-gray-900">{data.churchesProvidingSupport}</div>

            <div className="text-left text-gray-600">Total Churches</div>
            <div className="text-right font-semibold text-gray-900">{data.totalChurches}</div>
          </div>
        </div>
      </main>

      {/* Statewide summary (with cursive header) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow px-6 py-6 text-center">
          <h4 className="font-pacifico italic text-2xl text-gray-900 mb-4">
            Statewide Data Summary for Alabama
          </h4>

          <div className="flex flex-wrap justify-around gap-6 md:gap-10 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-500">
                {state.totalChildren.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Children in Care</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{state.licensedHomes}</p>
              <p className="text-sm text-gray-600">Licensed Homes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{state.waitingForAdoption}</p>
              <p className="text-sm text-gray-600">Children Waiting For Adoption</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{state.reunificationRate}%</p>
              <p className="text-sm text-gray-600">Biological Family Reunification Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{state.familyPreservationCases}</p>
              <p className="text-sm text-gray-600">Family Preservation Cases</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (right-aligned logo) */}
      <footer className="py-6 pr-6 flex justify-end">
        <img src={MTELogo} alt="More Than Enough Logo" className="h-8" />
      </footer>
    </div>
  );
};

export default County_Metric_View;