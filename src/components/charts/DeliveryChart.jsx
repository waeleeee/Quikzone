import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const DeliveryChart = ({ deliveryData = [] }) => {
  // If no data provided, show empty state
  if (!deliveryData || deliveryData.length === 0) {
    return (
      <div style={{ width: '100%', height: 300 }} className="flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Aucune donnée de livraison disponible</p>
        </div>
      </div>
    );
  }

  // Extract labels and data from the provided deliveryData
  const labels = deliveryData.map(item => item.label || item.date);
  const data = deliveryData.map(item => item.value || item.count);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Livraisons',
        data: data,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
        fill: true,
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
    <div style={{ width: '100%', height: 300 }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default DeliveryChart; 
