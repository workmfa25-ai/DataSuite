import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getShips, getApiHealth } from "../services/aisApi";
import '../styles/components/Map.css';

export default function Map({ sidebarOpen, setSidebarOpen, setRefreshData, isRefreshing }) {
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const gridLayerRef = useRef(null);
  const mountedRef = useRef(true);

  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [gridStep, setGridStep] = useState(5); // Default 5° grid
  const [showGrid, setShowGrid] = useState(true); // Grid on/off toggle

  // Helper functions for grid
  const isNearMultiple = (value, step) => Math.abs(value - Math.round(value / step) * step) < 1e-6;
  const latLabel = (deg) => `${Math.abs(deg)}°${deg >= 0 ? 'N' : 'S'}`;
  const lonLabel = (deg) => `${Math.abs(deg)}°${deg >= 0 ? 'E' : 'W'}`;

  // Build global grid like main.html
  const buildGlobalGrid = () => {
    if (!mapRef.current || !gridLayerRef.current) return;
    
    // Clear existing grid
    gridLayerRef.current.clearLayers();
    
    if (!showGrid || gridStep === 0) return; // Grid off
    
    const LAT_MIN = -85, LAT_MAX = 85; // Avoid extreme distortion at poles
    const LON_MIN = -180, LON_MAX = 180;
    
    // Create latitude lines (horizontal)
    for (let lat = Math.ceil(LAT_MIN / gridStep) * gridStep; lat <= LAT_MAX; lat += gridStep) {
      const major10 = isNearMultiple(lat, 10);
      
      const latLine = L.polyline([[lat, LON_MIN], [lat, LON_MAX]], {
        color: major10 ? '#00bcd4' : '#90a4ae',
        weight: major10 ? 1.6 : 1,
        opacity: major10 ? 0.7 : 0.5,
        dashArray: major10 ? null : '4,4',
        interactive: false
      });
      gridLayerRef.current.addLayer(latLine);
      
      // Add latitude label on the left edge
      const latLabelMarker = L.marker([lat, LON_MIN + 2], {
        interactive: false,
        icon: L.divIcon({
          className: 'grid-label',
          html: latLabel(lat),
          iconSize: [40, 20],
          iconAnchor: [0, 10]
        })
      });
      gridLayerRef.current.addLayer(latLabelMarker);
    }
    
    // Create longitude lines (vertical)
    for (let lon = Math.ceil(LON_MIN / gridStep) * gridStep; lon <= LON_MAX; lon += gridStep) {
      const major10 = isNearMultiple(lon, 10);
      
      const lonLine = L.polyline([[LAT_MIN, lon], [LAT_MAX, lon]], {
        color: major10 ? '#00bcd4' : '#90a4ae',
        weight: major10 ? 1.6 : 1,
        opacity: major10 ? 0.7 : 0.5,
        dashArray: major10 ? null : '4,4',
        interactive: false
      });
      gridLayerRef.current.addLayer(lonLine);
      
      // Add longitude label on the top edge
      const lonLabelMarker = L.marker([LAT_MAX - 2, lon], {
        interactive: false,
        icon: L.divIcon({
          className: 'grid-label',
          html: lonLabel(lon),
          iconSize: [40, 20],
          iconAnchor: [20, 0]
        })
      });
      gridLayerRef.current.addLayer(lonLabelMarker);
    }
  };

  // Ship type to color mapping
  const getShipColor = (shipType) => {
    const type = (shipType || "").toLowerCase();
    if (type.includes("cargo") || type.includes("container")) return "#16a34a"; // Green
    if (type.includes("tanker") || type.includes("oil")) return "#e11d48"; // Red
    if (type.includes("passenger") || type.includes("cruise")) return "#f59e0b"; // Orange
    if (type.includes("fishing")) return "#2563eb"; // Blue
    if (type.includes("tug") || type.includes("service")) return "#8e24aa"; // Purple
    if (type.includes("military") || type.includes("naval")) return "#37474f"; // Dark Gray
    return "#6b7280"; // Default Gray
  };

  // Simple ship icon - Optimized for large datasets
  const makeShipIcon = (color, heading = 0) => {
    // For large datasets, use simpler markers for better performance
    const html = `
      <div style="width:16px;height:16px;border-radius:50%;background:${color};border:1px solid rgba(0,0,0,0.3);transform:rotate(${heading}deg)">
        <div style="width:4px;height:4px;background:#fff;border-radius:50%;margin:6px auto;"></div>
      </div>`;
    return L.divIcon({
      className: "",
      html,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    });
  };

  // Normalize ship data from different API formats - Optimized for large datasets
  const normalizeShipsFromApi = (data) => {
    if (!data) return [];

    let vessels = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      vessels = data;
    } else if (data.vessels && Array.isArray(data.vessels)) {
      vessels = data.vessels;
    } else if (data.data && Array.isArray(data.data)) {
      vessels = data.data;
    } else if (data.ships && Array.isArray(data.ships)) {
      vessels = data.ships;
    }

    // For large datasets, don't limit the number of ships - show all
    return vessels.map((vessel) => ({
      mmsi: vessel.MMSI || vessel.mmsi || `${Math.floor(Math.random() * 900000000) + 100000000}`,
      name: vessel.NAME || vessel.shipname || vessel.name || `Vessel ${vessel.MMSI || Math.floor(Math.random() * 1000)}`,
      lat: parseFloat(vessel.LATITUDE || vessel.lat || vessel.latitude || 0),
      lon: parseFloat(vessel.LONGITUDE || vessel.lon || vessel.longitude || 0),
      sog: parseFloat(vessel.SOG || vessel.sog || vessel.speed || Math.random() * 20),
      cog: parseFloat(vessel.COG || vessel.cog || vessel.course || Math.random() * 360),
      heading: parseFloat(vessel.HEADING || vessel.heading || vessel.COG || vessel.cog || Math.random() * 360),
      shipType: vessel.SHIPTYPE || vessel.shiptype || vessel.type || vessel.vessel_type || 'Cargo',
      destination: vessel.DESTINATION || vessel.destination || vessel.dest || 'Unknown',
      eta: vessel.ETA || vessel.eta || new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      draught: parseFloat(vessel.DRAUGHT || vessel.draught || vessel.draft || Math.random() * 15 + 5),
      length: parseFloat(vessel.LENGTH || vessel.length || vessel.dim_bow + vessel.dim_stern || Math.random() * 200 + 100),
      width: parseFloat(vessel.WIDTH || vessel.width || vessel.dim_port + vessel.dim_starboard || Math.random() * 30 + 15),
      lastUpdate: vessel.TIME || vessel.timestamp || vessel.last_position_utc || new Date().toISOString().slice(0, 19)
    })).filter((ship) => ship.lat !== 0 && ship.lon !== 0);
  };

  // Demo data for offline mode (COMMENTED OUT - NOW USING REAL DATABASE DATA)
  const DEMO_DATA = [
    // Commented out - Now using real AIS data from database
    // {
    //   mmsi: "352982000",
    //   name: "CMA CGM TROCADERO",
    //   lat: 19.076,
    //   lon: 72.8777,
    //   sog: 14.2,
    //   cog: 127,
    //   heading: 125,
    //   shipType: "Container Ship",
    //   destination: "JNPT MUMBAI",
    //   eta: "2025-08-30 14:30",
    //   draught: 11.5,
    //   length: 334,
    //   width: 42,
    //   lastUpdate: "2025-08-29 12:45:00",
    // },
    // ... other demo ships commented out
  ];

  // Check API health status
  const checkApiHealth = useCallback(async () => {
    try {
      const health = await getApiHealth();
      setApiHealth(health);
      console.log("🏥 API Health:", health);
    } catch (error) {
      console.error("❌ Health check failed:", error);
      setApiHealth({ status: 'error', error: error.message });
    }
  }, []);

  // Fetch ship data using Axios API service
  const fetchShipData = useCallback(async () => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);

      console.log("🚢 Fetching ships with 7-digit MMSI IDs...");
      
      // Request ships with 7-digit MMSI only (should be around 402 ships)
      const ships = await getShips({ limit: 1000 });
      
      console.log(`✅ Received ${ships.length} ships with 7-digit MMSI from database`);

      if (mountedRef.current) {
        if (ships && ships.length > 0) {
          setShips(ships);
          setError(null);
        } else {
          setError("No ships found in database. Check if backend has data.");
          setShips([]);
        }
      }
    } catch (error) {
      console.error("❌ Failed to fetch ship data:", error);
      if (mountedRef.current) {
        setError(`API Error: ${error.message}`);
        setShips([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initialize map
  useEffect(() => {
    mountedRef.current = true;
    if (mapRef.current) return;

    const map = L.map("map", {
      center: [15.0, 75.0], // Indian Ocean region
      zoom: 5,
      preferCanvas: true,
      // Prevent world duplication
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
      noWrap: true, // Prevent tile wrapping
    }).addTo(map);

    // Initialize grid layer
    gridLayerRef.current = L.layerGroup().addTo(map);
    
    // Build initial grid
    buildGlobalGrid();

    // Dedicated layer group for markers
    markersRef.current = L.layerGroup().addTo(map);

    // Check API health first, then load data
    checkApiHealth();
    fetchShipData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      checkApiHealth();
      fetchShipData();
    }, 5 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      try {
        map.remove();
      } finally {
        mapRef.current = null;
        markersRef.current = null;
        gridLayerRef.current = null;
      }
    };
  }, [fetchShipData, checkApiHealth]);

  // Pass refresh function to parent component
  useEffect(() => {
    if (setRefreshData) {
      setRefreshData(() => fetchShipData);
    }
    return () => {
      if (setRefreshData) {
        setRefreshData(null);
      }
    };
  }, [fetchShipData, setRefreshData]);

  // Update grid when gridStep or showGrid changes
  useEffect(() => {
    buildGlobalGrid();
  }, [gridStep, showGrid]);

  // Update markers when ships change
  useEffect(() => {
    console.log(`🗺️ Updating map with ${ships.length} ships`);
    if (!mountedRef.current || !markersRef.current || ships.length === 0) {
      console.log("❌ Cannot update markers: component unmounted or no ships");
      return;
    }

    const markerGroup = markersRef.current;

    // Clear existing markers
    markerGroup.clearLayers();
    console.log("🧹 Cleared existing markers");

    // Add ship markers
    ships.forEach((ship) => {
      const color = getShipColor(ship.shipType);

      const marker = L.marker([ship.lat, ship.lon], {
        icon: makeShipIcon(color, ship.heading),
      }).bindPopup(`
        <div style="font:13px/1.35 system-ui,sans-serif; min-width:280px;">
          <div style="font-weight:600; margin-bottom:8px; color:#1f2937;">${ship.name}</div>
          <table style="width:100%; font-size:12px; line-height:1.4;">
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>MMSI:</strong></td><td>${ship.mmsi}</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Type:</strong></td><td>${ship.shipType}</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Position:</strong></td><td>${ship.lat.toFixed(4)}°, ${ship.lon.toFixed(4)}°</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Speed:</strong></td><td>${ship.sog.toFixed(1)} knots</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Course:</strong></td><td>${ship.cog.toFixed(0)}°</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Heading:</strong></td><td>${ship.heading.toFixed(0)}°</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Destination:</strong></td><td>${ship.destination}</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>ETA:</strong></td><td>${ship.eta}</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Dimensions:</strong></td><td>${ship.length}m × ${ship.width}m</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Draught:</strong></td><td>${ship.draught.toFixed(1)}m</td></tr>
            <tr><td style="padding:2px 8px 2px 0; color:#6b7280;"><strong>Last Update:</strong></td><td>${ship.lastUpdate}</td></tr>
          </table>
        </div>
      `);

      marker.addTo(markerGroup);
    });
    
    console.log(`✅ Added ${ships.length} ship markers to map`);
  }, [ships]);

  return (
    <div className="map-container">
      <div id="map" className="map-leaflet" />

      {/* Loading Overlay for Map */}
      {isRefreshing && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner"></div>
          <span>Loading ships...</span>
        </div>
      )}

      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-open' : ''}`} 
           onClick={() => setSidebarOpen(false)}></div>

      {/* Sliding Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>AIS Dashboard</h3>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="sidebar-content">
          {/* Ship Status Section */}
          <div className="sidebar-section">
            <h4>Ship Status</h4>
            <div className="status-info">
              <div className="status-row">
                <span>Ships:</span>
                <span className="status-value ships">{ships.length.toLocaleString()}</span>
                <span className="status-note">(7-digit MMSI only)</span>
              </div>
              <div className="status-row">
                <span>Source:</span>
                <span className={`status-value ${error ? "status-error" : "status-connected"}`}>
                  {error ? "Database Error" : "Filtered AIS Database"}
                </span>
              </div>
              {loading && <div className="status-row loading">Loading...</div>}
              {error && !loading && <div className="status-row error">{error}</div>}
            </div>
          </div>

          {/* Grid Controls Section */}
          <div className="sidebar-section">
            <h4>Grid Controls</h4>
            <div className="grid-controls">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`toggle-button ${showGrid ? 'toggle-on' : 'toggle-off'}`}
              >
                Grid {showGrid ? 'ON' : 'OFF'}
              </button>
              {showGrid && (
                <div className="grid-step-control">
                  <label>Step:</label>
                  <select 
                    value={gridStep} 
                    onChange={(e) => setGridStep(Number(e.target.value))}
                    className="grid-select"
                  >
                    <option value={1}>1°</option>
                    <option value={2}>2°</option>
                    <option value={5}>5°</option>
                    <option value={10}>10°</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Legend Section */}
          <div className="sidebar-section">
            <h4>Ship Types Legend</h4>
            <div className="legend-list">
              <div className="legend-item">
                <span className="legend-dot-cargo">●</span> Cargo/Container
              </div>
              <div className="legend-item">
                <span className="legend-dot-tanker">●</span> Tanker/Oil
              </div>
              <div className="legend-item">
                <span className="legend-dot-passenger">●</span> Passenger/Cruise
              </div>
              <div className="legend-item">
                <span className="legend-dot-fishing">●</span> Fishing
              </div>
              <div className="legend-item">
                <span className="legend-dot-tug">●</span> Tug/Service
              </div>
              <div className="legend-item">
                <span className="legend-dot-other">●</span> Other
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
