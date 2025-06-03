// main.js - Clean version without legacy code

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { 
  initDatabase, 
  getAccountBalances, 
  addAccount,
  updateAccount,
  updateAccountInitialBalance,
  deleteAccount,
  getMonthlyBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetComparison,
  getTransactions,
  getSavingsGoals,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal
} = require('./database');

const store = new Store();
let mainWindow;

// Check if we're in development mode
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false // Don't show until ready
  });

  // Load the appropriate URL based on environment
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✓ Application window ready');
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('✗ Failed to load:', validatedURL, 'Error:', errorDescription);
    
    if (isDev) {
      console.log('Development mode: Make sure webpack dev server is running on http://localhost:3000');
      console.log('Try running: npm run dev:react');
    } else {
      console.log('Production mode: Make sure build folder exists');
      console.log('Try running: npm run build:react');
    }
  });
}

app.whenReady().then(async () => {
  try {
    console.log('🚀 Starting application...');
    
    // Initialize database first
    await initDatabase();
    console.log('✓ Database ready');
    
    // Setup IPC handlers
    setupIpcHandlers();
    console.log('✓ IPC handlers ready');
    
    // Create the main window
    createWindow();
    console.log('✓ Application started successfully');
    
  } catch (error) {
    console.error('✗ Failed to start application:', error);
    // Show error dialog to user
    const { dialog } = require('electron');
    dialog.showErrorBox('Startup Error', `Failed to initialize database: ${error.message}`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup all IPC handlers
function setupIpcHandlers() {
  console.log('Setting up IPC handlers...');

  // Transaction handlers
  ipcMain.handle('db:addTransaction', async (event, transaction) => {
    try {
      console.log('Adding transaction:', transaction.description);
      return await addTransaction(transaction);
    } catch (error) {
      console.error('IPC Error - addTransaction:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getTransactions', async () => {
    try {
      const transactions = await getTransactions();
      console.log(`✓ Retrieved ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      console.error('IPC Error - getTransactions:', error);
      return [];
    }
  });

  ipcMain.handle('db:deleteTransaction', async (event, id) => {
    try {
      const result = await deleteTransaction(id);
      console.log('✓ Deleted transaction:', id);
      return result;
    } catch (error) {
      console.error('IPC Error - deleteTransaction:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateTransaction', async (event, transaction) => {
    try {
      const result = await updateTransaction(transaction);
      console.log('✓ Updated transaction:', transaction.id);
      return result;
    } catch (error) {
      console.error('IPC Error - updateTransaction:', error);
      throw error;
    }
  });

  // Account management handlers
  ipcMain.handle('db:addAccount', async (event, accountData) => {
    try {
      console.log('IPC: Adding account:', accountData);
      const result = await addAccount(accountData);
      console.log('IPC: Account added successfully:', result);
      return result;
    } catch (error) {
      console.error('IPC Error - addAccount:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateAccount', async (event, id, accountData) => {
    try {
      console.log('IPC: Updating account:', id, accountData);
      const result = await updateAccount(id, accountData);
      console.log('IPC: Account updated successfully:', result);
      return result;
    } catch (error) {
      console.error('IPC Error - updateAccount:', error);
      throw error;
    }
  });

  ipcMain.handle('db:deleteAccount', async (event, id) => {
    try {
      console.log('IPC: Deleting account:', id);
      const result = await deleteAccount(id);
      console.log('IPC: Account deleted successfully');
      return result;
    } catch (error) {
      console.error('IPC Error - deleteAccount:', error);
      throw error;
    }
  });

  // Handler for updating account initial balance
  ipcMain.handle('db:updateAccountInitialBalance', async (event, id, balance) => {
    try {
      console.log('IPC: Updating account initial balance:', id, balance);
      const result = await updateAccountInitialBalance(id, balance);
      console.log('IPC: Account initial balance updated successfully');
      return result;
    } catch (error) {
      console.error('IPC Error - updateAccountInitialBalance:', error);
      throw error;
    }
  });

  // Savings goals handlers
  ipcMain.handle('db:getSavingsGoals', async () => {
    try {
      const goals = await getSavingsGoals();
      console.log(`✓ Retrieved ${goals.length} savings goals`);
      return goals;
    } catch (error) {
      console.error('IPC Error - getSavingsGoals:', error);
      return [];
    }
  });

  ipcMain.handle('db:addSavingsGoal', async (event, goal) => {
    try {
      console.log('Adding savings goal:', goal.name);
      return await addSavingsGoal(goal);
    } catch (error) {
      console.error('IPC Error - addSavingsGoal:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateSavingsGoal', async (event, goal) => {
    try {
      const result = await updateSavingsGoal(goal);
      console.log('✓ Updated savings goal:', goal.id);
      return result;
    } catch (error) {
      console.error('IPC Error - updateSavingsGoal:', error);
      throw error;
    }
  });

  ipcMain.handle('db:deleteSavingsGoal', async (event, id) => {
    try {
      const result = await deleteSavingsGoal(id);
      console.log('✓ Deleted savings goal:', id);
      return result;
    } catch (error) {
      console.error('IPC Error - deleteSavingsGoal:', error);
      throw error;
    }
  });

  // Account balance handlers
  ipcMain.handle('db:getAccountBalances', async () => {
    try {
      const balances = await getAccountBalances();
      console.log(`✓ Retrieved ${balances.length} account balances`);
      return balances;
    } catch (error) {
      console.error('IPC Error - getAccountBalances:', error);
      return [];
    }
  });

  // Monthly budget handlers
  ipcMain.handle('db:getMonthlyBudget', async () => {
    try {
      const budget = await getMonthlyBudget();
      console.log(`✓ Retrieved ${budget.length} budget items`);
      return budget;
    } catch (error) {
      console.error('IPC Error - getMonthlyBudget:', error);
      return [];
    }
  });

  ipcMain.handle('db:addBudgetItem', async (event, budgetItem) => {
    try {
      return await addBudgetItem(budgetItem);
    } catch (error) {
      console.error('IPC Error - addBudgetItem:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateBudgetItem', async (event, budgetItem) => {
    try {
      return await updateBudgetItem(budgetItem);
    } catch (error) {
      console.error('IPC Error - updateBudgetItem:', error);
      throw error;
    }
  });

  ipcMain.handle('db:deleteBudgetItem', async (event, id) => {
    try {
      return await deleteBudgetItem(id);
    } catch (error) {
      console.error('IPC Error - deleteBudgetItem:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getBudgetComparison', async () => {
    try {
      const comparison = await getBudgetComparison();
      console.log(`✓ Retrieved budget comparison data`);
      return comparison;
    } catch (error) {
      console.error('IPC Error - getBudgetComparison:', error);
      return [];
    }
  });

  console.log('✓ All IPC handlers registered');
}