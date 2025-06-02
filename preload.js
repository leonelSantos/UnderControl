// preload.js - Bridge between main and renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addTransaction: (transaction) => ipcRenderer.invoke('db:addTransaction', transaction),
  getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
  deleteTransaction: (id) => ipcRenderer.invoke('db:deleteTransaction', id),
  updateTransaction: (transaction) => ipcRenderer.invoke('db:updateTransaction', transaction),
  getSavingsGoals: () => ipcRenderer.invoke('db:getSavingsGoals'),
  addSavingsGoal: (goal) => ipcRenderer.invoke('db:addSavingsGoal', goal),
  connectBank: () => ipcRenderer.invoke('bank:connect')
});
