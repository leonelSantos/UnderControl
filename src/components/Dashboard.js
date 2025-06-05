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
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Savings as SavingsIcon,
  CreditCard as DebtIcon,
  AccountBalanceWallet as NetWorthIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon
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
  { value: 'investment', label: 'Investment Income' },
  { value: 'business', label: 'Business Income' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'debt_payment', label: 'Debt Payment' },
  { value: 'transfer', label: 'Account Transfer' },
  { value: 'other', label: 'Other' } // Important: This should be the fallback category
];

const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
  <Card 
    elevation={2} 
    sx={{ cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
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

const Dashboard = () => {
  const { 
    accountBalances, 
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    loadData,
    generateId,
    loading 
  } = useData();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Transaction state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    type: 'expense',
    account_id: ''
  });

  // Account state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    account_type: 'checking',
    account_name: '',
    balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_date: 1
  });

  // Calculate balances and transaction totals for each account
  const calculatedBalances = useMemo(() => {
  const balances = {};
  
  // Initialize with backend-calculated balances
  accountBalances.forEach(account => {
    const accountKey = account.id || account.account_type;
    balances[accountKey] = {
      ...account,
      calculatedBalance: account.balance || 0,  // Use backend-calculated balance
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0
    };
  });

  // Only calculate transaction totals for display purposes
  transactions.forEach(transaction => {
    const accountKey = transaction.account_id || transaction.account_type;
    if (balances[accountKey]) {
      balances[accountKey].transactionCount++;
      
      if (transaction.type === 'income') {
        balances[accountKey].totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        balances[accountKey].totalExpenses += transaction.amount;
      }
    }
  });

  return Object.values(balances);
}, [accountBalances, transactions]);

  const financialSummary = useMemo(() => {
    const checkingAccounts = calculatedBalances.filter(acc => acc.account_type === 'checking');
    const savingsAccounts = calculatedBalances.filter(acc => acc.account_type === 'savings');
    const debtAccounts = calculatedBalances.filter(acc => 
      acc.account_type === 'credit_card' || acc.account_type === 'student_loan'
    );

    const totalChecking = checkingAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
    const totalSavings = savingsAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
    const totalDebt = debtAccounts.reduce((sum, acc) => sum + Math.abs(acc.calculatedBalance), 0);
    const netWorth = (totalChecking + totalSavings) - totalDebt;

    return {
      totalChecking,
      totalSavings,
      totalDebt,
      netWorth,
      checkingAccounts,
      savingsAccounts,
      debtAccounts
    };
  }, [calculatedBalances]);

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

  // Transaction filtering
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Available accounts for dropdown
  const availableAccounts = useMemo(() => {
    return calculatedBalances.map(account => ({
      id: account.id || account.account_type,
      label: account.account_name || 
             `${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1).replace('_', ' ')} Account`,
      type: account.account_type
    }));
  }, [calculatedBalances]);

  // Transaction handlers
const handleTransactionSubmit = async () => {
  try {
    // Validate form data before submitting
    if (!transactionForm.description || transactionForm.description.trim() === '') {
      alert('Please enter a transaction description');
      return;
    }
    
    if (!transactionForm.amount || isNaN(parseFloat(transactionForm.amount))) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!transactionForm.category || transactionForm.category.trim() === '') {
      alert('Please select a category');
      return;
    }
    
    if (!transactionForm.type || (transactionForm.type !== 'income' && transactionForm.type !== 'expense')) {
      alert('Please select a valid transaction type');
      return;
    }
    
    if (!transactionForm.date) {
      alert('Please select a date');
      return;
    }

    const transactionData = {
      id: editingTransaction ? editingTransaction.id : generateId(),
      date: transactionForm.date,
      description: transactionForm.description.trim(),
      amount: parseFloat(transactionForm.amount),
      category: transactionForm.category,
      type: transactionForm.type,
      account_id: transactionForm.account_id || null,
      account_type: transactionForm.account_id ? null : 'checking', // Fallback for backward compatibility
      tags: null, // Add tags support later if needed
      notes: null // Add notes support later if needed
    };

    console.log('Submitting transaction:', transactionData);

    if (editingTransaction) {
      await updateTransaction(transactionData);
    } else {
      await addTransaction(transactionData);
    }

    setTransactionModalOpen(false);
    setEditingTransaction(null);
    resetTransactionForm();
  } catch (error) {
    console.error('Transaction submission error:', error);
    alert('Failed to save transaction: ' + error.message);
  }
};

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type,
      account_id: transaction.account_id || transaction.account_type || ''
    });
    setTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        alert('Failed to delete transaction: ' + error.message);
      }
    }
  };

  const openAddTransactionModal = () => {
    setEditingTransaction(null);
    resetTransactionForm();
    setTransactionModalOpen(true);
  };

 const resetTransactionForm = () => {
  setTransactionForm({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '', // Don't set a default - force user to choose
    type: 'expense',
    account_id: availableAccounts.length > 0 ? availableAccounts[0].id : ''
  });
};

