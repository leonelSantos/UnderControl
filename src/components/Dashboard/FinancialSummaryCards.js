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
    elevation={3} 
    sx={{ 
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: '12px',
      background: color === 'error' 
        ? 'linear-gradient(135deg, #D84315 0%, #FF5722 100%)'
        : 'linear-gradient(135deg, #8D6E63 0%, #BCAAA4 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(93, 64, 55, 0.2)',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(93, 64, 55, 0.3)',
        transform: 'translateY(-2px)',
      },
      transition: 'all 0.3s ease-in-out',
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
            ${Math.abs(value).toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
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