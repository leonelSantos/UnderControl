// database.js - SQLite database setup
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Create database in user's app data directory
const dbPath = path.join(app.getPath('userData'), 'finance.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with all required tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Transactions table - stores all income and expense records
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          account_id TEXT,
          tags TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
        )
      `);

      // Savings goals table - tracks financial goals
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

      // Bank accounts table - for Plaid integration
      db.run(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id TEXT PRIMARY KEY,
          plaid_account_id TEXT UNIQUE,
          plaid_item_id TEXT,
          institution TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          subtype TEXT,
          balance REAL,
          currency TEXT DEFAULT 'USD',
          last_updated TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Budgets table - for budget tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'yearly')),
          start_date TEXT NOT NULL,
          end_date TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Categories table - custom spending categories
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

      // Recurring transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS recurring_transactions (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
          start_date TEXT NOT NULL,
          end_date TEXT,
          last_processed TEXT,
          next_date TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Settings table - app configuration
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)');
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)');

      // Insert default categories
      const defaultCategories = [
        { id: 'food', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#e74c3c' },
        { id: 'transport', name: 'Transportation', type: 'expense', icon: '🚗', color: '#3498db' },
        { id: 'utilities', name: 'Utilities', type: 'expense', icon: '💡', color: '#f39c12' },
        { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#9b59b6' },
        { id: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#e91e63' },
        { id: 'healthcare', name: 'Healthcare', type: 'expense', icon: '🏥', color: '#2ecc71' },
        { id: 'education', name: 'Education', type: 'expense', icon: '📚', color: '#1abc9c' },
        { id: 'housing', name: 'Housing', type: 'expense', icon: '🏠', color: '#34495e' },
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

      insertCategory.finalize();

      // Insert default settings
      const defaultSettings = [
        { key: 'currency', value: 'USD' },
        { key: 'dateFormat', value: 'MM/DD/YYYY' },
        { key: 'firstDayOfWeek', value: '0' }, // 0 = Sunday
        { key: 'theme', value: 'light' }
      ];

      const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
      defaultSettings.forEach(setting => {
        insertSetting.run(setting.key, setting.value);
      });
      insertSetting.finalize();

      // Trigger to update the updated_at timestamp
      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_transaction_timestamp 
        AFTER UPDATE ON transactions
        BEGIN
          UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_savings_goal_timestamp 
        AFTER UPDATE ON savings_goals
        BEGIN
          UPDATE savings_goals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_budget_timestamp 
        AFTER UPDATE ON budgets
        BEGIN
          UPDATE budgets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Helper functions for database operations

// Get summary statistics
const getFinancialSummary = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM transactions
      WHERE date >= ? AND date <= ?
      GROUP BY type
    `;
    
    db.all(query, [startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else {
        const summary = {
          income: { total: 0, count: 0, average: 0 },
          expense: { total: 0, count: 0, average: 0 },
          net: 0,
          savingsRate: 0
        };
        
        rows.forEach(row => {
          summary[row.type] = {
            total: row.total || 0,
            count: row.count || 0,
            average: row.average || 0
          };
        });
        
        summary.net = summary.income.total - summary.expense.total;
        summary.savingsRate = summary.income.total > 0 
          ? (summary.net / summary.income.total * 100).toFixed(2)
          : 0;
        
        resolve(summary);
      }
    });
  });
};

// Get spending by category
const getSpendingByCategory = (startDate, endDate, type = 'expense') => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = ? AND date >= ? AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `;
    
    db.all(query, [type, startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Get monthly trends
const getMonthlyTrends = (months = 12) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        strftime('%Y-%m', date) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE date >= date('now', '-' || ? || ' months')
      GROUP BY month, type
      ORDER BY month
    `;
    
    db.all(query, [months], (err, rows) => {
      if (err) reject(err);
      else {
        // Transform data into monthly summary
        const trends = {};
        rows.forEach(row => {
          if (!trends[row.month]) {
            trends[row.month] = { income: 0, expense: 0 };
          }
          trends[row.month][row.type] = row.total;
        });
        resolve(trends);
      }
    });
  });
};

// Budget tracking
const getBudgetStatus = (budgetId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        b.*,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.category = b.category 
        AND t.type = 'expense'
        AND t.date >= b.start_date
        AND (b.end_date IS NULL OR t.date <= b.end_date)
      WHERE b.id = ?
      GROUP BY b.id
    `;
    
    db.get(query, [budgetId], (err, row) => {
      if (err) reject(err);
      else {
        if (row) {
          row.remaining = row.amount - row.spent;
          row.percentage = (row.spent / row.amount * 100).toFixed(2);
        }
        resolve(row);
      }
    });
  });
};

// Process recurring transactions
const processRecurringTransactions = () => {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
      `SELECT * FROM recurring_transactions 
       WHERE is_active = 1 AND next_date <= ?`,
      [today],
      async (err, recurringTxns) => {
        if (err) return reject(err);
        
        const processed = [];
        for (const recurring of recurringTxns) {
          // Create transaction
          const txn = {
            id: require('uuid').v4(),
            date: recurring.next_date,
            description: recurring.description,
            amount: recurring.amount,
            category: recurring.category,
            type: recurring.type,
            notes: 'Recurring transaction'
          };
          
          // Insert transaction
          await new Promise((res, rej) => {
            db.run(
              `INSERT INTO transactions (id, date, description, amount, category, type, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [txn.id, txn.date, txn.description, txn.amount, txn.category, txn.type, txn.notes],
              (err) => err ? rej(err) : res()
            );
          });
          
          // Calculate next date
          const nextDate = calculateNextDate(recurring.next_date, recurring.frequency);
          
          // Update recurring transaction
          await new Promise((res, rej) => {
            db.run(
              `UPDATE recurring_transactions 
               SET last_processed = ?, next_date = ?
               WHERE id = ?`,
              [today, nextDate, recurring.id],
              (err) => err ? rej(err) : res()
            );
          });
          
          processed.push(txn);
        }
        
        resolve(processed);
      }
    );
  });
};

// Helper function to calculate next date for recurring transactions
const calculateNextDate = (currentDate, frequency) => {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
};

// Export database instance and helper functions
module.exports = {
  db,
  initDatabase,
  getFinancialSummary,
  getSpendingByCategory,
  getMonthlyTrends,
  getBudgetStatus,
  processRecurringTransactions
};