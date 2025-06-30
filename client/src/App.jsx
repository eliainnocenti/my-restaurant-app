import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

import { React, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route, Navigate, useNavigate } from 'react-router';

import { 
  GenericLayout, 
  NotFoundLayout, 
  BrowseLayout, 
  ConfiguratorLayout, 
  OrdersLayout,
  LoginLayout, 
  TotpLayout 
} from './components/Layout';

import API from './API.js';

function App() {
  const navigate = useNavigate();

  // Authentication state
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingTotpUser, setPendingTotpUser] = useState(null); // User who needs 2FA

  // Application data state
  const [dishes, setDishes] = useState([]);
  const [baseDishes, setBaseDishes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);

  // UI state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Error handling function
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (err.errors && err.errors[0].msg)
      msg = err.errors[0].msg + ' : ' + err.errors[0].path;
    else if (Array.isArray(err))
      msg = err[0].msg + ' : ' + err[0].path;
    else if (typeof err === 'string')
      msg = err;
    else
      msg = 'Unknown Error';

    setMessage(msg);

    // Handle authentication errors
    if (msg === 'Not authenticated') {
      setTimeout(() => {
        setUser(undefined); 
        setLoggedIn(false); 
        setPendingTotpUser(false);
        navigate('/login');
      }, 2000);
    } else {
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    API.getUserInfo()
      .then(u => {
        setLoggedIn(true);
        setUser(u);
        if (u.isTotp) setPendingTotpUser(true);
      })
      .catch(() => {
        // not authenticated
      });
  }, [navigate]);

  // Load dishes and ingredients on app load
  useEffect(() => {
    setLoading(true);
    API.getDishes()
      .then(ds => {
        setDishes(ds);
        return API.getBaseDishes();
      })
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

  // Load user orders when authenticated
  useEffect(() => {
    if (!loggedIn) {
      setOrders([]);
      return;
    }
    API.getUserOrders()
      .then(o => setOrders(o))
      .catch(handleErrors);
  }, [loggedIn]);

  /**
   * Handle user login with proper 2FA flow
   * @param {Object} credentials - Username and password
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
   */
  const handleTotpSuccess = () => {
    API.getUserInfo()
      .then(u => {
        setUser(u);
        setLoggedIn(true);
        setPendingTotpUser(null);
        navigate('/');
      })
      .catch(handleErrors);
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    API.logOut()
      .catch(() => {})
      .finally(() => {
        setLoggedIn(false);
        setUser(null);
        setPendingTotpUser(false);
        setOrders([]);
        navigate('/');
      });
  };

  /**
   * Handle order creation
   * @param {string} dishId - Selected dish ID (baseDishId_sizeId)
   * @param {Array} ingredientIds - Selected ingredient IDs
   */
  const handleCreateOrder = (dishId, ingredientIds) => {
    return API.createOrder(dishId, ingredientIds)
      .then(() => API.getIngredients())
      .then(ing => {
        setIngredients(ing);
        return API.getUserOrders();
      })
      .then(o => {
        setOrders(o);
        setMessage('Order created successfully!');
        navigate('/orders');
      })
      .catch(err => { throw err; });
  };

  /**
   * Handle order cancellation
   * @param {number} orderId - Order ID to cancel
   */
  const handleCancelOrder = (orderId) => {
    API.cancelOrder(orderId)
      .then(() => API.getIngredients())
      .then(ing => {
        setIngredients(ing);
        return API.getUserOrders();
      })
      .then(o => {
        setOrders(o);
        setMessage('Order cancelled successfully!');
      })
      .catch(handleErrors);
  };

  return (
    <Container fluid>
      <Routes>
        {/* Main layout with navigation */}
        <Route path="/" element={
          <GenericLayout 
            message={message} 
            setMessage={setMessage}
            loggedIn={loggedIn} 
            user={user} 
            logout={handleLogout}
            loading={loading}
          />
        }>
          {/* Default route - browse dishes and ingredients */}
          <Route index element={
            <BrowseLayout 
              dishes={dishes}
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
                dishes={dishes}
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
                dishes={dishes}
                ingredients={ingredients}
                cancelOrder={handleCancelOrder}
                canCancel={user?.isTotp} // Only allow cancellation with 2FA
              />
            ) : (
              <Navigate replace to='/login' />
            )
          } />
          
          {/* 404 page */}
          <Route path="*" element={<NotFoundLayout />} />
        </Route>
        
        {/* Login route with 2FA flow */}
        <Route path='/login' element={
          <LoginWithTotp 
            loggedIn={loggedIn} 
            login={handleLogin}
            user={user} 
            pendingTotpUser={pendingTotpUser}
            setPendingTotpUser={setPendingTotpUser}
            totpSuccessful={handleTotpSuccess}
          />
        } />
      </Routes>
    </Container>
  );
}

/**
 * Component to handle login flow with optional TOTP verification
 * Shows either login form or TOTP form based on authentication state
 */
function LoginWithTotp(props) {
  // If user is fully authenticated, redirect to main page
  if (props.loggedIn) {
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
      />
    );
  } 
  // Show standard username/password login form
  else {
    return <LoginLayout login={props.login} />;
  }
}

export default App;
