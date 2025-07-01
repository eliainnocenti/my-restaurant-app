/**
 * User Data Access Object (DAO)
 * 
 * Handles all user-related database operations including:
 * - User authentication with password hashing verification
 * - User profile retrieval for session management
 * - TOTP secret management for two-factor authentication
 * 
 * Uses crypto.scrypt for secure password verification with salt-based hashing.
 * Integrates with Passport.js authentication system.
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

'use strict';

const db = require('../db');
const crypto = require('crypto');

/**
 * Get user by ID for session management
 * Used by Passport.js during session deserialization
 * Returns user without sensitive password data
 * @param {number} id - User ID
 * @returns {Promise<Object>} User object without sensitive data
 */
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id=?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        // Passport expects a "username" property (set to email)
        // Include TOTP secret for 2FA functionality
        const user = { 
          id: row.id, 
          username: row.email, 
          name: row.name, 
          secret: row.secret 
        };
        resolve(user);
      }
    });
  });
};

/**
 * Get user by email and verify password for login
 * Performs secure password verification using scrypt hashing
 * Includes TOTP secret for 2FA capability check
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|false>} User object if credentials are valid, false otherwise
 */
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    // First, retrieve user record by email
    const sql = 'SELECT * FROM users WHERE email=?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        // User not found - return false for invalid credentials
        resolve(false);
      } else {
        // User found - prepare user object for authentication
        const user = { 
          id: row.id, 
          username: row.email, 
          name: row.name, 
          secret: row.secret 
        };
        
        // Verify password using scrypt with stored salt
        // This provides secure password verification without storing plain text
        crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
          if (err) reject(err);
          // Compare hashed password with stored hash using timing-safe comparison
          if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword))
            resolve(false); // Invalid password
          else
            resolve(user);  // Valid credentials
        });
      }
    });
  });
};
