import React, { useState, useEffect } from 'react';
import {
  getShipsPerDay,
  getAvgSpeedPerDay,
  getShipsPerHour,
  getAvgSpeedPerHour,
  getShipTypeTrends,
  getCommercialRatio,
  getMonthlyShipTotal,
  getArrivals,
  getShipTypesAtDestination
} from '../services/aisApi';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import DestinationSearch from './DestinationSearch';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

export default function TrendsDashboard() {
  const [shipsPerDay, setShipsPerDay] = useState([]);
  const [avgSpeedPerDay, setAvgSpeedPerDay] = useState([]);
  const [shipsPerHour, setShipsPerHour] = useState([]);
  const [avgSpeedPerHour, setAvgSpeedPerHour] = useState([]);
  const [shipTypeTrends, setShipTypeTrends] = useState([]);
  const [commercialRatio, setCommercialRatio] = useState([]);
  const [monthlyShipTotal, setMonthlyShipTotal] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [shipTypesAtDestination, setShipTypesAtDestination] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [timeScale, setTimeScale] = useState('daily'); // 'daily' or 'hourly'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSimpleAnalysis, setShowSimpleAnalysis] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const [
          shipsPerDayData,
          avgSpeedPerDayData,
          shipsPerHourData,
          avgSpeedPerHourData,
          shipTypeTrendsData,
          commercialRatioData,
          monthlyShipTotalData,
          arrivalsData,
        ] = await Promise.all([
          getShipsPerDay(),
          getAvgSpeedPerDay(),
          getShipsPerHour(),
          getAvgSpeedPerHour(),
          getShipTypeTrends(),
          getCommercialRatio(),
          getMonthlyShipTotal(),
          getArrivals(),
        ]);

        setShipsPerDay(shipsPerDayData);
        setAvgSpeedPerDay(avgSpeedPerDayData);
        setShipsPerHour(shipsPerHourData);
        setAvgSpeedPerHour(avgSpeedPerHourData);
        setShipTypeTrends(shipTypeTrendsData);
        setCommercialRatio(commercialRatioData);
        setMonthlyShipTotal(monthlyShipTotalData);
        setArrivals(arrivalsData);

      } catch (err) {
        console.error("Failed to fetch trend data:", err);
        setError("Failed to load trend data. Please check the API connection and ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  const handleDestinationSelect = async (destination) => {
    setSelectedDestination(destination);
    if (destination) {
      setLoading(true);
      try {
        const data = await getShipTypesAtDestination(destination);
        setShipTypesAtDestination(data);
      } catch (err) {
        console.error("Failed to fetch ship types for destination:", err);
        setError("Failed to load ship types for selected destination.");
      } finally {
        setLoading(false);
      }
    } else {
      setShipTypesAtDestination([]);
    }
  };

  const getChartOptions = (titleText) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: titleText,
      },
    },
  });

  const getShipsChartData = () => ({
    labels: timeScale === 'daily' ? shipsPerDay.map(data => data.day) : shipsPerHour.map(data => data.hour),
    datasets: [
      {
        label: 'Unique Ships',
        data: timeScale === 'daily' ? shipsPerDay.map(data => data.ships) : shipsPerHour.map(data => data.ships),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  });

  const getAvgSpeedChartData = () => ({
    labels: timeScale === 'daily' ? avgSpeedPerDay.map(data => data.day) : avgSpeedPerHour.map(data => data.hour),
    datasets: [
      {
        label: 'Average Speed (knots)',
        data: timeScale === 'daily' ? avgSpeedPerDay.map(data => data.avg_speed) : avgSpeedPerHour.map(data => data.avg_speed),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  });

  const getShipTypeTrendsChartData = () => {
    const aggregatedTypes = {};
    shipTypeTrends.forEach(item => {
      if (aggregatedTypes[item.ship_type]) {
        aggregatedTypes[item.ship_type] += item.count;
      } else {
        aggregatedTypes[item.ship_type] = item.count;
      }
    });

    return {
      labels: Object.keys(aggregatedTypes),
      datasets: [
        {
          label: 'Total Vessels',
          data: Object.values(aggregatedTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getCommercialRatioChartData = () => ({
    labels: commercialRatio.map(data => data.month),
    datasets: [
      {
        label: 'Commercial Vessels',
        data: commercialRatio.map(data => data.commercial),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Non-Commercial Vessels',
        data: commercialRatio.map(data => data.non_commercial),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  });

  const getArrivalsChartData = () => ({
    labels: arrivals.map(data => data.destination),
    datasets: [
      {
        label: 'Arrivals',
        data: arrivals.map(data => data.arrivals),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  });

  const getShipTypesAtDestinationChartData = () => ({
    labels: shipTypesAtDestination.map(data => data.ship_type),
    datasets: [
      {
        label: `Vessels at ${selectedDestination}`,
        data: shipTypesAtDestination.map(data => data.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  });

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading trend data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Trend Analysis Dashboard</h2>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowSimpleAnalysis(!showSimpleAnalysis)}
          className="px-4 py-2 rounded-md font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
        >
          {showSimpleAnalysis ? "Show Charts" : "Show Simple Analysis"}
        </button>
      </div>

      {monthlyShipTotal && (
        <div className="mb-8 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Overall Statistics ({monthlyShipTotal.month})</h3>
          <p>Total unique ships this month: <span className="font-medium">{monthlyShipTotal.ships_this_month}</span></p>
          <p>Total unique ships in database: <span className="font-medium">{monthlyShipTotal.total_ships_in_db}</span></p>
          <p>Total records processed: <span className="font-medium">{monthlyShipTotal.total_records}</span></p>
          <p className="text-sm text-gray-600">Last updated: {new Date(monthlyShipTotal.timestamp).toLocaleString()}</p>
        </div>
      )}

      {showSimpleAnalysis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ships Active</h3>
            <div className="flex justify-end mb-4">
              <button onClick={() => setTimeScale('daily')} className={`px-3 py-1 text-sm rounded-l-md ${timeScale === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Daily</button>
              <button onClick={() => setTimeScale('hourly')} className={`px-3 py-1 text-sm rounded-r-md ${timeScale === 'hourly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Hourly</button>
            </div>
            {(timeScale === 'daily' ? shipsPerDay : shipsPerHour).length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 max-h-60 overflow-y-auto">
                {(timeScale === 'daily' ? shipsPerDay : shipsPerHour).map((data, index) => (
                  <li key={index}>{data.day || data.hour}: {data.ships} unique ships</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No data available.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Speed</h3>
            <div className="flex justify-end mb-4">
              <button onClick={() => setTimeScale('daily')} className={`px-3 py-1 text-sm rounded-l-md ${timeScale === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Daily</button>
              <button onClick={() => setTimeScale('hourly')} className={`px-3 py-1 text-sm rounded-r-md ${timeScale === 'hourly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Hourly</button>
            </div>
            {(timeScale === 'daily' ? avgSpeedPerDay : avgSpeedPerHour).length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 max-h-60 overflow-y-auto">
                {(timeScale === 'daily' ? avgSpeedPerDay : avgSpeedPerHour).map((data, index) => (
                  <li key={index}>{data.day || data.hour}: {data.avg_speed.toFixed(2)} knots</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No data available.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Port Arrivals Per Destination</h3>
            {arrivals.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 max-h-60 overflow-y-auto">
                {arrivals.map((data, index) => (
                  <li key={index}>{data.destination}: {data.arrivals} arrivals</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No data available for port arrivals.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ship Types Overview</h3>
            {shipTypeTrends.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 max-h-60 overflow-y-auto">
                {shipTypeTrends.map((data, index) => (
                  <li key={index}>{data.month} - {data.ship_type}: {data.count} vessels</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No data available for ship types overview.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Commercial vs. Non-Commercial Ratio</h3>
            {commercialRatio.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 max-h-60 overflow-y-auto">
                {commercialRatio.map((data, index) => (
                  <li key={index}>{data.month}: Commercial - {data.commercial}, Non-Commercial - {data.non_commercial}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No data available for commercial ratio.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ship Types at {selectedDestination || 'Selected Destination'}</h3>
            {selectedDestination ? (
              shipTypesAtDestination.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-700 max-h-60 overflow-y-auto">
                  {shipTypesAtDestination.map((data, index) => (
                    <li key={index}>{data.ship_type}: {data.count} vessels</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No data available for ship types at this destination.</p>
              )
            ) : (
              <p className="text-gray-500">Please select a destination to view ship types.</p>
            )}
            <div className="mt-4">
              <label htmlFor="destination-search" className="block text-sm font-medium text-gray-700">Select Destination:</label>
              <DestinationSearch
                destinations={arrivals}
                onDestinationSelect={handleDestinationSelect}
              />
              {arrivals.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No destinations available.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ships Active</h3>
            <div className="flex justify-end mb-4">
              <button onClick={() => setTimeScale('daily')} className={`px-3 py-1 text-sm rounded-l-md ${timeScale === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Daily</button>
              <button onClick={() => setTimeScale('hourly')} className={`px-3 py-1 text-sm rounded-r-md ${timeScale === 'hourly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Hourly</button>
            </div>
            {(timeScale === 'daily' ? shipsPerDay : shipsPerHour).length > 0 ? (
              <Line options={getChartOptions(`Ships Active Per ${timeScale === 'daily' ? 'Day' : 'Hour'}`)} data={getShipsChartData()} />
            ) : (
              <p className="text-gray-500">No data available.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Speed</h3>
            <div className="flex justify-end mb-4">
              <button onClick={() => setTimeScale('daily')} className={`px-3 py-1 text-sm rounded-l-md ${timeScale === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Daily</button>
              <button onClick={() => setTimeScale('hourly')} className={`px-3 py-1 text-sm rounded-r-md ${timeScale === 'hourly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Hourly</button>
            </div>
            {(timeScale === 'daily' ? avgSpeedPerDay : avgSpeedPerHour).length > 0 ? (
              <Line options={getChartOptions(`Average Speed Per ${timeScale === 'daily' ? 'Day' : 'Hour'}`)} data={getAvgSpeedChartData()} />
            ) : (
              <p className="text-gray-500">No data available.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Port Arrivals Per Destination</h3>
            {arrivals.length > 0 ? (
              <Bar options={getChartOptions('Port Arrivals Per Destination')} data={getArrivalsChartData()} />
            ) : (
              <p className="text-gray-500">No data available for port arrivals.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ship Types Overview</h3>
            {shipTypeTrends.length > 0 ? (
              <Bar options={getChartOptions('Ship Types Overview')} data={getShipTypeTrendsChartData()} />
            ) : (
              <p className="text-gray-500">No data available for ship types overview.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Commercial vs. Non-Commercial Ratio</h3>
            {commercialRatio.length > 0 ? (
              <Bar options={getChartOptions('Commercial vs. Non-Commercial Ratio')} data={getCommercialRatioChartData()} />
            ) : (
              <p className="text-gray-500">No data available for commercial ratio.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ship Types at {selectedDestination || 'Selected Destination'}</h3>
            {selectedDestination ? (
              shipTypesAtDestination.length > 0 ? (
                <Bar options={getChartOptions(`Ship Types at ${selectedDestination}`)} data={getShipTypesAtDestinationChartData()} />
              ) : (
                <p className="text-gray-500">No data available for ship types at this destination.</p>
              )
            ) : (
              <p className="text-gray-500">Please select a destination to view ship types.</p>
            )}
            <div className="mt-4">
              <label htmlFor="destination-search" className="block text-sm font-medium text-gray-700">Select Destination:</label>
              <DestinationSearch
                destinations={arrivals}
                onDestinationSelect={handleDestinationSelect}
              />
              {arrivals.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No destinations available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
