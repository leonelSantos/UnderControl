// src/components/Dashboard/OverviewTab.js - Fixed version
import React, { useMemo, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components - CRITICAL: This must be done
ChartJS.register(ArcElement, Tooltip, Legend);

const OverviewTab = ({ financialSummary, transactions, availableAccounts, onAddTransaction }) => {
  const chartRef = useRef(null);

  const chartData = useMemo(() => {
    const { totalChecking, totalSavings, totalDebt } = financialSummary;
    const totalAssets = totalChecking + totalSavings;
    
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

  // Cleanup chart on unmount to prevent canvas reuse errors
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Force chart recreation when data changes significantly
  const chartKey = useMemo(() => {
    return `chart-${financialSummary.totalChecking}-${financialSummary.totalSavings}-${financialSummary.totalDebt}`;
  }, [financialSummary.totalChecking, financialSummary.totalSavings, financialSummary.totalDebt]);

  return (
    <>
      {/* Assets vs Debts Chart */}
      {chartData && (
        <Paper elevation={2} sx={{ p: 3, height: 400, mb: 4 }}>
          <Doughnut 
            key={chartKey}
            ref={chartRef}
            data={chartData} 
            options={chartOptions} 
          />
        </Paper>
      )}
      
      {!chartData && (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No financial data available yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Add some accounts and transactions to see your financial overview
          </Typography>
        </Paper>
      )}

      {/* Recent Transactions */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Recent Transactions</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddTransaction}
          >
            Add Transaction
          </Button>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.slice(0, 5).map((transaction) => {
                const account = availableAccounts.find(acc => 
                  acc.id === transaction.account_id || acc.id === transaction.account_type
                );
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{account?.label || 'Unknown Account'}</TableCell>
                    <TableCell align="right">
                      <Typography 
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.type} 
                        color={transaction.type === 'income' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default OverviewTab;