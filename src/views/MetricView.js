import React, { useState } from "react";
import { countyData, stateData, nationalStats } from "../real-data.js";

// Assets
import ChurchIcon from "../assets/church_icon.png";
import FosterKinshipIcon from "../assets/FosterKinship_icon.png";
import AdoptiveFamilyIcon from "../assets/Adoptive_family_icon.png";
import BiologicalFamilyIcon from "../assets/BiologicalFamily_icon.png";
import WrapAroundIcon from "../assets/WrapAround_icon.png";
import MTELogo from "../assets/MTE_Logo.png";
import InteractiveUSMap from "../InteractiveUSMap";
import InteractiveStateMap from "../InteractiveStateMap";

// Hoverable text with tooltip
const HoverableText = ({ children, tooltip }) => (
  <div className="relative inline-flex items-center group">
    <span className="underline decoration-dotted underline-offset-2 decoration-mte-blue">
      {children}
    </span>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-mte-charcoal text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
      {tooltip}
    </div>
  </div>
);

const MetricView = ({ regionLevel, regionId, onSelectRegion }) => {
  // State for selected metric
  const [selectedMetric, setSelectedMetric] = useState("Count of Family Preservation Cases");

  // Convert state names to codes
  const stateNameToCode = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY'
  };

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
        // regionId is lowercase-hyphenated format: "alabama", "new-york", etc.
        console.log('Looking up state data for regionId:', regionId);
        console.log('Available state keys:', Object.keys(stateData));
        
        let state = stateData[regionId];
        
        // Fallback to first available state if not found
        if (!state) {
          console.warn('State not found for regionId:', regionId, '- using first available state');
          console.warn('Make sure your mock-data.js has an entry for:', regionId);
          state = Object.values(stateData)[0];
        }
        
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

  // Get trend data based on selected metric
  const getTrendData = () => {
    switch (selectedMetric) {
      case "Count of Family Preservation Cases":
        return {
          title: "Number of Family Preservation Cases in the U.S. (by 1000s)",
          values: [140, 105, 110],
          years: [2022, 2023, 2024],
          labels: ["140,000 Cases", "105,000 Cases", "110,000 Cases"],
          source: "AFCARS 2022–2024"
        };
      case "Count of Children Waiting For Adoption":
        return {
          title: "Children Waiting For Adoption in the U.S. (by 1000s)",
          values: [52, 50, 48],
          years: [2022, 2023, 2024],
          labels: ["52,000 Children", "50,000 Children", "48,000 Children"],
          source: "AFCARS 2022–2024"
        };
      case "Ratio of Licensed Homes to Children in Care":
        return {
          title: "Licensed Foster Homes per Child in Care (U.S.)",
          values: [0.68, 0.72, 0.75],
          years: [2022, 2023, 2024],
          labels: ["0.68 Homes per Child", "0.72 Homes per Child", "0.75 Homes per Child"],
          source: "AFCARS 2022–2024"
        };
      case "Biological Family Reunification Rate":
        return {
          title: "Biological Family Reunification Rate (% of exits)",
          values: [72, 74, 76],
          years: [2022, 2023, 2024],
          labels: ["72% Reunified", "74% Reunified", "76% Reunified"],
          source: "AFCARS 2022–2024"
        };
      default:
        return {
          title: "Number of Family Preservation Cases in the U.S. (by 1000s)",
          values: [140, 105, 110],
          years: [2022, 2023, 2024],
          labels: ["140,000 Cases", "105,000 Cases", "110,000 Cases"],
          source: "AFCARS 2022–2024"
        };
    }
  };

  const trendData = getTrendData();

  // Handler for when a state is clicked on the national map
  const handleStateClick = (stateCode, stateName, clickedStateData) => {
    console.log('State clicked:', { stateCode, stateName, clickedStateData });
    
    // Convert state name to lowercase with hyphens to match mock-data format
    // "New York" -> "new-york", "Alabama" -> "alabama"
    const stateId = stateName.toLowerCase().replace(/\s+/g, '-');
    
    console.log('Converted to state ID:', stateId);
    console.log('Available state keys in stateData:', Object.keys(stateData));
    
    // Navigate to state view
    if (onSelectRegion) {
      onSelectRegion({ 
        level: 'state', 
        id: stateId,        // "new-york" or "alabama"
        name: stateName,    // "New York" or "Alabama"
        code: stateCode     // "NY" or "AL"
      });
    }
  };

  // Handler for when a county is clicked on the state map
  const handleCountyClick = (fips, countyName, clickedCountyData) => {
    console.log('County clicked:', { fips, countyName, clickedCountyData });
    
    // Get the state code from current state
    const stateCode = stateNameToCode[data.name];
    
    // Convert county name to lowercase with hyphens and add state code
    // "Butler" -> "butler-al", "Nassau" -> "nassau-ny"
    const countyId = `${countyName.toLowerCase().replace(/\s+/g, '-')}-${stateCode?.toLowerCase()}`;
    
    console.log('Converted to county ID:', countyId);
    console.log('Available county keys:', Object.keys(countyData));
    
    // Navigate to county view
    if (onSelectRegion) {
      onSelectRegion({ 
        level: 'county', 
        id: countyId,           // "butler-al" or "nassau-ny"
        name: `${countyName} County, ${data.name}`,  // "Butler County, Alabama"
        fips: fips 
      });
    }
  };

  // Conditional rendering helpers
  const showMap = regionLevel === "national";
  const showCountyDetails = regionLevel === "county";
  const showStateDetails = regionLevel === "state";
  const showStateContext = regionLevel === "county";
  const showPopulation = regionLevel === "county";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`relative`}>
        <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 pb-2 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl text-center font-nexa text-mte-black px-4">
            {data.name}
          </h1>
          {data.subtitle && (
            <p className="text-sm md:text-base text-mte-charcoal text-center mt-1 md:mt-2 px-4 font-lato">{data.subtitle}</p>
          )}
        </div>
      </header>

      {/* National Map Section */}
      {showMap && (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Sidebar - National only - Stacks on mobile */}
          <div className="w-full lg:w-1/4 space-y-3 md:space-y-4">
            {/* Jump selectors - UPDATED WITH FUNCTIONALITY */}
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
              
              {/* Jump to County Dropdown */}
              <select 
                className="w-full border border-mte-light-grey rounded p-2 text-base font-lato text-mte-charcoal"
                value=""
                onChange={(e) => {
                  if (e.target.value && onSelectRegion) {
                    const countyId = e.target.value;
                    const county = countyData[countyId];
                    if (county) {
                      onSelectRegion({ 
                        level: 'county', 
                        id: countyId,
                        name: county.name,
                        fips: county.fips
                      });
                    }
                  }
                }}
              >
                <option value="">Jump to a County</option>
                {Object.keys(countyData).sort((a, b) => {
                  const nameA = countyData[a].name;
                  const nameB = countyData[b].name;
                  return nameA.localeCompare(nameB);
                }).map(countyId => (
                  <option key={countyId} value={countyId}>
                    {countyData[countyId].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-lato font-bold mb-1 text-mte-black">Metrics</h3>
              <p className="text-sm text-mte-charcoal mb-2 font-lato">
                Filter by metric type to see what is happening across the country
              </p>
              <div className="relative">
                <select 
                  className="w-full border-2 border-mte-light-grey rounded-lg p-3 text-base font-lato text-mte-charcoal cursor-pointer appearance-none bg-white hover:border-mte-blue focus:border-mte-blue focus:ring-2 focus:ring-mte-blue-20 focus:outline-none transition-colors"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
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
                {/* Custom dropdown arrow */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-mte-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Trends */}
            <div className="bg-white p-4 rounded-lg shadow-mte-card">
              <h3 className="text-base font-lato font-bold text-mte-black mb-1">Trends</h3>
              <p className="text-sm text-mte-charcoal mb-3 font-lato">
                See trends for your selected metric over the past five years
              </p>
              <div className="bg-mte-subdued-white p-3 rounded relative overflow-hidden">
                <div className="text-sm font-medium mb-2 font-lato text-mte-black">
                  {trendData.title}
                </div>
                <div className="h-28 bg-white rounded flex items-end justify-between px-3 pb-2 relative overflow-visible">
                  {trendData.values.map((value, index) => {
                    const maxValue = Math.max(...trendData.values);
                    const heightPercent = (value / maxValue) * 100;
                    const heightPx = Math.round((heightPercent / 100) * 72);
                    
                    return (
                      <div key={index} className="flex flex-col items-center relative group flex-1 max-w-[60px]">
                        <div 
                          className="bg-mte-orange w-full max-w-[32px] rounded mb-1 cursor-pointer hover:bg-mte-orange-80 transition-colors relative" 
                          style={{ height: `${heightPx}px`, maxHeight: "72px" }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-mte-charcoal text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            <div className="font-semibold">{trendData.labels[index]}</div>
                            <div>{selectedMetric} on</div>
                            <div>December 31, {trendData.years[index]}</div>
                            <div className="text-mte-subdued-white mt-1">Source: AFCARS</div>
                          </div>
                        </div>
                        <span className="text-xs text-mte-charcoal font-lato whitespace-nowrap">{trendData.years[index]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-mte-charcoal font-lato">
                  Source: {trendData.source}
                </div>
              </div>
            </div>
          </div>

          {/* Main Area - National only */}
          <div className="w-full lg:w-3/4">
            {/* Interactive Map */}
            <div className="bg-white rounded-lg shadow-mte-card p-4 mb-6">
              <InteractiveUSMap 
                selectedMetric={selectedMetric}
                onStateClick={handleStateClick}
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
        <>
          {/* State Map */}
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="bg-white rounded-lg shadow-mte-card p-4">
              <InteractiveStateMap
                stateCode={stateNameToCode[data.name] || 'AL'}
                stateName={data.name}
                selectedMetric="Children in Care"
                onCountyClick={handleCountyClick}
              />
            </div>
          </div>

          {/* State Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
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
        </>
      )}

      {/* County-specific: Total Churches + Population Card */}
      {showCountyDetails && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center mx-auto" style={{ maxWidth: '800px' }}>
            <div className="flex justify-center gap-12">
              {/* Churches */}
              <div className="flex flex-col items-center">
                <img src={ChurchIcon} alt="Church" className="w-20 h-20 mb-3" />
                <div className="flex items-center gap-1">
                  <div className="text-xl md:text-2xl font-black text-mte-blue">{data.totalChurches}</div>
                  <div className="text-base text-mte-charcoal font-lato">Churches</div>
                </div>
              </div>
              
              {/* Population */}
              <div className="flex flex-col items-center">
                <svg 
  className="w-20 h-20 text-mte-charcoal mb-3" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  viewBox="0 0 24 24"
>
  {/* Left Adult */}
  <circle cx="6.5" cy="5.5" r="2"/>
  <path d="M4 16v-5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v5"/>
  
  {/* Right Adult */}
  <circle cx="17.5" cy="5.5" r="2"/>
  <path d="M15 16v-5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v5"/>
  
  {/* Left Child (smaller) */}
  <circle cx="9.5" cy="11" r="1.5"/>
  <path d="M8 16v-3c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v3"/>
  
  {/* Right Child (smaller) */}
  <circle cx="14.5" cy="11" r="1.5"/>
  <path d="M13 16v-3c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v3"/>
  
  {/* Base line */}
  <line x1="3" y1="16" x2="21" y2="16"/>
</svg>
                <div className="flex items-center gap-1">
                  <div className="text-xl md:text-2xl font-black text-mte-blue">{data.population?.toLocaleString()}</div>
                  <div className="text-base text-mte-charcoal font-lato">Population</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards - County only */}
      {showCountyDetails && (
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Foster & Kinship */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={FosterKinshipIcon} alt="Foster & Kinship" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Families who provide temporary care for children through formal foster care or informal kinship arrangements with relatives.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Foster and Kinship Families</h3>
            </HoverableText>

            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.licensedHomesPerChild}</div>
              <HoverableText tooltip="The ratio of available licensed foster homes to children currently in out-of-home care.">
                <div className="text-base text-mte-charcoal font-lato">Licensed Homes Per Child in Care</div>
              </HoverableText>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-base max-w-sm mx-auto">
              <HoverableText tooltip="Total number of children in the foster care system.">
                <div className="text-left text-mte-charcoal font-lato">Children in Care</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenInCare}</div>

              <HoverableText tooltip="Children placed with licensed foster families.">
                <div className="text-left text-mte-charcoal font-lato">Children in Family</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenInFamily}</div>

              <HoverableText tooltip="Children placed with relatives or family friends.">
                <div className="text-left text-mte-charcoal font-lato">Children in Kinship Care</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenInKinship}</div>

              <HoverableText tooltip="Children from this county placed in care outside county boundaries.">
                <div className="text-left text-mte-charcoal font-lato">Children Out-of-County</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenOutOfCounty}</div>

              <HoverableText tooltip="Total number of state-licensed foster homes in this county.">
                <div className="text-left text-mte-charcoal font-lato">Licensed Homes</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.licensedHomes}</div>
            </div>
          </div>

          {/* Adoptive Families */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={AdoptiveFamilyIcon} alt="Adoptive Families" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Families who have completed or are in the process of legally adopting children from foster care.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Adoptive Families</h3>
            </HoverableText>

            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.waitingForAdoption}</div>
              <HoverableText tooltip="Children whose parental rights have been terminated and are legally free for adoption.">
                <div className="text-base text-mte-charcoal font-lato">Children Waiting For Adoption</div>
              </HoverableText>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-base max-w-md mx-auto">
              <HoverableText tooltip="Number of finalized adoptions in the current year.">
                <div className="text-left text-mte-charcoal font-lato">Children Adopted in 2024</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.childrenAdopted2024}</div>

              <HoverableText tooltip="Average time from termination of parental rights to finalized adoption.">
                <div className="text-left text-mte-charcoal font-lato">Average Months to Adoption</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.avgMonthsToAdoption}</div>
            </div>
          </div>

          {/* Support for Biological Families */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={BiologicalFamilyIcon} alt="Biological Families" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Services and support provided to birth parents working toward reunification with their children.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Support for Biological Families</h3>
            </HoverableText>

            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.familyPreservationCases}</div>
              <HoverableText tooltip="Active cases providing intensive services to prevent foster care placement.">
                <div className="text-base text-mte-charcoal font-lato">Family Preservation Cases</div>
              </HoverableText>
            </div>

            <div className="flex justify-center items-center gap-1">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.reunificationRate}%</div>
              <HoverableText tooltip="Percentage of children who successfully return to their birth families.">
                <div className="text-base text-mte-charcoal font-lato">Biological Family Reunification Rate</div>
              </HoverableText>
            </div>
          </div>

          {/* Wraparound Support */}
          <div className="bg-white rounded-2xl shadow-mte-card p-6 text-center">
            <img src={WrapAroundIcon} alt="Wraparound Support" className="mx-auto w-20 h-20 mb-3" />
            <HoverableText tooltip="Comprehensive community-based support services for all families involved in foster care.">
              <h3 className="text-lg font-lato font-bold text-mte-black leading-none mb-4">Wraparound Support</h3>
            </HoverableText>

            <div className="flex justify-center items-center gap-1 mb-4">
              <div className="text-xl md:text-2xl font-black text-mte-blue">{data.supportPercentage}%</div>
              <HoverableText tooltip="Percentage of local churches actively engaged in foster care ministry.">
                <div className="text-base text-mte-charcoal font-lato">Churches Providing Support</div>
              </HoverableText>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-base max-w-md mx-auto">
              <HoverableText tooltip="Number of churches with active foster care support programs.">
                <div className="text-left text-mte-charcoal font-lato">Churches Providing Support</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.churchesProvidingSupport}</div>

              <HoverableText tooltip="Total number of churches in this county.">
                <div className="text-left text-mte-charcoal font-lato">Total Churches</div>
              </HoverableText>
              <div className="text-right font-semibold text-mte-black font-lato">{data.totalChurches}</div>
            </div>
          </div>
        </main>
      )}

      {/* Statewide summary - County only */}
      {showStateContext && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-mte-card px-6 py-6 text-center">
            <h3 className="text-2xl font-nexa text-mte-black mb-4">
              Statewide Data Summary for {data.state}
            </h3>

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