// database.js - SQLite database setup with better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Create database in user's app data directory
const dbPath = path.join(app.getPath('userData'), 'finance.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with all required tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // Transactions table - stores all income and expense records
      db.exec(`
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
      db.exec(`
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
      db.exec(`
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
      db.exec(`
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
      db.exec(`
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
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      `);

      // Initialize default account balances
      const insertAccountBalance = db.prepare(`
        INSERT OR IGNORE INTO account_balances (account_type, balance, account_name) 
        VALUES (?, ?, ?)
      `);
      
      insertAccountBalance.run('checking', 0, 'Checking Account');
      insertAccountBalance.run('savings', 0, 'Savings Account');

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

      const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, type, icon, color) 
        VALUES (?, ?, ?, ?, ?)
      `);

      defaultCategories.forEach(cat => {
        insertCategory.run(cat.id, cat.name, cat.type, cat.icon, cat.color);
      });

      // Insert default settings
      const defaultSettings = [
        { key: 'currency', value: 'USD' },
        { key: 'dateFormat', value: 'MM/DD/YYYY' },
        { key: 'firstDayOfWeek', value: '0' },
        { key: 'theme', value: 'light' }
      ];

      const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
      defaultSettings.forEach(setting => {
        insertSetting.run(setting.key, setting.value);
      });

      console.log('Database initialized successfully');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper functions for database operations

// Account balance functions
const getAccountBalances = () => {
  try {
    const stmt = db.prepare('SELECT * FROM account_balances ORDER BY account_type');
    return stmt.all();
  } catch (error) {
    console.error('Error getting account balances:', error);
    throw error;
  }
};

const updateAccountBalance = (accountType, balance) => {
  try {
    const stmt = db.prepare('UPDATE account_balances SET balance = ?, last_updated = CURRENT_TIMESTAMP WHERE account_type = ?');
    const result = stmt.run(balance, accountType);
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating account balance:', error);
    throw error;
  }
};

const addDebtAccount = (accountData) => {
  try {
    const { account_type, balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    const stmt = db.prepare(`
      INSERT INTO account_balances (account_type, balance, account_name, interest_rate, minimum_payment, due_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(account_type, balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1);
    return { id: result.lastInsertRowid, ...accountData };
  } catch (error) {
    console.error('Error adding debt account:', error);
    throw error;
  }
};

const updateDebtAccount = (id, accountData) => {
  try {
    const { balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    const stmt = db.prepare(`
      UPDATE account_balances 
      SET balance = ?, account_name = ?, interest_rate = ?, minimum_payment = ?, due_date = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1, id);
    return result.changes > 0 ? accountData : null;
  } catch (error) {
    console.error('Error updating debt account:', error);
    throw error;
  }
};

const deleteDebtAccount = (id) => {
  try {
    const stmt = db.prepare('DELETE FROM account_balances WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting debt account:', error);
    throw error;
  }
};

// Monthly budget functions
const getMonthlyBudget = () => {
  try {
    const stmt = db.prepare('SELECT * FROM monthly_budget WHERE is_active = 1 ORDER BY type, name');
    return stmt.all();
  } catch (error) {
    console.error('Error getting monthly budget:', error);
    throw error;
  }
};

const addBudgetItem = (budgetItem) => {
  try {
    const { id, name, amount, type, category, day_of_month } = budgetItem;
    
    const stmt = db.prepare(`
      INSERT INTO monthly_budget (id, name, amount, type, category, day_of_month) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, name, amount, type, category, day_of_month || 1);
    return { id, ...budgetItem };
  } catch (error) {
    console.error('Error adding budget item:', error);
    throw error;
  }
};

const updateBudgetItem = (budgetItem) => {
  try {
    const { id, name, amount, type, category, day_of_month } = budgetItem;
    
    const stmt = db.prepare(`
      UPDATE monthly_budget 
      SET name = ?, amount = ?, type = ?, category = ?, day_of_month = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(name, amount, type, category, day_of_month, id);
    return result.changes > 0 ? budgetItem : null;
  } catch (error) {
    console.error('Error updating budget item:', error);
    throw error;
  }
};

const deleteBudgetItem = (id) => {
  try {
    const stmt = db.prepare('DELETE FROM monthly_budget WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
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
    
    const stmt = db.prepare(`
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
        AND strftime('%m', t.date) = ?
        AND strftime('%Y', t.date) = ?
      WHERE b.is_active = 1
      GROUP BY b.id, b.name, b.amount, b.type, b.category
    `);
    
    const rows = stmt.all(currentMonth, currentYear);
    
    return rows.map(row => ({
      ...row,
      difference: row.budgeted - row.actual,
      percentage: row.budgeted > 0 ? (row.actual / row.budgeted * 100).toFixed(2) : 0
    }));
  } catch (error) {
    console.error('Error getting budget comparison:', error);
    throw error;
  }
};

// Export database instance and helper functions
module.exports = {
  db,
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