/**
 * Restaurant Data Access Object (DAO)
 * 
 * Handles all database operations related to restaurant functionality including:
 * - Dish management (combinations of base dishes and sizes)
 * - Ingredient management with constraints (requirements, incompatibilities, availability)
 * - Order creation, retrieval, and cancellation with automatic availability tracking
 * 
 * Uses SQLite database with complex queries to handle dish-size combinations
 * and ingredient constraint relationships.
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

'use strict';

const db = require('../db');

/**
 * Get all dishes (combinations of base dishes and sizes)
 * Creates a Cartesian product of base dishes and sizes to show all possible combinations
 * Uses CROSS JOIN to generate all dish-size variants with combined IDs for easier handling
 * @returns {Promise<Array>} Array of dish objects with combined IDs (baseDishId_sizeId)
 */
exports.getAllDishes = () => {
  return new Promise((resolve, reject) => {
    // CROSS JOIN creates all possible combinations of base dishes and sizes
    // Combined ID format allows frontend to easily reference specific dish-size pairs
    const sql = `
      SELECT 
        bd.id || '_' || s.id as id,
        bd.name,
        s.label as size,
        s.base_price as price,
        s.max_ingredients as maxIngredients,
        bd.id as baseDishId,
        s.id as sizeId
      FROM base_dishes bd
      CROSS JOIN sizes s
      ORDER BY bd.name, s.base_price
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => ({
        id: row.id,                         // Combined ID for easy reference
        name: row.name,
        size: row.size,
        price: row.price,
        maxIngredients: row.maxIngredients,
        baseDishId: row.baseDishId,         // Original base dish ID
        sizeId: row.sizeId                  // Original size ID
      })));
    });
  });
};

/**
 * Get all ingredients with their constraint relationships
 * Includes requirements and incompatibilities for UI constraint handling
 * Uses complex JOINs to aggregate constraint data into arrays
 * @returns {Promise<Array>} Array of ingredient objects with relationships
 */
exports.getAllIngredients = () => {
  return new Promise((resolve, reject) => {
    // Complex query joins ingredient constraints and aggregates them
    // GROUP_CONCAT creates comma-separated lists of related ingredient names
    const sql = `
      SELECT 
        i.id,
        i.name,
        i.price,
        i.availability,
        GROUP_CONCAT(DISTINCT req.name) as requires,
        GROUP_CONCAT(DISTINCT inc.name) as incompatible
      FROM ingredients i
      LEFT JOIN ingredient_requirements ir ON i.id = ir.ingredient_id
      LEFT JOIN ingredients req ON ir.required_id = req.id
      LEFT JOIN ingredient_incompatibilities ii ON i.id = ii.ingredient_id
      LEFT JOIN ingredients inc ON ii.incompatible_with_id = inc.id
      GROUP BY i.id, i.name, i.price, i.availability
      ORDER BY i.name
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        availability: row.availability,
        // Convert comma-separated strings to arrays for easier frontend handling
        requires: row.requires ? row.requires.split(',') : [],
        incompatible: row.incompatible ? row.incompatible.split(',') : []
      })));
    });
  });
};

/**
 * Get a single ingredient by ID
 * Simple lookup for ingredient validation during order creation
 * @param {number} id - The ingredient ID
 * @returns {Promise<Object|null>} Ingredient object or null if not found
 */
exports.getIngredientById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM ingredients WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null); // Ingredient not found
      else resolve({
        id: row.id,
        name: row.name,
        price: row.price,
        availability: row.availability
      });
    });
  });
};

/**
 * Get dish by combined ID (baseDishId_sizeId format)
 * Splits the combined ID and reconstructs dish information from separate tables
 * Used for order validation and price calculation
 * @param {string} combinedId - Combined dish ID in format "baseDishId_sizeId"
 * @returns {Promise<Object|null>} Dish object or null if not found
 */
