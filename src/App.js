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
import HistoricView from "./views/HistoricView";

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

    // HISTORIC VIEW - Consolidated!
    if (view === "historic") {
      return <HistoricView regionLevel={region} regionId={selectedRegion?.id} />;
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