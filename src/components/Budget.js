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
  Tab,
  Switch,
  Tooltip
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
  Compare as CompareIcon,
  Event as EventIcon,
  Repeat as RepeatIcon,
  EventRepeat as EventRepeatIcon
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import { ChartJS, barOptions } from '../utils/chartConfig';
import { useData } from '../context/DataContext';


const categories = [
  // Income categories
  { value: 'salary', label: 'Salary', type: 'income' },
  { value: 'freelance', label: 'Freelance', type: 'income' },
  { value: 'investment_income', label: 'Investment Income', type: 'income' },
  { value: 'rental_income', label: 'Rental Income', type: 'income' },
  { value: 'business_income', label: 'Business Income', type: 'income' },
  { value: 'other_income', label: 'Other Income', type: 'income' },
  
  // Expense categories
  { value: 'housing', label: 'Housing/Rent', type: 'expense' },
  { value: 'utilities', label: 'Utilities', type: 'expense' },
  { value: 'food', label: 'Food & Dining', type: 'expense' },
  { value: 'transportation', label: 'Transportation', type: 'expense' },
  { value: 'entertainment', label: 'Entertainment', type: 'expense' },
  { value: 'shopping', label: 'Shopping', type: 'expense' },
  { value: 'healthcare', label: 'Healthcare', type: 'expense' },
  { value: 'education', label: 'Education', type: 'expense' },
  { value: 'insurance', label: 'Insurance', type: 'expense' },
  { value: 'debt_payments', label: 'Debt Payments', type: 'expense' },
  { value: 'savings_transfer', label: 'Savings Transfer', type: 'expense' },
  { value: 'subscriptions', label: 'Subscriptions', type: 'expense' },
  { value: 'personal_care', label: 'Personal Care', type: 'expense' },
  { value: 'gifts_donations', label: 'Gifts & Donations', type: 'expense' },
  { value: 'taxes', label: 'Taxes', type: 'expense' },
  { value: 'other_expense', label: 'Other Expenses', type: 'expense' }
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
  
  // Parse the due date safely without timezone issues
  const getDueDateInfo = (item) => {
    if (item.due_date || item.calculated_due_date) {
      const dateString = item.due_date || item.calculated_due_date;
      // Parse the date as local date to avoid timezone shift
      const [year, month, day] = dateString.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day); // month is 0-indexed in JS
      
      return {
        fullDate: dueDate.toLocaleDateString(),
        monthYear: dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        day: dueDate.getDate(),
        isCurrentMonth: dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear
      };
    }
    
    // Fallback to legacy format
    const day = item.day_of_month || 1;
    const month = item.month || currentMonth;
    const year = item.year || currentYear;
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return {
      fullDate: date.toLocaleDateString(),
      monthYear: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      day: day,
      isCurrentMonth: month === currentMonth && year === currentYear
    };
  };
  
  const dueDateInfo = getDueDateInfo(item);
  
  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography variant="h6">
                {item.name}
              </Typography>
              {item.is_recurring && Boolean(item.is_recurring) && (
                <Tooltip title="Recurring item">
                  <RepeatIcon color="primary" fontSize="small" />
                </Tooltip>
              )}
              {!dueDateInfo.isCurrentMonth && (
                <Chip 
                  size="small" 
                  label={dueDateInfo.monthYear}
                  variant="outlined"
                  color="secondary"
                />
              )}
            </Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {categoryLabel} • Due: {dueDateInfo.fullDate}
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
    due_date: new Date().toISOString().split('T')[0], // Default to today
    is_recurring: true
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
      // Check by due_date first
      if (item.due_date || item.calculated_due_date) {
        const dateString = item.due_date || item.calculated_due_date;
        // Parse as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        return month === selectedMonth && year === selectedYear;
      }
      
      // Fallback to legacy month/year properties
      if (item.month && item.year) {
        return item.month === selectedMonth && item.year === selectedYear;
      }
      
      // For recurring items without specific month/year, include them
      return item.is_recurring;
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
  
  // Group budget items by month/year from due_date
  monthlyBudget.forEach(item => {
    let monthKey;
    
    if (item.due_date || item.calculated_due_date) {
      const dateString = item.due_date || item.calculated_due_date;
      try {
        // Handle different date formats more robustly
        let parsedDate;
        
        if (dateString.includes('-')) {
          // Format: YYYY-MM-DD or YYYY-MM or MM-DD-YYYY
          const parts = dateString.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              // YYYY-MM-DD format
              parsedDate = new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              // MM-DD-YYYY format
              parsedDate = new Date(parts[2], parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
          } else if (parts.length === 2 && parts[0].length === 4) {
            // YYYY-MM format
            parsedDate = new Date(parts[0], parseInt(parts[1]) - 1, 1);
          }
        } else {
          // Try to parse as-is
          parsedDate = new Date(dateString);
        }
        
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          monthKey = `${year}-${month}`;
        } else {
          console.warn('Invalid date in budget item:', dateString, item);
          return; // Skip this item
        }
      } catch (error) {
        console.warn('Error parsing date in budget item:', dateString, error);
        return; // Skip this item
      }
    } else if (item.month && item.year) {
      // Legacy format
      monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
    } else {
      console.warn('Budget item missing date information:', item);
      return; // Skip items without date info
    }
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { 
        budgetIncome: 0, 
        budgetExpenses: 0, 
        actualIncome: 0, 
        actualExpenses: 0 
      };
    }
    
    if (item.type === 'income') {
      monthlyData[monthKey].budgetIncome += parseFloat(item.amount) || 0;
    } else if (item.type === 'expense') {
      monthlyData[monthKey].budgetExpenses += parseFloat(item.amount) || 0;
    }
  });

  // Add actual spending from transactions
  transactions.forEach(transaction => {
    if (!transaction.date) {
      console.warn('Transaction missing date:', transaction);
      return;
    }
    
    try {
      // Extract month key from transaction date
      let monthKey;
      
      if (transaction.date.includes('-')) {
        // Handle YYYY-MM-DD format (most common)
        const dateParts = transaction.date.split('-');
        if (dateParts.length >= 2) {
          if (dateParts[0].length === 4) {
            // YYYY-MM-DD format
            monthKey = `${dateParts[0]}-${dateParts[1]}`;
          } else {
            // MM-DD-YYYY format
            monthKey = `${dateParts[2]}-${dateParts[0]}`;
          }
        }
      } else {
        // Try to parse as Date object
        const parsedDate = new Date(transaction.date);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          monthKey = `${year}-${month}`;
        }
      }
      
      if (!monthKey) {
        console.warn('Could not parse transaction date:', transaction.date);
        return;
      }
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          budgetIncome: 0, 
          budgetExpenses: 0, 
          actualIncome: 0, 
          actualExpenses: 0 
        };
      }
      
      const amount = parseFloat(transaction.amount) || 0;
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].actualIncome += amount;
      } else if (transaction.type === 'expense') {
        monthlyData[monthKey].actualExpenses += amount;
      }
    } catch (error) {
      console.warn('Error processing transaction date:', transaction.date, error);
    }
  });

  // Convert to sorted array for chart
  const sortedMonths = Object.keys(monthlyData)
    .filter(month => month.match(/^\d{4}-\d{2}$/)) // Ensure proper format
    .sort();
  
  // Get last 6 months that have data, or current and previous 5 months
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Generate last 6 months including current month
  const last6MonthKeys = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    last6MonthKeys.push(key);
  }
  
  // Use last 6 months from data if available, otherwise use generated months
  const monthsToShow = sortedMonths.length > 0 ? 
    (sortedMonths.length >= 6 ? sortedMonths.slice(-6) : sortedMonths) : 
    last6MonthKeys;
  
  console.log('Monthly comparison data:', {
    monthlyData,
    sortedMonths,
    monthsToShow,
    budgetItemsCount: monthlyBudget.length,
    transactionsCount: transactions.length
  });
  
  return {
    labels: monthsToShow.map(month => {
      try {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch (error) {
        return month; // Fallback to raw month key
      }
    }),
    datasets: [
      {
        label: 'Budgeted Income',
        data: monthsToShow.map(month => monthlyData[month]?.budgetIncome || 0),
        backgroundColor: 'rgba(46, 204, 113, 0.6)',
        borderColor: '#2ecc71',
        borderWidth: 2
      },
      {
        label: 'Actual Income',
        data: monthsToShow.map(month => monthlyData[month]?.actualIncome || 0),
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#27ae60',
        borderWidth: 2
      },
      {
        label: 'Budgeted Expenses',
        data: monthsToShow.map(month => monthlyData[month]?.budgetExpenses || 0),
        backgroundColor: 'rgba(231, 76, 60, 0.6)',
        borderColor: '#e74c3c',
        borderWidth: 2
      },
      {
        label: 'Actual Expenses',
        data: monthsToShow.map(month => monthlyData[month]?.actualExpenses || 0),
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#c0392b',
        borderWidth: 2
      }
    ]
  };
}, [monthlyBudget, transactions]);

