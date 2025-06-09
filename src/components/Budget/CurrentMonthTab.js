// src/components/Budget/CurrentMonthTab.js
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Button
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon
} from '@mui/icons-material';

// Import sub-components
import StatCard from './Components/StatCard';
import BudgetItemCard from './Components/BudgetItemCard';
import { monthOptions, yearOptions } from './utils/budgetConstants';

const CurrentMonthTab = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  budgetSummary,
  actualSpending,
  onAddItem,
  onEditItem,
  onDeleteItem
}) => {
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        onMonthChange(12);
        onYearChange(selectedYear - 1);
      } else {
        onMonthChange(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        onMonthChange(1);
        onYearChange(selectedYear + 1);
      } else {
        onMonthChange(selectedMonth + 1);
      }
    }
  };

  const getCurrentMonthName = () => {
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
    return `${monthName} ${selectedYear}`;
  };

  return (
    <>
      {/* Month Navigation */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigateMonth('prev')}>
              <PrevIcon />
            </IconButton>
            <Typography variant="h5" sx={{ minWidth: '200px', textAlign: 'center' }}>
              {getCurrentMonthName()}
            </Typography>
            <IconButton onClick={() => navigateMonth('next')}>
              <NextIcon />
            </IconButton>
          </Box>
          
          <Box display="flex" alignItems="center" gap={3}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                label="Month"
              >
                {monthOptions.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                label="Year"
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Budget Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Budgeted Income"
            amount={budgetSummary.totalIncome}
            type="income"
            icon={<IncomeIcon fontSize="large" />}
            onClick={() => onAddItem('income')}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Budgeted Expenses"
            amount={budgetSummary.totalExpenses}
            type="expense"
            icon={<ExpenseIcon fontSize="large" />}
            onClick={() => onAddItem('expense')}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" color="textSecondary">
                  Actual Income
                </Typography>
                <IncomeIcon fontSize="large" color="success" />
              </Box>
              <Typography variant="h4" component="div" color="success.main" sx={{ mb: 1 }}>
                ${actualSpending.actualIncome.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                vs ${budgetSummary.totalIncome.toFixed(2)} budgeted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" color="textSecondary">
                  Actual Expenses
                </Typography>
                <ExpenseIcon fontSize="large" color="error" />
              </Box>
              <Typography variant="h4" component="div" color="error.main" sx={{ mb: 1 }}>
                ${actualSpending.actualExpenses.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                vs ${budgetSummary.totalExpenses.toFixed(2)} budgeted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Net Income and Savings Rate */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Budgeted Net Income
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={budgetSummary.netIncome >= 0 ? 'success.main' : 'error.main'}
                sx={{ mb: 2 }}
              >
                ${budgetSummary.netIncome.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Savings Rate: {budgetSummary.savingsRate.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.max(0, Math.min(100, budgetSummary.savingsRate))}
                color={budgetSummary.savingsRate >= 20 ? 'success' : budgetSummary.savingsRate >= 10 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Actual Net Income
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={actualSpending.actualNet >= 0 ? 'success.main' : 'error.main'}
                sx={{ mb: 2 }}
              >
                ${actualSpending.actualNet.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Difference: ${(actualSpending.actualNet - budgetSummary.netIncome).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Items Lists */}
      <Grid container spacing={3}>
        {/* Income Items */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" color="success.main">
                Income for {getCurrentMonthName()}
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => onAddItem('income')}
              >
                Add Income
              </Button>
            </Box>
            
            {budgetSummary.incomeItems.length === 0 ? (
              <Alert severity="info">
                No income items for this month. Add your salary and other income sources.
              </Alert>
            ) : (
              budgetSummary.incomeItems.map((item) => (
                <BudgetItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  currentMonth={selectedMonth}
                  currentYear={selectedYear}
                />
              ))
            )}
            
            {budgetSummary.incomeItems.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h6" align="center" color="success.contrastText">
                  Total: ${budgetSummary.totalIncome.toFixed(2)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Expense Items */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" color="error.main">
                Expenses for {getCurrentMonthName()}
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<AddIcon />}
                onClick={() => onAddItem('expense')}
              >
                Add Expense
              </Button>
            </Box>
            
            {budgetSummary.expenseItems.length === 0 ? (
              <Alert severity="info">
                No expense items for this month. Add your expenses like rent, utilities, etc.
              </Alert>
            ) : (
              budgetSummary.expenseItems.map((item) => (
                <BudgetItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  currentMonth={selectedMonth}
                  currentYear={selectedYear}
                />
              ))
            )}
            
            {budgetSummary.expenseItems.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="h6" align="center" color="error.contrastText">
                  Total: ${budgetSummary.totalExpenses.toFixed(2)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default CurrentMonthTab;