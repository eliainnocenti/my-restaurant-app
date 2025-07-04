/* Database Connection Module */

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
  // ('Connected to SQLite database successfully');  // Debug log
});

// Export database connection for use in DAO modules
module.exports = db;
