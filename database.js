// database.js - SQLite database setup with sql.js (no compilation needed)
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db = null;
let SQL = null;

// Database file path
const dbPath = path.join(app.getPath('userData'), 'finance.db');

// Initialize database
const initDatabase = async () => {
  try {
    // Initialize sql.js
    SQL = await initSqlJs();
    
    // Check if database file exists
    let buffer;
    if (fs.existsSync(dbPath)) {
      // Load existing database
      buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log('Loaded existing database');
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('Created new database');
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    createTables();
    
    // Insert default data
    insertDefaultData();
    
    // Save database to file
    saveDatabase();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const createTables = () => {
  // Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      account_type TEXT CHECK(account_type IN ('checking', 'savings')),
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Account balances table
  db.run(`
    CREATE TABLE IF NOT EXISTS account_balances (
      id INTEGER PRIMARY KEY,
      account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings', 'credit_card', 'student_loan')),
      balance REAL NOT NULL DEFAULT 0,
      account_name TEXT,
      interest_rate REAL DEFAULT 0,
      minimum_payment REAL DEFAULT 0,
      due_date INTEGER DEFAULT 1,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Monthly budget table
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_budget (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      is_recurring BOOLEAN DEFAULT 1,
      day_of_month INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Savings goals table
  db.run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target REAL NOT NULL,
      current REAL DEFAULT 0,
      deadline TEXT,
      description TEXT,
      color TEXT DEFAULT '#3498db',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'both')),
      icon TEXT,
      color TEXT,
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `);

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)');
  db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
};

const insertDefaultData = () => {
  // Check if default data already exists
  const accountCount = db.exec("SELECT COUNT(*) as count FROM account_balances")[0];
  if (accountCount && accountCount.values[0][0] > 0) {
    return; // Default data already exists
  }

  // Initialize default account balances
  db.run(`INSERT OR IGNORE INTO account_balances (account_type, balance, account_name) VALUES (?, ?, ?)`, 
    ['checking', 0, 'Checking Account']);
  db.run(`INSERT OR IGNORE INTO account_balances (account_type, balance, account_name) VALUES (?, ?, ?)`, 
    ['savings', 0, 'Savings Account']);

  // Insert default categories
  const defaultCategories = [
    { id: 'food', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#e74c3c' },
    { id: 'transport', name: 'Transportation', type: 'expense', icon: '🚗', color: '#3498db' },
    { id: 'utilities', name: 'Utilities', type: 'expense', icon: '💡', color: '#f39c12' },
    { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#9b59b6' },
    { id: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#e91e63' },
    { id: 'healthcare', name: 'Healthcare', type: 'expense', icon: '🏥', color: '#2ecc71' },
    { id: 'education', name: 'Education', type: 'expense', icon: '📚', color: '#1abc9c' },
    { id: 'housing', name: 'Housing/Rent', type: 'expense', icon: '🏠', color: '#34495e' },
    { id: 'insurance', name: 'Insurance', type: 'expense', icon: '🛡️', color: '#16a085' },
    { id: 'savings', name: 'Savings', type: 'expense', icon: '💰', color: '#27ae60' },
    { id: 'salary', name: 'Salary', type: 'income', icon: '💵', color: '#2ecc71' },
    { id: 'freelance', name: 'Freelance', type: 'income', icon: '💻', color: '#3498db' },
    { id: 'investments', name: 'Investments', type: 'income', icon: '📈', color: '#f39c12' },
    { id: 'other', name: 'Other', type: 'both', icon: '📌', color: '#95a5a6' }
  ];

  defaultCategories.forEach(cat => {
    db.run(`INSERT OR IGNORE INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.type, cat.icon, cat.color]);
  });

  // Insert default settings
  const defaultSettings = [
    { key: 'currency', value: 'USD' },
    { key: 'dateFormat', value: 'MM/DD/YYYY' },
    { key: 'firstDayOfWeek', value: '0' },
    { key: 'theme', value: 'light' }
  ];

  defaultSettings.forEach(setting => {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
  });
};

const saveDatabase = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Helper functions for database operations

// Account balance functions
const getAccountBalances = () => {
  try {
    const stmt = db.prepare('SELECT * FROM account_balances ORDER BY account_type');
    const result = stmt.getAsObject();
    stmt.free();
    
    // Convert sql.js result to array format
    const results = [];
    const res = db.exec('SELECT * FROM account_balances ORDER BY account_type');
    if (res.length > 0) {
      const columns = res[0].columns;
      const values = res[0].values;
      
      values.forEach(row => {
        const obj = {};
        columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        results.push(obj);
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error getting account balances:', error);
    throw error;
  }
};

const updateAccountBalance = (accountType, balance) => {
  try {
    db.run('UPDATE account_balances SET balance = ?, last_updated = CURRENT_TIMESTAMP WHERE account_type = ?', 
      [balance, accountType]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error updating account balance:', error);
    throw error;
  }
};

const addDebtAccount = (accountData) => {
  try {
    const { account_type, balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    db.run(`INSERT INTO account_balances (account_type, balance, account_name, interest_rate, minimum_payment, due_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
      [account_type, balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1]);
    
    saveDatabase();
    
    // Get the last inserted row id (simulation)
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    return { id, ...accountData };
  } catch (error) {
    console.error('Error adding debt account:', error);
    throw error;
  }
};

const updateDebtAccount = (id, accountData) => {
  try {
    const { balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    db.run(`UPDATE account_balances 
            SET balance = ?, account_name = ?, interest_rate = ?, minimum_payment = ?, due_date = ?, last_updated = CURRENT_TIMESTAMP
            WHERE id = ?`,
      [balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1, id]);
    
    saveDatabase();
    return accountData;
  } catch (error) {
    console.error('Error updating debt account:', error);
    throw error;
  }
};

const deleteDebtAccount = (id) => {
  try {
    db.run('DELETE FROM account_balances WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error deleting debt account:', error);
    throw error;
  }
};

// Monthly budget functions
const getMonthlyBudget = () => {
  try {
    const results = [];
    const res = db.exec('SELECT * FROM monthly_budget WHERE is_active = 1 ORDER BY type, name');
    if (res.length > 0) {
      const columns = res[0].columns;
      const values = res[0].values;
      
      values.forEach(row => {
        const obj = {};
        columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        results.push(obj);
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error getting monthly budget:', error);
    throw error;
  }
};

const addBudgetItem = (budgetItem) => {
  try {
    const { id, name, amount, type, category, day_of_month } = budgetItem;
    
    db.run(`INSERT INTO monthly_budget (id, name, amount, type, category, day_of_month) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, amount, type, category, day_of_month || 1]);
    
    saveDatabase();
    return { id, ...budgetItem };
  } catch (error) {
    console.error('Error adding budget item:', error);
    throw error;
  }
};

const updateBudgetItem = (budgetItem) => {
  try {
    const { id, name, amount, type, category, day_of_month } = budgetItem;
    
    db.run(`UPDATE monthly_budget 
            SET name = ?, amount = ?, type = ?, category = ?, day_of_month = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      [name, amount, type, category, day_of_month, id]);
    
    saveDatabase();
    return budgetItem;
  } catch (error) {
    console.error('Error updating budget item:', error);
    throw error;
  }
};

const deleteBudgetItem = (id) => {
  try {
    db.run('DELETE FROM monthly_budget WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error deleting budget item:', error);
    throw error;
  }
};

// Get budget vs actual comparison
const getBudgetComparison = () => {
  try {
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();
    
    const results = [];
    const res = db.exec(`
      SELECT 
        b.id,
        b.name,
        b.amount as budgeted,
        b.type,
        b.category,
        COALESCE(SUM(t.amount), 0) as actual
      FROM monthly_budget b
      LEFT JOIN transactions t ON t.category = b.category 
        AND t.type = b.type
        AND strftime('%m', t.date) = '${currentMonth}'
        AND strftime('%Y', t.date) = '${currentYear}'
      WHERE b.is_active = 1
      GROUP BY b.id, b.name, b.amount, b.type, b.category
    `);
    
    if (res.length > 0) {
      const columns = res[0].columns;
      const values = res[0].values;
      
      values.forEach(row => {
        const obj = {};
        columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        
        obj.difference = obj.budgeted - obj.actual;
        obj.percentage = obj.budgeted > 0 ? (obj.actual / obj.budgeted * 100).toFixed(2) : 0;
        
        results.push(obj);
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error getting budget comparison:', error);
    throw error;
  }
};

// Export database instance and helper functions
module.exports = {
  db: () => db, // Return db as a function since it's initialized asynchronously
  initDatabase,
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
};