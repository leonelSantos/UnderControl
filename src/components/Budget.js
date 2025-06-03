import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert,
  LinearProgress,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Assessment as RatioIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useData } from '../context/DataContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const categories = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment Income' },
  { value: 'other_income', label: 'Other Income' },
  { value: 'housing', label: 'Housing/Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'debt_payment', label: 'Debt Payments' },
  { value: 'savings', label: 'Savings' },
  { value: 'other_expense', label: 'Other Expenses' }
];

const StatCard = ({ title, amount, type, icon, onClick }) => (
  <Card elevation={2} sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" color="textSecondary">
          {title}
        </Typography>
        <Box color={type === 'income' ? 'success.main' : 'error.main'}>
          {icon}
        </Box>
      </Box>
      <Typography 
        variant="h4" 
        component="div" 
        color={type === 'income' ? 'success.main' : 'error.main'}
        sx={{ mb: 2 }}
      >
        ${amount.toFixed(2)}
      </Typography>
      <Button 
        variant="outlined" 
        size="small" 
        startIcon={<AddIcon />}
        onClick={onClick}
        fullWidth
      >
        Add {type === 'income' ? 'Income' : 'Expense'}
      </Button>
    </CardContent>
  </Card>
);

const BudgetItemCard = ({ item, onEdit, onDelete, currentMonth, currentYear }) => {
  const categoryLabel = categories.find(cat => cat.value === item.category)?.label || item.category;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography variant="h6">
                {item.name}
              </Typography>
              {item.month && item.year && (item.month !== currentMonth || item.year !== currentYear) && (
                <Chip 
                  size="small" 
                  label={`${monthNames[item.month - 1]} ${item.year}`}
                  variant="outlined"
                  color="secondary"
                />
              )}
            </Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {categoryLabel} • Due on day {item.day_of_month}
            </Typography>
            <Typography 
              variant="h5" 
              color={item.type === 'income' ? 'success.main' : 'error.main'}
              fontWeight="bold"
            >
              ${item.amount.toFixed(2)}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={() => onEdit(item)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(item.id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Budget = () => {
  const { 
    monthlyBudget,
    transactions,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    generateId 
  } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState(0);
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: '',
    day_of_month: 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  // Calculate current month budget summary
  const budgetSummary = useMemo(() => {
    // Filter budget items for selected month/year
    const filteredBudget = monthlyBudget.filter(item => {
      // If item has month/year properties, filter by them
      if (item.month && item.year) {
        return item.month === selectedMonth && item.year === selectedYear;
      }
      // Otherwise include all items (for backward compatibility)
      return true;
    });

    const incomeItems = filteredBudget.filter(item => item.type === 'income');
    const expenseItems = filteredBudget.filter(item => item.type === 'expense');
    
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      incomeItems,
      expenseItems
    };
  }, [monthlyBudget, selectedMonth, selectedYear]);

  // Calculate actual spending for current month from transactions
  const actualSpending = useMemo(() => {
    const selectedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    
    const monthTransactions = transactions.filter(transaction => 
      transaction.date.startsWith(selectedDate)
    );

    const actualIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const actualExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      actualIncome,
      actualExpenses,
      actualNet: actualIncome - actualExpenses
    };
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate multi-month comparison data
  const monthlyComparison = useMemo(() => {
    const monthlyData = {};
    
    // Group budget items by month/year
    monthlyBudget.forEach(item => {
      if (item.month && item.year) {
        const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!monthlyData[key]) {
          monthlyData[key] = { budgetIncome: 0, budgetExpenses: 0, actualIncome: 0, actualExpenses: 0 };
        }
        
        if (item.type === 'income') {
          monthlyData[key].budgetIncome += item.amount;
        } else {
          monthlyData[key].budgetExpenses += item.amount;
        }
      }
    });

    // Add actual spending from transactions
    transactions.forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { budgetIncome: 0, budgetExpenses: 0, actualIncome: 0, actualExpenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].actualIncome += transaction.amount;
      } else {
        monthlyData[monthKey].actualExpenses += transaction.amount;
      }
    });

    // Convert to sorted array for chart
    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);
    
    return {
      labels: last6Months.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Budgeted Income',
          data: last6Months.map(month => monthlyData[month]?.budgetIncome || 0),
          backgroundColor: 'rgba(46, 204, 113, 0.6)',
          borderColor: '#2ecc71',
          borderWidth: 2
        },
        {
          label: 'Actual Income',
          data: last6Months.map(month => monthlyData[month]?.actualIncome || 0),
          backgroundColor: 'rgba(46, 204, 113, 0.8)',
          borderColor: '#27ae60',
          borderWidth: 2
        },
        {
          label: 'Budgeted Expenses',
          data: last6Months.map(month => monthlyData[month]?.budgetExpenses || 0),
          backgroundColor: 'rgba(231, 76, 60, 0.6)',
          borderColor: '#e74c3c',
          borderWidth: 2
        },
        {
          label: 'Actual Expenses',
          data: last6Months.map(month => monthlyData[month]?.actualExpenses || 0),
          backgroundColor: 'rgba(231, 76, 60, 0.8)',
          borderColor: '#c0392b',
          borderWidth: 2
        }
      ]
    };
  }, [monthlyBudget, transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Budget vs Actual - 6 Month Comparison'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const handleFormSubmit = async () => {
    try {
      const itemData = {
        ...budgetForm,
        amount: parseFloat(budgetForm.amount),
        day_of_month: parseInt(budgetForm.day_of_month),
        month: parseInt(budgetForm.month),
        year: parseInt(budgetForm.year),
        id: editingItem ? editingItem.id : generateId()
      };

      if (editingItem) {
        await updateBudgetItem(itemData);
      } else {
        await addBudgetItem(itemData);
      }

      setModalOpen(false);
      setEditingItem(null);
      setBudgetForm({
        name: '',
        amount: '',
        type: 'expense',
        category: '',
        day_of_month: 1,
        month: selectedMonth,
        year: selectedYear
      });
    } catch (error) {
      alert('Failed to save budget item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setBudgetForm({
      name: item.name,
      amount: item.amount.toString(),
      type: item.type,
      category: item.category,
      day_of_month: item.day_of_month,
      month: item.month || selectedMonth,
      year: item.year || selectedYear
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget item?')) {
      try {
        await deleteBudgetItem(id);
      } catch (error) {
        alert('Failed to delete budget item: ' + error.message);
      }
    }
  };

  const openAddModal = (type = 'expense') => {
    setEditingItem(null);
    setBudgetForm({
      name: '',
      amount: '',
      type,
      category: '',
      day_of_month: 1,
      month: selectedMonth,
      year: selectedYear
    });
    setModalOpen(true);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getCurrentMonthName = () => {
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
    return `${monthName} ${selectedYear}`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monthly Budget Tracker
      </Typography>

      {/* Tab Navigation */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Current Month" />
          <Tab label="Multi-Month Comparison" />
        </Tabs>
      </Paper>

      {/* Current Month Tab */}
      <TabPanel value={activeTab} index={0}>
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
                  onChange={(e) => setSelectedMonth(e.target.value)}
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
                  onChange={(e) => setSelectedYear(e.target.value)}
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
              onClick={() => openAddModal('income')}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Budgeted Expenses"
              amount={budgetSummary.totalExpenses}
              type="expense"
              icon={<ExpenseIcon fontSize="large" />}
              onClick={() => openAddModal('expense')}
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
                  onClick={() => openAddModal('income')}
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
                  onClick={() => openAddModal('expense')}
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
      </TabPanel>

      {/* Multi-Month Comparison Tab */}
      <TabPanel value={activeTab} index={1}>
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
            const monthBudget = monthlyBudget.filter(item => 
              item.month === month.value && item.year === currentYear
            );
            const income = monthBudget.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
            const expenses = monthBudget.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
            const net = income - expenses;

            if (income === 0 && expenses === 0) return null;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={month.value}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 }
                  }}
                  onClick={() => {
                    setSelectedMonth(month.value);
                    setSelectedYear(currentYear);
                    setActiveTab(0);
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {month.label} {currentYear}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Income: ${income.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Expenses: ${expenses.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={net >= 0 ? 'success.main' : 'error.main'}
                      sx={{ mt: 1 }}
                    >
                      Net: ${net.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      {/* Add/Edit Budget Item Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit' : 'Add'} Budget Item
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <RadioGroup
                  row
                  value={budgetForm.type}
                  onChange={(e) => setBudgetForm({ ...budgetForm, type: e.target.value })}
                >
                  <FormControlLabel value="income" control={<Radio />} label="Income" />
                  <FormControlLabel value="expense" control={<Radio />} label="Expense" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Name/Description"
                value={budgetForm.name}
                onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                fullWidth
                required
                placeholder="e.g., Monthly Salary, Rent, Groceries"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                type="number"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Day of Month"
                type="number"
                value={budgetForm.day_of_month}
                onChange={(e) => setBudgetForm({ ...budgetForm, day_of_month: e.target.value })}
                fullWidth
                inputProps={{ min: 1, max: 31 }}
                helperText="When do you receive/pay this?"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Month</InputLabel>
                <Select
                  value={budgetForm.month}
                  onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
                  label="Month"
                >
                  {monthOptions.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Year</InputLabel>
                <Select
                  value={budgetForm.year}
                  onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                  label="Year"
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year.value} value={year.value}>
                      {year.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  label="Category"
                >
                  {categories
                    .filter(cat => 
                      budgetForm.type === 'income' 
                        ? ['salary', 'freelance', 'investment', 'other_income'].includes(cat.value)
                        : !['salary', 'freelance', 'investment', 'other_income'].includes(cat.value)
                    )
                    .map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained">
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budget;