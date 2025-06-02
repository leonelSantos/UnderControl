// main.js - Main process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { 
  initDatabase, 
  db, 
  getAccountBalances, 
  updateAccountBalance,
  getMonthlyBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetComparison
} = require('./database');

const store = new Store();
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

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