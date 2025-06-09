// src/database/accounts.js - Account management operations

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