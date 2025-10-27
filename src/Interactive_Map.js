import React from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

// Small red dot icon
const dotIcon = new L.DivIcon({
  className: "custom-dot",
  html: '<div style="width:10px; height:10px; background:#e63946; border-radius:50%;"></div>'
});

export default function InteractiveMap() {
  const markers = [
    { id: 1, position: [37.7749, -122.4194], text: "San Francisco" },
    { id: 2, position: [34.0522, -118.2437], text: "Los Angeles" },
    { id: 3, position: [40.7128, -74.0060], text: "New York" }
  ];

  return (
    <MapContainer
      center={[37.7749, -122.4194]} // initial center
      zoom={4}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((m) => (
        <Marker key={m.id} position={m.position} icon={dotIcon}>
          <Tooltip>{m.text}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