exports.getDishById = (combinedId) => {
  return new Promise((resolve, reject) => {
    // Parse the combined ID to extract base dish and size components
    const [baseDishId, sizeId] = combinedId.split('_');
    
    // Reconstruct dish information by joining base_dishes and sizes tables
    const sql = `
      SELECT 
        bd.id || '_' || s.id as id,
        bd.name,
        s.label as size,
        s.base_price as price,
        s.max_ingredients as maxIngredients,
        bd.id as baseDishId,
        s.id as sizeId
      FROM base_dishes bd
      JOIN sizes s ON s.id = ?
      WHERE bd.id = ?
    `;
    db.get(sql, [sizeId, baseDishId], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null); // Invalid dish combination
      else resolve({
        id: row.id,
        name: row.name,
        size: row.size,
        price: row.price,
        maxIngredients: row.maxIngredients,
        baseDishId: row.baseDishId,
        sizeId: row.sizeId
      });
    });
  });
};

/**
 * Create a new order with ingredients and update availability
 * Handles transaction-like behavior by inserting order and updating ingredient availability
 * Processes each ingredient individually to handle availability constraints
 * @param {number} userId - ID of the user placing the order
 * @param {string} dishId - Combined dish ID (baseDishId_sizeId)
 * @param {Array<number>} ingredientIds - Array of ingredient IDs to include
 * @returns {Promise<Object>} Created order object with ID
 */
exports.createOrder = (userId, dishId, ingredientIds) => {
  return new Promise((resolve, reject) => {
    // Extract base dish and size IDs from combined dish ID
    const [baseDishId, sizeId] = dishId.split('_');
    
    // Insert main order record with 'confirmed' status
    const orderSql = 'INSERT INTO orders (user_id, base_dish_id, size_id, status) VALUES (?, ?, ?, ?)';
    db.run(orderSql, [userId, baseDishId, sizeId, 'confirmed'], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      const orderId = this.lastID; // SQLite provides auto-generated ID
      
      // If no ingredients selected, order is complete
      if (ingredientIds.length === 0) {
        resolve({ id: orderId });
        return;
      }
      
      // Process each ingredient: add to order and update availability
      let completed = 0;
      let hasError = false;
      
      ingredientIds.forEach(ingredientId => {
        if (hasError) return; // Skip remaining if error occurred
        
        // Insert ingredient-order relationship
        const orderIngSql = 'INSERT INTO order_ingredients (order_id, ingredient_id) VALUES (?, ?)';
        db.run(orderIngSql, [orderId, ingredientId], (err) => {
          if (err) {
            hasError = true;
            reject(err);
            return;
          }
          
          // Update ingredient availability (only if it has limited availability)
          // Prevents negative availability and only updates when constraint exists
          const updateSql = `
            UPDATE ingredients 
            SET availability = availability - 1 
            WHERE id = ? AND availability IS NOT NULL AND availability > 0
          `;
          db.run(updateSql, [ingredientId], (err) => {
            if (err) {
              hasError = true;
              reject(err);
              return;
            }
            
            completed++;
            // Resolve when all ingredients have been processed
            if (completed === ingredientIds.length) {
              resolve({ id: orderId });
            }
          });
        });
      });
    });
  });
};

/**
 * Get all orders for a specific user with full details
 * Fetches orders and their ingredients in separate queries for better performance
 * Calculates total prices including ingredient costs
 * @param {number} userId - ID of the user whose orders to retrieve
 * @returns {Promise<Array>} Array of order objects with full details
 */
