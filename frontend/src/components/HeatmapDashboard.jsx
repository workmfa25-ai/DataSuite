import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getShipsActiveHeatmap, getAverageSpeedHeatmap } from '../services/aisApi';
import HeatmapLayer from './HeatmapLayer';

export default function HeatmapDashboard() {
  const [shipsActiveData, setShipsActiveData] = useState([]);
  const [averageSpeedData, setAverageSpeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const [shipsActive, averageSpeed] = await Promise.all([
          getShipsActiveHeatmap(),
          getAverageSpeedHeatmap(),
        ]);
        setShipsActiveData(shipsActive);
        setAverageSpeedData(averageSpeed);
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
        setError("Failed to load heatmap data.");
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading heatmap data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Heatmap Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ships Active Heatmap</h3>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <HeatmapLayer data={shipsActiveData} />
          </MapContainer>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Speed Heatmap</h3>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <HeatmapLayer data={averageSpeedData} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
