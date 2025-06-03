// preload.js - Clean bridge without legacy code
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Transaction methods
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