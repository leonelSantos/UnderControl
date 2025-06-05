// src/components/Dashboard/index.js - Main Dashboard Component
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { useData } from '../../context/DataContext';

// Import dashboard components
import FinancialSummaryCards from './FinancialSummaryCards';
import OverviewTab from './OverviewTab';
import AccountsTab from './AccountsTab';
import TransactionsTab from './TransactionsTab';
import TransactionModal from './TransactionModal';
import AccountModal from './AccountModal';

// Import utilities
import { calculateBalances, calculateFinancialSummary } from './utils/calculations';
import { categories } from './utils/constants';

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

  // Calculated data
  const calculatedBalances = useMemo(() => 
    calculateBalances(accountBalances, transactions), 
    [accountBalances, transactions]
  );

  const financialSummary = useMemo(() => 
    calculateFinancialSummary(calculatedBalances), 
    [calculatedBalances]
  );

  const availableAccounts = useMemo(() => {
    return calculatedBalances.map(account => ({
      id: account.id || account.account_type,
      label: account.account_name || 
             `${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1).replace('_', ' ')} Account`,
      type: account.account_type
    }));
  }, [calculatedBalances]);

  // Transaction handlers
  const transactionHandlers = {
    openAdd: () => {
      setEditingTransaction(null);
      setTransactionForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: '',
        type: 'expense',
        account_id: availableAccounts.length > 0 ? availableAccounts[0].id : ''
      });
      setTransactionModalOpen(true);
    },
    
    edit: (transaction) => {
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
    },
    
    delete: async (id) => {
      if (window.confirm('Are you sure you want to delete this transaction?')) {
        try {
          await deleteTransaction(id);
        } catch (error) {
          alert('Failed to delete transaction: ' + error.message);
        }
      }
    },
    
    submit: async () => {
      try {
        if (!transactionForm.description?.trim()) {
          alert('Please enter a transaction description');
          return;
        }
        
        if (!transactionForm.amount || isNaN(parseFloat(transactionForm.amount))) {
          alert('Please enter a valid amount');
          return;
        }
        
        if (!transactionForm.category?.trim()) {
          alert('Please select a category');
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
          account_type: transactionForm.account_id ? null : 'checking',
          tags: null,
          notes: null
        };

        if (editingTransaction) {
          await updateTransaction(transactionData);
        } else {
          await addTransaction(transactionData);
        }

        setTransactionModalOpen(false);
        setEditingTransaction(null);
      } catch (error) {
        console.error('Transaction submission error:', error);
        alert('Failed to save transaction: ' + error.message);
      }
    }
  };

  // Account handlers
  const accountHandlers = {
    openAdd: (accountType) => {
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
    },
    
    edit: (account) => {
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
    },
    
    delete: async (id) => {
      if (window.confirm('Are you sure you want to delete this account?')) {
        try {
          await deleteAccount(id);
          await loadData();
        } catch (error) {
          alert('Failed to delete account: ' + error.message);
        }
      }
    },
    
    submit: async () => {
      try {
        const accountData = {
          account_type: accountForm.account_type,
          account_name: accountForm.account_name,
          initial_balance: parseFloat(accountForm.balance) || 0,
          interest_rate: parseFloat(accountForm.interest_rate) || 0,
          minimum_payment: parseFloat(accountForm.minimum_payment) || 0,
          due_date: parseInt(accountForm.due_date) || 1
        };

        if (editingAccount) {
          await updateAccount(editingAccount.id, accountData);
        } else {
          await addAccount(accountData);
        }

        setAccountModalOpen(false);
        setEditingAccount(null);
        await loadData();
      } catch (error) {
        alert('Failed to save account: ' + error.message);
      }
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
      <FinancialSummaryCards 
        financialSummary={financialSummary}
        onCardClick={(tabIndex) => setActiveTab(tabIndex)}
      />

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

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <OverviewTab
          financialSummary={financialSummary}
          transactions={transactions}
          availableAccounts={availableAccounts}
          onAddTransaction={transactionHandlers.openAdd}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AccountsTab
          financialSummary={financialSummary}
          calculatedBalances={calculatedBalances}
          onAddAccount={accountHandlers.openAdd}
          onEditAccount={accountHandlers.edit}
          onDeleteAccount={accountHandlers.delete}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <TransactionsTab
          transactions={transactions}
          availableAccounts={availableAccounts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddTransaction={transactionHandlers.openAdd}
          onEditTransaction={transactionHandlers.edit}
          onDeleteTransaction={transactionHandlers.delete}
        />
      </TabPanel>

      {/* Modals */}
      <TransactionModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        isEditing={!!editingTransaction}
        form={transactionForm}
        onFormChange={setTransactionForm}
        onSubmit={transactionHandlers.submit}
        availableAccounts={availableAccounts}
        categories={categories}
      />

      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        isEditing={!!editingAccount}
        form={accountForm}
        onFormChange={setAccountForm}
        onSubmit={accountHandlers.submit}
      />
    </Box>
  );
};

export default Dashboard;