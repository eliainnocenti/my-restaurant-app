/**
 * Main server application for the Restaurant ordering system
 * Provides REST API for restaurant menu, orders, and user authentication
 * Includes support for TOTP-based two-factor authentication
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

'use strict';

const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const TotpStrategy = require('passport-totp').Strategy;
const base32 = require('thirty-two');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

// Import DAO modules for database operations
const userDao = require('./dao/dao-users');
const restaurantDao = require('./dao/dao-restaurant');

// Create Express application instance
const app = express();
const port = 3001;

// --- Middleware setup ---

// HTTP request logging
app.use(morgan('dev'));

// JSON body parsing
app.use(express.json());

// CORS configuration for frontend communication
const corsOptions = {
  origin: 'http://localhost:5173', // Vite development server
  credentials: true, // Allow session cookies
};
app.use(cors(corsOptions));

// Session management
app.use(session({
  secret: 'restaurant-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false } // Use secure: true in production with HTTPS
}));

// --- Passport authentication setup ---

app.use(passport.initialize());
app.use(passport.session());

/**
 * Local authentication strategy for username/password login
 */
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  try {
    const user = await userDao.getUser(username, password);
    if (!user) {
      console.log('LOGIN', username, false, 'Invalid credentials');
      return callback(null, false, 'Incorrect username or password');
    }
    console.log('LOGIN', username, true, 'Credentials validated');
    return callback(null, user);
  } catch (err) {
    console.log('AUTH', 'Login verification failed', { username, error: err.message });
    return callback(err);
  }
}));

/**
 * TOTP authentication strategy for two-factor authentication
 */
passport.use(new TotpStrategy(
  function(user, done) {
    if (!user || !user.secret) {
      return done(new Error('No TOTP secret configured'), false);
    }
    try {
      // Decode base32 TOTP secret for verification
      const key = base32.decode(user.secret.replace(/ /g, ''));
      return done(null, key, 30); // 30 seconds validity period
    } catch (e) {
      return done(e, false);
    }
  }
));

/**
 * Serialize user object for session storage
 */
passport.serializeUser(function (user, callback) {
  console.log('AUTH', 'Serializing user', { userId: user.id, username: user.username });
  callback(null, user);
});

/**
 * Deserialize user object from session
 */
passport.deserializeUser(function (user, callback) {
  console.log('AUTH', 'Deserializing user', { userId: user.id, username: user.username });
  return callback(null, user);
});

// --- Middleware functions ---

/**
 * Authentication middleware - requires valid login session
 */
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('AUTH', 'User authenticated', { username: req.user.username, route: req.url });
    return next();
  }
  console.log('AUTH', 'Unauthorized access attempt', { route: req.url, ip: req.ip });
  return res.status(401).json({ error: 'Not authenticated' });
};

/**
 * TOTP middleware - requires completed two-factor authentication
 */
function isTotp(req, res, next) {
  if(req.session.method === 'totp')
    return next();
  return res.status(401).json({ error: 'Missing TOTP authentication'});
}

/**
 * Create client-safe user information object
 * @param {Object} req - Express request object
 * @returns {Object} User info safe for client consumption
 */
function clientUserInfo(req) {
  const user = req.user;
  return {
    id: user.id, 
    username: user.username, 
    name: user.name, 
    canDoTotp: user.secret ? true : false, // Does user have 2FA configured?
    isTotp: req.session.method === 'totp'  // Has user completed 2FA this session?
  };
}

// System startup logging
console.log('Server starting up', { port, environment: process.env.NODE_ENV || 'development' });

// --- API Routes ---

// PUBLIC ROUTES (no authentication required)

/**
 * GET /api/dishes - Get all available dish combinations
 * Returns all possible combinations of base dishes and sizes
 */
