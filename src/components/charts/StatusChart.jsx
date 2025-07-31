import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusChart = ({ statusStats = {} }) => {
  // Define all possible statuses with their colors
  const statusColors = {
    'En attente': '#f59e0b', // yellow
    'À enlever': '#fbbf24', // amber
    'Enlevé': '#f59e0b', // yellow
    'Au dépôt': '#3b82f6', // blue
    'En cours': '#8b5cf6', // purple
    'RTN dépôt': '#f97316', // orange
    'Livrés': '#10b981', // green
    'Livrés payés': '#059669', // emerald
    'Retour définitif': '#ef4444', // red
    'RTN client agence': '#ec4899', // pink
    'Retour Expéditeur': '#6b7280', // gray
    'Retour En Cours': '#6366f1', // indigo
    'Retour reçu': '#06b6d4', // cyan
  };

  // Create labels and data from the real statusStats
  // Show all statuses, even those with 0 count
  const labels = Object.keys(statusStats);
  const data = labels.map(status => statusStats[status]);
  const backgroundColor = labels.map(status => statusColors[status] || '#6b7280');

  // Filter out statuses with 0 count for better visualization
  const nonZeroLabels = labels.filter((_, index) => data[index] > 0);
  const nonZeroData = data.filter(count => count > 0);
  const nonZeroColors = backgroundColor.filter((_, index) => data[index] > 0);

  const chartData = {
    labels: nonZeroLabels,
    datasets: [
      {
        data: nonZeroData,
        backgroundColor: nonZeroColors,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
      },
    },
  };

  // Show a message if no data or all statuses have 0 count
  if (labels.length === 0 || nonZeroData.length === 0) {
    return (
      <div style={{ width: '100%', height: 350 }} className="flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default StatusChart; 
