// src/index.js - Updated with earthy color scheme
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8D6E63', // Warm brown
      light: '#BCAAA4',
      dark: '#5D4037',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#689F38', // Earthy green
      light: '#8BC34A',
      dark: '#33691E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#689F38', // Earthy green for income
      light: '#8BC34A',
      dark: '#33691E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D84315', // Burnt orange for expenses
      light: '#FF5722',
      dark: '#BF360C',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F57C00', // Amber orange
      light: '#FFB74D',
      dark: '#E65100',
      contrastText: '#000000',
    },
    info: {
      main: '#5D7C85', // Sage blue-gray
      light: '#90A4AE',
      dark: '#37474F',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5DC', // Beige background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3E2723', // Dark brown
      secondary: '#5D4037', // Medium brown
    },
    divider: '#BCAAA4',
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    h1: {
      color: '#3E2723',
    },
    h2: {
      color: '#3E2723',
    },
    h3: {
      color: '#3E2723',
    },
    h4: {
      color: '#3E2723',
    },
    h5: {
      color: '#3E2723',
    },
    h6: {
      color: '#F5F5DC',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#6D4C41', // Deep brown for app bar
          color: '#FFFFFF',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.15)',
          borderRadius: '12px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 3px 6px rgba(93, 64, 55, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(93, 64, 55, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
        colorSuccess: {
          backgroundColor: '#689F38',
          color: '#FFFFFF',
        },
        colorError: {
          backgroundColor: '#D84315',
          color: '#FFFFFF',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: '48px',
          '&.Mui-selected': {
            color: '#b6bf9b',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#F5F5DC', // Beige indicator
          height: '3px',
          borderRadius: '3px',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);