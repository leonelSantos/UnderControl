// src/components/Dashboard/AccountsTab.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon
} from '@mui/icons-material';
import { getOrdinalSuffix } from './utils/constants';

const AccountsTab = ({
  financialSummary,
  calculatedBalances,
  onAddAccount,
  onEditAccount,
  onDeleteAccount
}) => {
  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Account Management</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAddAccount('checking')}
            sx={{ mr: 1 }}
          >
            Add Checking
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAddAccount('savings')}
            sx={{ mr: 1 }}
          >
            Add Savings
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAddAccount('credit_card')}
            sx={{ mr: 1 }}
          >
            Add Credit Card
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAddAccount('student_loan')}
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
                        <IconButton size="small" onClick={() => onEditAccount(account)}>
                          <EditIcon />
                        </IconButton>
                        {account.id && (
                          <IconButton size="small" onClick={() => onDeleteAccount(account.id)} color="error">
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
                          <IconButton size="small" onClick={() => onEditAccount(account)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => onDeleteAccount(account.id)} color="error">
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
    </>
  );
};

export default AccountsTab;