// src/App.js - Updated with Chart.js configuration
import React, { useState, useEffect } from 'react';

// Import Chart.js configuration FIRST - This is critical!
import './utils/chartConfig';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as AccountIcon,
  Receipt as BudgetIcon,
  Savings as SavingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Import your components
import Dashboard from './components/Dashboard';
import Budget from './components/Budget';
import SavingsGoals from './components/SavingsGoals';
import Analytics from './components/Analytics';

// Context for sharing data across components
import { DataProvider } from './context/DataContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon />, component: Dashboard },
    { label: 'Budget', icon: <BudgetIcon />, component: Budget },
    { label: 'Savings', icon: <SavingsIcon />, component: SavingsGoals },
    { label: 'Analytics', icon: <AnalyticsIcon />, component: Analytics },
  ];

  useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      setError('Electron API not available. Make sure you\'re running in Electron.');
      setLoading(false);
      return;
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <DataProvider>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Personal Finance Tracker
            </Typography>
          </Toolbar>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
        </AppBar>

        <main>
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={currentTab} index={index}>
              <tab.component />
            </TabPanel>
          ))}
        </main>
      </Box>
    </DataProvider>
  );
}

export default App;