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
      await loadAccountBalances(); // Refresh account balances
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
      await loadAccountBalances();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
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
    } catch (error) {
      console.error('Failed to load account balances:', error);
    }
  };

  const updateAccountBalance = async (accountType, balance) => {
    try {
      await window.electronAPI.updateAccountBalance(accountType, balance);
      await loadAccountBalances();
    } catch (error) {
      console.error('Failed to update account balance:', error);
      throw error;
    }
  };

  // Debt account methods
  const addDebtAccount = async (accountData) => {
    try {
      const newAccount = await window.electronAPI.addDebtAccount(accountData);
      await loadAccountBalances();
      return newAccount;
    } catch (error) {
      console.error('Failed to add debt account:', error);
      throw error;
    }
  };

  const updateDebtAccount = async (id, accountData) => {
    try {
      const updatedAccount = await window.electronAPI.updateDebtAccount(id, accountData);
      await loadAccountBalances();
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update debt account:', error);
      throw error;
    }
  };

  const deleteDebtAccount = async (id) => {
    try {
      await window.electronAPI.deleteDebtAccount(id);
      await loadAccountBalances();
    } catch (error) {
      console.error('Failed to delete debt account:', error);
      throw error;
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
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    updateAccountBalance,
    addDebtAccount,
    updateDebtAccount,
    deleteDebtAccount,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    generateId
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};