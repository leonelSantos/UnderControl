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
  CardActions,
  IconButton,
  Chip,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Assessment as RatioIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

const BudgetItemCard = ({ item, onEdit, onDelete }) => {
  const categoryLabel = categories.find(cat => cat.value === item.category)?.label || item.category;
  
  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {item.name}
            </Typography>
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
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: '',
    day_of_month: 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Calculate monthly data for chart
  const monthlyData = useMemo(() => {
    const monthlyStats = {};
    
    // Process transactions by month
    transactions.forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); // YYYY-MM
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyStats[monthKey].income += transaction.amount;
      } else {
        monthlyStats[monthKey].expenses += transaction.amount;
      }
    });

    // Sort months and prepare chart data
    const sortedMonths = Object.keys(monthlyStats).sort();
    const last6Months = sortedMonths.slice(-6);
    
    return {
      labels: last6Months.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Income',
          data: last6Months.map(month => monthlyStats[month]?.income || 0),
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: last6Months.map(month => monthlyStats[month]?.expenses || 0),
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.4
        }
      ]
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses Trend'
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monthly Budget Tracker
      </Typography>

      {/* Month/Year Selection */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
          <Typography variant="h6">
            Viewing Budget for:
          </Typography>
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
      </Paper>

      {/* Monthly Trend Chart */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, height: 400 }}>
        <Line data={monthlyData} options={chartOptions} />
      </Paper>

      {/* Budget Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Monthly Income"
            amount={budgetSummary.totalIncome}
            type="income"
            icon={<IncomeIcon fontSize="large" />}
            onClick={() => openAddModal('income')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Monthly Expenses"
            amount={budgetSummary.totalExpenses}
            type="expense"
            icon={<ExpenseIcon fontSize="large" />}
            onClick={() => openAddModal('expense')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" color="textSecondary">
                  Net Income
                </Typography>
                <RatioIcon fontSize="large" color={budgetSummary.netIncome >= 0 ? 'success' : 'error'} />
              </Box>
              <Typography 
                variant="h4" 
                component="div" 
                color={budgetSummary.netIncome >= 0 ? 'success.main' : 'error.main'}
                sx={{ mb: 1 }}
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
      </Grid>

      {/* Budget vs Actual Section - REMOVED */}

      {/* Budget Items Lists */}
      <Grid container spacing={3}>
        {/* Income Items */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" color="success.main">
                Income for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
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
                No income items added yet. Add your salary and other income sources.
              </Alert>
            ) : (
              budgetSummary.incomeItems.map((item) => (
                <BudgetItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
            
            {budgetSummary.incomeItems.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h6" align="center" color="success.contrastText">
                  Total Monthly Income: ${budgetSummary.totalIncome.toFixed(2)}
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
                Expenses for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
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
                No expense items added yet. Add your monthly expenses like rent, utilities, etc.
              </Alert>
            ) : (
              budgetSummary.expenseItems.map((item) => (
                <BudgetItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
            
            {budgetSummary.expenseItems.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="h6" align="center" color="error.contrastText">
                  Total Monthly Expenses: ${budgetSummary.totalExpenses.toFixed(2)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

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