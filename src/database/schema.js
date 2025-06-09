// src/database/schema.js - Database schema creation and migration

const { getDatabase, executeSQL, checkTableExists, querySQL, saveDatabase } = require('./core');

// Create all database tables
const createTables = () => {
  console.log('Creating/verifying database tables...');
  
  createAccountsTable();
  createTransactionsTable();
  createSavingsGoalsTable();
  createMonthlyBudgetTable();
  
  console.log('✓ Tables created/verified');
};

// Create accounts table
const createAccountsTable = () => {
  executeSQL(`
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
};

// Create transactions table with transfer support
const createTransactionsTable = () => {
  executeSQL(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      account_id INTEGER,
      transfer_to_account_id INTEGER,
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (transfer_to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);
};

// Create savings goals table
const createSavingsGoalsTable = () => {
  executeSQL(`
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
};

// Create modern monthly_budget table
const createMonthlyBudgetTable = () => {
  executeSQL(`
    CREATE TABLE IF NOT EXISTS monthly_budget (
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
};

// Insert default data only if tables are empty
const insertDefaultData = () => {
  try {
    // Check if accounts table is empty
    const result = querySQL('SELECT COUNT(*) as count FROM accounts');
    const isEmpty = result.length === 0 || result[0].count === 0;
    
    if (isEmpty) {
      console.log('Inserting default accounts...');
      
      // Insert default checking and savings accounts
      executeSQL(`
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

// Clean up any imported CSV data with inconsistent formats
const cleanupImportedData = () => {
  try {
    console.log('🧹 Cleaning up imported CSV data...');
    
    // Fix null categories - set them to 'other'
    executeSQL(`
      UPDATE transactions 
      SET category = 'other' 
      WHERE category IS NULL OR category = ''
    `);
    console.log('✓ Fixed null categories');
    
    // Fix non-standard account types
    const accountTypeMapping = {
      'chase': 'checking',
      'bank_of_america': 'checking',
      'wells_fargo': 'checking',
      'savings_account': 'savings',
      'discover': 'credit_card',
      'visa': 'credit_card',
      'mastercard': 'credit_card'
    };
    
    Object.entries(accountTypeMapping).forEach(([oldType, newType]) => {
      executeSQL(`
        UPDATE transactions 
        SET account_type = ? 
        WHERE account_type = ?
      `, [newType, oldType]);
    });
    console.log('✓ Standardized account types');
    
    // Fix date formats - convert M/D/YYYY to YYYY-MM-DD
    const dateFormatResult = querySQL(`
      SELECT id, date FROM transactions 
      WHERE date LIKE '%/%'
    `);
    
    if (dateFormatResult.length > 0) {
      console.log(`Fixing ${dateFormatResult.length} date formats...`);
      
      dateFormatResult.forEach(({ id, date }) => {
        try {
          // Parse M/D/YYYY format
          const [month, day, year] = date.split('/');
          const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          executeSQL(`
            UPDATE transactions 
            SET date = ? 
            WHERE id = ?
          `, [standardDate, id]);
        } catch (error) {
          console.warn(`⚠ Could not fix date format for transaction ${id}: ${date}`);
        }
      });
      console.log('✓ Fixed date formats');
    }
    
    // Ensure all transactions have valid amounts
    executeSQL(`
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

// Initialize all database structures
const initializeSchema = () => {
  createTables();
  cleanupImportedData();
  insertDefaultData();
  saveDatabase();
  console.log('✓ Database schema initialized successfully');
};

module.exports = {
  initializeSchema,
  createTables,
  insertDefaultData,
  cleanupImportedData
};