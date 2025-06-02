import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Savings as SavingsIcon,
  CreditCard as DebtIcon,
  AccountBalanceWallet as NetWorthIcon
} from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useData } from '../context/DataContext';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card elevation={2}>
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

const Dashboard = () => {
  const { accountBalances, loading } = useData();

  const financialSummary = useMemo(() => {
    if (!accountBalances.length) {
      return {
        checkingBalance: 0,
        savingsBalance: 0,
        totalDebt: 0,
        netWorth: 0
      };
    }

    const checkingBalance = accountBalances.find(acc => acc.account_type === 'checking')?.balance || 0;
    const savingsBalance = accountBalances.find(acc => acc.account_type === 'savings')?.balance || 0;
    const totalDebt = accountBalances
      .filter(acc => acc.account_type === 'credit_card' || acc.account_type === 'student_loan')
      .reduce((sum, acc) => sum + acc.balance, 0);
    const netWorth = (checkingBalance + savingsBalance) - totalDebt;

    return {
      checkingBalance,
      savingsBalance,
      totalDebt,
      netWorth
    };
  }, [accountBalances]);

  const chartData = useMemo(() => {
    const { checkingBalance, savingsBalance, totalDebt } = financialSummary;
    const totalAssets = checkingBalance + savingsBalance;
    
    if (totalAssets === 0 && totalDebt === 0) {
      return null;
    }

    return {
      labels: ['Assets', 'Debts'],
      datasets: [{
        data: [totalAssets, totalDebt],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }, [financialSummary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Assets vs Debts'
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financial Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Checking Account"
            value={financialSummary.checkingBalance}
            icon={<AccountIcon fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Savings Account"
            value={financialSummary.savingsBalance}
            icon={<SavingsIcon fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Debt"
            value={financialSummary.totalDebt}
            icon={<DebtIcon fontSize="large" />}
            color="error"
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

      {chartData && (
        <Paper elevation={2} sx={{ p: 3, height: 400 }}>
          <Doughnut data={chartData} options={chartOptions} />
        </Paper>
      )}
      
      {!chartData && (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No financial data available yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Add some account balances to see your financial overview
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;