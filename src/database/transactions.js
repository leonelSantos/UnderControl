// src/database/transactions.js - Transaction management operations

const { executeSQL, querySQL, saveDatabase } = require('./core');

// Get all transactions with account information
const getTransactions = () => {
  try {
    const results = querySQL(`
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
    
    console.log(`✓ Loaded ${results.length} transactions`);
    return results;
  } catch (error) {
    console.error('✗ Error getting transactions:', error);
    return [];
  }
};

// Add a new transaction (including transfers)
const addTransaction = (transaction) => {
  try {
    console.log('Adding transaction with data:', transaction);

    const { 
      id, 
      date, 
      description, 
      amount, 
      category, 
      type, 
      account_id, 
      transfer_to_account_id,
      tags,
      notes
    } = transaction;

    // Validate required fields
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
    if (type === 'transfer' && !transfer_to_account_id) {
      throw new Error('Transfer transactions require a destination account');
    }

    // Provide default category if missing
    const safeCategory = category || (type === 'transfer' ? 'transfer' : 'other');
    
    // Handle optional fields - convert null to NULL for database
    const safeTags = tags || null;
    const safeNotes = notes || null;
    const safeAccountId = account_id || null;
    const safeTransferToAccountId = transfer_to_account_id || null;

    console.log('Processed transaction data:', {
      id,
      date,
      description: description.substring(0, 50) + '...', // Truncate for logging
      amount,
      category: safeCategory,
      type,
      account_id: safeAccountId,
      transfer_to_account_id: safeTransferToAccountId
    });
    
    executeSQL(`
      INSERT INTO transactions (
        id, 
        date, 
        description, 
        amount, 
        category, 
        type, 
        account_id, 
        transfer_to_account_id,
        tags,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      date, 
      description, 
      amount, 
      safeCategory, 
      type, 
      safeAccountId, 
      safeTransferToAccountId,
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

// Update an existing transaction
const updateTransaction = (transaction) => {
  try {
    const { 
      id, 
      date, 
      description, 
      amount, 
      category, 
      type, 
      account_id, 
      transfer_to_account_id
    } = transaction;
    
    executeSQL(
      `UPDATE transactions 
       SET date = ?, description = ?, amount = ?, category = ?, type = ?, account_id = ?, 
           transfer_to_account_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, description, amount, category, type, account_id, transfer_to_account_id, id]
    );
    
    saveDatabase();
    console.log('✓ Updated transaction:', id);
    return transaction;
  } catch (error) {
    console.error('✗ Error updating transaction:', error);
    throw error;
  }
};

// Delete a transaction
const deleteTransaction = (id) => {
  try {
    executeSQL('DELETE FROM transactions WHERE id = ?', [id]);
    saveDatabase();
    console.log('✓ Deleted transaction:', id);
    return true;
  } catch (error) {
    console.error('✗ Error deleting transaction:', error);
    throw error;
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction
};