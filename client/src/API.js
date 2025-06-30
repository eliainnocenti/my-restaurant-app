/**
 * API client for the Restaurant application
 * Handles all HTTP communication with the backend server
 * Provides a consistent interface for authentication and data operations
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3001/api/';

/**
 * Utility function for parsing HTTP responses from the server
 * Handles both successful responses and error cases
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
            .then(obj => reject(obj))
            .catch(err => reject({ error: 'Cannot parse server response' }));
        }
      })
      .catch(err => reject({ error: 'Cannot communicate' })); // Network error
  });
}

// --- Authentication API calls ---

/**
 * Authenticate user with username and password
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
 * @returns {Promise<Object>} Current user object
 */
const getUserInfo = async () =>
  getJson(
    fetch(SERVER_URL + 'sessions/current', { credentials: 'include' })
  );

/**
 * Log out current user and destroy session
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

// --- Restaurant data API calls ---

/**
 * Get all available dishes (combinations of base dishes and sizes)
 * @returns {Promise<Array>} Array of dish objects
 */
const getDishes = async () =>
  getJson(fetch(SERVER_URL + 'dishes', { credentials: 'include' }));

/**
 * Get all base dish types (pizza, pasta, salad, etc.)
 * @returns {Promise<Array>} Array of base dish objects
 */
const getBaseDishes = async () =>
  getJson(fetch(SERVER_URL + 'base-dishes', { credentials: 'include' }));

/**
 * Get all available sizes with pricing information
 * @returns {Promise<Array>} Array of size objects
 */
const getSizes = async () =>
  getJson(fetch(SERVER_URL + 'sizes', { credentials: 'include' }));

/**
 * Get all ingredients with constraints and availability
 * @returns {Promise<Array>} Array of ingredient objects with relationships
 */
const getIngredients = async () =>
  getJson(fetch(SERVER_URL + 'ingredients', { credentials: 'include' }));

// --- Order management API calls ---

/**
 * Get current user's orders
 * @returns {Promise<Array>} Array of order objects with full details
 */
const getUserOrders = async () =>
  getJson(fetch(SERVER_URL + 'orders', { credentials: 'include' }));

/**
 * Create a new order with selected dish and ingredients
 * @param {string} dishId - Combined dish ID (baseDishId_sizeId)
 * @param {Array<number>} ingredientIds - Array of selected ingredient IDs
 * @returns {Promise<Object>} Created order object
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
 */
const API = {
  // Authentication
  logIn,
  getUserInfo,
  logOut,
  totpVerify,
  
  // Restaurant data
  getDishes,
  getBaseDishes,
  getSizes,
  getIngredients,
  
  // Order management
  getUserOrders,
  createOrder,
  cancelOrder
};

export default API;
