// src/components/Dashboard/AccountsTab.js - Fixed to include transfers in payments calculation
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
  // Helper function to calculate payments made (income + transfers in)
  const calculatePaymentsMade = (account) => {
    return (account.totalIncome || 0) + (account.totalTransfersIn || 0);
  };

  // Helper function to calculate charges/interest (expenses + transfers out)
  const calculateChargesInterest = (account) => {
    return (account.totalExpenses || 0) + (account.totalTransfersOut || 0);
  };

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
                              Deposits + Transfers In
                            </Typography>
                            <Typography variant="body1" color="success.main" fontWeight="bold">
                              ${((account.totalIncome || 0) + (account.totalTransfersIn || 0)).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ExpenseIcon color="error" fontSize="small" />
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Expenses + Transfers Out
                            </Typography>
                            <Typography variant="body1" color="error.main" fontWeight="bold">
                              ${((account.totalExpenses || 0) + (account.totalTransfersOut || 0)).toFixed(2)}
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
                  <Card sx={{ 
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5DC 100%)',
                    border: '2px solid #D84315',
                    boxShadow: '0 4px 12px rgba(216, 67, 21, 0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(216, 67, 21, 0.2)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease-in-out',
                    }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ color: '#3E2723' }}>
                            {account.account_name || 'Unnamed Account'}
                          </Typography>
                          <Chip
                            label={account.account_type === 'credit_card' ? 'Credit Card' : 'Student Loan'}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: '#D84315',
                              color: '#D84315',
                              backgroundColor: 'rgba(216, 67, 21, 0.1)',
                            }}
                          />
                        </Box>
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => onEditAccount(account)}
                            sx={{ 
                              color: '#8D6E63',
                              '&:hover': { backgroundColor: 'rgba(141, 110, 99, 0.1)' }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => onDeleteAccount(account.id)} 
                            sx={{ 
                              color: '#D84315',
                              '&:hover': { backgroundColor: 'rgba(216, 67, 21, 0.1)' }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="h4" sx={{ color: '#D84315', mb: 2, fontWeight: 'bold' }}>
                        ${Math.abs(account.calculatedBalance).toFixed(2)}
                      </Typography>
                      
                      {/* Payments and Charges Breakdown for Debt Accounts */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IncomeIcon color="success" fontSize="small" />
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Payments Made
                              </Typography>
                              <Typography variant="body1" color="success.main" fontWeight="bold">
                                ${calculatePaymentsMade(account).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Income: ${(account.totalIncome || 0).toFixed(2)} + Transfers: ${(account.totalTransfersIn || 0).toFixed(2)}
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
                                ${calculateChargesInterest(account).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Expenses: ${(account.totalExpenses || 0).toFixed(2)} + Cash Advances: ${(account.totalTransfersOut || 0).toFixed(2)}
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