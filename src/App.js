import React, { useState } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";

// Shared
import TopNav from "./TopNav";

// Landing
import LandingPage from "./Landing_Page";

// Unified Views
import MetricView from "./views/MetricView";
import OrganizationalView from "./views/OrganizationalView";

// National
import National_Historic_View from "./National_Historic_View";

// State
import State_Historic_View from "./State_Historic_View";

// County
import County_Historic_View from "./County_Historic_View";

// Download Page
import Download_Page from "./Download_Page";

function App() {
  // region = "landing" | "national" | "state" | "county"
  const [region, setRegion] = useState("landing");
  // view = "metric" | "organizational" | "historic" | "download"
  const [view, setView] = useState("metric");
  // selectedRegion holds the chosen object from Region_Menu
  // e.g. { level: "county", id: "butler-al" }
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Called when user selects from LandingPage or Region_Menu
  const handleSelectRegion = ({ level, id }) => {
    setRegion(level);
    setView("metric"); // default to metric view when switching
    setSelectedRegion({ level, id });
  };

  const handleSwitchView = (newView) => {
    if (newView === "download") {
      setView("download");
      return;
    }
    setView(newView);
  };

  const renderView = () => {
    // DOWNLOAD PAGE
    if (view === "download") {
      return (
        <Download_Page
          onSelectRegion={handleSelectRegion}
          onSwitchView={handleSwitchView}
        />
      );
    }

    if (region === "landing") {
      return (
        <LandingPage
          onSelectRegion={handleSelectRegion}
          onSwitchView={handleSwitchView}
        />
      );
    }

    // METRIC VIEW - Consolidated!
    if (view === "metric") {
      return <MetricView regionLevel={region} regionId={selectedRegion?.id} />;
    }

    // ORGANIZATIONAL VIEW - Consolidated!
    if (view === "organizational") {
      return <OrganizationalView regionLevel={region} regionId={selectedRegion?.id} />;
    }

    // NATIONAL
    if (region === "national") {
      if (view === "historic")
        return <National_Historic_View country={selectedRegion?.id} />;
    }

    // STATE
    if (region === "state") {
      if (view === "historic")
        return <State_Historic_View state={selectedRegion?.id} />;
    }

    // COUNTY
    if (region === "county") {
      if (view === "historic")
        return <County_Historic_View county={selectedRegion?.id} />;
    }

    return null;
  };

  return (
    <div className="App min-h-screen">
      {region !== "landing" && (
        <TopNav
          currentRegion={region}
          currentView={view}
          onSelectRegion={handleSelectRegion}
          onSwitchView={handleSwitchView}
        />
      )}
      <div className="w-full">
        {renderView()}
      </div>
    </div>
  );
}

export default App;