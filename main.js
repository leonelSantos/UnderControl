// main.js - Main process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { 
  initDatabase, 
  db, 
  getAccountBalances, 
  updateAccountBalance,
  addDebtAccount,
  updateDebtAccount,
  deleteDebtAccount,
  getMonthlyBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetComparison
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
    // In development, load from webpack dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    const indexPath = path.join(__dirname, 'build', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, 'Error:', errorDescription);
    
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
    await initDatabase();
    console.log('Database initialized successfully');
    createWindow();
  } catch (error) {
    console.error('Failed to initialize database:', error);
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

// IPC handlers for database operations

// Transaction handlers
ipcMain.handle('db:addTransaction', async (event, transaction) => {
  return new Promise((resolve, reject) => {
    const { id, date, description, amount, category, type, account_type } = transaction;
    db.run(
      `INSERT INTO transactions (id, date, description, amount, category, type, account_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, date, description, amount, category, type, account_type],
      function(err) {
        if (err) reject(err);
        else resolve({ id, ...transaction });
      }
    );
  });
});

ipcMain.handle('db:getTransactions', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('db:deleteTransaction', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM transactions WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

ipcMain.handle('db:updateTransaction', async (event, transaction) => {
  return new Promise((resolve, reject) => {
    const { id, date, description, amount, category, type, account_type } = transaction;
    db.run(
      `UPDATE transactions 
       SET date = ?, description = ?, amount = ?, category = ?, type = ?, account_type = ?
       WHERE id = ?`,
      [date, description, amount, category, type, account_type, id],
      (err) => {
        if (err) reject(err);
        else resolve(transaction);
      }
    );
  });
});

// Savings goals handlers
ipcMain.handle('db:getSavingsGoals', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM savings_goals', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('db:addSavingsGoal', async (event, goal) => {
  return new Promise((resolve, reject) => {
    const { id, name, target, current, deadline } = goal;
    db.run(
      `INSERT INTO savings_goals (id, name, target, current, deadline) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, target, current, deadline],
      function(err) {
        if (err) reject(err);
        else resolve({ id, ...goal });
      }
    );
  });
});

ipcMain.handle('db:updateSavingsGoal', async (event, goal) => {
  return new Promise((resolve, reject) => {
    const { id, name, target, current, deadline } = goal;
    db.run(
      `UPDATE savings_goals 
       SET name = ?, target = ?, current = ?, deadline = ?
       WHERE id = ?`,
      [name, target, current, deadline, id],
      (err) => {
        if (err) reject(err);
        else resolve(goal);
      }
    );
  });
});

ipcMain.handle('db:deleteSavingsGoal', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM savings_goals WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

// Account balance handlers
ipcMain.handle('db:getAccountBalances', async () => {
  return await getAccountBalances();
});

ipcMain.handle('db:updateAccountBalance', async (event, accountType, balance) => {
  return await updateAccountBalance(accountType, balance);
});

// Debt account handlers
ipcMain.handle('db:addDebtAccount', async (event, accountData) => {
  return await addDebtAccount(accountData);
});

ipcMain.handle('db:updateDebtAccount', async (event, id, accountData) => {
  return await updateDebtAccount(id, accountData);
});

ipcMain.handle('db:deleteDebtAccount', async (event, id) => {
  return await deleteDebtAccount(id);
});

// Monthly budget handlers
ipcMain.handle('db:getMonthlyBudget', async () => {
  return await getMonthlyBudget();
});

ipcMain.handle('db:addBudgetItem', async (event, budgetItem) => {
  return await addBudgetItem(budgetItem);
});

ipcMain.handle('db:updateBudgetItem', async (event, budgetItem) => {
  return await updateBudgetItem(budgetItem);
});

ipcMain.handle('db:deleteBudgetItem', async (event, id) => {
  return await deleteBudgetItem(id);
});

ipcMain.handle('db:getBudgetComparison', async () => {
  return await getBudgetComparison();
});