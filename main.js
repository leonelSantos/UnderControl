// main.js - Main process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { initDatabase, db } = require('./database');

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
ipcMain.handle('db:addTransaction', async (event, transaction) => {
  return new Promise((resolve, reject) => {
    const { id, date, description, amount, category, type } = transaction;
    db.run(
      `INSERT INTO transactions (id, date, description, amount, category, type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, date, description, amount, category, type],
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
    const { id, date, description, amount, category, type } = transaction;
    db.run(
      `UPDATE transactions 
       SET date = ?, description = ?, amount = ?, category = ?, type = ?
       WHERE id = ?`,
      [date, description, amount, category, type, id],
      (err) => {
        if (err) reject(err);
        else resolve(transaction);
      }
    );
  });
});

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

// Bank connection handler (Plaid integration)
ipcMain.handle('bank:connect', async () => {
  // This is a placeholder for Plaid Link integration
  // In production, you'd implement the full Plaid flow
  return {
    message: 'Bank connection feature requires Plaid API keys',
    instructions: 'Sign up at https://plaid.com to get API credentials'
  };
});
