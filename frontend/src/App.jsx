import Map from "./components/Map";
import ApiDashboard from "./components/ApiDashboard";
import TrendsDashboard from "./components/TrendsDashboard"; // New import
import HeatmapDashboard from "./components/HeatmapDashboard"; // New import
import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshData, setRefreshData] = useState(null); // Function to refresh map data
  const [isRefreshing, setIsRefreshing] = useState(false); // Loading state for refresh

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Hamburger menu (only visible on map tab) */}
          <div className="flex items-center space-x-4">
            {activeTab === "map" && (
              <button 
                className="hamburger-menu-header"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <div className="hamburger-line-header"></div>
                <div className="hamburger-line-header"></div>
                <div className="hamburger-line-header"></div>
              </button>
            )}
          </div>
          
          {/* Center - Title */}
          <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">AIS Maritime Tracking System</h1>
          
          {/* Right side - Tab buttons and Refresh */}
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => setActiveTab("map")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "map"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Dashboard
            </button>
            {/* New Trends Button */}
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "trends"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveTab("heatmaps")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "heatmaps"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Heatmaps
            </button>
            
            {/* Refresh Button - only visible on map tab */}
            {activeTab === "map" && refreshData && (
              <button
                onClick={async () => {
                  console.log("🔄 Refresh button clicked");
                  setIsRefreshing(true);
                  
                  // Show loading for 0.5 seconds minimum
                  const loadingPromise = new Promise(resolve => setTimeout(resolve, 500));
                  const dataPromise = refreshData();
                  
                  await Promise.all([loadingPromise, dataPromise]);
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className={`p-2 rounded-md font-medium transition-colors ${
                  isRefreshing 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
                title="Refresh Data"
                aria-label="Refresh Data"
              >
                <svg 
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "map" && (
          <div className="h-full w-full">
            <Map 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              setRefreshData={setRefreshData}
              isRefreshing={isRefreshing}
            />
          </div>
        )}
        
        {activeTab === "dashboard" && (
          <div className="h-full w-full overflow-auto p-6">
            <ApiDashboard />
          </div>
        )}

        {/* New Trends Content */}
        {activeTab === "trends" && (
          <div className="h-full w-full overflow-auto p-6">
            <TrendsDashboard />
          </div>
        )}

        {/* New Heatmaps Content */}
        {activeTab === "heatmaps" && (
          <div className="h-full w-full overflow-auto p-6">
            <HeatmapDashboard />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-2">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <span>© 2025 AIS Maritime Tracking - Real-time vessel monitoring</span>
        </div>
      </div>
    </div>
  );
}
