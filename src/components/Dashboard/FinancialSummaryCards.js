// src/components/Dashboard/FinancialSummaryCards.js
import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Savings as SavingsIcon,
  CreditCard as DebtIcon,
  AccountBalanceWallet as NetWorthIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
  <Card 
    elevation={2} 
    sx={{ cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={color === 'error' ? 'error' : 'primary'}>
            ${Math.abs(value).toFixed(2)}
          </Typography>
        </Box>
        <Box color={color === 'error' ? 'error.main' : 'primary.main'}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const FinancialSummaryCards = ({ financialSummary, onCardClick }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Checking"
          value={financialSummary.totalChecking}
          icon={<AccountIcon fontSize="large" />}
          onClick={() => onCardClick(1)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Savings"
          value={financialSummary.totalSavings}
          icon={<SavingsIcon fontSize="large" />}
          onClick={() => onCardClick(1)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Debt"
          value={financialSummary.totalDebt}
          icon={<DebtIcon fontSize="large" />}
          color="error"
          onClick={() => onCardClick(1)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Net Worth"
          value={financialSummary.netWorth}
          icon={<NetWorthIcon fontSize="large" />}
          color={financialSummary.netWorth >= 0 ? 'primary' : 'error'}
        />
      </Grid>
    </Grid>
  );
};

export default FinancialSummaryCards;