import React from 'react';

const StaticMap = ({ currentView, selectedState, onStateClick }) => {
  const baseMapUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDk2MCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzE2YTM0YSIgLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgSW50ZXJhY3RpdmUgVVMgTWFwIFBsYWNlaG9sZGVyCiAgPC90ZXh0Pgo8L3N2Zz4K";
  
  return (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
      <img 
        src={baseMapUrl} 
        alt="US Map" 
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => selectedState !== 'alabama' && onStateClick && onStateClick('alabama')}
      />
      {currentView === 'national' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded">
            Click on states to explore data
          </div>
        </div>
      )}
      {currentView === 'organization' && (
        <>
          {/* Example organization markers */}
          <div className="absolute top-20 left-40 w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="absolute top-32 left-60 w-3 h-3 bg-purple-500 rounded-full"></div>
          <div className="absolute top-44 right-40 w-3 h-3 bg-yellow-500 rounded-full"></div>
        </>
      )}
    </div>
  );
};

export default StaticMap;