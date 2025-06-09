// src/database/savings.js - Savings goals management operations

const { executeSQL, querySQL, saveDatabase } = require('./core');

// Get all savings goals
const getSavingsGoals = () => {
  try {
    const results = querySQL('SELECT * FROM savings_goals ORDER BY created_at DESC');
    
    console.log(`✓ Loaded ${results.length} savings goals`);
    return results;
  } catch (error) {
    console.error('✗ Error getting savings goals:', error);
    return [];
  }
};

// Add a new savings goal
const addSavingsGoal = (goal) => {
  try {
    const { id, name, target, current, deadline, description } = goal;
    
    executeSQL(`
      INSERT INTO savings_goals (id, name, target, current, deadline, description) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, name, target, current || 0, deadline, description]);
    
    saveDatabase();
    console.log('✓ Added savings goal:', name);
    return { id, ...goal };
  } catch (error) {
    console.error('✗ Error adding savings goal:', error);
    throw error;
  }
};

// Update an existing savings goal
const updateSavingsGoal = (goal) => {
  try {
    const { id, name, target, current, deadline, description } = goal;
    
    executeSQL(
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

// Delete a savings goal
const deleteSavingsGoal = (id) => {
  try {
    executeSQL('DELETE FROM savings_goals WHERE id = ?', [id]);
    saveDatabase();
    console.log('✓ Deleted savings goal:', id);
    return true;
  } catch (error) {
    console.error('✗ Error deleting savings goal:', error);
    throw error;
  }
};

module.exports = {
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal
};