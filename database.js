// database.js

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db = null;
let SQL = null;

// Database file path
const dbPath = path.join(app.getPath('userData'), 'finance.db');

// Add this function to your database.js file and call it during initialization
const cleanupImportedData = () => {
  try {
    console.log('🧹 Cleaning up imported CSV data...');
    
    // Fix null categories - set them to 'other'
    const nullCategoryResult = db.exec(`
      UPDATE transactions 
      SET category = 'other' 
      WHERE category IS NULL OR category = ''
    `);
    console.log('✓ Fixed null categories');
    
    // Fix non-standard account types
    // Map your CSV account types to standard ones
    const accountTypeMapping = {
      'chase': 'checking',
      'bank_of_america': 'checking',
      'wells_fargo': 'checking',
      'savings_account': 'savings',
      'credit_card': 'credit_card',
      'discover': 'credit_card',
      'visa': 'credit_card',
      'mastercard': 'credit_card'
    };
    
    Object.entries(accountTypeMapping).forEach(([oldType, newType]) => {
      db.run(`
        UPDATE transactions 
        SET account_type = ? 
        WHERE account_type = ?
      `, [newType, oldType]);
    });
    console.log('✓ Standardized account types');
    
    // Fix date formats - convert M/D/YYYY to YYYY-MM-DD
    const dateFormatResult = db.exec(`
      SELECT id, date FROM transactions 
      WHERE date LIKE '%/%'
    `);
    
    if (dateFormatResult.length > 0 && dateFormatResult[0].values.length > 0) {
      console.log(`Fixing ${dateFormatResult[0].values.length} date formats...`);
      
      dateFormatResult[0].values.forEach(([id, dateStr]) => {
        try {
          // Parse M/D/YYYY format
          const [month, day, year] = dateStr.split('/');
          const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          db.run(`
            UPDATE transactions 
            SET date = ? 
            WHERE id = ?
          `, [standardDate, id]);
        } catch (error) {
          console.warn(`⚠ Could not fix date format for transaction ${id}: ${dateStr}`);
        }
      });
      console.log('✓ Fixed date formats');
    }
    
    // Ensure all transactions have valid amounts
    db.run(`
      UPDATE transactions 
      SET amount = 0 
      WHERE amount IS NULL OR amount = ''
    `);
    console.log('✓ Fixed null amounts');
    
    // Save the cleanup changes
    saveDatabase();
    console.log('✓ Data cleanup completed successfully');
    
  } catch (error) {
    console.error('✗ Error during data cleanup:', error);
  }
};

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

    cleanupImportedData();
    
    // Migrate existing data if needed
    migrateExistingData();
    
    // Insert default data only if needed
    insertDefaultData();
    
    // Save database to file
    saveDatabase();
    
    console.log('✓ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Error initializing database:', error);
    throw error;
  }
};

