// src/components/Analytics.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Analytics = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financial Analytics
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Analytics component coming soon!
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          This will include spending analysis, trends, and financial insights.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Analytics;