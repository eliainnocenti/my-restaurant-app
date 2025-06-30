/**
 * Database Connection Module
 * 
 * Initializes and exports SQLite database connection for the restaurant application.
 * Provides centralized database access for all DAO modules.
 * Database file contains restaurant menu data, user accounts, and order history.
 */

'use strict';

const sqlite3 = require('sqlite3');

/**
 * Open SQLite database connection
 * Database file is located at ./db/restaurant.db relative to server root
 * Contains tables for users, dishes, ingredients, orders, and their relationships
 */
const db = new sqlite3.Database('./db/restaurant.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    throw err;
  }
  console.log('Connected to SQLite database successfully');
});

// Export database connection for use in DAO modules
module.exports = db;
