import React, { useState } from "react";

// Assets
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";

const years = [2020, 2021, 2022, 2023, 2024];

// Available metrics for each category
const categoryMetrics = {
  kinship: [
    { id: 'children_in_care', label: 'Children in Care', data: { national: [120, 115, 110, 105, 100], state: [80, 75, 70, 65, 60], county: [60, 55, 50, 40, 30] } },
    { id: 'licensed_homes', label: 'Licensed Homes', data: { national: [100, 105, 110, 115, 120], state: [65, 68, 72, 75, 78], county: [45, 47, 50, 52, 55] } },
    { id: 'kinship_placements', label: 'Kinship Placements', data: { national: [85, 88, 90, 92, 95], state: [55, 57, 60, 62, 65], county: [35, 38, 40, 42, 45] } }
  ],
  adoption: [
    { id: 'waiting_adoption', label: 'Children Waiting for Adoption', data: { national: [50, 48, 47, 49, 50], state: [15, 14, 15, 16, 18], county: [2, 2, 3, 4, 6] } },
    { id: 'finalized_adoptions', label: 'Finalized Adoptions', data: { national: [45, 47, 48, 50, 52], state: [12, 13, 14, 15, 16], county: [1, 2, 2, 3, 4] } },
    { id: 'avg_months_adoption', label: 'Avg Months to Adoption', data: { national: [18, 17, 16, 15, 14], state: [19, 18, 17, 16, 15], county: [20, 19, 18, 17, 16] } }
  ],
  biological: [
    { id: 'family_preservation', label: 'Family Preservation Cases', data: { national: [140, 135, 130, 110, 105], state: [60, 55, 50, 45, 40], county: [30, 35, 32, 25, 20] } },
    { id: 'reunification_rate', label: 'Reunification Rate (%)', data: { national: [70, 72, 74, 76, 78], state: [68, 70, 72, 74, 76], county: [65, 67, 70, 72, 75] } },
    { id: 'support_services', label: 'Support Services Provided', data: { national: [160, 165, 170, 175, 180], state: [75, 78, 82, 85, 88], county: [35, 38, 40, 42, 45] } }
  ],
  wraparound: [
    { id: 'wraparound_cases', label: 'Wraparound Support Cases', data: { national: [30, 32, 35, 38, 40], state: [10, 12, 14, 15, 16], county: [1, 2, 3, 3, 4] } },
    { id: 'community_support', label: 'Community Support Programs', data: { national: [25, 28, 32, 35, 38], state: [8, 10, 12, 13, 15], county: [1, 1, 2, 2, 3] } },
    { id: 'respite_services', label: 'Respite Services Hours', data: { national: [40, 42, 45, 48, 50], state: [15, 17, 19, 21, 23], county: [3, 4, 5, 6, 7] } }
  ]
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
  // State for selected metrics in each category
  const [selectedMetrics, setSelectedMetrics] = useState({
    kinship: 'children_in_care',
    adoption: 'waiting_adoption',
    biological: 'family_preservation',
    wraparound: 'wraparound_cases'
  });

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

  const getRegionKey = () => {
    switch (regionLevel) {
      case "national":
        return "national";
      case "state":
        return "state";
      case "county":
        return "county";
      default:
        return "county";
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

  const name = getDisplayName();
  const regionKey = getRegionKey();
  const trends = getTrends();

  // Get selected metric data for each category
  const getMetricData = (category) => {
    const metricId = selectedMetrics[category];
    const metric = categoryMetrics[category].find(m => m.id === metricId);
    return metric ? metric.data[regionKey] : [];
  };

  const getMetricLabel = (category) => {
    const metricId = selectedMetrics[category];
    const metric = categoryMetrics[category].find(m => m.id === metricId);
    return metric ? metric.label : '';
  };

  const handleMetricChange = (category, metricId) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [category]: metricId
    }));
  };

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

      {/* Metrics Grid - Fully Responsive */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow">
        {/* Foster & Kinship */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={FosterKinshipIcon} alt="Kinship" className="w-10 h-10 md:w-12 md:h-12" />
            <h3 className="text-base md:text-lg font-bold text-mte-black font-lato">Foster and Kinship Families</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric:</label>
            <select 
              value={selectedMetrics.kinship}
              onChange={(e) => handleMetricChange('kinship', e.target.value)}
              className="w-full border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.kinship.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey">
              {getMetricData('kinship').map((value, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-mte-green w-full rounded transition-all hover:opacity-80"
                    style={{ 
                      height: `${Math.max(value * 1.5, 20)}px`,
                      maxWidth: '50px'
                    }}
                  ></div>
                  <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Adoptive */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={AdoptiveFamilyIcon} alt="Adoptive" className="w-10 h-10 md:w-12 md:h-12" />
            <h3 className="text-base md:text-lg font-bold text-mte-black font-lato">Adoptive Families</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric:</label>
            <select 
              value={selectedMetrics.adoption}
              onChange={(e) => handleMetricChange('adoption', e.target.value)}
              className="w-full border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.adoption.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey">
              {getMetricData('adoption').map((value, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-mte-yellow w-full rounded transition-all hover:opacity-80"
                    style={{ 
                      height: `${Math.max(value * 8, 20)}px`,
                      maxWidth: '50px'
                    }}
                  ></div>
                  <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biological */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={BiologicalFamilyIcon} alt="Biological" className="w-10 h-10 md:w-12 md:h-12" />
            <h3 className="text-base md:text-lg font-bold text-mte-black font-lato">Support for Biological Families</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric:</label>
            <select 
              value={selectedMetrics.biological}
              onChange={(e) => handleMetricChange('biological', e.target.value)}
              className="w-full border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.biological.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey">
              {getMetricData('biological').map((value, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-mte-orange w-full rounded transition-all hover:opacity-80"
                    style={{ 
                      height: `${Math.max(value * 3, 20)}px`,
                      maxWidth: '50px'
                    }}
                  ></div>
                  <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wraparound */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-mte-card">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <img src={WrapAroundIcon} alt="Wraparound" className="w-10 h-10 md:w-12 md:h-12" />
            <h3 className="text-base md:text-lg font-bold text-mte-black font-lato">Wraparound Support</h3>
          </div>
          
          {/* Metric Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-lato text-mte-charcoal mb-2">Select a Metric:</label>
            <select 
              value={selectedMetrics.wraparound}
              onChange={(e) => handleMetricChange('wraparound', e.target.value)}
              className="w-full border border-mte-light-grey rounded-lg px-3 py-2 text-sm font-lato text-mte-charcoal focus:outline-none focus:ring-2 focus:ring-mte-blue"
            >
              {categoryMetrics.wraparound.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Responsive bar chart container with y-axis */}
          <div className="relative h-48 md:h-64 flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-2 text-xs text-mte-charcoal font-lato">
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            {/* Y-axis line */}
            <div className="w-px bg-mte-light-grey"></div>
            {/* Chart area */}
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-mte-light-grey">
              {getMetricData('wraparound').map((value, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-mte-purple w-full rounded transition-all hover:opacity-80"
                    style={{ 
                      height: `${Math.max(value * 10, 20)}px`,
                      maxWidth: '50px'
                    }}
                  ></div>
                  <span className="text-xs md:text-sm mt-2 font-lato text-mte-charcoal whitespace-nowrap">{years[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Change - Responsive Grid */}
      <div className="bg-white max-w-5xl mx-auto rounded-lg shadow-mte-card p-4 md:p-6 mb-6 md:mb-8 mx-4">
        <h3 className="text-2xl md:text-3xl font-nexa mb-3 md:mb-4 text-mte-black text-center">
          Historical Change (2020 to 2024)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-sm md:text-base font-lato">
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.childrenInCare < 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.childrenInCare > 0 ? '+' : ''}{trends.childrenInCare}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Children in Care</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.licensedHomes > 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.licensedHomes > 0 ? '+' : ''}{trends.licensedHomes}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Licensed Homes</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.waitingForAdoption < 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.waitingForAdoption > 0 ? '+' : ''}{trends.waitingForAdoption}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Waiting for Adoption</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg md:text-xl ${trends.reunificationRate > 0 ? 'text-mte-green' : 'text-mte-orange'}`}>
              {trends.reunificationRate > 0 ? '+' : ''}{trends.reunificationRate}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Reunification Rate</div>
          </div>
          <div className="text-center col-span-2 md:col-span-1">
            <div className={`font-bold text-lg md:text-xl ${trends.familyPreservationCases < 0 ? 'text-mte-orange' : 'text-mte-green'}`}>
              {trends.familyPreservationCases > 0 ? '+' : ''}{trends.familyPreservationCases}%
            </div>
            <div className="text-mte-charcoal text-xs md:text-sm leading-tight">Family Preservation</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-right pr-6">
        <img src={MTELogo} alt="More Than Enough" className="h-6 md:h-8 inline-block" />
      </div>
    </div>
  );
}