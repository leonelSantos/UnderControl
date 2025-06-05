// src/components/Dashboard/AccountModal.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid
} from '@mui/material';

const AccountModal = ({ 
  open, 
  onClose, 
  isEditing, 
  form, 
  onFormChange, 
  onSubmit 
}) => {
  const getAccountTypeLabel = () => {
    switch(form.account_type) {
      case 'credit_card':
        return 'Credit Card';
      case 'student_loan':
        return 'Student Loan';
      default:
        return form.account_type.charAt(0).toUpperCase() + form.account_type.slice(1);
    }
  };

  const isDebtAccount = form.account_type === 'credit_card' || form.account_type === 'student_loan';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit' : 'Add'} {getAccountTypeLabel()} Account
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Account Name"
              value={form.account_name}
              onChange={(e) => onFormChange({ ...form, account_name: e.target.value })}
              fullWidth
              required
              helperText="Give this account a descriptive name (e.g., 'Chase Checking', 'Emergency Fund')"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Starting Balance"
              type="number"
              value={form.balance}
              onChange={(e) => onFormChange({ ...form, balance: e.target.value })}
              fullWidth
              required
              helperText={
                isDebtAccount
                  ? "Enter the amount you owe (positive number)"
                  : "Enter your current account balance"
              }
            />
          </Grid>
          {isDebtAccount && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Interest Rate (%)"
                  type="number"
                  value={form.interest_rate}
                  onChange={(e) => onFormChange({ ...form, interest_rate: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Minimum Payment"
                  type="number"
                  value={form.minimum_payment}
                  onChange={(e) => onFormChange({ ...form, minimum_payment: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Due Date (Day of Month)"
                  type="number"
                  value={form.due_date}
                  onChange={(e) => onFormChange({ ...form, due_date: e.target.value })}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">
          {isEditing ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountModal;