/* Main Application Component for Restaurant Ordering System */

/* This component serves as the entry point for the application, managing authentication, routing, and global state. */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { React, useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route, Navigate, useNavigate } from 'react-router';

import { 
  GenericLayout, 
  NotFoundLayout, 
  MenuBrowser, 
  ConfiguratorLayout, 
  OrdersLayout,
  LoginLayout, 
  TotpLayout 
} from './components/Layout';

import API from './API.js';

function App() {
  const navigate = useNavigate();
  
  // Add timeout reference for message cleanup
  const messageTimeoutRef = useRef(null);

  // Authentication state management
  const [loggedIn, setLoggedIn] = useState(false);              // Full authentication status
  const [user, setUser] = useState(null);                       // Current user object
  const [pendingTotpUser, setPendingTotpUser] = useState(null); // User awaiting 2FA

  // Application data state - cached for performance
  const [baseDishes, setBaseDishes] = useState([]);   // Base dish types
  const [sizes, setSizes] = useState([]);             // Available sizes
  const [ingredients, setIngredients] = useState([]); // Ingredients with constraints
  const [orders, setOrders] = useState([]);           // User's orders

  // UI state management
  const [message, setMessage] = useState({ type: '', text: '' }); // It support message types
  const [loading, setLoading] = useState(true); // Initial loading state

  /**
   * Centralized message setter with automatic timeout cleanup
   * @param {Object} message - Message object with type and text
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   */
  const setMessageWithTimeout = (message, timeout = 5000) => {
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    // Set the new message
    setMessage(message);
    
    // Set new timeout to clear message
    if (timeout > 0) {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage({ type: '', text: '' });
        messageTimeoutRef.current = null;
      }, timeout);
    }
  };

  /**
   * Global error handler for API operations
   * Processes different error formats and handles authentication errors
   * @param {Object|string|Array} err - Error object from API or validation
   */
  const handleErrors = (err) => {
    let msg = '';
    // Handle different error response formats from server
    if (err.error) msg = err.error;
    else if (err.errors && err.errors[0].msg)
      msg = err.errors[0].msg + ' : ' + err.errors[0].path;
    else if (Array.isArray(err))
      msg = err[0].msg + ' : ' + err[0].path;
    else if (typeof err === 'string')
      msg = err;
    else
      msg = 'Unknown Error';

    // Use centralized message handling for other errors
    setMessageWithTimeout({ type: 'error', text: msg });
  };

  /**
   * Check authentication status on app load
   * Verifies existing session and determines authentication state
   */
  useEffect(() => {
    API.getUserInfo()
      .then(u => {
        setLoggedIn(true);
        setUser(u);
        // Check if user completed 2FA in current session
        if (u.isTotp) setPendingTotpUser(true);
      })
      .catch(() => {
        // User not authenticated - this is expected for new sessions
      });
  }, []);

  /**
   * Load restaurant data on app initialization
   * Fetches menu data that's needed throughout the application
   */
  useEffect(() => {
    setLoading(true);
    // Chain API calls to load all necessary data
    API.getBaseDishes()
      .then(bd => {
        setBaseDishes(bd);
        return API.getSizes();
      })
      .then(sz => {
        setSizes(sz);
        return API.getIngredients();
      })
      .then(ing => {
        setIngredients(ing);
      })
      .catch(handleErrors)
      .finally(() => setLoading(false));
  }, []);

  /**
   * Load user orders when authentication state changes
   * Orders are only available for authenticated users
   */
  useEffect(() => {
    if (!loggedIn) {
      setOrders([]); // Clear orders when not logged in
      return;
    }
    // Fetch user's orders after successful authentication
    API.getUserOrders()
      .then(o => setOrders(o))
      .catch(handleErrors);
  }, [loggedIn]);

  /**
   * Handle user login with proper 2FA flow
   * Manages complex authentication states including partial authentication
   * @param {Object} credentials - Username and password
   * @returns {Promise} Login operation promise
   */
  const handleLogin = (credentials) => {
    return API.logIn(credentials)
      .then(u => {
        // Check if user has 2FA enabled but hasn't completed it yet
        if (u.canDoTotp && !u.isTotp) {
          // User needs to complete 2FA - set pending state
          setPendingTotpUser(u);
          setLoggedIn(false); // Not fully logged in until 2FA is complete
          setUser(null);
        } else {
          // User is fully authenticated (no 2FA required or already completed)
          setUser(u);
          setLoggedIn(true);
          setPendingTotpUser(null);
        }
      })
      .catch(err => { throw err; });
  };

  /**
   * Handle successful TOTP verification
   * Transitions user from pending 2FA state to fully authenticated
   */
  const handleTotpSuccess = () => {
    // Refresh user info to get updated authentication status
    API.getUserInfo()
      .then(u => {
        setUser(u);
        setLoggedIn(true);
        setPendingTotpUser(null);
        navigate('/'); // Redirect to main page
      })
      .catch(handleErrors);
  };

  /**
   * Handle skipping TOTP verification (partial authentication)
   * Allows user to access most features without 2FA
   */
  const handleSkipTotp = () => {
    // User is partially authenticated - can access most features but not cancel orders
    const partialUser = { ...pendingTotpUser, isTotp: false };
    setUser(partialUser);
    setLoggedIn(true);
    setPendingTotpUser(null);
    navigate('/'); // Redirect to main page
  };

  /**
   * Handle upgrade to full 2FA authentication
   * Redirects to login page for 2FA completion without logging out
   * Used when user wants to access 2FA-protected features
   */
  const handleUpgradeTo2FA = () => {
    const currentUsername = user?.username; // Capture current username
    // console.log('Upgrading to 2FA for user:', currentUsername); // Debug log
    
    if (!currentUsername) {
      console.error('No username found for 2FA upgrade');
      setMessageWithTimeout({ type: 'error', text: 'Error: Unable to determine username for 2FA upgrade' });
      return;
    }
    
    // Don't log out - just redirect to login with 2FA requirement
    // User remains logged in but needs to complete 2FA for full privileges
    const loginUrl = `/login?require2fa=true&username=${encodeURIComponent(currentUsername)}`;
    // console.log('Redirecting to:', loginUrl); // Debug log
    navigate(loginUrl);
  };

  /**
   * Handle user logout
   * Clears all authentication state and redirects to home
   */
  const handleLogout = () => {
    API.logOut()
      .catch(() => {}) // Ignore logout errors
      .finally(() => {
        // Clear all user-related state
        setLoggedIn(false);
        setUser(null);
        setPendingTotpUser(false);
        setOrders([]);
        navigate('/'); // Redirect to home page
      });
  };

  /**
   * Handle order creation
   * Creates order and refreshes related data (ingredients availability, user orders)
   * Handles validation errors by redirecting back to configurator with preserved state
   * @param {string} dishId - Selected dish ID (baseDishId_sizeId)
   * @param {Array} ingredientIds - Selected ingredient IDs
   * @param {Function} onUnavailableIngredient - Callback to handle unavailable ingredient
   * @returns {Promise} Order creation promise
   */
  const handleCreateOrder = (dishId, ingredientIds, onUnavailableIngredient) => {
    return API.createOrder(dishId, ingredientIds)
      .then(() => API.getIngredients()) // Refresh ingredients for availability updates
      .then(ing => {
        setIngredients(ing);
        return API.getUserOrders(); // Refresh user orders
      })
      .then(o => {
        setOrders(o);
        setMessageWithTimeout({ type: 'success', text: 'Order created successfully!' });
        navigate('/orders'); // Redirect to orders page
      })
      .catch(err => { 
        // Handle constraint violations - keep user on configurator
        if (err.constraintViolation) {
          // console.log('Order validation failed:', err); // Debug log
          
          // If there's an unavailable ingredient, notify the configurator to deselect it
          if (err.constraintViolation === 'availability' && err.ingredient && onUnavailableIngredient) {
            // console.log('Notifying configurator to deselect ingredient:', err.ingredient); // Debug log
            onUnavailableIngredient(err.ingredient);
          }
          
          // Refresh ingredients to show current availability
          API.getIngredients()
            .then(ing => setIngredients(ing))
            .catch(refreshErr => console.error('Failed to refresh ingredients:', refreshErr));
          
          // Don't navigate away - let user fix the order
          // The error will be displayed and handled by the configurator component
          throw err;
        } else {
          // For other errors, use standard error handling
          throw err;
        }
      });
  };

  /**
   * Handle order cancellation
   * Cancels order and refreshes related data (ingredients availability, user orders)
   * @param {number} orderId - Order ID to cancel
   */
  const handleCancelOrder = (orderId) => {
    API.cancelOrder(orderId)
      .then(() => API.getIngredients()) // Refresh ingredients for availability updates
      .then(ing => {
        setIngredients(ing);
        return API.getUserOrders(); // Refresh user orders
      })
      .then(o => {
        setOrders(o);
        setMessageWithTimeout({ type: 'success', text: 'Order cancelled successfully!' });
      })
      .catch(handleErrors);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Container fluid>
      <Routes>
        {/* Main layout with navigation - wraps most pages */}
        <Route path="/" element={
          <GenericLayout 
            message={message} 
            setMessage={setMessage}
            loggedIn={loggedIn} 
            user={user} 
            logout={handleLogout}
            upgradeTo2FA={handleUpgradeTo2FA}
            loading={loading}
          />
        }>
          {/* Default route - browse dishes and ingredients (public) */}
          <Route index element={
            <MenuBrowser 
              baseDishes={baseDishes}
              sizes={sizes}
              ingredients={ingredients}
              loggedIn={loggedIn}
            />
          } />
          
          {/* Order configurator - requires authentication */}
          <Route path="configure" element={
            loggedIn ? (
              <ConfiguratorLayout 
                baseDishes={baseDishes}
                sizes={sizes}
                ingredients={ingredients}
                createOrder={handleCreateOrder}
                handleErrors={handleErrors}
              />
            ) : (
              <Navigate replace to='/login' />
            )
          } />
          
          {/* User orders - requires authentication */}
          <Route path="orders" element={
            loggedIn ? (
              <OrdersLayout 
                orders={orders}
                cancelOrder={handleCancelOrder}
                canCancel={user?.isTotp} // Only allow cancellation with 2FA
                upgradeTo2FA={handleUpgradeTo2FA}
                user={user}
              />
            ) : (
              <Navigate replace to='/login' />
            )
          } />
          
          {/* 404 page for unknown routes */}
          <Route path="*" element={<NotFoundLayout />} />
        </Route>
        
        {/* Login route with 2FA flow - separate layout */}
        <Route path='/login' element={
          <LoginWithTotp 
            loggedIn={loggedIn} 
            login={handleLogin}
            user={user} 
            pendingTotpUser={pendingTotpUser}
            setPendingTotpUser={setPendingTotpUser}
            totpSuccessful={handleTotpSuccess}
            skipTotpSuccessful={handleSkipTotp}
            handleErrors={handleErrors}
          />
        } />
      </Routes>
    </Container>
  );
}

/**
 * Component to handle login flow with optional TOTP verification
 * Shows either login form or TOTP form based on authentication state
 * Manages the complex multi-step authentication process
 * @param {Object} props - Component props containing authentication handlers
 * @returns {JSX.Element} Appropriate authentication form component
 */
function LoginWithTotp(props) {
  // If user is fully authenticated, redirect to main page
  if (props.loggedIn && props.user?.isTotp) {
    return <Navigate replace to='/' />;
  } 
  // If user has completed basic login but needs 2FA
  else if (props.pendingTotpUser) {
    return (
      <TotpLayout 
        totpSuccessful={() => {
          props.setPendingTotpUser(null);
          props.totpSuccessful();
        }}
        skipTotpSuccessful={() => {
          props.setPendingTotpUser(null);
          props.skipTotpSuccessful();
        }}
        handleErrors={props.handleErrors}
      />
    );
  } 
  // Show standard username/password login form
  else {
    return <LoginLayout login={props.login} user={props.user} handleErrors={props.handleErrors} />;
  }
}

export default App;
