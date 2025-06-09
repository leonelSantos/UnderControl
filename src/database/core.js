// src/database/core.js - Core database initialization and utilities

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
    console.log('🚀 Initializing database at:', dbPath);
    
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

    console.log('✓ Database core initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Error initializing database:', error);
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

// Get database instance
const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
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

// Execute SQL with error handling
const executeSQL = (sql, params = []) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    if (params.length > 0) {
      db.run(sql, params);
    } else {
      db.run(sql);
    }
    
    return true;
  } catch (error) {
    console.error('✗ SQL execution error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Query SQL with error handling
const querySQL = (sql, params = []) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const results = [];
    const res = db.exec(sql, params);
    
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
    
    return results;
  } catch (error) {
    console.error('✗ SQL query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    return [];
  }
};

module.exports = {
  initDatabase,
  saveDatabase,
  getDatabase,
  checkTableExists,
  executeSQL,
  querySQL,
  dbPath
};