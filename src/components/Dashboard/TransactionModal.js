// src/components/Dashboard/TransactionModal.js - Updated with Transfer support
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Box,
  Typography
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  SwapHoriz as TransferIcon
} from '@mui/icons-material';

const TransactionModal = ({ 
  open, 
  onClose, 
  isEditing, 
  form, 
  onFormChange, 
  onSubmit, 
  availableAccounts,
  categories 
}) => {
  const isFormValid = () => {
    const baseValid = (
      form.description.trim() !== '' &&
      form.amount !== '' &&
      !isNaN(parseFloat(form.amount)) &&
      form.category !== '' &&
      form.type !== '' &&
      form.date !== '' &&
      form.account_id !== ''
    );

    // For transfers, also require a destination account
    if (form.type === 'transfer') {
      return baseValid && form.transfer_to_account_id !== '' && form.transfer_to_account_id !== form.account_id;
    }

    return baseValid;
  };

  // Filter categories based on transaction type
  const getFilteredCategories = () => {
    if (form.type === 'transfer') {
      return [{ value: 'transfer', label: 'Account Transfer' }];
    }
    return categories;
  };

  // Get available destination accounts (excluding the source account)
  const getDestinationAccounts = () => {
    return availableAccounts.filter(account => account.id !== form.account_id);
  };

  // Set transfer category automatically when transfer type is selected
  const handleTypeChange = (newType) => {
    const updates = { type: newType };
    
    if (newType === 'transfer') {
      updates.category = 'transfer';
      updates.transfer_to_account_id = '';
    } else {
      updates.transfer_to_account_id = '';
    }
    
    onFormChange({ ...form, ...updates });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Transaction Type */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <FormLabel>Transaction Type</FormLabel>
              <RadioGroup
                row
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
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
                  value="transfer" 
                  control={<Radio />} 
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <TransferIcon color="primary" fontSize="small" />
                      Transfer
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Transfer Help Text */}
          {form.type === 'transfer' && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Transfer:</strong> Use this for moving money between your accounts (e.g., credit card payments, 
                  moving money from checking to savings). Transfers won't count as income or expenses in your budget.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Date and Amount */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => onFormChange({ ...form, date: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              fullWidth
              required
              placeholder={
                form.type === 'transfer' 
                  ? 'e.g., Credit card payment, Transfer to savings'
                  : 'e.g., Grocery shopping, Salary payment'
              }
            />
          </Grid>

          {/* Source Account */}
          <Grid item xs={12} sm={form.type === 'transfer' ? 6 : 4}>
            <FormControl fullWidth required>
              <InputLabel>
                {form.type === 'transfer' ? 'From Account' : 'Account'}
              </InputLabel>
              <Select
                value={form.account_id}
                onChange={(e) => onFormChange({ ...form, account_id: e.target.value })}
                label={form.type === 'transfer' ? 'From Account' : 'Account'}
              >
                {availableAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Destination Account (for transfers only) */}
          {form.type === 'transfer' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>To Account</InputLabel>
                <Select
                  value={form.transfer_to_account_id || ''}
                  onChange={(e) => onFormChange({ ...form, transfer_to_account_id: e.target.value })}
                  label="To Account"
                >
                  {getDestinationAccounts().map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Category */}
          {form.type !== 'transfer' && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  onChange={(e) => onFormChange({ ...form, category: e.target.value })}
                  label="Category"
                >
                  {getFilteredCategories().map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Transfer Validation */}
          {form.type === 'transfer' && form.account_id && form.transfer_to_account_id === form.account_id && (
            <Grid item xs={12}>
              <Alert severity="error">
                Source and destination accounts cannot be the same.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSubmit} 
          variant="contained"
          disabled={!isFormValid()}
        >
          {isEditing ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionModal;