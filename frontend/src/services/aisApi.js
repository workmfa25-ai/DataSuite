import axios from 'axios';

// Base configuration for the AIS API
const API_BASE_URL = 'http://localhost:5000';

// Create axios instance with default configuration
const aisApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout for large datasets
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Disable credentials for CORS
});

// Request interceptor for logging
aisApi.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
aisApi.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} - ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    if (error.response) {
      // Server responded with error status
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// ===== SHIPS API ENDPOINTS =====

/**
 * Get current ship positions for map display
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Maximum number of ships to return (default: 100)
 * @returns {Promise<Array>} Array of ship objects
 */
export const getShips = async (params = {}) => {
  try {
    const response = await aisApi.get('/ships/', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ships: ${error.message}`);
  }
};

/**
 * Get ship history by MMSI
 * @param {number} mmsi - Ship's MMSI identifier
 * @returns {Promise<Array>} Array of historical positions
 */
export const getShipHistory = async (mmsi) => {
  try {
    const response = await aisApi.get(`/ships/${mmsi}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ship history for MMSI ${mmsi}: ${error.message}`);
  }
};

// ===== TRENDS API ENDPOINTS =====

/**
 * Get ships active per day
 * @returns {Promise<Array>} Array of daily ship counts
 */
export const getShipsPerDay = async () => {
  try {
    const response = await aisApi.get('/trends/ships-per-day');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ships per day: ${error.message}`);
  }
};

/**
 * Get average speed per day
 * @returns {Promise<Array>} Array of daily average speeds
 */
export const getAvgSpeedPerDay = async () => {
  try {
    const response = await aisApi.get('/trends/avg-speed-per-day');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch average speed per day: ${error.message}`);
  }
};

/**
 * Get ships active per hour
 * @returns {Promise<Array>} Array of hourly ship counts
 */
export const getShipsPerHour = async () => {
  try {
    const response = await aisApi.get('/trends/ships-per-hour');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ships per hour: ${error.message}`);
  }
};

/**
 * Get average speed per hour
 * @returns {Promise<Array>} Array of hourly average speeds
 */
export const getAvgSpeedPerHour = async () => {
  try {
    const response = await aisApi.get('/trends/avg-speed-per-hour');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch average speed per hour: ${error.message}`);
  }
};


/**
 * Get port arrivals per destination
 * @returns {Promise<Array>} Array of destination arrival counts
 */
export const getArrivals = async () => {
  try {
    const response = await aisApi.get('/trends/arrivals');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch port arrivals: ${error.message}`);
  }
};


// ===== SHIP TYPES API ENDPOINTS =====

/**
 * Get ship type trends per month
 * @returns {Promise<Array>} Array of ship type trends
 */
export const getShipTypeTrends = async () => {
  try {
    const response = await aisApi.get('/ship-types/trends');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ship type trends: ${error.message}`);
  }
};

/**
 * Get ship types at a specific destination
 * @param {string} destination - Destination name
 * @returns {Promise<Array>} Array of ship types at destination
 */
export const getShipTypesAtDestination = async (destination) => {
  try {
    const response = await aisApi.get('/ship-types/destinations', {
      params: { destination }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ship types at ${destination}: ${error.message}`);
  }
};

/**
 * Get fishing vessels seasonality data
 * @param {Object} params - Query parameters
 * @param {number} params.lat_min - Minimum latitude
 * @param {number} params.lat_max - Maximum latitude  
 * @param {number} params.lon_min - Minimum longitude
 * @param {number} params.lon_max - Maximum longitude
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of fishing vessel counts by month
 */
export const getFishingSeasonality = async (params = {}) => {
  try {
    const response = await aisApi.get('/ship-types/fishing-seasonality', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch fishing seasonality: ${error.message}`);
  }
};

/**
 * Get commercial vs non-commercial vessel ratio
 * @returns {Promise<Array>} Array of monthly commercial vs non-commercial data
 */
export const getCommercialRatio = async () => {
  try {
    const response = await aisApi.get('/ship-types/ratio');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch commercial ratio: ${error.message}`);
  }
};

/**
 * Get total number of ships in the current month
 * @returns {Promise<Object>} Object with total ships count and month info
 */
export const getMonthlyShipTotal = async () => {
  try {
    const response = await aisApi.get('/ship-types/monthly-total');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch monthly ship total: ${error.message}`);
  }
};

// ===== HEATMAPS API ENDPOINTS =====

/**
 * Get ships active heatmap data
 * @returns {Promise<Array>} Array of heatmap data points
 */
export const getShipsActiveHeatmap = async () => {
  try {
    const response = await aisApi.get('/heatmaps/ships-active');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ships active heatmap: ${error.message}`);
  }
};

/**
 * Get average speed heatmap data
 * @returns {Promise<Array>} Array of heatmap data points
 */
export const getAverageSpeedHeatmap = async () => {
  try {
    const response = await aisApi.get('/heatmaps/average-speed');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch average speed heatmap: ${error.message}`);
  }
};


// ===== UTILITY FUNCTIONS =====

/**
 * Test API connection
 * @returns {Promise<boolean>} True if API is reachable
 */
export const testApiConnection = async () => {
  try {
    const response = await aisApi.get('/ships/', { params: { limit: 1 } });
    return response.status === 200;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

/**
 * Get API health status
 * @returns {Promise<Object>} API health information
 */
export const getApiHealth = async () => {
  try {
    const isConnected = await testApiConnection();
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      baseUrl: API_BASE_URL,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'error',
      baseUrl: API_BASE_URL,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Default export
export default aisApi;
