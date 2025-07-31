import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const GeoChart = ({ geoData = [] }) => {
  // If no data provided, show empty state
  if (!geoData || geoData.length === 0) {
    return (
      <div style={{ width: '100%', height: 250 }} className="flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Aucune donnée géographique disponible</p>
        </div>
      </div>
    );
  }

  // Extract labels and data from the provided geoData
  const labels = geoData.map(item => item.label || item.region || item.city);
  const data = geoData.map(item => item.value || item.count);

  // Generate colors for the bars
  const colors = [
    '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
    '#ff9a9e', '#fecfef', '#fecfef', '#fad0c4', '#ffd1ff'
  ];

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Livraisons',
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div style={{ width: '100%', height: 250 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default GeoChart; 
