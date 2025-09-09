import { useState, useEffect } from 'react';
import { 
  getShips, 
  getShipTypeTrends, 
  getShipTypesAtDestination, 
  getFishingSeasonality,
  getCommercialRatio,
  getApiHealth,
  getMonthlyShipTotal
} from '../services/aisApi';
import '../styles/components/ApiDashboard.css';

const ApiDashboard = () => {
  const [stats, setStats] = useState({
    totalShips: 0,
    monthlyTotal: { 
      ships_this_month: 0, 
      total_ships_in_db: 0, 
      total_records: 0,
      month: 'Loading...', 
      timestamp: null 
    },
    apiHealth: null,
    lastUpdate: null,
    shipTypes: [],
    fishingData: [],
    commercialRatio: [],
    commercialShips: {},
    nonCommercialShips: {},
    loading: true,
    error: null
  });

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all dashboard data in parallel
      const [ships, health, trends, fishing, ratio, monthlyTotal] = await Promise.allSettled([
        getShips({ limit: 100 }),
        getApiHealth(),
        getShipTypeTrends(),
        getFishingSeasonality(),
        getCommercialRatio(),
        getMonthlyShipTotal()
      ]);

      // Process ship types into commercial and non-commercial categories
      const shipTypesData = trends.status === 'fulfilled' ? trends.value : [];
      const commercialTypes = ['Cargo', 'Tanker', 'Passenger'];
      
      const commercialShips = {};
      const nonCommercialShips = {};
      
      shipTypesData.forEach(item => {
        const shipType = item.ship_type || 'Unknown';
        const count = item.count || 0;
        
        if (commercialTypes.some(type => shipType.toLowerCase().includes(type.toLowerCase()))) {
          commercialShips[shipType] = (commercialShips[shipType] || 0) + count;
        } else {
          nonCommercialShips[shipType] = (nonCommercialShips[shipType] || 0) + count;
        }
      });

      setStats({
        totalShips: ships.status === 'fulfilled' ? ships.value.length : 0,
        monthlyTotal: monthlyTotal.status === 'fulfilled' ? monthlyTotal.value : { 
          ships_this_month: 0, 
          total_ships_in_db: 0, 
          total_records: 0,
          month: 'Error', 
          timestamp: null 
        },
        apiHealth: health.status === 'fulfilled' ? health.value : null,
        lastUpdate: new Date().toLocaleString(),
        shipTypes: trends.status === 'fulfilled' ? trends.value : [],
        fishingData: fishing.status === 'fulfilled' ? fishing.value : [],
        commercialRatio: ratio.status === 'fulfilled' ? ratio.value : [],
        commercialShips,
        nonCommercialShips,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchDashboardData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (stats.loading) {
    return (
      <div className="loading-skeleton">
        <div className="loading-skeleton-inner">
          <div className="loading-skeleton-title"></div>
          <div className="loading-skeleton-content">
            <div className="loading-skeleton-line"></div>
            <div className="loading-skeleton-line-short"></div>
            <div className="loading-skeleton-line-shorter"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">AIS Dashboard</h2>
        <button
          onClick={() => {
            setTimeout(() => {
              fetchDashboardData();
            }, 500);
          }}
          className="refresh-button"
        >
          Refresh
        </button>
      </div>

      {stats.error && (
        <div className="error-alert">
          <strong>Error:</strong> {stats.error}
        </div>
      )}

      <div className="stats-grid">
        {/* Total Ships */}
        <div className="stat-card-blue">
          <h3 className="stat-title-blue">Total Ships</h3>
          <p className="stat-value-blue">{stats.totalShips.toLocaleString()}</p>
        </div>

        {/* Ship Types */}
        <div className="stat-card-purple">
          <h3 className="stat-title-purple">Ship Types</h3>
          <p className="stat-value-purple">{stats.shipTypes.length}</p>
        </div>

        {/* Fishing Vessels */}
        <div className="stat-card-orange">
          <h3 className="stat-title-orange">Fishing Vessels</h3>
          <p className="stat-value-orange">
            {stats.fishingData.reduce((sum, item) => sum + item.fishing_vessels, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="stats-grid">
        {/* Total Database Ships */}
        <div className="stat-card-blue">
          <h3 className="stat-title-blue">Total Ships in Database</h3>
          <p className="stat-value-blue">{stats.monthlyTotal.total_ships_in_db.toLocaleString()}</p>
          <p className="stat-subtitle-blue">Unique vessels</p>
        </div>

        {/* Total Records */}
        <div className="stat-card-purple">
          <h3 className="stat-title-purple">Total Records</h3>
          <p className="stat-value-purple">{stats.monthlyTotal.total_records.toLocaleString()}</p>
          <p className="stat-subtitle-purple">All AIS positions</p>
        </div>
      </div>

      <div className="charts-grid">
        {/* Ship Types */}
        <div className="chart-container">
          <h3 className="chart-title">Ship Types</h3>
          <div className="chart-content">
            {stats.shipTypes
              .sort((a, b) => (b.count || 0) - (a.count || 0))
              .slice(0, 10)
              .map((type, index) => (
              <div key={index} className="chart-item">
                <span className="chart-item-label">{type.ship_type || 'Unknown'}</span>
                <span className="chart-item-value">{type.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial vs Non-Commercial */}
        <div className="chart-container">
          <h3 className="chart-title">Commercial vs Non-Commercial</h3>
          <div className="chart-content">
            <div className="chart-section">
              <h4 className="chart-section-title">Commercial Ships</h4>
              {Object.entries(stats.commercialShips)
                .sort(([,a], [,b]) => b - a)
                .map(([shipType, count], index) => (
                <div key={`commercial-${index}`} className="chart-item">
                  <span className="chart-item-label">{shipType}</span>
                  <span className="chart-item-value chart-commercial">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="chart-section">
              <h4 className="chart-section-title">Non-Commercial Ships</h4>
              {Object.entries(stats.nonCommercialShips)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([shipType, count], index) => (
                <div key={`non-commercial-${index}`} className="chart-item">
                  <span className="chart-item-label">{shipType}</span>
                  <span className="chart-item-value chart-non-commercial">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="last-updated">
        Last updated: {stats.lastUpdate}
      </div>
    </div>
  );
};

export default ApiDashboard;
