// src/components/SavingsGoals.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SavingsGoals = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Savings Goals
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Savings Goals component coming soon!
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          This will help you track progress toward your financial goals.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SavingsGoals;