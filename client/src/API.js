/* API Client for Restaurant Application */

/* Provides centralized HTTP communication layer between frontend and backend. */

const SERVER_URL = 'http://localhost:3001/api/';

/**
 * Utility function for parsing HTTP responses from the server
 * Handles both successful responses and error cases consistently
 * Provides unified error format for the application
 * @param {Promise} httpResponsePromise - Fetch promise to process
 * @returns {Promise} Parsed JSON response or error object
 */
function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then(response => {
        if (response.ok) {
          // Success case - parse JSON response
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: 'Cannot parse server response' }));
        } else {
          // Error case - try to parse error message from response
          response.json()
            .then(obj => {
              // Preserve constraint violation information for client handling
              if (obj.constraintViolation) {
                reject({ ...obj, constraintViolation: obj.constraintViolation });
              } else {
                reject(obj);
              }
            })
            .catch(err => reject({ error: 'Cannot parse server response' }));
        }
      })
      .catch(err => reject({ error: 'Cannot communicate with server' })); // Network error
  });
}

// --- Authentication API calls ---

/**
 * Authenticate user with username and password
 * Initiates session and returns user info including 2FA requirements
 * @param {Object} credentials - Object containing username and password
 * @returns {Promise<Object>} User object with authentication info
 */
const logIn = async credentials =>
  getJson(
    fetch(SERVER_URL + 'sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include session cookies
      body: JSON.stringify(credentials)
    })
  );

/**
 * Get current user information from session
 * Verifies session validity and returns user authentication status
 * @returns {Promise<Object>} Current user object with 2FA status
 */
const getUserInfo = async () =>
  getJson(
    fetch(SERVER_URL + 'sessions/current', { credentials: 'include' })
  );

/**
 * Log out current user and destroy session
 * Clears server-side session and invalidates cookies
 * @returns {Promise<Object>} Logout confirmation
 */
const logOut = async () =>
  getJson(
    fetch(SERVER_URL + 'sessions/current', {
      method: 'DELETE',
      credentials: 'include'
    })
  );

/**
 * Verify TOTP code for two-factor authentication
 * Validates 6-digit time-based code from authenticator app
 * Upgrades session to full authentication on success
 * @param {string} totpCode - 6-digit TOTP code from authenticator app
 * @returns {Promise<Object>} TOTP verification result
 */
const totpVerify = async totpCode =>
  getJson(
    fetch(SERVER_URL + 'login-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: totpCode })
    })
  );

/**
 * Skip TOTP verification for partial authentication
 * Allows user to proceed with limited privileges
 * Session marked as partial authentication (no sensitive operations)
 * @returns {Promise<Object>} Skip confirmation with limitations
 */
const skipTotp = async () =>
  getJson(
    fetch(SERVER_URL + 'skip-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
  );

// --- Restaurant data API calls ---

/**
 * Get all base dish types (pizza, pasta, salad, etc.)
 * Returns fundamental dish categories for menu organization
 * Public endpoint - no authentication required
 * @returns {Promise<Array>} Array of base dish objects
 */
const getBaseDishes = async () =>
  getJson(fetch(SERVER_URL + 'base-dishes', { credentials: 'include' }));

/**
 * Get all available sizes with pricing information
 * Returns size options with base prices and ingredient limits
 * Public endpoint - no authentication required
 * @returns {Promise<Array>} Array of size objects with constraints
 */
const getSizes = async () =>
  getJson(fetch(SERVER_URL + 'sizes', { credentials: 'include' }));

/**
 * Get all ingredients with constraints and availability
 * Returns ingredients with requirements, incompatibilities, and stock levels
 * Public endpoint - no authentication required
 * @returns {Promise<Array>} Array of ingredient objects with relationships
 */
const getIngredients = async () =>
  getJson(fetch(SERVER_URL + 'ingredients', { credentials: 'include' }));

// --- Order management API calls ---

/**
 * Get current user's orders
 * Returns all orders for authenticated user with full details and history
 * Requires authentication - protected endpoint
 * @returns {Promise<Array>} Array of order objects with ingredients and pricing
 */
const getUserOrders = async () =>
  getJson(fetch(SERVER_URL + 'orders', { credentials: 'include' }));

/**
 * Create a new order with selected dish and ingredients
 * Validates selections and creates order with automatic availability tracking
 * Requires authentication - protected endpoint
 * @param {string} dishId - Combined dish ID (baseDishId_sizeId)
 * @param {Array<number>} ingredientIds - Array of selected ingredient IDs
 * @returns {Promise<Object>} Created order object with confirmation details
 */
const createOrder = async (dishId, ingredientIds) =>
  getJson(
    fetch(SERVER_URL + 'orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ dishId, ingredientIds })
    })
  );

/**
 * Cancel an existing order
 * Requires TOTP authentication for security
 * Restores ingredient availability when order is cancelled
 * @param {number} orderId - ID of the order to cancel
 * @returns {Promise<Object>} Cancellation confirmation
 */
const cancelOrder = async orderId =>
  getJson(
    fetch(`${SERVER_URL}orders/${orderId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
  );

/**
 * Exported API object containing all available methods
 * Provides a single import point for all API functionality
 * Organized by functional categories for easy maintenance
 */
const API = {
  // Authentication methods
  logIn,
  getUserInfo,
  logOut,
  totpVerify,
  skipTotp,
  
  // Restaurant data methods
  getBaseDishes,
  getSizes,
  getIngredients,
  
  // Order management methods
  getUserOrders,
  createOrder,
  cancelOrder
};

export default API;
