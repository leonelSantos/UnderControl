// src/database/accounts.js - Account management operations (FIXED TRANSFER BUG)

const { executeSQL, querySQL, saveDatabase } = require('./core');

// Get all accounts with correctly calculated balances including transfer support
const getAccountBalances = () => {
  try {
    const results = querySQL(`
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
            -- For debt accounts: initial_balance + expenses + transfers_out - (income + transfers_in)
            -- transfers_in = payments TO the credit card (reduces debt)
            -- transfers_out = cash advances FROM the credit card (increases debt)
            COALESCE(a.initial_balance, 0) + 
            COALESCE(expense_out.expense_total, 0) + 
            COALESCE(transfers_from_this.transfers_out, 0) - 
            COALESCE(income_in.income_total, 0) - 
            COALESCE(transfers_to_this.transfers_in, 0)
          ELSE
            -- For asset accounts: initial_balance + income + transfers_in - expenses - transfers_out
            COALESCE(a.initial_balance, 0) + 
            COALESCE(income_in.income_total, 0) + 
            COALESCE(transfers_to_this.transfers_in, 0) - 
            COALESCE(expense_out.expense_total, 0) - 
            COALESCE(transfers_from_this.transfers_out, 0)
        END as balance
      FROM accounts a
      
      -- Income transactions TO this account
      LEFT JOIN (
        SELECT 
          account_id,
          SUM(amount) as income_total
        FROM transactions
        WHERE type = 'income' AND account_id IS NOT NULL
        GROUP BY account_id
      ) income_in ON a.id = income_in.account_id
      
      -- Expense transactions FROM this account  
      LEFT JOIN (
        SELECT 
          account_id,
          SUM(amount) as expense_total
        FROM transactions
        WHERE type = 'expense' AND account_id IS NOT NULL
        GROUP BY account_id
      ) expense_out ON a.id = expense_out.account_id
      
      -- Transfer transactions TO this account (credit card payments, deposits)
      LEFT JOIN (
        SELECT 
          transfer_to_account_id,
          SUM(amount) as transfers_in
        FROM transactions
        WHERE type = 'transfer' AND transfer_to_account_id IS NOT NULL
        GROUP BY transfer_to_account_id
      ) transfers_to_this ON a.id = transfers_to_this.transfer_to_account_id
      
      -- Transfer transactions FROM this account (withdrawals, payments out)
      LEFT JOIN (
        SELECT 
          account_id,
          SUM(amount) as transfers_out
        FROM transactions
        WHERE type = 'transfer' AND account_id IS NOT NULL
        GROUP BY account_id
      ) transfers_from_this ON a.id = transfers_from_this.account_id
      
      WHERE a.is_active = 1
      ORDER BY a.account_type, a.account_name
    `);
    
    console.log(`✓ Loaded ${results.length} account balances with corrected transfer support`);
    return results;
  } catch (error) {
    console.error('✗ Error getting account balances:', error);
    return [];
  }
};

// Add a new account
const addAccount = (accountData) => {
  try {
    console.log('Database: Adding account with data:', accountData);
    
    const { account_type, account_name, initial_balance, interest_rate, minimum_payment, due_date } = accountData;
    
    executeSQL(`
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
    const result = querySQL('SELECT last_insert_rowid() as id');
    const id = result[0].id;
    
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
    console.log('Database: Updating account with ID:', id, 'Data:', accountData);

    const { account_name, initial_balance, interest_rate, minimum_payment, due_date } = accountData;
    
    executeSQL(`
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

// Update just the initial balance of an account
const updateAccountInitialBalance = (id, newInitialBalance) => {
  try {
    console.log('Database: Updating account initial balance for ID:', id, 'New balance:', newInitialBalance);
    
    executeSQL(`
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
    // Soft delete by setting is_active to 0
    executeSQL('UPDATE accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    // Clear account_id from transactions for deleted account
    executeSQL('UPDATE transactions SET account_id = NULL WHERE account_id = ?', [id]);
    
    saveDatabase();
    console.log(`✓ Deleted account with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('✗ Error deleting account:', error);
    throw error;
  }
};

module.exports = {
  getAccountBalances,
  addAccount,
  updateAccount,
  updateAccountInitialBalance,
  deleteAccount
};