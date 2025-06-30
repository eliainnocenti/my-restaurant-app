'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('../db');
const crypto = require('crypto');

/**
 * Get user by ID for session management
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
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|false>} User object if credentials are valid, false otherwise
 */
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email=?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = { 
          id: row.id, 
          username: row.email, 
          name: row.name, 
          secret: row.secret 
        };
        
        crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
          if (err) reject(err);
          if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};
