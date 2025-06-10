// src/utils/chartConfig.js - Updated with Filler plugin and earthy color scheme
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler // Add this import
} from 'chart.js';

// Register all Chart.js components globally - INCLUDING Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register the Filler plugin
);

export { ChartJS };

// Earthy color palette
export const earthyColors = {
  primary: '#8D6E63',      // Warm brown
  secondary: '#689F38',    // Earthy green
  success: '#689F38',      // Earthy green
  error: '#D84315',        // Burnt orange
  warning: '#F57C00',      // Amber orange
  info: '#5D7C85',         // Sage blue-gray
  neutral: '#BCAAA4',      // Light brown
  background: '#F5F5DC',   // Beige
  text: '#3E2723',         // Dark brown
};

// Extended earthy color palette for charts
export const chartColors = [
  '#8D6E63',  // Warm brown
  '#689F38',  // Earthy green
  '#D84315',  // Burnt orange
  '#F57C00',  // Amber orange
  '#5D7C85',  // Sage blue-gray
  '#795548',  // Deep brown
  '#8BC34A',  // Light green
  '#FF5722',  // Orange red
  '#BCAAA4',  // Light brown
  '#4CAF50',  // Forest green
  '#FF8F00',  // Dark amber
  '#6D4C41',  // Very deep brown
];

// Common chart options that can be reused
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        color: earthyColors.text,
        font: {
          family: 'Inter',
          size: 12,
        },
      },
    },
    title: {
      display: false, // Usually handled by Material-UI Typography
      color: earthyColors.text,
      font: {
        family: 'Inter',
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(62, 39, 35, 0.9)',
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      borderColor: earthyColors.primary,
      borderWidth: 1,
      cornerRadius: 8,
    },
    filler: {
      propagate: false,
    },
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
    },
    line: {
      borderWidth: 3,
      tension: 0.1,
    },
    bar: {
      borderRadius: 4,
      borderSkipped: false,
    },
    arc: {
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
  },
};

export const doughnutOptions = {
  ...commonChartOptions,
  cutout: '60%',
  plugins: {
    ...commonChartOptions.plugins,
    legend: {
      ...commonChartOptions.plugins.legend,
      position: 'bottom',
    },
  },
};

export const barOptions = {
  ...commonChartOptions,
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: earthyColors.text,
        font: {
          family: 'Inter',
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(188, 170, 164, 0.3)',
        drawBorder: false,
      },
      ticks: {
        color: earthyColors.text,
        font: {
          family: 'Inter',
          size: 11,
        },
        callback: function(value) {
          return '$' + value.toLocaleString();
        },
      },
    },
  },
};

export const lineOptions = {
  ...commonChartOptions,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    ...commonChartOptions.plugins,
    filler: {
      propagate: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: earthyColors.text,
        font: {
          family: 'Inter',
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(188, 170, 164, 0.3)',
        drawBorder: false,
      },
      ticks: {
        color: earthyColors.text,
        font: {
          family: 'Inter',
          size: 11,
        },
        callback: function(value) {
          return '$' + value.toLocaleString();
        },
      },
    },
  },
};

// Helper function to create gradients for charts
export const createGradient = (ctx, colorStart, colorEnd) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
};

// Helper function to generate chart data with earthy colors
export const generateEarthyChartData = (labels, datasets) => {
  return {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || chartColors[index % chartColors.length],
      borderColor: dataset.borderColor || chartColors[index % chartColors.length],
      ...dataset,
    })),
  };
};

// Specific configurations for different chart types with earthy theme
export const assetDebtChartConfig = {
  data: {
    labels: ['Assets', 'Debts'],
    datasets: [{
      data: [0, 0], // Will be populated dynamically
      backgroundColor: [earthyColors.success, earthyColors.error],
      borderColor: ['#FFFFFF', '#FFFFFF'],
      borderWidth: 3,
    }]
  },
  options: {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      title: {
        display: true,
        text: 'Assets vs Debts',
        color: earthyColors.text,
      },
    },
  },
};

export const budgetComparisonConfig = {
  options: {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        display: true,
        text: 'Budget vs Actual Spending',
        color: earthyColors.text,
      },
    },
  },
};