import React, { useState, useEffect } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";

// Shared
import TopNav from "./TopNav";
import LandingPage from "./Landing_Page";

// Unified Views
import MetricView from "./views/MetricView";
import OrganizationalView from "./views/OrganizationalView";
import HistoricView from "./views/HistoricView";

// Import data for looking up names
import { stateData, countyData, stateNameToCode } from "./real-data.js";

// View component mapping
const VIEW_COMPONENTS = {
  metric: MetricView,
  organizational: OrganizationalView,
  historic: HistoricView,
};

// ============================================
// STEP 2: URL READING - Parse hash into state
// ============================================
function parseHashToState(hash) {
  // Remove leading '#' if present
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  
  // No hash = landing page
  if (!cleanHash || cleanHash === '/') {
    return { region: 'landing', view: 'metric', selectedRegion: null };
  }

  // Split hash: "/national/metric" -> ["", "national", "metric"]
  const parts = cleanHash.split('/').filter(Boolean);
  
  // Need at least 2 parts: [level, view] or [level, id, view]
  if (parts.length < 2) {
    console.warn('Invalid hash format:', hash);
    return { region: 'landing', view: 'metric', selectedRegion: null };
  }

  const level = parts[0]; // "national", "state", or "county"
  
  // National: #/national/metric
  if (level === 'national') {
    const view = parts[1] || 'metric';
    return {
      region: 'national',
      view: view,
      selectedRegion: { level: 'national', id: 'usa', name: 'United States' }
    };
  }
  
  // State or County: need ID
  if (parts.length < 3) {
    console.warn('Missing ID for state/county:', hash);
    return { region: 'landing', view: 'metric', selectedRegion: null };
  }

  const id = parts[1];      // "alabama" or "nassau-ny"
  const view = parts[2] || 'metric';

  // State: #/state/alabama/metric
  if (level === 'state') {
    const stateInfo = stateData[id];
    if (!stateInfo) {
      console.warn('State not found:', id);
      return { region: 'landing', view: 'metric', selectedRegion: null };
    }
    
    const stateCode = stateNameToCode[stateInfo.name];
    return {
      region: 'state',
      view: view,
      selectedRegion: {
        level: 'state',
        id: id,
        name: stateInfo.name,
        code: stateCode
      }
    };
  }
  
  // County: #/county/nassau-ny/metric
  if (level === 'county') {
    const countyInfo = countyData[id];
    if (!countyInfo) {
      console.warn('County not found:', id);
      return { region: 'landing', view: 'metric', selectedRegion: null };
    }
    
    // Extract state code from county ID (e.g., "nassau-ny" -> "NY")
    const parts = id.split('-');
    const stateCode = parts[parts.length - 1]?.toUpperCase();
    
    return {
      region: 'county',
      view: view,
      selectedRegion: {
        level: 'county',
        id: id,
        name: countyInfo.name,
        code: stateCode
      }
    };
  }

  // Unknown level
  console.warn('Unknown region level:', level);
  return { region: 'landing', view: 'metric', selectedRegion: null };
}
// ============================================

function App() {
  const [region, setRegion] = useState("landing");
  const [view, setView] = useState("metric");
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Detect embed mode from URL parameter
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  // ============================================
  // STEP 2: URL READING - Read hash on initial load
  // ============================================
  useEffect(() => {
    const initialHash = window.location.hash;
    console.log('📖 Reading initial URL:', initialHash);
    
    if (initialHash) {
      const parsed = parseHashToState(initialHash);
      console.log('✅ Parsed state:', parsed);
      
      setRegion(parsed.region);
      setView(parsed.view);
      setSelectedRegion(parsed.selectedRegion);
    }
  }, []); // Empty array = runs once on mount
  // ============================================

  // ============================================
  // STEP 3: HASH CHANGE LISTENER - Handle back/forward navigation
  // ============================================
  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash;
      console.log('🔙 Hash changed (back/forward):', newHash);
      
      const parsed = parseHashToState(newHash);
      console.log('✅ Updating state from hash:', parsed);
      
      setRegion(parsed.region);
      setView(parsed.view);
      setSelectedRegion(parsed.selectedRegion);
    };

    // Listen for hash changes (back/forward button clicks)
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup: remove listener when component unmounts
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // Empty array = runs once, sets up listener
  // ============================================

  // ============================================
  // STEP 1: URL WRITING - Update hash when state changes
  // ============================================
  useEffect(() => {
    // Don't set hash for landing page
    if (region === "landing") {
      // Clear hash if we're on landing
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    // Build hash for non-landing pages
    let hash = '';
    
    if (region === "national") {
      hash = `#/national/${view}`;
    } else if (region === "state" && selectedRegion?.id) {
      hash = `#/state/${selectedRegion.id}/${view}`;
    } else if (region === "county" && selectedRegion?.id) {
      hash = `#/county/${selectedRegion.id}/${view}`;
    }

    // Update URL if hash changed
    if (hash && window.location.hash !== hash) {
      window.location.hash = hash;
      console.log('✅ URL updated:', hash); // Debug log - can remove later
    }
  }, [region, view, selectedRegion]);
  // ============================================

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

  // Landing page (not shown in embed mode)
  if (region === "landing" && !isEmbed) {
    return (
      <LandingPage
        onSelectRegion={handleSelectRegion}
        onSwitchView={handleSwitchView}
      />
    );
  }

  // In embed mode with no region, default to national historic view
  if (region === "landing" && isEmbed) {
    return (
      <div className="App min-h-screen">
        <div className="w-full">
          <HistoricView
            regionLevel="national"
            regionId="usa"
            selectedRegion={{ level: 'national', id: 'usa', name: 'United States' }}
            onSelectRegion={handleSelectRegion}
          />
        </div>
      </div>
    );
  }

  // Get the view component
  const ViewComponent = VIEW_COMPONENTS[view];

  return (
    <div className="App min-h-screen">
      {!isEmbed && (
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