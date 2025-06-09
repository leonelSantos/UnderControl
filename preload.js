// preload.js - Complete bridge with all required functions including transfer support
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Transaction methods (now with transfer support)
  addTransaction: (transaction) => ipcRenderer.invoke('db:addTransaction', transaction),
  getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
  deleteTransaction: (id) => ipcRenderer.invoke('db:deleteTransaction', id),
  updateTransaction: (transaction) => ipcRenderer.invoke('db:updateTransaction', transaction),
  
  // Account management methods
  addAccount: (accountData) => ipcRenderer.invoke('db:addAccount', accountData),
  updateAccount: (id, accountData) => ipcRenderer.invoke('db:updateAccount', id, accountData),
  deleteAccount: (id) => ipcRenderer.invoke('db:deleteAccount', id),
  updateAccountInitialBalance: (id, balance) => ipcRenderer.invoke('db:updateAccountInitialBalance', id, balance),
  getAccountBalances: () => ipcRenderer.invoke('db:getAccountBalances'),
  
  // Debt account management methods (for credit cards and loans)
  addDebtAccount: (accountData) => ipcRenderer.invoke('db:addAccount', accountData),
  updateDebtAccount: (id, accountData) => ipcRenderer.invoke('db:updateAccount', id, accountData),
  deleteDebtAccount: (id) => ipcRenderer.invoke('db:deleteAccount', id),
  
  // Legacy balance update method (for backward compatibility)
  updateAccountBalance: (accountType, balance) => {
    // This is a legacy method - we'll try to find the account by type and update its initial balance
    console.warn('updateAccountBalance is deprecated, use updateAccountInitialBalance instead');
    return ipcRenderer.invoke('db:updateAccountBalance', accountType, balance);
  },
  
  // Savings goals methods
  getSavingsGoals: () => ipcRenderer.invoke('db:getSavingsGoals'),
  addSavingsGoal: (goal) => ipcRenderer.invoke('db:addSavingsGoal', goal),
  updateSavingsGoal: (goal) => ipcRenderer.invoke('db:updateSavingsGoal', goal),
  deleteSavingsGoal: (id) => ipcRenderer.invoke('db:deleteSavingsGoal', id),
  
  // Monthly budget methods
  getMonthlyBudget: () => ipcRenderer.invoke('db:getMonthlyBudget'),
  addBudgetItem: (budgetItem) => ipcRenderer.invoke('db:addBudgetItem', budgetItem),
  updateBudgetItem: (budgetItem) => ipcRenderer.invoke('db:updateBudgetItem', budgetItem),
  deleteBudgetItem: (id) => ipcRenderer.invoke('db:deleteBudgetItem', id),
  getBudgetComparison: () => ipcRenderer.invoke('db:getBudgetComparison')
});