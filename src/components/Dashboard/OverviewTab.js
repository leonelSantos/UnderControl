// src/components/Dashboard/OverviewTab.js - Updated with Net Worth Trend Chart
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
  Chip,
  Grid
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js';

// Register Chart.js components - CRITICAL: This must be done
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const OverviewTab = ({ financialSummary, transactions, availableAccounts, onAddTransaction }) => {
  const chartRef = useRef(null);
  const netWorthChartRef = useRef(null);

  // Calculate assets and debts trends over time
  const netWorthTrendData = useMemo(() => {
    if (!transactions || transactions.length === 0 || !financialSummary) {
      return null;
    }

    // Get all unique months from transactions, sorted chronologically
    const monthsSet = new Set();
    transactions.forEach(transaction => {
      if (transaction.date) {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(monthKey);
      }
    });

    const sortedMonths = Array.from(monthsSet).sort();
    
    // If we have less than 2 months of data, don't show the chart
    if (sortedMonths.length < 2) {
      return null;
    }

    // Get all accounts from financial summary
    const allAccounts = [
      ...financialSummary.checkingAccounts,
      ...financialSummary.savingsAccounts,
      ...financialSummary.debtAccounts
    ];

    // Calculate assets and debts for each month
    const trendByMonth = sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
      
      let totalAssets = 0;
      let totalDebts = 0;

      // Calculate balance for each account up to this month
      allAccounts.forEach(account => {
        const initialBalance = account.initial_balance || 0;
        
        // Get transactions for this account up to the end of this month
        const relevantTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate <= endOfMonth && 
                 (t.account_id === account.id || 
                  t.transfer_to_account_id === account.id);
        });

        let accountBalance = initialBalance;

        // Apply transactions using the same logic as your database
        relevantTransactions.forEach(transaction => {
          if (account.account_type === 'credit_card' || account.account_type === 'student_loan') {
            // For debt accounts: 
            // - expenses and transfers OUT increase debt
            // - income and transfers IN reduce debt
            if (transaction.account_id === account.id) {
              // Transaction FROM this account
              if (transaction.type === 'expense') {
                accountBalance += transaction.amount; // More debt
              } else if (transaction.type === 'transfer') {
                accountBalance += transaction.amount; // Cash advance increases debt
              } else if (transaction.type === 'income') {
                accountBalance -= transaction.amount; // Payment reduces debt
              }
            } else if (transaction.transfer_to_account_id === account.id) {
              // Transfer TO this account (payment)
              accountBalance -= transaction.amount; // Payment reduces debt
            }
          } else {
            // For asset accounts (checking/savings):
            // - income and transfers IN increase balance
            // - expenses and transfers OUT decrease balance
            if (transaction.account_id === account.id) {
              // Transaction FROM this account
              if (transaction.type === 'income') {
                accountBalance += transaction.amount; // Money coming in
              } else if (transaction.type === 'expense') {
                accountBalance -= transaction.amount; // Money going out
              } else if (transaction.type === 'transfer') {
                accountBalance -= transaction.amount; // Money transferred out
              }
            } else if (transaction.transfer_to_account_id === account.id) {
              // Transfer TO this account
              accountBalance += transaction.amount; // Money transferred in
            }
          }
        });

        // Categorize final balance
        if (account.account_type === 'credit_card' || account.account_type === 'student_loan') {
          totalDebts += Math.abs(accountBalance); // Always positive for display
        } else {
          totalAssets += Math.max(0, accountBalance); // Only positive balances count as assets
        }
      });

      return {
        month: monthKey,
        totalAssets,
        totalDebts,
        label: new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
      };
    });

    // Show last 12 months or all data if less than 12 months
    const dataToShow = trendByMonth.length > 12 ? trendByMonth.slice(-12) : trendByMonth;

    return {
      labels: dataToShow.map(item => item.label),
      datasets: [
        {
          label: 'Total Assets',
          data: dataToShow.map(item => item.totalAssets),
          borderColor: '#689F38',
          backgroundColor: 'rgba(104, 159, 56, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: '#689F38',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Total Debts',
          data: dataToShow.map(item => item.totalDebts),
          borderColor: '#D84315',
          backgroundColor: 'rgba(216, 67, 21, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: '#D84315',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ]
    };
  }, [transactions, availableAccounts, financialSummary]);

  const netWorthChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#3E2723',
          font: {
            family: 'Inter',
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Assets vs Debts Over Time',
        color: '#3E2723',
        font: {
          family: 'Inter',
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(62, 39, 35, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#8D6E63',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
            return `${context.dataset.label}: ${formatted}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#3E2723',
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(188, 170, 164, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#3E2723',
          font: {
            family: 'Inter',
            size: 11,
          },
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          }
        }
      }
    }
  };

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
        backgroundColor: ['#689F38', '#D84315'], // Earthy green and burnt orange
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverBackgroundColor: ['#8BC34A', '#FF5722'],
        hoverBorderColor: '#FFFFFF',
      }]
    };
  }, [financialSummary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#3E2723',
          font: {
            family: 'Inter',
            size: 12,
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Assets vs Debts',
        color: '#3E2723',
        font: {
          family: 'Inter',
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(62, 39, 35, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#8D6E63',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
            return `${context.label}: ${formatted}`;
          }
        }
      },
    },
  };

  // Cleanup charts on unmount to prevent canvas reuse errors
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      if (netWorthChartRef.current) {
        netWorthChartRef.current.destroy();
      }
    };
  }, []);

  // Force chart recreation when data changes significantly
  const chartKey = useMemo(() => {
    return `chart-${financialSummary.totalChecking}-${financialSummary.totalSavings}-${financialSummary.totalDebt}`;
  }, [financialSummary.totalChecking, financialSummary.totalSavings, financialSummary.totalDebt]);

  const netWorthChartKey = useMemo(() => {
    return `net-worth-chart-${transactions.length}-${Date.now()}`;
  }, [transactions.length]);

  return (
    <>
      {/* Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Assets vs Debts Chart */}
        <Grid item xs={12} md={6}>
          {chartData && (
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Doughnut 
                key={chartKey}
                ref={chartRef}
                data={chartData} 
                options={chartOptions} 
              />
            </Paper>
          )}
          
          {!chartData && (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <Typography variant="h6" color="textSecondary">
                  No financial data available yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Add some accounts and transactions to see your financial overview
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Net Worth Trend Chart */}
        <Grid item xs={12} md={6}>
          {netWorthTrendData && (
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Line 
                key={netWorthChartKey}
                ref={netWorthChartRef}
                data={netWorthTrendData} 
                options={netWorthChartOptions} 
              />
            </Paper>
          )}
          
          {!netWorthTrendData && (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <Typography variant="h6" color="textSecondary">
                  Assets vs Debts Trend Unavailable
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Add transactions spanning multiple months to see your assets and debts trend
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">Recent Transactions</Typography>
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