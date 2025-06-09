// database.js - Main database module (refactored)

const { initDatabase, saveDatabase, getDatabase } = require('./src/database/core');
const { initializeSchema } = require('./src/database/schema');
const { 
  getAccountBalances,
  addAccount,
  updateAccount,
  updateAccountInitialBalance,
  deleteAccount
} = require('./src/database/accounts');
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require('./src/database/transactions');
const {
  getMonthlyBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetComparison
} = require('./src/database/budget');
const {
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal
} = require('./src/database/savings');

// Initialize the complete database
const initCompleteDatabase = async () => {
  try {
    console.log('🚀 Starting complete database initialization...');
    
    // Initialize core database
    await initDatabase();
    console.log('✓ Database core ready');
    
    // Initialize schema and data
    initializeSchema();
    console.log('✓ Database schema and data ready');
    
    console.log('✅ Complete database initialization successful');
    return true;
  } catch (error) {
    console.error('❌ Complete database initialization failed:', error);
    throw error;
  }
};

// Export all database functions
module.exports = {
  // Core
  db: getDatabase,
  initDatabase: initCompleteDatabase,
  saveDatabase,
  
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
  deleteSavingsGoal
};