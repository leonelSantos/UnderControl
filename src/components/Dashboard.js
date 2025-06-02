import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
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
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Savings as SavingsIcon,
  CreditCard as DebtIcon,
  AccountBalanceWallet as NetWorthIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
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

const categories = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'housing', label: 'Housing/Rent' },
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'other', label: 'Other' }
];

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
  const { 
    accountBalances, 
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    generateId,
    loading 
  } = useData();

  // Transaction state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    type: 'expense',
    account_type: 'checking'
  });

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

  // Transaction filtering
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transaction handlers
  const handleFormSubmit = async () => {
    try {
      const transactionData = {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
        id: editingTransaction ? editingTransaction.id : generateId()
      };

      if (editingTransaction) {
        await updateTransaction(transactionData);
      } else {
        await addTransaction(transactionData);
      }

      setModalOpen(false);
      setEditingTransaction(null);
      setTransactionForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: '',
        type: 'expense',
        account_type: 'checking'
      });
    } catch (error) {
      alert('Failed to save transaction: ' + error.message);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type,
      account_type: transaction.account_type || 'checking'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        alert('Failed to delete transaction: ' + error.message);
      }
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setTransactionForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: '',
      type: 'expense',
      account_type: 'checking'
    });
    setModalOpen(true);
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
      
      {/* Financial Summary Cards */}
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

      {/* Assets vs Debts Chart */}
      {chartData && (
        <Paper elevation={2} sx={{ p: 3, height: 400, mb: 4 }}>
          <Doughnut data={chartData} options={chartOptions} />
        </Paper>
      )}
      
      {!chartData && (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No financial data available yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Add some account balances to see your financial overview
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Transactions Section */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4">Recent Transactions</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddModal}
            >
              Add Transaction
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    {categories.find(cat => cat.value === transaction.category)?.label || transaction.category}
                  </TableCell>
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
                  <TableCell>
                    {transaction.account_type || 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(transaction)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(transaction.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredTransactions.length > 10 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Showing latest 10 transactions of {filteredTransactions.length} total
            </Typography>
          </Box>
        )}
      </Box>

      {/* Transaction Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={transactionForm.account_type}
                  onChange={(e) => setTransactionForm({ ...transactionForm, account_type: e.target.value })}
                  label="Account"
                >
                  <MenuItem value="checking">Checking</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <RadioGroup
                  row
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                >
                  <FormControlLabel value="expense" control={<Radio />} label="Expense" />
                  <FormControlLabel value="income" control={<Radio />} label="Income" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained">
            {editingTransaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;