// Debug component to help troubleshoot data issues
const DebugDataDisplay = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
      <Typography variant="h6" gutterBottom>Debug Info (Development Only)</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2"><strong>Budget Items:</strong> {monthlyBudget.length}</Typography>
          <Typography variant="body2"><strong>Transactions:</strong> {transactions.length}</Typography>
          <Typography variant="body2"><strong>Selected Month:</strong> {selectedMonth}/{selectedYear}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2"><strong>Budget Summary:</strong></Typography>
          <Typography variant="body2">Income: ${budgetSummary.totalIncome.toFixed(2)}</Typography>
          <Typography variant="body2">Expenses: ${budgetSummary.totalExpenses.toFixed(2)}</Typography>
        </Grid>
      </Grid>
      
      {monthlyBudget.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2"><strong>Sample Budget Item:</strong></Typography>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
            {JSON.stringify(monthlyBudget[0], null, 2)}
          </pre>
        </Box>
      )}
      
      {transactions.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2"><strong>Sample Transaction:</strong></Typography>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
            {JSON.stringify(transactions[0], null, 2)}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

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
        id: editingItem ? editingItem.id : generateId(),
        name: budgetForm.name,
        amount: parseFloat(budgetForm.amount),
        type: budgetForm.type,
        category: budgetForm.category,
        due_date: budgetForm.due_date,
        is_recurring: budgetForm.is_recurring
      };

      if (editingItem) {
        await updateBudgetItem(itemData);
      } else {
        await addBudgetItem(itemData);
      }

      setModalOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      alert('Failed to save budget item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Extract due_date from item
    let dueDate = item.due_date || item.calculated_due_date;
    if (!dueDate && item.month && item.year && item.day_of_month) {
      dueDate = `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day_of_month).padStart(2, '0')}`;
    }
    if (!dueDate) {
      dueDate = new Date().toISOString().split('T')[0];
    }
    
    // Ensure the date is in the correct format (YYYY-MM-DD)
    if (dueDate && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // If it's not in the right format, try to parse and reformat
      const parsedDate = new Date(dueDate);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        dueDate = `${year}-${month}-${day}`;
      }
    }
    
    setBudgetForm({
      name: item.name,
      amount: item.amount.toString(),
      type: item.type,
      category: item.category,
      due_date: dueDate,
      is_recurring: Boolean(item.is_recurring) // Convert to boolean
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
    resetForm(type);
    setModalOpen(true);
  };

  const resetForm = (type = 'expense') => {
    setBudgetForm({
      name: '',
      amount: '',
      type,
      category: '',
      due_date: new Date().toISOString().split('T')[0],
      is_recurring: true
    });
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
            // Calculate budget for each month from due_dates
            const monthBudget = monthlyBudget.filter(item => {
              if (item.due_date || item.calculated_due_date) {
                const dateString = item.due_date || item.calculated_due_date;
                // Parse as local date to avoid timezone issues
                const [year, month, day] = dateString.split('-').map(Number);
                return month === month.value && year === currentYear;
              }
              // Fallback to legacy month/year
              return item.month === month.value && item.year === currentYear;
            });
            
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
          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon />
            {editingItem ? 'Edit' : 'Add'} Budget Item
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Type Selection */}
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <RadioGroup
                  row
                  value={budgetForm.type}
                  onChange={(e) => setBudgetForm({ ...budgetForm, type: e.target.value })}
                >
                  <FormControlLabel 
                    value="income" 
                    control={<Radio />} 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <IncomeIcon color="success" fontSize="small" />
                        Income
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="expense" 
                    control={<Radio />} 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <ExpenseIcon color="error" fontSize="small" />
                        Expense
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Name/Description */}
            <Grid item xs={12}>
              <TextField
                label="Name/Description"
                value={budgetForm.name}
                onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                fullWidth
                required
                placeholder="e.g., Monthly Salary, Rent, Groceries"
                helperText="Give this budget item a descriptive name"
              />
            </Grid>

            {/* Amount and Due Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                type="number"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Monthly amount"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Due Date"
                type="date"
                value={budgetForm.due_date}
                onChange={(e) => setBudgetForm({ ...budgetForm, due_date: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                helperText="When is this due/received?"
              />
            </Grid>

            {/* Category */}
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
                        ? cat.type === 'income'
                        : cat.type === 'expense'
                    )
                    .map((category) => (
                      <MenuItem key={`category-${category.value}`} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Recurring Toggle */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <RepeatIcon color={Boolean(budgetForm.is_recurring) ? 'primary' : 'disabled'} />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Recurring Item
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {Boolean(budgetForm.is_recurring)
                          ? 'This item repeats every month' 
                          : 'This is a one-time budget item'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={Boolean(budgetForm.is_recurring)}
                    onChange={(e) => setBudgetForm({ ...budgetForm, is_recurring: e.target.checked })}
                    color="primary"
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Helpful Tips */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Tips:</strong>
                  <br />• Use recurring items for monthly expenses like rent, salary, utilities
                  <br />• Use one-time items for special occasions or irregular expenses
                  <br />• The due date helps track when money comes in or goes out
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained"
            disabled={!budgetForm.name || !budgetForm.amount || !budgetForm.category || !budgetForm.due_date}
            startIcon={editingItem ? <EditIcon /> : <AddIcon />}
          >
            {editingItem ? 'Update' : 'Add'} Budget Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budget;