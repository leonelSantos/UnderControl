// src/components/Budget/MultiMonthTab.js
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { chartOptions, monthOptions } from './utils/budgetConstants';

const MultiMonthTab = ({
  monthlyComparison,
  monthlyBudget,
  selectedMonth,
  selectedYear,
  onMonthSelect
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          6-Month Budget vs Actual Comparison
        </Typography>
        <Box sx={{ height: 400 }}>
          <Bar data={monthlyComparison} options={chartOptions} />
        </Box>
      </Paper>

      {/* Monthly Summary Cards */}
      <Typography variant="h5" gutterBottom>
        Monthly Budget Overview
      </Typography>
      <Grid container spacing={3}>
        {monthOptions.map((month) => {
          // Calculate budget for each month from due_dates
          const monthBudget = monthlyBudget.filter(item => {
            if (item.due_date || item.calculated_due_date) {
              const dateString = item.due_date || item.calculated_due_date;
              const [year, monthNum, day] = dateString.split('-').map(Number);
              return monthNum === month.value && year === currentYear;
            }
            // Fallback to legacy month/year
            return item.month === month.value && item.year === currentYear;
          });
          
          const income = monthBudget
            .filter(item => item.type === 'income')
            .reduce((sum, item) => sum + item.amount, 0);
          
          const expenses = monthBudget
            .filter(item => item.type === 'expense')
            .reduce((sum, item) => sum + item.amount, 0);
          
          const net = income - expenses;

          // Skip months with no data
          if (income === 0 && expenses === 0) return null;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={month.value}>
              <Card 
                elevation={2} 
                sx={{ 
                  cursor: 'pointer',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5DC 100%)',
                  border: selectedMonth === month.value && selectedYear === currentYear 
                    ? '2px solid #8D6E63' 
                    : '1px solid rgba(188, 170, 164, 0.3)',
                  '&:hover': { 
                    boxShadow: '0 4px 12px rgba(93, 64, 55, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
                onClick={() => onMonthSelect(month.value, currentYear)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#3E2723' }}>
                    {month.label} {currentYear}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#689F38', mb: 1 }}>
                    Income: ${income.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#D84315', mb: 2 }}>
                    Expenses: ${expenses.toFixed(2)}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: net >= 0 ? '#689F38' : '#D84315',
                      fontWeight: 'bold',
                    }}
                  >
                    Net: ${net.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

export default MultiMonthTab;