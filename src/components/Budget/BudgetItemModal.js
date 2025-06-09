// src/components/Budget/BudgetItemModal.js
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
  Paper,
  Box,
  Typography,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Repeat as RepeatIcon,
  Event as EventIcon
} from '@mui/icons-material';

const BudgetItemModal = ({ 
  open, 
  onClose, 
  isEditing, 
  form, 
  onFormChange, 
  onSubmit, 
  categories 
}) => {
  const isFormValid = () => {
    return (
      form.name && 
      form.name.trim() !== '' &&
      form.amount && 
      !isNaN(parseFloat(form.amount)) &&
      form.category && 
      form.category !== '' &&
      form.due_date && 
      form.due_date !== ''
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EventIcon />
          {isEditing ? 'Edit' : 'Add'} Budget Item
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
                value={form.type}
                onChange={(e) => onFormChange({ ...form, type: e.target.value })}
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
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
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
              value={form.amount}
              onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
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
              value={form.due_date}
              onChange={(e) => onFormChange({ ...form, due_date: e.target.value })}
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
                value={form.category}
                onChange={(e) => onFormChange({ ...form, category: e.target.value })}
                label="Category"
              >
                {categories
                  .filter(cat => 
                    form.type === 'income' 
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
                  <RepeatIcon color={Boolean(form.is_recurring) ? 'primary' : 'disabled'} />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Recurring Item
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {Boolean(form.is_recurring)
                        ? 'This item repeats every month' 
                        : 'This is a one-time budget item'
                      }
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={Boolean(form.is_recurring)}
                  onChange={(e) => onFormChange({ ...form, is_recurring: e.target.checked })}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSubmit} 
          variant="contained"
          disabled={!isFormValid()}
          startIcon={isEditing ? <EditIcon /> : <AddIcon />}
        >
          {isEditing ? 'Update' : 'Add'} Budget Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BudgetItemModal;