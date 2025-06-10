// src/database/budget.js - Budget management operations (FIXED - includes transfers)

const { executeSQL, querySQL, saveDatabase } = require('./core');

// Get all monthly budget items
const getMonthlyBudget = () => {
  try {
    const results = querySQL(`
      SELECT * FROM monthly_budget 
      WHERE is_active = 1 
      ORDER BY due_date, type, name
    `);
    
    console.log(`✓ Loaded ${results.length} budget items`);
    return results;
  } catch (error) {
    console.error('✗ Error getting monthly budget:', error);
    return [];
  }
};

// Add a new budget item
const addBudgetItem = (budgetItem) => {
  try {
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
    
    executeSQL(`
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

// Update an existing budget item
const updateBudgetItem = (budgetItem) => {
  try {
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
    
    executeSQL(`
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

// Delete a budget item
const deleteBudgetItem = (id) => {
  try {
    executeSQL('DELETE FROM monthly_budget WHERE id = ?', [id]);
    saveDatabase();
    console.log(`✓ Deleted budget item with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('✗ Error deleting budget item:', error);
    throw error;
  }
};

// Get budget comparison (budgeted vs actual, NOW INCLUDING transfers as expenses)
const getBudgetComparison = () => {
  try {
    const results = querySQL(`
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
      LEFT JOIN transactions t ON (
        (t.category = b.category AND t.type = b.type AND t.type != 'transfer') 
        OR 
        (b.type = 'expense' AND t.type = 'transfer')  -- Include transfers as expenses
      )
        AND strftime('%Y', t.date) = strftime('%Y', b.due_date)
        AND strftime('%m', t.date) = strftime('%m', b.due_date)
      WHERE b.is_active = 1
      GROUP BY b.id, b.name, b.amount, b.type, b.category, b.due_date, b.is_recurring
      ORDER BY b.due_date, b.type, b.name
    `);
    
    // Calculate additional metrics
    const processedResults = results.map(item => ({
      ...item,
      difference: item.budgeted - item.actual,
      percentage: item.budgeted > 0 ? (item.actual / item.budgeted * 100).toFixed(2) : 0
    }));
    
    console.log(`✓ Generated budget comparison for ${processedResults.length} categories (including transfers as expenses)`);
    return processedResults;
  } catch (error) {
    console.error('✗ Error getting budget comparison:', error);
    return [];
  }
};

module.exports = {
  getMonthlyBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetComparison
};