app.get('/api/dishes', async (req, res) => {
  try {
    console.log('API', 'Fetching all dishes');
    const dishes = await restaurantDao.getAllDishes();
    console.log('SELECT', 'dishes', true, { count: dishes.length });
    res.json(dishes);
  } catch (err) {
    console.log('SELECT', 'dishes', false, { error: err.message });
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * GET /api/ingredients - Get all ingredients with constraints
 * Returns ingredients with availability, requirements, and incompatibilities
 */
app.get('/api/ingredients', async (req, res) => {
  try {
    console.log('API', 'Fetching all ingredients');
    const ingredients = await restaurantDao.getAllIngredients();
    console.log('SELECT', 'ingredients', true, { count: ingredients.length });
    res.json(ingredients);
  } catch (err) {
    console.log('SELECT', 'ingredients', false, { error: err.message });
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * GET /api/base-dishes - Get all base dish types
 */
app.get('/api/base-dishes', (req, res) => {
  restaurantDao.getBaseDishes()
    .then(baseDishes => res.json(baseDishes))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Database error while retrieving base dishes' });
    });
});

/**
 * GET /api/sizes - Get all available sizes with pricing
 */
app.get('/api/sizes', (req, res) => {
  restaurantDao.getSizes()
    .then(sizes => res.json(sizes))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Database error while retrieving sizes' });
    });
});

// AUTHENTICATION ROUTES

/**
 * POST /api/sessions - User login endpoint
 * Authenticates user with username/password
 */
app.post('/api/sessions', function(req, res, next) {
  const username = req.body.username;
  console.log('AUTH', 'Login attempt', { username });

  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
    if (!user) {
      console.log('LOGIN', username, false, info);
      return res.status(401).json({ error: info });
    }
    
    // Successful authentication - establish session
    req.login(user, (err) => {
      if (err)
        return next(err);
      
      console.log('LOGIN', username, true, 'Session created successfully');
      
      // Return user info - client will check if 2FA is needed
      const userInfo = clientUserInfo(req);
      console.log('LOGIN', username, true, `2FA required: ${userInfo.canDoTotp && !userInfo.isTotp}`);
      
      return res.json(userInfo);
    });
  })(req, res, next);
});

/**
 * POST /api/login-totp - TOTP verification endpoint
 * Verifies TOTP code for two-factor authentication
 */
app.post('/api/login-totp', isLoggedIn, [
  check('code').isLength({ min: 6, max: 6 }).isNumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('API', 'TOTP validation failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate('totp', (err, user, info) => {
    if (err) {
      console.log('TOTP', req.user.username, false, 'TOTP authentication error: ' + err.message);
      return res.status(500).json({ error: 'TOTP verification failed' });
    }
    if (!user) {
      console.log('TOTP', req.user.username, false, 'Invalid TOTP code');
      return res.status(401).json({ error: 'Invalid TOTP code' });
    }
    
    // TOTP verification successful - mark session as fully authenticated
    req.session.method = 'totp';
    console.log('TOTP', req.user.username, true, 'TOTP verification successful');
    
    return res.json({ otp: 'authorized' });
  })(req, res, next);
});

/**
 * GET /api/sessions/current - Get current user session info
 */
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    console.log('AUTH', 'Current user session retrieved', { username: req.user.username });
    return res.json(clientUserInfo(req));
  }
  console.log('AUTH', 'No active user session found');
  res.status(401).json({ error: 'Not authenticated' });
});

/**
 * DELETE /api/sessions/current - Logout current user
 */
app.delete('/api/sessions/current', (req, res) => {
  const username = req.isAuthenticated() ? req.user.username : 'unknown';
  
  req.logout(err => {
    if (err) {
      console.log('AUTH', 'Logout failed', { username, error: err.message });
      return res.status(500).json({ error: 'Logout error' });
    }
    console.log('LOGOUT', username, true, 'Session destroyed');
    res.json({ message: 'Logout successful' });
  });
});

// ORDER MANAGEMENT ROUTES (require authentication)

/**
 * POST /api/orders - Create a new order
 * Requires authentication; TOTP required for users with 2FA enabled
 */
