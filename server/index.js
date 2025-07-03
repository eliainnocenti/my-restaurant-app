/* Restaurant Ordering System - Main Server Application */

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

// HTTP request logging for debugging and monitoring
app.use(morgan('dev'));

// JSON body parsing for API requests
app.use(express.json());

// CORS configuration for frontend communication
// Allows credentials (session cookies) from the Vite development server
const corsOptions = {
  origin: 'http://localhost:5173', // Vite development server
  credentials: true,               // Allow session cookies
};
app.use(cors(corsOptions));

// Session management with secure configuration
app.use(session({
  secret: 'restaurant-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

// --- Passport authentication setup ---

app.use(passport.initialize());
app.use(passport.session());

/**
 * Local authentication strategy for username/password login
 * Validates credentials against user database and handles login attempts
 * Provides detailed logging for security monitoring
 */
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  try {
    // Verify credentials against database
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
 * Decodes base32 TOTP secret and validates time-based codes
 * Provides 30-second validity window for TOTP codes
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
 * Stores complete user object in session for easy access
 */
passport.serializeUser(function (user, callback) {
  console.log('AUTH', 'Serializing user', { userId: user.id, username: user.username });
  callback(null, user);
});

/**
 * Deserialize user object from session
 * Retrieves user object from session data
 */
passport.deserializeUser(function (user, callback) {
  console.log('AUTH', 'Deserializing user', { userId: user.id, username: user.username });
  return callback(null, user);
});

// --- Middleware functions ---

/**
 * Authentication middleware - requires valid login session
 * Checks if user is authenticated and logs access attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
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
 * Ensures user has completed 2FA for sensitive operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function isTotp(req, res, next) {
  if(req.session.method === 'totp')
    return next();
  return res.status(401).json({ error: 'Missing TOTP authentication'});
}

/**
 * Create client-safe user information object
 * Removes sensitive data and adds authentication status flags
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
 * Public endpoint for menu browsing
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
 * Public endpoint for menu browsing and constraint checking
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
 * Public endpoint for menu category browsing
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
 * Public endpoint for size and pricing information
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
 * Authenticates user with username/password using Passport Local Strategy
 * Returns user info indicating if 2FA is required
 */
app.post('/api/sessions', function(req, res, next) {
  const username = req.body.username;
  console.log('AUTH', 'Login attempt', { username });

  // Use Passport to authenticate credentials
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
 * Requires existing authentication session and valid 6-digit code
 */
app.post('/api/login-totp', isLoggedIn, [
  check('code').isLength({ min: 6, max: 6 }).isNumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('API', 'TOTP validation failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  // Use Passport TOTP strategy to verify code
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
 * POST /api/skip-totp - Skip TOTP verification for partial authentication
 * Allows user to proceed with limited privileges (cannot cancel orders)
 * Provides graceful degradation for users who prefer not to use 2FA
 */
app.post('/api/skip-totp', isLoggedIn, (req, res) => {
  const username = req.user.username;
  console.log('TOTP', username, 'skipped', 'User chose to skip 2FA verification');
  
  // Mark session as partially authenticated (no TOTP)
  // User can access most features but not sensitive operations
  req.session.method = 'partial'; // Different from 'totp' for full auth
  
  return res.json({ 
    message: 'Proceeding with partial authentication',
    limitations: ['Cannot cancel orders', 'Limited to basic operations']
  });
});

/**
 * GET /api/sessions/current - Get current user session info
 * Returns current user information and authentication status
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
 * Destroys session and logs out user with proper cleanup
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
 * Requires authentication; validates dish and ingredients before creation
 * Updates ingredient availability automatically
 */
app.post('/api/orders', isLoggedIn, [
  check('dishId').isString().notEmpty(), // Combined ID format: baseDishId_sizeId
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

    // Parse combined dish ID to get base dish and size
    const [baseDishId, sizeId] = dishId.split('_');
    if (!baseDishId || !sizeId) {
      console.log('ORDER_CREATE', false, { 
        username: req.user.username, 
        reason: 'Invalid dish ID format',
        dishId 
      });
      return res.status(400).json({ error: 'Invalid dish ID format' });
    }

    // Validate dish exists using combined ID
    const dish = await restaurantDao.getDishById(dishId);
    if (!dish) {
      console.log('ORDER_CREATE', false, { 
        username: req.user.username, 
        reason: 'Invalid dish ID',
        dishId 
      });
      return res.status(400).json({ error: 'Invalid dish' });
    }

    // Get size information for capacity validation
    const sizes = await restaurantDao.getSizes();
    const selectedSize = sizes.find(s => s.id.toString() === sizeId);
    if (!selectedSize) {
      console.log('ORDER_CREATE', false, { 
        username: req.user.username, 
        reason: 'Invalid size ID',
        sizeId 
      });
      return res.status(400).json({ error: 'Invalid size' });
    }

    // SERVER-SIDE CONSTRAINT VALIDATION

    // 1. Check ingredient count constraint
    if (ingredientIds.length > selectedSize.maxIngredients) {
      console.log('ORDER_CREATE', false, { 
        username: req.user.username, 
        reason: 'Too many ingredients',
        count: ingredientIds.length,
        max: selectedSize.maxIngredients
      });
      return res.status(400).json({ 
        error: `${selectedSize.label} dishes can have at most ${selectedSize.maxIngredients} ingredients. You selected ${ingredientIds.length}.`,
        constraintViolation: 'ingredient_count',
        maxAllowed: selectedSize.maxIngredients,
        provided: ingredientIds.length
      });
    }

    // 2. Fetch fresh ingredient data and validate each ingredient
    const allIngredients = await restaurantDao.getAllIngredients();
    const selectedIngredients = [];
    let totalPrice = dish.price;

    // Validate each ingredient exists and is available
    for (const ingrId of ingredientIds) {
      const ingredient = allIngredients.find(ing => ing.id === ingrId);
      if (!ingredient) {
        console.log('ORDER_CREATE', false, { 
          username: req.user.username, 
          reason: 'Invalid ingredient ID',
          ingredientId: ingrId 
        });
        return res.status(400).json({ 
          error: `Invalid ingredient: ${ingrId}`,
          constraintViolation: 'invalid_ingredient'
        });
      }

      // Check availability constraint
      // This check is probably reduntant beacuse we will check it again before creating the order
      // but it is useful as an early exit point to avoid unnecessary processing if an ingredient is not available
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        console.log('ORDER_CREATE', false, { 
          username: req.user.username, 
          reason: 'Ingredient not available',
          ingredient: ingredient.name,
          availability: ingredient.availability
        });
        return res.status(400).json({ 
          error: `${ingredient.name} is not available (current availability: ${ingredient.availability})`,
          constraintViolation: 'availability',
          ingredient: ingredient.name
        });
      }

      selectedIngredients.push(ingredient);
      totalPrice += ingredient.price;
    }

    // 3. Check incompatibility constraints
    const selectedIngredientNames = selectedIngredients.map(ing => ing.name);
    
    for (const ingredient of selectedIngredients) {
      const incompatibleSelected = ingredient.incompatible.filter(incompatName => 
        selectedIngredientNames.includes(incompatName) && incompatName !== ingredient.name
      );
      
      if (incompatibleSelected.length > 0) {
        console.log('ORDER_CREATE', false, { 
          username: req.user.username, 
          reason: 'Incompatible ingredients',
          ingredient: ingredient.name,
          incompatibleWith: incompatibleSelected
        });
        return res.status(400).json({ 
          error: `${ingredient.name} is incompatible with: ${incompatibleSelected.join(', ')}`,
          constraintViolation: 'incompatibility',
          ingredient: ingredient.name,
          conflictsWith: incompatibleSelected
        });
      }
    }

    // 4. Check requirement constraints using recursive validation
    const validateRequirements = (ingredient, checkedIngredients = new Set()) => {
      // Prevent infinite recursion
      if (checkedIngredients.has(ingredient.name)) {
        return { valid: true, missing: [] };
      }
      checkedIngredients.add(ingredient.name);

      const missingRequirements = [];
      
      for (const reqName of ingredient.requires) {
        const isRequired = selectedIngredientNames.includes(reqName);
        if (!isRequired) {
          missingRequirements.push(reqName);
        } else {
          // Recursively check requirements of required ingredients
          const reqIngredient = selectedIngredients.find(ing => ing.name === reqName);
          if (reqIngredient) {
            const reqResult = validateRequirements(reqIngredient, checkedIngredients);
            if (!reqResult.valid) {
              missingRequirements.push(...reqResult.missing);
            }
          }
        }
      }

      return {
        valid: missingRequirements.length === 0,
        missing: missingRequirements
      };
    };

    // Check requirements for all selected ingredients
    for (const ingredient of selectedIngredients) {
      const reqResult = validateRequirements(ingredient);
      if (!reqResult.valid) {
        console.log('ORDER_CREATE', false, { 
          username: req.user.username, 
          reason: 'Missing required ingredients',
          ingredient: ingredient.name,
          missing: reqResult.missing
        });
        return res.status(400).json({ 
          error: `${ingredient.name} requires: ${reqResult.missing.join(', ')}`,
          constraintViolation: 'requirements',
          ingredient: ingredient.name,
          missingRequirements: reqResult.missing
        });
      }
    }

    // 5. Final availability check with potential race condition protection
    // Re-fetch ingredients to ensure we have the latest availability
    const freshIngredients = await restaurantDao.getAllIngredients();
    const unavailableIngredients = [];
    
    for (const ingrId of ingredientIds) {
      const freshIngredient = freshIngredients.find(ing => ing.id === ingrId);
      if (!freshIngredient || (freshIngredient.availability !== null && freshIngredient.availability <= 0)) {
        const ingredientName = freshIngredient ? freshIngredient.name : `ID:${ingrId}`;
        unavailableIngredients.push(ingredientName);
      }
    }

    if (unavailableIngredients.length > 0) {
      console.log('ORDER_CREATE', false, { 
        username: req.user.username, 
        reason: 'Ingredients became unavailable',
        unavailable: unavailableIngredients
      });
      return res.status(400).json({ 
        error: `The following ingredients became unavailable: ${unavailableIngredients.join(', ')}. Please refresh and try again.`,
        constraintViolation: 'availability_changed',
        unavailableIngredients: unavailableIngredients
      });
    }

    // ALL VALIDATIONS PASSED - Create the order
    const order = await restaurantDao.createOrder(req.user.id, dishId, ingredientIds);
    
    console.log('ORDER_CREATE', true, {
      username: req.user.username,
      orderId: order.id,
      dishName: dish.name,
      dishSize: dish.size,
      ingredients: selectedIngredients.map(ing => ing.name),
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
    
    // Handle specific database constraint violations
    if (err.message.includes('availability')) {
      res.status(400).json({ 
        error: err.message,
        constraintViolation: 'availability'
      });
    } else {
      res.status(500).json({ error: err.message || 'Database error' });
    }
  }
});

/**
 * GET /api/orders - Get current user's orders
 * Returns all orders for the authenticated user with full details
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
 * Restores ingredient availability when order is cancelled
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
    
    // Cancel order and restore ingredient availability
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
    
    // Provide specific error messages for different failure cases
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
 * Logs errors and provides generic response to client
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
 * Logs attempted access to non-existent endpoints
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