// Create tables function
const createTables = () => {
  console.log('Creating/verifying database tables...');
  
  // Accounts table to support multiple accounts of same type
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings', 'credit_card', 'student_loan')),
      account_name TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0,
      interest_rate REAL DEFAULT 0,
      minimum_payment REAL DEFAULT 0,
      due_date INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Updated transactions table with transfer support
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      account_id INTEGER,
      account_type TEXT, -- Keep for backward compatibility during migration
      transfer_to_account_id INTEGER, -- For transfer transactions
      transfer_to_account_type TEXT, -- For backward compatibility
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (transfer_to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);

  // Check if we need to add the new transfer columns to existing table
  try {
    const tableInfo = db.exec("PRAGMA table_info(transactions)");
    const columns = tableInfo[0]?.values?.map(row => row[1]) || [];
    
    if (!columns.includes('transfer_to_account_id')) {
      console.log('Adding transfer support to transactions table...');
      db.run('ALTER TABLE transactions ADD COLUMN transfer_to_account_id INTEGER');
      db.run('ALTER TABLE transactions ADD COLUMN transfer_to_account_type TEXT');
      
      // Update the check constraint to include 'transfer'
      // Note: SQLite doesn't support modifying check constraints, so we'll handle validation in code
      console.log('✓ Added transfer support to transactions table');
    }
  } catch (error) {
    console.warn('⚠ Could not check/add transfer columns:', error.message);
  }

  // Legacy account_balances table - kept temporarily for migration
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

  // Savings goals table
  db.run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target REAL NOT NULL,
      current REAL DEFAULT 0,
      deadline TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Modern monthly_budget table with full date support only
  const monthlyBudgetExists = checkTableExists('monthly_budget');
  
  if (!monthlyBudgetExists) {
    // Create new table with clean structure
    console.log('Creating new monthly_budget table...');
    db.run(`
      CREATE TABLE monthly_budget (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT NOT NULL,
        due_date TEXT NOT NULL, -- Full date in YYYY-MM-DD format
        is_recurring INTEGER DEFAULT 1, -- Whether this item repeats monthly
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else {
    // Migrate existing table to new structure
    migrateMonthlyBudgetTable();
  }

  console.log('✓ Tables created/verified');
};

// Check if a table exists
const checkTableExists = (tableName) => {
  try {
    const result = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
    return result.length > 0 && result[0].values.length > 0;
  } catch (error) {
    console.warn(`⚠ Could not check if table ${tableName} exists:`, error.message);
    return false;
  }
};

// Migrate existing monthly_budget table to new structure
const migrateMonthlyBudgetTable = () => {
  try {
    console.log('Migrating monthly_budget table to new structure...');
    
    // Get current table structure
    const tableInfo = db.exec("PRAGMA table_info(monthly_budget)");
    const columns = tableInfo[0]?.values?.map(row => row[1]) || [];
    
    console.log('Current monthly_budget columns:', columns);
    
    // Check if we need to migrate from old structure
    const hasOldStructure = columns.includes('month') || columns.includes('year') || columns.includes('day_of_month');
    const hasNewStructure = columns.includes('due_date') && columns.includes('is_recurring');
    
    if (hasOldStructure && !hasNewStructure) {
      console.log('Migrating from old structure to new structure...');
      
      // Backup existing data
      let existingData = [];
      try {
        const result = db.exec('SELECT * FROM monthly_budget');
        if (result.length > 0) {
          const cols = result[0].columns;
          existingData = result[0].values.map(row => {
            const obj = {};
            cols.forEach((col, index) => {
              obj[col] = row[index];
            });
            return obj;
          });
        }
        console.log(`Backed up ${existingData.length} existing budget items`);
      } catch (backupError) {
        console.warn('Could not backup existing data:', backupError.message);
        return;
      }
      
      // Drop old table and create new one
      db.run('DROP TABLE monthly_budget');
      db.run(`
        CREATE TABLE monthly_budget (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          category TEXT NOT NULL,
          due_date TEXT NOT NULL,
          is_recurring INTEGER DEFAULT 1,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Migrate data to new structure
      existingData.forEach(item => {
        try {
          // Convert old date format to new format
          let dueDate;
          if (item.month && item.year && item.day_of_month) {
            const year = item.year;
            const month = String(item.month).padStart(2, '0');
            const day = String(item.day_of_month).padStart(2, '0');
            dueDate = `${year}-${month}-${day}`;
          } else {
            // Default to current date if no date info available
            dueDate = new Date().toISOString().split('T')[0];
          }
          
          db.run(`
            INSERT INTO monthly_budget (
              id, name, amount, type, category, due_date, is_recurring, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            item.id,
            item.name,
            item.amount,
            item.type,
            item.category,
            dueDate,
            1, // Default to recurring
            item.is_active !== undefined ? item.is_active : 1,
            item.created_at || new Date().toISOString(),
            item.updated_at || new Date().toISOString()
          ]);
        } catch (restoreError) {
          console.error('Error migrating budget item:', item.id, restoreError.message);
        }
      });
      
      console.log('✓ Monthly budget table migration completed');
    } else if (!hasNewStructure) {
      // Add missing columns to existing table
      if (!columns.includes('due_date')) {
        db.run('ALTER TABLE monthly_budget ADD COLUMN due_date TEXT NOT NULL DEFAULT "2025-01-01"');
      }
      if (!columns.includes('is_recurring')) {
        db.run('ALTER TABLE monthly_budget ADD COLUMN is_recurring INTEGER DEFAULT 1');
      }
      console.log('✓ Added missing columns to monthly_budget table');
    }
    
  } catch (error) {
    console.error('✗ Error migrating monthly_budget table:', error.message);
  }
};

// Migrate existing data from old structure to new structure
const migrateExistingData = () => {
  try {
    console.log('Checking for data migration...');
    
    // Check if we have data in account_balances but not in accounts
    const accountBalancesResult = db.exec('SELECT COUNT(*) as count FROM account_balances');
    const accountsResult = db.exec('SELECT COUNT(*) as count FROM accounts');
    
    const hasOldData = accountBalancesResult.length > 0 && accountBalancesResult[0].values[0][0] > 0;
    const hasNewData = accountsResult.length > 0 && accountsResult[0].values[0][0] > 0;
    
    if (hasOldData && !hasNewData) {
      console.log('Migrating data from account_balances to accounts...');
      
      // Migrate account_balances to accounts table
      db.run(`
        INSERT INTO accounts (account_type, account_name, initial_balance, interest_rate, minimum_payment, due_date)
        SELECT 
          account_type,
          COALESCE(account_name, 
            CASE account_type 
              WHEN 'checking' THEN 'Primary Checking'
              WHEN 'savings' THEN 'Primary Savings'
              WHEN 'credit_card' THEN 'Credit Card'
              WHEN 'student_loan' THEN 'Student Loan'
              ELSE account_type
            END
          ) as account_name,
          balance,
          COALESCE(interest_rate, 0),
          COALESCE(minimum_payment, 0),
          COALESCE(due_date, 1)
        FROM account_balances
      `);
      
      // Update transactions to reference the new account IDs where possible
      const accountMappings = db.exec(`
        SELECT id, account_type FROM accounts
      `);
      
      if (accountMappings.length > 0) {
        accountMappings[0].values.forEach(([id, type]) => {
          db.run(`
            UPDATE transactions 
            SET account_id = ? 
            WHERE account_type = ? AND account_id IS NULL
          `, [id, type]);
        });
      }
      
      console.log('✓ Data migration completed');
    }
    
  } catch (error) {
    console.warn('⚠ Data migration failed:', error.message);
  }
};

// Insert default data only if tables are empty
const insertDefaultData = () => {
  try {
    // Check if accounts table is empty
    const result = db.exec('SELECT COUNT(*) as count FROM accounts');
    const isEmpty = result.length === 0 || result[0].values[0][0] === 0;
    
    if (isEmpty) {
      console.log('Inserting default accounts...');
      
      // Insert default checking and savings accounts
      db.run(`
        INSERT INTO accounts (account_type, account_name, initial_balance) VALUES 
        ('checking', 'Primary Checking', 0),
        ('savings', 'Primary Savings', 0)
      `);
      
      console.log('✓ Default accounts created');
    }
  } catch (error) {
    console.warn('⚠ Could not insert default data:', error.message);
  }
};

// FIXED: Get all accounts with CORRECTLY calculated balances including transfer support
const getAccountBalances = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

    const results = [];
    
    // Get accounts with CORRECTLY calculated balances from transactions including transfers
    const res = db.exec(`
      SELECT 
        a.id,
        a.account_type,
        a.account_name,
        a.initial_balance,
        a.interest_rate,
        a.minimum_payment,
        a.due_date,
        a.is_active,
        CASE 
          WHEN a.account_type IN ('credit_card', 'student_loan') THEN
            -- For debt accounts: initial_balance + expenses - (income + transfers_in)
            COALESCE(a.initial_balance, 0) + 
            COALESCE(t.expense_total, 0) - 
            COALESCE(t.income_total, 0) - 
            COALESCE(t.transfers_in, 0)
          ELSE
            -- For asset accounts: initial_balance + income - expenses + transfers_in - transfers_out
            COALESCE(a.initial_balance, 0) + 
            COALESCE(t.income_total, 0) - 
            COALESCE(t.expense_total, 0) + 
            COALESCE(t.transfers_in, 0) - 
            COALESCE(t.transfers_out, 0)
        END as balance
      FROM accounts a
      LEFT JOIN (
        SELECT 
          account_id,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income_total,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense_total,
          SUM(CASE WHEN type = 'transfer' AND transfer_to_account_id = account_id THEN amount ELSE 0 END) as transfers_in,
          SUM(CASE WHEN type = 'transfer' AND account_id = account_id THEN amount ELSE 0 END) as transfers_out
        FROM transactions
        WHERE account_id IS NOT NULL
        GROUP BY account_id
      ) t ON a.id = t.account_id
      WHERE a.is_active = 1
      ORDER BY a.account_type, a.account_name
    `);
    
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
    
    console.log(`✓ Loaded ${results.length} account balances with transfer support`);
    return results;
  } catch (error) {
    console.error('✗ Error getting account balances:', error);
    return [];
  }
};

// Add a new account
const addAccount = (accountData) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('Database: Adding account with data:', accountData);
    
    const { account_type, account_name, initial_balance, interest_rate, minimum_payment, due_date } = accountData;
    
    db.run(`
      INSERT INTO accounts (account_type, account_name, initial_balance, interest_rate, minimum_payment, due_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      account_type, 
      account_name, 
      initial_balance || 0, 
      interest_rate || 0, 
      minimum_payment || 0, 
      due_date || 1
    ]);
    
    saveDatabase();
    
    // Get the last inserted row id
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    console.log(`✓ Added account: ${account_name} (${account_type}) with ID: ${id}`);
    return { id, ...accountData };
  } catch (error) {
    console.error('✗ Error adding account:', error);
    throw error;
  }
};

// Update account
const updateAccount = (id, accountData) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('Database: Updating account with ID:', id, 'Data:', accountData);

    const { account_name, initial_balance, interest_rate, minimum_payment, due_date } = accountData;
    
    db.run(`
      UPDATE accounts 
      SET account_name = ?, initial_balance = ?, interest_rate = ?, minimum_payment = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [account_name, initial_balance, interest_rate || 0, minimum_payment || 0, due_date || 1, id]);
    
    saveDatabase();
    console.log(`✓ Updated account: ${account_name} (ID: ${id})`);
    return { id, ...accountData };
  } catch (error) {
    console.error('✗ Error updating account:', error);
    throw error;
  }
};

// Function to update just the initial balance of an account
const updateAccountInitialBalance = (id, newInitialBalance) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('Database: Updating account initial balance for ID:', id, 'New balance:', newInitialBalance);
    
    db.run(`
      UPDATE accounts 
      SET initial_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newInitialBalance, id]);
    
    saveDatabase();
    console.log(`✓ Updated account initial balance for ID: ${id} to ${newInitialBalance}`);
    return true;
  } catch (error) {
    console.error('✗ Error updating account initial balance:', error);
    throw error;
  }
};

// Delete account (soft delete)
const deleteAccount = (id) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Soft delete by setting is_active to 0
    db.run('UPDATE accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    // Clear account_id from transactions for deleted account
    db.run('UPDATE transactions SET account_id = NULL WHERE account_id = ?', [id]);
    
    saveDatabase();
    console.log(`✓ Deleted account with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('✗ Error deleting account:', error);
    throw error;
  }
};

// Transaction functions with transfer support
const getTransactions = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

    const results = [];
    const res = db.exec(`
      SELECT 
        t.*,
        a.account_name,
        a.account_type as linked_account_type,
        ta.account_name as transfer_to_account_name,
        ta.account_type as transfer_to_account_type_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts ta ON t.transfer_to_account_id = ta.id
      ORDER BY t.date DESC, t.created_at DESC
    `);
    
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

const addTransaction = (transaction) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('Adding transaction with data:', transaction);

    // Destructure and validate the transaction data
    const { 
      id, 
      date, 
      description, 
      amount, 
      category, 
      type, 
      account_id, 
      account_type,
      transfer_to_account_id,
      transfer_to_account_type,
      tags,
      notes
    } = transaction;

    // Validate required fields and provide defaults for optional ones
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    if (!date) {
      throw new Error('Transaction date is required');
    }
    if (!description || description.trim() === '') {
      throw new Error('Transaction description is required');
    }
    if (amount === undefined || amount === null || isNaN(amount)) {
      throw new Error('Transaction amount must be a valid number');
    }
    if (!type || !['income', 'expense', 'transfer'].includes(type)) {
      throw new Error('Transaction type must be "income", "expense", or "transfer"');
    }

    // Validate transfer-specific requirements
    if (type === 'transfer' && !transfer_to_account_id && !transfer_to_account_type) {
      throw new Error('Transfer transactions require a destination account');
    }

    // Provide default category if missing
    const safeCategory = category || (type === 'transfer' ? 'transfer' : 'other');
    
    // Handle optional fields - convert null to NULL for database
    const safeTags = tags || null;
    const safeNotes = notes || null;
    const safeAccountId = account_id || null;
    const safeAccountType = account_type || null;
    const safeTransferToAccountId = transfer_to_account_id || null;
    const safeTransferToAccountType = transfer_to_account_type || null;

    console.log('Processed transaction data:', {
      id,
      date,
      description: description.substring(0, 50) + '...', // Truncate for logging
      amount,
      category: safeCategory,
      type,
      account_id: safeAccountId,
      account_type: safeAccountType,
      transfer_to_account_id: safeTransferToAccountId
    });
    
    db.run(`
      INSERT INTO transactions (
        id, 
        date, 
        description, 
        amount, 
        category, 
        type, 
        account_id, 
        account_type,
        transfer_to_account_id,
        transfer_to_account_type,
        tags,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      date, 
      description, 
      amount, 
      safeCategory, 
      type, 
      safeAccountId, 
      safeAccountType,
      safeTransferToAccountId,
      safeTransferToAccountType,
      safeTags,
      safeNotes
    ]);
    
    saveDatabase();
    console.log('✓ Added transaction:', description.substring(0, 30), `(${type}: $${amount})`);
    return { id, ...transaction, category: safeCategory };
  } catch (error) {
    console.error('✗ Error adding transaction:', error);
    console.error('Transaction data that failed:', JSON.stringify(transaction, null, 2));
    throw error;
  }
};

const updateTransaction = (transaction) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const { 
      id, 
      date, 
      description, 
      amount, 
      category, 
      type, 
      account_id, 
      account_type,
      transfer_to_account_id,
      transfer_to_account_type
    } = transaction;
    
    db.run(
      `UPDATE transactions 
       SET date = ?, description = ?, amount = ?, category = ?, type = ?, account_id = ?, account_type = ?, 
           transfer_to_account_id = ?, transfer_to_account_type = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, description, amount, category, type, account_id, account_type, 
       transfer_to_account_id, transfer_to_account_type, id]
    );
    
    saveDatabase();
    console.log('✓ Updated transaction:', id);
    return transaction;
  } catch (error) {
    console.error('✗ Error updating transaction:', error);
    throw error;
  }
};

const deleteTransaction = (id) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    db.run('DELETE FROM transactions WHERE id = ?', [id]);
    saveDatabase();
    console.log('✓ Deleted transaction:', id);
    return true;
  } catch (error) {
    console.error('✗ Error deleting transaction:', error);
    throw error;
  }
};

// Budget functions (exclude transfers from income/expense calculations)
const getMonthlyBudget = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

    const results = [];
    const res = db.exec(`
      SELECT * FROM monthly_budget 
      WHERE is_active = 1 
      ORDER BY due_date, type, name
    `);
    
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

    console.log('Database: Adding budget item:', budgetItem);

    const { 
      id, 
      name, 
      amount, 
      type, 
      category, 
      due_date,
      is_recurring
    } = budgetItem;
    
    // Validate required fields
    if (!id || !name || !amount || !type || !category || !due_date) {
      throw new Error('Missing required fields for budget item');
    }
    
    db.run(`
      INSERT INTO monthly_budget (
        id, name, amount, type, category, due_date, is_recurring
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      name, 
      amount, 
      type, 
      category, 
      due_date,
      is_recurring !== undefined ? is_recurring : 1
    ]);
    
    saveDatabase();
    console.log(`✓ Added budget item: ${name} (${type}) - ${amount} - Due: ${due_date}`);
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

    console.log('Database: Updating budget item:', budgetItem);

    const { 
      id, 
      name, 
      amount, 
      type, 
      category, 
      due_date,
      is_recurring
    } = budgetItem;
    
    // Validate required fields
    if (!id || !name || !amount || !type || !category || !due_date) {
      throw new Error('Missing required fields for budget item');
    }
    
    db.run(`
      UPDATE monthly_budget 
      SET name = ?, amount = ?, type = ?, category = ?, due_date = ?, is_recurring = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, 
      amount, 
      type, 
      category, 
      due_date,
      is_recurring !== undefined ? is_recurring : 1,
      id
    ]);
    
    saveDatabase();
    console.log(`✓ Updated budget item: ${name} (ID: ${id}) - Due: ${due_date}`);
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

// FIXED: Budget comparison excludes transfers from income/expense calculations
const getBudgetComparison = () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const results = [];
    const res = db.exec(`
      SELECT 
        b.id,
        b.name,
        b.amount as budgeted,
        b.type,
        b.category,
        b.due_date,
        b.is_recurring,
        COALESCE(SUM(ABS(t.amount)), 0) as actual
      FROM monthly_budget b
      LEFT JOIN transactions t ON t.category = b.category 
        AND t.type = b.type
        AND t.type != 'transfer'  -- EXCLUDE transfers from budget calculations
        AND strftime('%Y', t.date) = strftime('%Y', b.due_date)
        AND strftime('%m', t.date) = strftime('%m', b.due_date)
      WHERE b.is_active = 1
      GROUP BY b.id, b.name, b.amount, b.type, b.category, b.due_date, b.is_recurring
      ORDER BY b.due_date, b.type, b.name
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
    
    console.log(`✓ Generated budget comparison for ${results.length} categories (excluding transfers)`);
    return results;
  } catch (error) {
    console.error('✗ Error getting budget comparison:', error);
    return [];
  }
};

// Savings goals functions
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

const updateSavingsGoal = (goal) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const { id, name, target, current, deadline, description } = goal;
    db.run(
      `UPDATE savings_goals 
       SET name = ?, target = ?, current = ?, deadline = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, target, current, deadline, description, id]
    );
    
    saveDatabase();
    console.log('✓ Updated savings goal:', id);
    return goal;
  } catch (error) {
    console.error('✗ Error updating savings goal:', error);
    throw error;
  }
};

const deleteSavingsGoal = (id) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    db.run('DELETE FROM savings_goals WHERE id = ?', [id]);
    saveDatabase();
    console.log('✓ Deleted savings goal:', id);
    return true;
  } catch (error) {
    console.error('✗ Error deleting savings goal:', error);
    throw error;
  }
};

// Save function with error handling
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

// Export all functions
module.exports = {
  db: () => db,
  initDatabase,
  
  // Account functions
  getAccountBalances,
  addAccount,
  updateAccount,
  updateAccountInitialBalance,
  deleteAccount,
  
  // Transaction functions
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  
  // Budget functions
  getMonthlyBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetComparison,
  
  // Savings goals functions
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  
  // Utility
  saveDatabase
};