app.post('/api/orders', isLoggedIn, [
  check('dishId').isString().notEmpty(), // Changed from isInt to handle combined IDs
  check('ingredientIds').isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('API', 'Order creation validation failed', { 
      username: req.user.username,
      errors: errors.array() 
    });
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { dishId, ingredientIds } = req.body;
    console.log('BUSINESS', 'Order creation started', { 
      username: req.user.username, 
      dishId, 
      ingredientCount: ingredientIds.length 
    });

    // Validate dish exists
    const dish = await restaurantDao.getDishById(dishId);
    if (!dish) {
      console.log('ORDER_CREATE', false, { 
        username: req.user.username, 
        reason: 'Invalid dish ID',
        dishId 
      });
      return res.status(400).json({ error: 'Invalid dish' });
    }
    
    // Validate all ingredients exist and calculate total price
    let totalPrice = dish.price;
    const ingredientDetails = [];

    for (const ingrId of ingredientIds) {
      const ingredient = await restaurantDao.getIngredientById(ingrId);
      if (!ingredient) {
        console.log('ORDER_CREATE', false, { 
          username: req.user.username, 
          reason: 'Invalid ingredient ID',
          ingredientId: ingrId 
        });
        return res.status(400).json({ error: `Invalid ingredient: ${ingrId}` });
      }
      totalPrice += ingredient.price;
      ingredientDetails.push(ingredient.name);
    }

    // Create the order
    const order = await restaurantDao.createOrder(req.user.id, dishId, ingredientIds, totalPrice);
    
    console.log('ORDER_CREATE', true, {
      username: req.user.username,
      orderId: order.id,
      dishName: dish.name,
      dishSize: dish.size,
      ingredients: ingredientDetails,
      totalPrice: totalPrice
    });

    res.status(201).json({
      id: order.id,
      dishId: dishId,
      ingredientIds: ingredientIds,
      totalPrice: totalPrice,
      message: 'Order created successfully'
    });
  } catch (err) {
    console.log('BUSINESS', 'Order creation failed', { 
      username: req.user.username,
      error: err.message,
      stack: err.stack 
    });
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

/**
 * GET /api/orders - Get current user's orders
 */
app.get('/api/orders', isLoggedIn, async (req, res) => {
  try {
    console.log('API', 'Fetching user orders', { username: req.user.username });
    const orders = await restaurantDao.getUserOrders(req.user.id);
    console.log('SELECT', 'orders', true, { 
      username: req.user.username,
      orderCount: orders.length 
    });
    res.json(orders);
  } catch (err) {
    console.log('SELECT', 'orders', false, { 
      username: req.user.username,
      error: err.message 
    });
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * DELETE /api/orders/:id - Cancel an order
 * Requires TOTP authentication for security
 */
app.delete('/api/orders/:id', isLoggedIn, isTotp, [
  check('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('API', 'Order cancellation validation failed', { 
      username: req.user.username,
      errors: errors.array() 
    });
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const orderId = parseInt(req.params.id, 10);
    console.log('BUSINESS', 'Order cancellation started', { 
      username: req.user.username, 
      orderId 
    });
    
    await restaurantDao.cancelOrder(orderId, req.user.id);
    
    console.log('ORDER_CANCEL', true, { 
      username: req.user.username, 
      orderId 
    });
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.log('BUSINESS', 'Order cancellation failed', { 
      username: req.user.username,
      orderId: req.params.id,
      error: err.message 
    });
    
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || 'Database error' });
    }
  }
});

// --- Error handling ---

/**
 * Global error handler for unhandled errors
 */
app.use((err, req, res, next) => {
  console.log('SERVER', 'Unhandled error', { 
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack 
  });
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * 404 handler for unknown routes
 */
app.use((req, res) => {
  console.log('HTTP', 'Route not found', { 
    method: req.method, 
    url: req.url,
    ip: req.ip 
  });
  res.status(404).json({ error: 'Route not found' });
});

// --- Server startup ---

app.listen(port, () => {
  console.log('Server started successfully', { 
    port, 
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'INFO'
  });
  console.log(`API endpoints available at http://localhost:${port}/api/`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
