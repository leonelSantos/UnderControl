import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [accountBalances, setAccountBalances] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      
      if (window.electronAPI) {
        const [
          transactionsData,
          savingsGoalsData,
          accountBalancesData,
          monthlyBudgetData,
          budgetComparisonData
        ] = await Promise.all([
          window.electronAPI.getTransactions(),
          window.electronAPI.getSavingsGoals(),
          window.electronAPI.getAccountBalances(),
          window.electronAPI.getMonthlyBudget(),
          window.electronAPI.getBudgetComparison()
        ]);

        setTransactions(transactionsData);
        setSavingsGoals(savingsGoalsData);
        setAccountBalances(accountBalancesData);
        setMonthlyBudget(monthlyBudgetData);
        setBudgetComparison(budgetComparisonData);
        
        console.log('Data loaded successfully:', {
          transactions: transactionsData.length,
          accounts: accountBalancesData.length,
          savings: savingsGoalsData.length,
          budget: monthlyBudgetData.length
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transaction methods
  const addTransaction = async (transaction) => {
    try {
      const newTransaction = await window.electronAPI.addTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      // Refresh account balances since they are calculated from transactions
      await loadAccountBalances();
      return newTransaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (transaction) => {
    try {
      const updatedTransaction = await window.electronAPI.updateTransaction(transaction);
      setTransactions(prev => 
        prev.map(t => t.id === transaction.id ? updatedTransaction : t)
      );
      // Refresh account balances since they are calculated from transactions
      await loadAccountBalances();
      return updatedTransaction;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await window.electronAPI.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      // Refresh account balances since they are calculated from transactions
      await loadAccountBalances();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  // Account management methods
  const addAccount = async (accountData) => {
    try {
      console.log('DataContext: Adding account', accountData);
      const newAccount = await window.electronAPI.addAccount(accountData);
      console.log('DataContext: Account added successfully', newAccount);
      await loadAccountBalances();
      return newAccount;
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  };

  const updateAccount = async (id, accountData) => {
    try {
      console.log('DataContext: Updating account', id, accountData);
      const updatedAccount = await window.electronAPI.updateAccount(id, accountData);
      console.log('DataContext: Account updated successfully', updatedAccount);
      await loadAccountBalances();
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  };

  const deleteAccount = async (id) => {
    try {
      console.log('DataContext: Deleting account', id);
      await window.electronAPI.deleteAccount(id);
      console.log('DataContext: Account deleted successfully');
      await loadAccountBalances();
      // Also refresh transactions to update the account references
      await loadTransactions();
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  // Method to update just the initial balance of an account
  const updateAccountInitialBalance = async (id, balance) => {
    try {
      console.log('DataContext: Updating account initial balance', id, balance);
      await window.electronAPI.updateAccountInitialBalance(id, balance);
      console.log('DataContext: Account initial balance updated successfully');
      await loadAccountBalances();
    } catch (error) {
      console.error('Failed to update account initial balance:', error);
      throw error;
    }
  };

  // Savings goals methods
  const addSavingsGoal = async (goal) => {
    try {
      const newGoal = await window.electronAPI.addSavingsGoal(goal);
      setSavingsGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Failed to add savings goal:', error);
      throw error;
    }
  };

  const updateSavingsGoal = async (goal) => {
    try {
      const updatedGoal = await window.electronAPI.updateSavingsGoal(goal);
      setSavingsGoals(prev => 
        prev.map(g => g.id === goal.id ? updatedGoal : g)
      );
      return updatedGoal;
    } catch (error) {
      console.error('Failed to update savings goal:', error);
      throw error;
    }
  };

  const deleteSavingsGoal = async (id) => {
    try {
      await window.electronAPI.deleteSavingsGoal(id);
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
      throw error;
    }
  };

  // Account balance methods
  const loadAccountBalances = async () => {
    try {
      const balances = await window.electronAPI.getAccountBalances();
      setAccountBalances(balances);
      console.log('Account balances refreshed:', balances.length);
    } catch (error) {
      console.error('Failed to load account balances:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const transactionsData = await window.electronAPI.getTransactions();
      setTransactions(transactionsData);
      console.log('Transactions refreshed:', transactionsData.length);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  // Budget methods
  const addBudgetItem = async (budgetItem) => {
    try {
      const newItem = await window.electronAPI.addBudgetItem(budgetItem);
      setMonthlyBudget(prev => [...prev, newItem]);
      await loadBudgetComparison();
      return newItem;
    } catch (error) {
      console.error('Failed to add budget item:', error);
      throw error;
    }
  };

  const updateBudgetItem = async (budgetItem) => {
    try {
      const updatedItem = await window.electronAPI.updateBudgetItem(budgetItem);
      setMonthlyBudget(prev => 
        prev.map(item => item.id === budgetItem.id ? updatedItem : item)
      );
      await loadBudgetComparison();
      return updatedItem;
    } catch (error) {
      console.error('Failed to update budget item:', error);
      throw error;
    }
  };

  const deleteBudgetItem = async (id) => {
    try {
      await window.electronAPI.deleteBudgetItem(id);
      setMonthlyBudget(prev => prev.filter(item => item.id !== id));
      await loadBudgetComparison();
    } catch (error) {
      console.error('Failed to delete budget item:', error);
      throw error;
    }
  };

  const loadBudgetComparison = async () => {
    try {
      const comparison = await window.electronAPI.getBudgetComparison();
      setBudgetComparison(comparison);
    } catch (error) {
      console.error('Failed to load budget comparison:', error);
    }
  };

  // Helper function to generate UUIDs
  const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const value = {
    // Data
    transactions,
    savingsGoals,
    accountBalances,
    monthlyBudget,
    budgetComparison,
    loading,
    
    // Methods
    loadData,
    
    // Transaction methods
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Account management methods
    addAccount,
    updateAccount,
    deleteAccount,
    updateAccountInitialBalance,
    
    // Savings goal methods
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    
    // Account balance methods
    loadAccountBalances,
    loadTransactions,
    
    // Budget methods
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    
    // Utility
    generateId
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};