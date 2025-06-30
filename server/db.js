/**
 * Database connection module
 * Initializes and exports SQLite database connection
 */

'use strict';

const sqlite3 = require('sqlite3');

/**
 * Open SQLite database connection
 * Database file is located at ./db/restaurant.db relative to server root
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
