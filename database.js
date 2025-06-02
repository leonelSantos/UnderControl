// database.js - Enhanced version with better error handling and data loading

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
    console.log('Initializing database at:', dbPath);
    
    // Initialize sql.js
    SQL = await initSqlJs();
    
    // Check if database file exists
    let buffer;
    if (fs.existsSync(dbPath)) {
      // Load existing database
      buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log('✓ Loaded existing database from:', dbPath);
      
      // Verify database integrity
      try {
        const result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('✓ Database tables found:', result[0]?.values?.map(row => row[0]) || 'none');
      } catch (err) {
        console.warn('⚠ Could not verify database tables:', err.message);
      }
    } else {
      // Create new database
      db = new SQL.Database();
      console.log('✓ Created new database');
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables (this is safe to run even if tables exist)
    createTables();
    
    // Insert default data only if needed
    //insertDefaultData();
    
    // Save database to file
    saveDatabase();
    
    console.log('✓ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Error initializing database:', error);
    throw error;
  }
};

// Enhanced helper functions with better error handling
const getAccountBalances = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

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
    
    console.log(`✓ Loaded ${results.length} account balances`);
    return results;
  } catch (error) {
    console.error('✗ Error getting account balances:', error);
    return []; // Return empty array instead of throwing
  }
};

// Database functions to add to your database.js file

// Account balance functions
const updateAccountBalance = (accountType, balance) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    db.run('UPDATE account_balances SET balance = ?, last_updated = CURRENT_TIMESTAMP WHERE account_type = ?', 
      [balance, accountType]);
    saveDatabase();
    console.log(`✓ Updated ${accountType} balance to ${balance}`);
    return true;
  } catch (error) {
    console.error('✗ Error updating account balance:', error);
    throw error;
  }
};

const addDebtAccount = (accountData) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { account_type, balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    db.run(`INSERT INTO account_balances (account_type, balance, account_name, interest_rate, minimum_payment, due_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
      [account_type, balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1]);
    
    saveDatabase();
    
    // Get the last inserted row id
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    console.log(`✓ Added debt account: ${account_name} (${account_type})`);
    return { id, ...accountData };
  } catch (error) {
    console.error('✗ Error adding debt account:', error);
    throw error;
  }
};

const updateDebtAccount = (id, accountData) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { balance, account_name, interest_rate, minimum_payment, due_date } = accountData;
    
    db.run(`UPDATE account_balances 
            SET balance = ?, account_name = ?, interest_rate = ?, minimum_payment = ?, due_date = ?, last_updated = CURRENT_TIMESTAMP
            WHERE id = ?`,
      [balance, account_name, interest_rate || 0, minimum_payment || 0, due_date || 1, id]);
    
    saveDatabase();
    console.log(`✓ Updated debt account: ${account_name} (ID: ${id})`);
    return accountData;
  } catch (error) {
    console.error('✗ Error updating debt account:', error);
    throw error;
  }
};

const deleteDebtAccount = (id) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    db.run('DELETE FROM account_balances WHERE id = ?', [id]);
    saveDatabase();
    console.log(`✓ Deleted debt account with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('✗ Error deleting debt account:', error);
    throw error;
  }
};

// Monthly budget functions
const getMonthlyBudget = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

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
    
    console.log(`✓ Loaded ${results.length} budget items`);
    return results;
  } catch (error) {
    console.error('✗ Error getting monthly budget:', error);
    return [];
  }
};

const addBudgetItem = (budgetItem) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { id, name, amount, type, category, day_of_month } = budgetItem;
    
    db.run(`INSERT INTO monthly_budget (id, name, amount, type, category, day_of_month) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, amount, type, category, day_of_month || 1]);
    
    saveDatabase();
    console.log(`✓ Added budget item: ${name} (${type}) - $${amount}`);
    return { id, ...budgetItem };
  } catch (error) {
    console.error('✗ Error adding budget item:', error);
    throw error;
  }
};

const updateBudgetItem = (budgetItem) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { id, name, amount, type, category, day_of_month } = budgetItem;
    
    db.run(`UPDATE monthly_budget 
            SET name = ?, amount = ?, type = ?, category = ?, day_of_month = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      [name, amount, type, category, day_of_month, id]);
    
    saveDatabase();
    console.log(`✓ Updated budget item: ${name} (ID: ${id})`);
    return budgetItem;
  } catch (error) {
    console.error('✗ Error updating budget item:', error);
    throw error;
  }
};

const deleteBudgetItem = (id) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    db.run('DELETE FROM monthly_budget WHERE id = ?', [id]);
    saveDatabase();
    console.log(`✓ Deleted budget item with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('✗ Error deleting budget item:', error);
    throw error;
  }
};

// Get budget vs actual comparison
const getBudgetComparison = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

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
        
        // Calculate additional metrics
        obj.difference = obj.budgeted - obj.actual;
        obj.percentage = obj.budgeted > 0 ? (obj.actual / obj.budgeted * 100).toFixed(2) : 0;
        
        results.push(obj);
      });
    }
    
    console.log(`✓ Generated budget comparison for ${results.length} categories`);
    return results;
  } catch (error) {
    console.error('✗ Error getting budget comparison:', error);
    return [];
  }
};

const getTransactions = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

    const results = [];
    const res = db.exec('SELECT * FROM transactions ORDER BY date DESC');
    
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
    
    console.log(`✓ Loaded ${results.length} transactions`);
    return results;
  } catch (error) {
    console.error('✗ Error getting transactions:', error);
    return [];
  }
};

const getSavingsGoals = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

    const results = [];
    const res = db.exec('SELECT * FROM savings_goals ORDER BY created_at DESC');
    
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
    
    console.log(`✓ Loaded ${results.length} savings goals`);
    return results;
  } catch (error) {
    console.error('✗ Error getting savings goals:', error);
    return [];
  }
};

// Add transaction function
const addTransaction = (transaction) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { id, date, description, amount, category, type, account_type } = transaction;
    
    db.run(`INSERT INTO transactions (id, date, description, amount, category, type, account_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, date, description, amount, category, type, account_type]);
    
    saveDatabase();
    console.log('✓ Added transaction:', description);
    return { id, ...transaction };
  } catch (error) {
    console.error('✗ Error adding transaction:', error);
    throw error;
  }
};

// Add savings goal function
const addSavingsGoal = (goal) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { id, name, target, current, deadline, description } = goal;
    
    db.run(`INSERT INTO savings_goals (id, name, target, current, deadline, description) 
             VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, target, current || 0, deadline, description]);
    
    saveDatabase();
    console.log('✓ Added savings goal:', name);
    return { id, ...goal };
  } catch (error) {
    console.error('✗ Error adding savings goal:', error);
    throw error;
  }
};

// Enhanced save function with error handling
const saveDatabase = () => {
  try {
    if (!db) {
      console.warn('⚠ Cannot save: database not initialized');
      return false;
    }

    const data = db.export();
    const buffer = Buffer.from(data);
    
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dbPath, buffer);
    console.log('✓ Database saved to:', dbPath);
    return true;
  } catch (error) {
    console.error('✗ Error saving database:', error);
    return false;
  }
};

// Create tables function (same as before but with logging)
const createTables = () => {
  console.log('Creating/verifying database tables...');
  
  // [Include all your existing createTables code here - it's fine as is]
  
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

  // [Include other table creation code...]
  
  console.log('✓ Tables created/verified');
};

// Export all functions
module.exports = {
  db: () => db,
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
  getBudgetComparison,
  getTransactions,
  getSavingsGoals,
  addTransaction,
  addSavingsGoal,
  saveDatabase // Export for manual saving if needed
};