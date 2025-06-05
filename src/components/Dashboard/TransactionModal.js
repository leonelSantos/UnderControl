// src/components/Dashboard/TransactionModal.js
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
  FormLabel
} from '@mui/material';

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
    return (
      form.description.trim() !== '' &&
      form.amount !== '' &&
      !isNaN(parseFloat(form.amount)) &&
      form.category !== '' &&
      form.type !== '' &&
      form.date !== ''
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
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
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                onChange={(e) => onFormChange({ ...form, category: e.target.value })}
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
                value={form.account_id}
                onChange={(e) => onFormChange({ ...form, account_id: e.target.value })}
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
                value={form.type}
                onChange={(e) => onFormChange({ ...form, type: e.target.value })}
              >
                <FormControlLabel value="expense" control={<Radio />} label="Expense" />
                <FormControlLabel value="income" control={<Radio />} label="Income" />
              </RadioGroup>
            </FormControl>
          </Grid>
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