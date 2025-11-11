import React, { useState } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";

// Shared
import TopNav from "./TopNav";
import LandingPage from "./Landing_Page";

// Unified Views
import MetricView from "./views/MetricView";
import OrganizationalView from "./views/OrganizationalView";
import HistoricView from "./views/HistoricView";

// View component mapping
const VIEW_COMPONENTS = {
  metric: MetricView,
  organizational: OrganizationalView,
  historic: HistoricView,
};

function App() {
  const [region, setRegion] = useState("landing");
  const [view, setView] = useState("metric");
  const [selectedRegion, setSelectedRegion] = useState(null);

  const handleSelectRegion = ({ level, id, name, code, view: requestedView }) => {
    console.log('App: handleSelectRegion', { level, id, name, code, requestedView });
    setRegion(level);
    // Only change view if explicitly requested, otherwise keep current view
    if (requestedView) {
      setView(requestedView);
    }
    setSelectedRegion({ level, id, name, code });
  };

  const handleSwitchView = (newView) => {
    setView(newView);
  };

  // Landing page
  if (region === "landing") {
    return (
      <LandingPage
        onSelectRegion={handleSelectRegion}
        onSwitchView={handleSwitchView}
      />
    );
  }

  // Get the view component
  const ViewComponent = VIEW_COMPONENTS[view];

  // Historic view has its own navigation, so don't show TopNav
  const showTopNav = view !== 'historic';

  return (
    <div className="App min-h-screen">
      {showTopNav && (
        <TopNav
          currentRegion={region}
          currentView={view}
          selectedRegion={selectedRegion}
          onSelectRegion={handleSelectRegion}
          onSwitchView={handleSwitchView}
        />
      )}
      <div className="w-full">
        {ViewComponent && (
          <ViewComponent
            regionLevel={region}
            regionId={selectedRegion?.id}
            selectedRegion={selectedRegion}
            onSelectRegion={handleSelectRegion}
          />
        )}
      </div>
    </div>
  );
}

export default App;