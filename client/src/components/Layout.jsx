/* Layout Components for Restaurant Application */

/* This file contains various layout components used throughout the restaurant application. */

import { Row, Col, Button, Spinner, Alert, Card, Container } from 'react-bootstrap';
import { Outlet, Link, useNavigate } from 'react-router';

import { Navigation } from './Navigation';
import { MenuBrowser } from './MenuBrowser';
import { RestaurantConfigurator } from './RestaurantConfigurator';
import { OrdersList } from './OrdersList';
import { LoginForm, TotpForm } from './Auth';

/**
 * Generic layout wrapper with navigation and global message handling
 * Serves as the main template for most application pages
 * @param {Object} props - Layout properties including authentication state and handlers
 * @returns {JSX.Element} Layout with navigation, messages, and content area
 */
function GenericLayout(props) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Top navigation bar with authentication controls */}
      <Navigation 
        loggedIn={props.loggedIn} 
        user={props.user} 
        loggedInTotp={props.loggedInTotp} 
        logout={props.logout}
        upgradeTo2FA={props.upgradeTo2FA}
      />

      <Container fluid className="py-4" style={{ flex: 1 }}>
        {/* Global message display for errors and notifications */}
        {props.message && props.message.text && (
          <Row>
            <Col>
              <Alert 
                className='mb-4 border-0 rounded-3 shadow-sm' 
                onClose={() => props.setMessage({ type: '', text: '' })} 
                variant={props.message.type === 'success' ? 'success' : 'danger'}
                dismissible
                style={{ 
                  background: props.message.type === 'success' 
                    ? 'rgba(40, 167, 69, 0.1)' 
                    : 'rgba(220, 53, 69, 0.1)' 
                }}
              >
                <i className={`bi ${props.message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                {props.message.text}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Loading spinner or page content */}
        {props.loading ? (
          <Row>
            <Col className="text-center py-5">
              <Spinner 
                animation="border" 
                role="status" 
                style={{ color: '#f39c12', width: '3rem', height: '3rem' }}
              >
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-3 text-muted fs-5">Loading...</div>
            </Col>
          </Row>
        ) : (
          // React Router outlet for nested routes
          <Outlet />
        )}
      </Container>

      {/* Footer */}
      <footer className="mt-auto py-3 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
        <Container>
          <small className="text-muted d-block mb-1">
            Full-stack restaurant ordering app for the Web Applications Exam @ PoliTo
          </small>
          <small className="text-muted">
            Author: <span className="fw-semibold">Elia Innocenti</span> | 
            <a 
              href="https://github.com/polito-WA-2025-exams/exam2-restaurant-eliainnocenti" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-decoration-none ms-1"
              style={{ color: '#6c757d' }}
            >
              <i className="bi bi-github me-1"></i>
              GitHub Repository
            </a>
          </small>
        </Container>
      </footer>
    </div>
  );
}

/**
 * Order configurator layout for authenticated users
 * Wraps the RestaurantConfigurator component with header and navigation
 * @param {Object} props - Menu data and order creation handlers
 * @returns {JSX.Element} Order configuration interface
 */
function ConfiguratorLayout(props) {
  return (
    <Container>
      {/* Page header with navigation */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '3rem' }}>
                <i className="bi bi-sliders me-3" style={{ color: '#f39c12' }}></i>
                Configure Your Order
              </h1>
              <p className="text-muted fs-5">Create your perfect meal with our fresh ingredients</p>
            </div>
            <Link to="/">
              <Button 
                variant="outline-secondary" 
                size="lg"
                className="px-4 py-3 fw-semibold rounded-pill"
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Menu
              </Button>
            </Link>
          </div>
        </Col>
      </Row>

      {/* Order configurator component */}
      <RestaurantConfigurator 
        dishes={props.dishes}
        baseDishes={props.baseDishes}
        sizes={props.sizes}
        ingredients={props.ingredients}
        createOrder={props.createOrder}
        handleErrors={props.handleErrors}
      />
    </Container>
  );
}

/**
 * Orders list layout for viewing and managing user orders
 * Includes header with navigation and order management actions
 * @param {Object} props - Orders data and management functions
 * @returns {JSX.Element} Order management interface
 */
function OrdersLayout(props) {
  return (
    <Container>
      {/* Page header with navigation and actions */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '3rem' }}>
                <i className="bi bi-basket me-3" style={{ color: '#f39c12' }}></i>
                My Orders
              </h1>
              <p className="text-muted fs-5">Track and manage your restaurant orders</p>
            </div>
            <div>
              {/* New order button */}
              <Link to="/configure" className="me-3">
                <Button 
                  size="lg"
                  className="px-4 py-3 fw-semibold rounded-pill me-3"
                  style={{
                    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  New Order
                </Button>
              </Link>
              {/* Back to menu button */}
              <Link to="/">
                <Button 
                  variant="outline-secondary" 
                  size="lg"
                  className="px-4 py-3 fw-semibold rounded-pill"
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Menu
                </Button>
              </Link>
            </div>
          </div>
        </Col>
      </Row>

      {/* Orders list component */}
      <OrdersList 
        orders={props.orders}
        dishes={props.dishes}
        ingredients={props.ingredients}
        cancelOrder={props.cancelOrder}
        canCancel={props.canCancel}
        upgradeTo2FA={props.upgradeTo2FA}
        user={props.user}
      />
    </Container>
  );
}

/**
 * Login layout wrapper
 * Simple wrapper for the LoginForm component
 * @param {Object} props - Login handler function and user object
 * @returns {JSX.Element} Login form interface
 */
function LoginLayout(props) {
  return <LoginForm login={props.login} user={props.user} />;
}

/**
 * TOTP layout wrapper for two-factor authentication
 * Simple wrapper for the TotpForm component
 * @param {Object} props - TOTP success and skip handlers
 * @returns {JSX.Element} TOTP verification interface
 */
function TotpLayout(props) {
  return <TotpForm totpSuccessful={props.totpSuccessful} skipTotpSuccessful={props.skipTotpSuccessful} />;
}

/**
 * 404 Not Found layout
 * Displays error message and navigation back to main page
 * @returns {JSX.Element} 404 error page
 */
function NotFoundLayout() {
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} className="text-center">
          <Card 
            className="shadow-lg border-0 rounded-4"
            style={{ background: 'rgba(255, 255, 255, 0.9)' }}
          >
            <Card.Body className="p-5">
              {/* 404 error icon */}
              <i 
                className="bi bi-exclamation-triangle" 
                style={{ fontSize: '4rem', color: '#e74c3c' }}
              ></i>
              <h2 className="mt-3 mb-3 fw-bold" style={{ color: '#2c3e50' }}>
                Page Not Found
              </h2>
              <p className="text-muted mb-4">
                Oops! The page you're looking for doesn't exist.
              </p>
              {/* Back to home button */}
              <Link to="/">
                <Button 
                  size="lg"
                  className="px-4 py-3 fw-semibold rounded-pill"
                  style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-house me-2"></i>
                  Go back to the main page
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export { 
  GenericLayout, 
  MenuBrowser, 
  ConfiguratorLayout, 
  OrdersLayout,
  LoginLayout, 
  TotpLayout,
  NotFoundLayout
};
