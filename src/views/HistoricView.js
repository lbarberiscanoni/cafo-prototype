import React from "react";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

const years = [2020, 2021, 2022, 2023, 2024];

// Mock historical data (would come from props/API in real app)
const mockHistoryData = {
  national: {
    kinship: [120, 115, 110, 105, 100],
    adoption: [50, 48, 47, 49, 50],
    biological: [140, 135, 130, 110, 105],
    wraparound: [30, 32, 35, 38, 40]
  },
  state: {
    kinship: [80, 75, 70, 65, 60],
    adoption: [15, 14, 15, 16, 18],
    biological: [60, 55, 50, 45, 40],
    wraparound: [10, 12, 14, 15, 16]
  },
  county: {
    kinship: [60, 55, 50, 40, 30],
    adoption: [2, 2, 3, 4, 6],
    biological: [30, 35, 32, 25, 20],
    wraparound: [1, 2, 3, 3, 4]
  }
};

const mockTrendsData = {
  national: {
    childrenInCare: -8,
    licensedHomes: 12,
    waitingForAdoption: -15,
    reunificationRate: 8,
    familyPreservationCases: -25
  },
  state: {
    childrenInCare: -15,
    licensedHomes: 10,
    waitingForAdoption: -12,
    reunificationRate: 6,
    familyPreservationCases: -20
  },
  county: {
    childrenInCare: -30,
    licensedHomes: 5,
    waitingForAdoption: -10,
    reunificationRate: 10,
    familyPreservationCases: -5
  }
};

export default function HistoricView({ regionLevel, regionId }) {
  // Get data based on region level
  const getDisplayName = () => {
    switch (regionLevel) {
      case "national":
        return "United States of America";
      case "state":
        return "Alabama"; // Would come from regionId lookup
      case "county":
        return "Butler County, Alabama"; // Would come from regionId lookup
      default:
        return "";
    }
  };

  const getHistory = () => {
    switch (regionLevel) {
      case "national":
        return mockHistoryData.national;
      case "state":
        return mockHistoryData.state;
      case "county":
        return mockHistoryData.county;
      default:
        return mockHistoryData.county;
    }
  };

  const getTrends = () => {
    switch (regionLevel) {
      case "national":
        return mockTrendsData.national;
      case "state":
        return mockTrendsData.state;
      case "county":
        return mockTrendsData.county;
      default:
        return mockTrendsData.county;
    }
  };

  const history = getHistory();
  const trends = getTrends();
  const name = getDisplayName();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-mte-light-grey">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 text-center">
          <h1 className="text-2xl md:text-4xl font-nexa text-mte-black">
            {name}
          </h1>
          <p className="text-sm md:text-base text-mte-charcoal mt-1 font-lato">Historic Trends (2020–2024)</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow">
        {/* Foster & Kinship */}
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-2 mb-2">
            <img src={FosterKinshipIcon} alt="Kinship" className="w-5 h-5 md:w-6 md:h-6" />
            <h3 className="text-sm md:text-base font-bold uppercase text-mte-black">Foster and Kinship Families</h3>
          </div>
          <div className="h-32 md:h-32 md:h-48 flex items-end justify-between">
            {history.kinship.map((value, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="bg-mte-green w-7 rounded"
                  style={{ height: `${value * 2}px` }}
                ></div>
                <span className="text-sm mt-1 font-lato text-mte-charcoal">{years[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Adoptive */}
        <div className="bg-white p-3 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-2 mb-1">
            <img src={AdoptiveFamilyIcon} alt="Adoptive" className="w-5 h-5 md:w-6 md:h-6" />
            <h3 className="text-sm md:text-base font-bold uppercase text-mte-black">Adoptive Families</h3>
          </div>
          <div className="h-32 md:h-48 flex items-end justify-between">
            {history.adoption.map((value, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="bg-mte-yellow w-7 rounded"
                  style={{ height: `${value * 12}px` }}
                ></div>
                <span className="text-sm mt-1 font-lato text-mte-charcoal">{years[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biological */}
        <div className="bg-white p-3 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-2 mb-1">
            <img src={BiologicalFamilyIcon} alt="Biological" className="w-5 h-5 md:w-6 md:h-6" />
            <h3 className="text-sm md:text-base font-bold uppercase text-mte-black">Support for Biological Families</h3>
          </div>
          <div className="h-32 md:h-48 flex items-end justify-between">
            {history.biological.map((value, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="bg-mte-orange w-7 rounded"
                  style={{ height: `${value * 4}px` }}
                ></div>
                <span className="text-sm mt-1 font-lato text-mte-charcoal">{years[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wraparound */}
        <div className="bg-white p-3 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-2 mb-1">
            <img src={WrapAroundIcon} alt="Wraparound" className="w-5 h-5 md:w-6 md:h-6" />
            <h3 className="text-sm md:text-base font-bold uppercase text-mte-black">Wraparound Support</h3>
          </div>
          <div className="h-32 md:h-48 flex items-end justify-between">
            {history.wraparound.map((value, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="bg-mte-purple w-7 rounded"
                  style={{ height: `${value * 15}px` }}
                ></div>
                <span className="text-sm mt-1 font-lato text-mte-charcoal">{years[idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Change */}
      <div className="bg-white max-w-5xl mx-auto rounded-lg shadow-mte-card p-4 md:p-6 mb-6 md:mb-8 text-center">
        <h3 className="text-lg md:text-2xl font-source-serif italic mb-3 md:mb-4 text-mte-black">
          Historical Change (2020 to 2024)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-sm md:text-base font-lato">
          <div>
            <div className={`font-bold ${trends.childrenInCare < 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.childrenInCare > 0 ? '+' : ''}{trends.childrenInCare}%
            </div>
            <div className="text-mte-charcoal">Children in Care</div>
          </div>
          <div>
            <div className={`font-bold ${trends.licensedHomes > 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.licensedHomes > 0 ? '+' : ''}{trends.licensedHomes}%
            </div>
            <div className="text-mte-charcoal">Licensed Homes</div>
          </div>
          <div>
            <div className={`font-bold ${trends.waitingForAdoption < 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.waitingForAdoption > 0 ? '+' : ''}{trends.waitingForAdoption}%
            </div>
            <div className="text-mte-charcoal">Waiting for Adoption</div>
          </div>
          <div>
            <div className={`font-bold ${trends.reunificationRate > 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.reunificationRate > 0 ? '+' : ''}{trends.reunificationRate}%
            </div>
            <div className="text-mte-charcoal">Reunification Rate</div>
          </div>
          <div>
            <div className={`font-bold ${trends.familyPreservationCases < 0 ? 'text-mte-orange' : 'text-mte-green'}`}>
              {trends.familyPreservationCases > 0 ? '+' : ''}{trends.familyPreservationCases}%
            </div>
            <div className="text-mte-charcoal">Family Preservation</div>
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