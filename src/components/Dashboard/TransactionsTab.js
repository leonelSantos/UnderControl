// src/components/Dashboard/TransactionsTab.js - Enhanced with filtering and pagination
import React, { useState, useMemo } from 'react';
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { categories } from './utils/constants';

const ITEMS_PER_PAGE = 10;

const TransactionsTab = ({
  transactions,
  availableAccounts,
  searchTerm,
  onSearchChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter state
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    type: '',
    category: '',
    account: ''
  });

  // Generate filter options
  const filterOptions = useMemo(() => {
    const months = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];

    // Get unique years from transactions
    const years = [...new Set(transactions.map(t => {
      if (t.date) {
        try {
          return new Date(t.date).getFullYear();
        } catch {
          return null;
        }
      }
      return null;
    }).filter(year => year !== null))].sort((a, b) => b - a);

    // Get unique types
    const types = [...new Set(transactions.map(t => t.type).filter(Boolean))];

    // Get unique categories
    const transactionCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];

    return {
      months,
      years,
      types,
      categories: transactionCategories
    };
  }, [transactions]);

  // Apply filters and search
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply month filter
    if (filters.month) {
      filtered = filtered.filter(transaction => {
        if (!transaction.date) return false;
        try {
          const transactionMonth = new Date(transaction.date).getMonth() + 1;
          return String(transactionMonth).padStart(2, '0') === filters.month;
        } catch {
          return false;
        }
      });
    }

    // Apply year filter
    if (filters.year) {
      filtered = filtered.filter(transaction => {
        if (!transaction.date) return false;
        try {
          const transactionYear = new Date(transaction.date).getFullYear();
          return transactionYear === parseInt(filters.year);
        } catch {
          return false;
        }
      });
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(transaction => transaction.type === filters.type);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(transaction => transaction.category === filters.category);
    }

    // Apply account filter
    if (filters.account) {
      filtered = filtered.filter(transaction => 
        transaction.account_id === filters.account || 
        transaction.account_type === filters.account
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchTerm, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      month: '',
      year: '',
      type: '',
      category: '',
      account: ''
    });
    onSearchChange('');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || Object.values(filters).some(value => value !== '');

  // Calculate summary for filtered transactions
  const filteredSummary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      total: filteredTransactions.length,
      income,
      expenses,
      net: income - expenses
    };
  }, [filteredTransactions]);

  // Handle page change
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">All Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddTransaction}
        >
          Add Transaction
        </Button>
      </Box>

      {/* Filters Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
          <FilterIcon />
          <Typography variant="h6">Filters</Typography>
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              variant="outlined"
            >
              Clear All
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>

          {/* Month Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                label="Month"
              >
                <MenuItem value="">All Months</MenuItem>
                {filterOptions.months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Year Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                label="Year"
              >
                <MenuItem value="">All Years</MenuItem>
                {filterOptions.years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Type Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {filterOptions.types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Category Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {filterOptions.categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {categories.find(cat => cat.value === category)?.label || category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Quick Month Filters */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Quick Filters:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              size="small"
              variant={filters.month === new Date().getMonth() + 1 && filters.year === new Date().getFullYear() ? 'contained' : 'outlined'}
              onClick={() => {
                const now = new Date();
                handleFilterChange('month', String(now.getMonth() + 1).padStart(2, '0'));
                handleFilterChange('year', now.getFullYear());
              }}
            >
              This Month
            </Button>
            <Button
              size="small"
              variant={filters.month === new Date(new Date().setMonth(new Date().getMonth() - 1)).getMonth() + 1 ? 'contained' : 'outlined'}
              onClick={() => {
                const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1));
                handleFilterChange('month', String(lastMonth.getMonth() + 1).padStart(2, '0'));
                handleFilterChange('year', lastMonth.getFullYear());
              }}
            >
              Last Month
            </Button>
            <Button
              size="small"
              variant={filters.year === new Date().getFullYear() && !filters.month ? 'contained' : 'outlined'}
              onClick={() => {
                handleFilterChange('month', '');
                handleFilterChange('year', new Date().getFullYear());
              }}
            >
              This Year
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Summary Cards */}
      {hasActiveFilters && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Filtered Results
                </Typography>
                <Typography variant="h6">
                  {filteredSummary.total} transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Income
                </Typography>
                <Typography variant="h6" color="success.main">
                  ${filteredSummary.income.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Expenses
                </Typography>
                <Typography variant="h6" color="error.main">
                  ${filteredSummary.expenses.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Net Amount
                </Typography>
                <Typography 
                  variant="h6" 
                  color={filteredSummary.net >= 0 ? 'success.main' : 'error.main'}
                >
                  ${filteredSummary.net.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Results Info */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} transactions
        </Typography>
        {hasActiveFilters && (
          <Chip
            label={`${filteredTransactions.length} results`}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      {/* Transactions Table */}
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
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Alert severity="info" sx={{ m: 2 }}>
                    {hasActiveFilters
                      ? 'No transactions match your current filters.'
                      : 'No transactions found. Add your first transaction to get started!'
                    }
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => {
                const account = availableAccounts.find(acc => 
                  acc.id === transaction.account_id || acc.id === transaction.account_type
                );
                return (
                  <TableRow key={transaction.id} hover>
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
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
};

export default TransactionsTab;