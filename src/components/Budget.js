// src/components/Budget.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Budget = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Budget Management
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Budget component coming soon!
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          This will include monthly budget planning and tracking.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Budget;