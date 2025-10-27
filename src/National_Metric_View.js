import React from "react";

const National_Metric_View = ({ state }) => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">National Metric View</h1>
      <p className="mt-2 text-gray-600">
        Showing metrics for: <span className="font-semibold">{state || "Example State"}</span>
      </p>
      {/* Mock stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4 text-center">
          <h2 className="text-xl font-bold">1,234</h2>
          <p className="text-sm text-gray-500">Children in Care</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <h2 className="text-xl font-bold">567</h2>
          <p className="text-sm text-gray-500">Licensed Homes</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <h2 className="text-xl font-bold">89%</h2>
          <p className="text-sm text-gray-500">Reunification Rate</p>
        </div>
      </div>
    </div>
  );
};

export default National_Metric_View;
