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
          account_type TEXT CHECK(account_type IN ('checking', 'savings')),
          tags TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Account balances table - check if it exists and migrate if needed
      db.run(`
        CREATE TABLE IF NOT EXISTS account_balances (
          id INTEGER PRIMARY KEY,
          account_type TEXT UNIQUE NOT NULL CHECK(account_type IN ('checking', 'savings')),
          balance REAL NOT NULL DEFAULT 0,
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if we need to migrate the account_balances table
      db.all("PRAGMA table_info(account_balances)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const columnNames = columns.map(col => col.name);
        const needsMigration = !columnNames.includes('account_name');

        if (needsMigration) {
          console.log('Migrating account_balances table...');
          
          // SQLite doesn't support modifying CHECK constraints directly
          // We need to recreate the table with the new constraint
          db.run(`
            CREATE TABLE IF NOT EXISTS account_balances_new (
              id INTEGER PRIMARY KEY,
              account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings', 'credit_card', 'student_loan')),
              balance REAL NOT NULL DEFAULT 0,
              account_name TEXT,
              interest_rate REAL DEFAULT 0,
              minimum_payment REAL DEFAULT 0,
              due_date INTEGER DEFAULT 1,
              last_updated TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating new table:', err);
              // Continue with ALTER approach if table creation fails
              addColumnsToExistingTable();
              return;
            }
            
            // Copy existing data to new table
            db.run(`
              INSERT INTO account_balances_new (id, account_type, balance, account_name, last_updated)
              SELECT 
                id, 
                account_type, 
                balance, 
                CASE 
                  WHEN account_type = 'checking' THEN 'Checking Account'
                  WHEN account_type = 'savings' THEN 'Savings Account'
                  ELSE account_type
                END as account_name,
                last_updated
              FROM account_balances
            `, (err) => {
              if (err) {
                console.error('Error copying data:', err);
                addColumnsToExistingTable();
                return;
              }
              
              // Drop old table and rename new one
              db.run('DROP TABLE account_balances', (err) => {
                if (err) {
                  console.error('Error dropping old table:', err);
                  addColumnsToExistingTable();
                  return;
                }
                
                db.run('ALTER TABLE account_balances_new RENAME TO account_balances', (err) => {
                  if (err) {
                    console.error('Error renaming table:', err);
                    // Try to recreate the original table structure
                    addColumnsToExistingTable();
                    return;
                  }
                  
                  console.log('Migration completed successfully');
                  continueInitialization(resolve, reject);
                });
              });
            });
          });
        } else {
          // No migration needed, continue with initialization
          continueInitialization(resolve, reject);
        }
        
        function addColumnsToExistingTable() {
          console.log('Falling back to ALTER TABLE approach...');
          
          // Add new columns to existing table (this won't fix the CHECK constraint but allows the app to work)
          db.run('ALTER TABLE account_balances ADD COLUMN account_name TEXT', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding account_name column:', err);
            }
          });
          
          db.run('ALTER TABLE account_balances ADD COLUMN interest_rate REAL DEFAULT 0', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding interest_rate column:', err);
            }
          });
          
          db.run('ALTER TABLE account_balances ADD COLUMN minimum_payment REAL DEFAULT 0', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding minimum_payment column:', err);
            }
          });
          
          db.run('ALTER TABLE account_balances ADD COLUMN due_date INTEGER DEFAULT 1', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding due_date column:', err);
            }
          });

          // Update existing checking and savings accounts with names
          db.run(`UPDATE account_balances SET account_name = 'Checking Account' WHERE account_type = 'checking' AND account_name IS NULL`);
          db.run(`UPDATE account_balances SET account_name = 'Savings Account' WHERE account_type = 'savings' AND account_name IS NULL`);
          
          continueInitialization(resolve, reject);
        }
      });
    });
  });
};

const continueInitialization = (resolve, reject) => {
  db.serialize(() => {

      // Monthly budget table - for salary and recurring expenses
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

      // Initialize default account balances - now includes debt accounts
      db.run(`
        INSERT OR IGNORE INTO account_balances (account_type, balance, account_name) 
        VALUES 
          ('checking', 0, 'Checking Account'),
          ('savings', 0, 'Savings Account')
      `);

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
        AFTER UPDATE ON monthly_budget
        BEGIN
          UPDATE monthly_budget SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_account_balance_timestamp 
        AFTER UPDATE ON account_balances
        BEGIN
          UPDATE account_balances SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

// Helper functions for database operations

// Account balance functions - updated for all account types
const getAccountBalances = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM account_balances ORDER BY account_type', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const updateAccountBalance = (accountType, balance) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE account_balances SET balance = ? WHERE account_type = ?',
      [balance, accountType],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

const addDebtAccount = (accountData) => {
  return new Promise((resolve, reject) => {
    const { account_type, balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    // Since we can't use UNIQUE constraint on account_type anymore for debt accounts,
    // we'll insert without the UNIQUE constraint
    db.run(
      `INSERT INTO account_balances (account_type, balance, account_name, interest_rate, minimum_payment, due_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [account_type, balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...accountData });
      }
    );
  });
};

const updateDebtAccount = (id, accountData) => {
  return new Promise((resolve, reject) => {
    const { balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    db.run(
      `UPDATE account_balances 
       SET balance = ?, account_name = ?, interest_rate = ?, minimum_payment = ?, due_date = ?
       WHERE id = ?`,
      [balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1, id],
      function(err) {
        if (err) reject(err);
        else resolve(accountData);
      }
    );
  });
};

const deleteDebtAccount = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM account_balances WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Monthly budget functions
const getMonthlyBudget = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM monthly_budget WHERE is_active = 1 ORDER BY type, name', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const addBudgetItem = (budgetItem) => {
  return new Promise((resolve, reject) => {
    const { id, name, amount, type, category, day_of_month } = budgetItem;
    db.run(
      `INSERT INTO monthly_budget (id, name, amount, type, category, day_of_month) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, amount, type, category, day_of_month || 1],
      function(err) {
        if (err) reject(err);
        else resolve({ id, ...budgetItem });
      }
    );
  });
};

const updateBudgetItem = (budgetItem) => {
  return new Promise((resolve, reject) => {
    const { id, name, amount, type, category, day_of_month } = budgetItem;
    db.run(
      `UPDATE monthly_budget 
       SET name = ?, amount = ?, type = ?, category = ?, day_of_month = ?
       WHERE id = ?`,
      [name, amount, type, category, day_of_month, id],
      function(err) {
        if (err) reject(err);
        else resolve(budgetItem);
      }
    );
  });
};

const deleteBudgetItem = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM monthly_budget WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

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

// Budget vs actual spending comparison
const getBudgetComparison = () => {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const query = `
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
    `;
    
    db.all(query, [currentMonth.toString().padStart(2, '0'), currentYear.toString()], (err, rows) => {
      if (err) reject(err);
      else {
        const comparison = rows.map(row => ({
          ...row,
          difference: row.budgeted - row.actual,
          percentage: row.budgeted > 0 ? (row.actual / row.budgeted * 100).toFixed(2) : 0
        }));
        resolve(comparison);
      }
    });
  });
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
  getFinancialSummary,
  getSpendingByCategory,
  getMonthlyTrends,
  getBudgetComparison
};