exports.getUserOrders = (userId) => {
  return new Promise((resolve, reject) => {
    // First query: get basic order information with dish details
    const sql = `
      SELECT 
        o.id,
        o.user_id,
        o.created_at as order_date,
        o.status,
        bd.name as dish_name,
        s.label as dish_size,
        s.base_price as dish_price
      FROM orders o
      JOIN base_dishes bd ON o.base_dish_id = bd.id
      JOIN sizes s ON o.size_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // No orders found for this user
      if (rows.length === 0) {
        resolve([]);
        return;
      }
      
      // For each order, fetch its ingredients separately to avoid complex JOINs
      let processedOrders = 0;
      const orders = [];
      
      rows.forEach(row => {
        // Second query: get ingredients for this specific order
        const ingredientsSql = `
          SELECT i.name, i.price
          FROM order_ingredients oi
          JOIN ingredients i ON oi.ingredient_id = i.id
          WHERE oi.order_id = ?
        `;
        
        db.all(ingredientsSql, [row.id], (err, ingredientRows) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Process ingredient data and calculate total price
          const ingredients = ingredientRows.map(ing => ing.name);
          const ingredientPrices = ingredientRows.map(ing => ing.price);
          const totalPrice = row.dish_price + ingredientPrices.reduce((sum, price) => sum + price, 0);
          
          // Build complete order object with all details
          orders.push({
            id: row.id,
            userId: row.user_id,
            dishName: row.dish_name,
            dishSize: row.dish_size,
            dishPrice: row.dish_price,
            totalPrice: totalPrice,
            orderDate: row.order_date,
            status: row.status,
            ingredients: ingredients,
            ingredientPrices: ingredientPrices
          });
          
          processedOrders++;
          // When all orders are processed, sort and return
          if (processedOrders === rows.length) {
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            resolve(orders);
          }
        });
      });
    })
  });
};

/**
 * Cancel an order and restore ingredient availability
 * Only confirmed orders can be cancelled, and ingredient availability is restored
 * Implements reverse operation of order creation for availability management
 * @param {number} orderId - ID of the order to cancel
 * @param {number} userId - ID of the user (for security check)
 * @returns {Promise<void>} Promise that resolves when cancellation is complete
 */
exports.cancelOrder = (orderId, userId) => {
  return new Promise((resolve, reject) => {
    // First, retrieve ingredients from the order to restore their availability
    const getIngredientsSql = `
      SELECT ingredient_id 
      FROM order_ingredients
      WHERE order_id = ?
    `;
    
    db.all(getIngredientsSql, [orderId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Update order status to cancelled (with security check)
      // Only allows cancellation of confirmed orders by the order owner
      const updateOrderSql = 'UPDATE orders SET status = ? WHERE id = ? AND user_id = ? AND status = ?';
      db.run(updateOrderSql, ['cancelled', orderId, userId, 'confirmed'], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Check if the order was actually updated (exists and was confirmed)
        if (this.changes === 0) {
          reject(new Error('Order not found or cannot be cancelled'));
          return;
        }
        
        // If no ingredients to restore, cancellation is complete
        if (rows.length === 0) {
          resolve();
          return;
        }
        
        // Restore availability for each ingredient that was used in the order
        let completed = 0;
        let hasError = false;
        
        rows.forEach(row => {
          if (hasError) return; // Skip remaining if error occurred
          
          // Increment availability for ingredients that have availability tracking
          const restoreAvailabilitySql = `
            UPDATE ingredients 
            SET availability = availability + 1 
            WHERE id = ? AND availability IS NOT NULL
          `;
          
          db.run(restoreAvailabilitySql, [row.ingredient_id], (err) => {
            if (err) {
              hasError = true;
              reject(err);
              return;
            }
            
            completed++;
            // Resolve when all ingredient availabilities have been restored
            if (completed === rows.length) {
              resolve();
            }
          });
        });
      });
    });
  });
};

/**
 * Get all base dishes (pizza, pasta, salad, etc.)
 * Simple lookup for menu display and order configuration
 * @returns {Promise<Array>} Array of base dish objects
 */
exports.getBaseDishes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM base_dishes ORDER BY name';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => ({
        id: row.id,
        name: row.name
      })));
    });
  });
};

/**
 * Get all available sizes with pricing and constraints
 * Provides size options with pricing and ingredient capacity limits
 * @returns {Promise<Array>} Array of size objects with pricing information
 */
exports.getSizes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sizes ORDER BY base_price';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => ({
        id: row.id,
        label: row.label,
        basePrice: row.base_price,
        maxIngredients: row.max_ingredients
      })));
    });
  });
};