// Also update the form validation in the modal
const isFormValid = () => {
  return (
    transactionForm.description.trim() !== '' &&
    transactionForm.amount !== '' &&
    !isNaN(parseFloat(transactionForm.amount)) &&
    transactionForm.category !== '' &&
    transactionForm.type !== '' &&
    transactionForm.date !== ''
  );
};

  // Account handlers
  const handleAccountSubmit = async () => {
    try {
      const accountData = {
        account_type: accountForm.account_type,
        account_name: accountForm.account_name,
        initial_balance: parseFloat(accountForm.balance) || 0,
        interest_rate: parseFloat(accountForm.interest_rate) || 0,
        minimum_payment: parseFloat(accountForm.minimum_payment) || 0,
        due_date: parseInt(accountForm.due_date) || 1
      };

      console.log('Submitting account data:', accountData);

      if (editingAccount) {
        console.log('Updating account with ID:', editingAccount.id);
        await updateAccount(editingAccount.id, accountData);
      } else {
        console.log('Adding new account');
        await addAccount(accountData);
      }

      setAccountModalOpen(false);
      setEditingAccount(null);
      resetAccountForm();
      
      // Force reload of all data
      await loadData();
    } catch (error) {
      console.error('Account submission error:', error);
      alert('Failed to save account: ' + error.message);
    }
  };

  const handleEditAccount = (account) => {
    console.log('Editing account:', account);
    setEditingAccount(account);
    setAccountForm({
      account_type: account.account_type,
      account_name: account.account_name || '',
      balance: (account.initial_balance || account.balance || 0).toString(),
      interest_rate: (account.interest_rate || 0).toString(),
      minimum_payment: (account.minimum_payment || 0).toString(),
      due_date: account.due_date || 1
    });
    setAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        console.log('Deleting account with ID:', id);
        await deleteAccount(id);
        // Force reload of all data
        await loadData();
      } catch (error) {
        console.error('Delete account error:', error);
        alert('Failed to delete account: ' + error.message);
      }
    }
  };

  const openAddAccountModal = (accountType) => {
    setEditingAccount(null);
    setAccountForm({
      account_type: accountType,
      account_name: '',
      balance: '',
      interest_rate: '',
      minimum_payment: '',
      due_date: 1
    });
    setAccountModalOpen(true);
  };

  const resetAccountForm = () => {
    setAccountForm({
      account_type: 'checking',
      account_name: '',
      balance: '',
      interest_rate: '',
      minimum_payment: '',
      due_date: 1
    });
  };

  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
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
      
      {/* Financial Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Checking"
            value={financialSummary.totalChecking}
            icon={<AccountIcon fontSize="large" />}
            onClick={() => setActiveTab(1)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Savings"
            value={financialSummary.totalSavings}
            icon={<SavingsIcon fontSize="large" />}
            onClick={() => setActiveTab(1)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Debt"
            value={financialSummary.totalDebt}
            icon={<DebtIcon fontSize="large" />}
            color="error"
            onClick={() => setActiveTab(1)}
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

      {/* Tab Navigation */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" />
          <Tab label="Accounts" />
          <Tab label="Transactions" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
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
              onClick={openAddTransactionModal}
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
      </TabPanel>

      {/* Accounts Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5">Account Management</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openAddAccountModal('checking')}
              sx={{ mr: 1 }}
            >
              Add Checking
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openAddAccountModal('savings')}
              sx={{ mr: 1 }}
            >
              Add Savings
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openAddAccountModal('credit_card')}
              sx={{ mr: 1 }}
            >
              Add Credit Card
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openAddAccountModal('student_loan')}
            >
              Add Loan
            </Button>
          </Box>
        </Box>

        {/* Assets */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Assets</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {[...financialSummary.checkingAccounts, ...financialSummary.savingsAccounts].map((account) => (
                <Grid item xs={12} md={6} key={account.id || account.account_type}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Typography variant="h6">
                          {account.account_name || 
                           `${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account`}
                        </Typography>
                        <Chip
                          label={account.account_type}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                        ${account.calculatedBalance.toFixed(2)}
                      </Typography>
                      
                      {/* Income and Expense Breakdown */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IncomeIcon color="success" fontSize="small" />
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Total Income
                              </Typography>
                              <Typography variant="body1" color="success.main" fontWeight="bold">
                                ${account.totalIncome.toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ExpenseIcon color="error" fontSize="small" />
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Total Expenses
                              </Typography>
                              <Typography variant="body1" color="error.main" fontWeight="bold">
                                ${account.totalExpenses.toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                          {account.transactionCount} transactions | Initial: ${(account.initial_balance || account.balance || 0).toFixed(2)}
                        </Typography>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditAccount(account)}>
                            <EditIcon />
                          </IconButton>
                          {account.id && (
                            <IconButton size="small" onClick={() => handleDeleteAccount(account.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Debts */}
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Debts</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {financialSummary.debtAccounts.length === 0 ? (
              <Alert severity="info">
                No debt accounts added yet. Use the buttons above to add credit cards or loans.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {financialSummary.debtAccounts.map((account) => (
                  <Grid item xs={12} md={6} lg={4} key={account.id}>
                    <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {account.account_name || 'Unnamed Account'}
                            </Typography>
                            <Chip
                              label={account.account_type === 'credit_card' ? 'Credit Card' : 'Student Loan'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <Box>
                            <IconButton size="small" onClick={() => handleEditAccount(account)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteAccount(account.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Typography variant="h4" color="error" sx={{ mb: 2 }}>
                          ${Math.abs(account.calculatedBalance).toFixed(2)}
                        </Typography>
                        
                        {/* Income and Expense Breakdown for Debt Accounts */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <IncomeIcon color="success" fontSize="small" />
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  Payments Made
                                </Typography>
                                <Typography variant="body1" color="success.main" fontWeight="bold">
                                  ${account.totalIncome.toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <ExpenseIcon color="error" fontSize="small" />
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  Charges/Interest
                                </Typography>
                                <Typography variant="body1" color="error.main" fontWeight="bold">
                                  ${account.totalExpenses.toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              Interest Rate
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {account.interest_rate || 0}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              Min Payment
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              ${(account.minimum_payment || 0).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Due Date: {account.due_date || 1}{getOrdinalSuffix(account.due_date || 1)} of each month | {account.transactionCount} transactions
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* Transactions Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5">All Transactions</Typography>
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
              onClick={openAddTransactionModal}
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
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const account = availableAccounts.find(acc => 
                  acc.id === transaction.account_id || acc.id === transaction.account_type
                );
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {categories.find(cat => cat.value === transaction.category)?.label || transaction.category}
                    </TableCell>
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
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditTransaction(transaction)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTransaction(transaction.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Transaction Modal */}
      <Dialog open={transactionModalOpen} onClose={() => setTransactionModalOpen(false)} maxWidth="md" fullWidth>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Account</InputLabel>
                <Select
                  value={transactionForm.account_id}
                  onChange={(e) => setTransactionForm({ ...transactionForm, account_id: e.target.value })}
                  label="Account"
                >
                  {availableAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
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
          <Button onClick={() => setTransactionModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleTransactionSubmit} 
            variant="contained"
            disabled={!isFormValid()}
          >
            {editingTransaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Modal */}
      <Dialog open={accountModalOpen} onClose={() => setAccountModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit' : 'Add'} {accountForm.account_type === 'credit_card' ? 'Credit Card' : 
          accountForm.account_type === 'student_loan' ? 'Student Loan' : 
          accountForm.account_type.charAt(0).toUpperCase() + accountForm.account_type.slice(1)} Account
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Account Name"
                value={accountForm.account_name}
                onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                fullWidth
                required
                helperText="Give this account a descriptive name (e.g., 'Chase Checking', 'Emergency Fund')"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Starting Balance"
                type="number"
                value={accountForm.balance}
                onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                fullWidth
                required
                helperText={
                  accountForm.account_type === 'credit_card' || accountForm.account_type === 'student_loan'
                    ? "Enter the amount you owe (positive number)"
                    : "Enter your current account balance"
                }
              />
            </Grid>
            {(accountForm.account_type === 'credit_card' || accountForm.account_type === 'student_loan') && (
              <>
                <Grid item xs={6}>
                  <TextField
                    label="Interest Rate (%)"
                    type="number"
                    value={accountForm.interest_rate}
                    onChange={(e) => setAccountForm({ ...accountForm, interest_rate: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Minimum Payment"
                    type="number"
                    value={accountForm.minimum_payment}
                    onChange={(e) => setAccountForm({ ...accountForm, minimum_payment: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Due Date (Day of Month)"
                    type="number"
                    value={accountForm.due_date}
                    onChange={(e) => setAccountForm({ ...accountForm, due_date: e.target.value })}
                    fullWidth
                    inputProps={{ min: 1, max: 31 }}
                    helperText="What day of the month is payment due?"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAccountSubmit} variant="contained">
            {editingAccount ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;