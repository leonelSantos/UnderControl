import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
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
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CreditCard as CreditCardIcon,
  School as StudentLoanIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

const Accounts = () => {
  const { 
    accountBalances, 
    updateAccountBalance, 
    addDebtAccount, 
    updateDebtAccount, 
    deleteDebtAccount,
    generateId 
  } = useData();

  const [checkingInput, setCheckingInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtForm, setDebtForm] = useState({
    account_type: 'credit_card',
    account_name: '',
    balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_date: 1
  });

  const checkingBalance = accountBalances.find(acc => acc.account_type === 'checking')?.balance || 0;
  const savingsBalance = accountBalances.find(acc => acc.account_type === 'savings')?.balance || 0;
  const debtAccounts = accountBalances.filter(acc => 
    acc.account_type === 'credit_card' || acc.account_type === 'student_loan'
  );

  const handleUpdateBalance = async (accountType, inputValue, setInputValue) => {
    if (!inputValue || isNaN(parseFloat(inputValue))) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await updateAccountBalance(accountType, parseFloat(inputValue));
      setInputValue('');
    } catch (error) {
      alert('Failed to update balance: ' + error.message);
    }
  };

  const handleDebtFormSubmit = async () => {
    try {
      const debtData = {
        ...debtForm,
        balance: parseFloat(debtForm.balance),
        interest_rate: parseFloat(debtForm.interest_rate) || 0,
        minimum_payment: parseFloat(debtForm.minimum_payment) || 0,
        due_date: parseInt(debtForm.due_date) || 1
      };

      if (editingDebt) {
        await updateDebtAccount(editingDebt.id, debtData);
      } else {
        await addDebtAccount(debtData);
      }

      setDebtModalOpen(false);
      setEditingDebt(null);
      setDebtForm({
        account_type: 'credit_card',
        account_name: '',
        balance: '',
        interest_rate: '',
        minimum_payment: '',
        due_date: 1
      });
    } catch (error) {
      alert('Failed to save debt account: ' + error.message);
    }
  };

  const handleEditDebt = (account) => {
    setEditingDebt(account);
    setDebtForm({
      account_type: account.account_type,
      account_name: account.account_name || '',
      balance: account.balance.toString(),
      interest_rate: (account.interest_rate || 0).toString(),
      minimum_payment: (account.minimum_payment || 0).toString(),
      due_date: account.due_date || 1
    });
    setDebtModalOpen(true);
  };

  const handleDeleteDebt = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt account?')) {
      try {
        await deleteDebtAccount(id);
      } catch (error) {
        alert('Failed to delete debt account: ' + error.message);
      }
    }
  };

  const openAddDebtModal = (accountType) => {
    setEditingDebt(null);
    setDebtForm({
      account_type: accountType,
      account_name: '',
      balance: '',
      interest_rate: '',
      minimum_payment: '',
      due_date: 1
    });
    setDebtModalOpen(true);
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Account Balances</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openAddDebtModal('credit_card')}
            sx={{ mr: 1 }}
          >
            Add Credit Card
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openAddDebtModal('student_loan')}
          >
            Add Student Loan
          </Button>
        </Box>
      </Box>

      {/* Assets Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Assets
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Checking Account
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                ${checkingBalance.toFixed(2)}
              </Typography>
              <Box display="flex" gap={1}>
                <TextField
                  label="New Balance"
                  type="number"
                  value={checkingInput}
                  onChange={(e) => setCheckingInput(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => handleUpdateBalance('checking', checkingInput, setCheckingInput)}
                >
                  Update
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Savings Account
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                ${savingsBalance.toFixed(2)}
              </Typography>
              <Box display="flex" gap={1}>
                <TextField
                  label="New Balance"
                  type="number"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => handleUpdateBalance('savings', savingsInput, setSavingsInput)}
                >
                  Update
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Debts Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Debts
      </Typography>
      {debtAccounts.length === 0 ? (
        <Alert severity="info">
          No debt accounts added yet. Use the buttons above to add credit cards or student loans.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {debtAccounts.map((account) => (
            <Grid item xs={12} md={6} lg={4} key={account.id}>
              <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {account.account_name || 'Unnamed Account'}
                      </Typography>
                      <Chip
                        icon={account.account_type === 'credit_card' ? <CreditCardIcon /> : <StudentLoanIcon />}
                        label={account.account_type === 'credit_card' ? 'Credit Card' : 'Student Loan'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleEditDebt(account)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteDebt(account.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="h4" color="error" sx={{ mb: 2 }}>
                    ${account.balance.toFixed(2)}
                  </Typography>
                  
                  <Grid container spacing={2}>
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
                        Due Date
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {account.due_date || 1}{getOrdinalSuffix(account.due_date || 1)} of each month
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Debt Account Modal */}
      <Dialog open={debtModalOpen} onClose={() => setDebtModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDebt ? 'Edit' : 'Add'} {debtForm.account_type === 'credit_card' ? 'Credit Card' : 'Student Loan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Account Name"
                value={debtForm.account_name}
                onChange={(e) => setDebtForm({ ...debtForm, account_name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Current Balance"
                type="number"
                value={debtForm.balance}
                onChange={(e) => setDebtForm({ ...debtForm, balance: e.target.value })}
                fullWidth
                required
                helperText="Enter the amount you owe (positive number)"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Interest Rate (%)"
                type="number"
                value={debtForm.interest_rate}
                onChange={(e) => setDebtForm({ ...debtForm, interest_rate: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Minimum Payment"
                type="number"
                value={debtForm.minimum_payment}
                onChange={(e) => setDebtForm({ ...debtForm, minimum_payment: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Due Date (Day of Month)"
                type="number"
                value={debtForm.due_date}
                onChange={(e) => setDebtForm({ ...debtForm, due_date: e.target.value })}
                fullWidth
                inputProps={{ min: 1, max: 31 }}
                helperText="What day of the month is payment due?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDebtModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDebtFormSubmit} variant="contained">
            {editingDebt ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;