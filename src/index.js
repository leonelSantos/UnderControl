// src/index.js - Updated with Inter font and enhanced typography
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
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#3E2723',
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: '#3E2723',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      color: '#3E2723',
      letterSpacing: '-0.005em',
    },
    h4: {
      fontFamily: '"JetBrains Mono", "Inter", monospace', // Monospace for financial amounts
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#3E2723',
      letterSpacing: '0em',
    },
    h5: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#3E2723',
    },
    h6: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      color: '#3E2723', // Light text for app bar
    },
    subtitle1: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#3E2723',
    },
    subtitle2: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#5D4037',
    },
    body1: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#3E2723',
    },
    body2: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#5D4037',
    },
    button: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      color: '#5D4037',
    },
    overline: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#8D6E63',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#6D4C41', // Deep brown for app bar
          color: '#FFFFFF',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.15)',
          borderRadius: '12px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          letterSpacing: '0.02em',
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
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          fontWeight: 500,
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
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
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
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
        head: {
          fontWeight: 600,
          color: '#3E2723',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segue UI", Arial, sans-serif',
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