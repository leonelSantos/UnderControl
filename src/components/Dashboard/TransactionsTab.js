// src/components/Dashboard/TransactionsTab.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { categories } from './utils/constants';

const TransactionsTab = ({
  transactions,
  availableAccounts,
  searchTerm,
  onSearchChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">All Transactions</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddTransaction}
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
                    <IconButton size="small" onClick={() => onEditTransaction(transaction)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDeleteTransaction(transaction.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default TransactionsTab;