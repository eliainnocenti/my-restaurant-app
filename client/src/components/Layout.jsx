/* Layout Components for Restaurant Application */

/* This file contains various layout components used throughout the restaurant application. */

import { Row, Col, Button, Spinner, Alert, Card, Container } from 'react-bootstrap';
import { Outlet, Link, useNavigate } from 'react-router';

import { Navigation } from './Navigation';
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
 * Browse layout for public menu viewing
 * Displays dishes, sizes, and ingredients without requiring authentication
 * Includes call-to-action buttons for logged-in users
 * @param {Object} props - Menu data and authentication status
 * @returns {JSX.Element} Public menu browsing interface
 */
function BrowseLayout(props) {
  const { dishes, baseDishes, sizes, ingredients, loggedIn } = props;
  const navigate = useNavigate();

  /**
   * Get appropriate icon for each dish type
   * @param {string} dishName - Name of the dish
   * @returns {string} Bootstrap icon class name
   */
  const getDishIcon = (dishName) => {
    const name = dishName.toLowerCase();
    if (name.includes('pizza')) return 'bi-pie-chart'; // bi-dash-circle
    if (name.includes('pasta')) return 'bi-fork-knife';
    if (name.includes('salad')) return 'bi-flower1';
    return 'bi-star'; // fallback to star
  };

  return (
    <Container>
      {/* Page header with title and action buttons */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '3rem' }}>
                <i className="bi bi-shop me-3" style={{ color: '#f39c12' }}></i>
                Restaurant Menu
              </h1>
              <p className="text-muted fs-5">Discover our delicious dishes and fresh ingredients</p>
            </div>
            {/* Action buttons for authenticated users */}
            {loggedIn && (
              <div>
                <Link to="/orders" className="me-3">
                  <Button 
                    variant="outline-primary"
                    size="lg"
                    className="px-4 py-3 fw-semibold rounded-pill shadow me-3"
                    style={{
                      borderColor: '#3498db',
                      color: '#3498db',
                      borderWidth: '2px'
                    }}
                  >
                    <i className="bi bi-basket me-2"></i>
                    My Orders
                  </Button>
                </Link>
                <Button 
                  size="lg"
                  onClick={() => navigate('/configure')}
                  className="px-4 py-3 fw-semibold rounded-pill shadow"
                  style={{
                    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Order
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Call-to-action for non-authenticated users */}
      {!loggedIn && (
        <Row className="mb-4">
          <Col>
            <Card 
              className="shadow-lg border-0 rounded-4 mb-4"
              style={{ background: 'rgba(255, 255, 255, 0.9)' }}
            >
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={2} className="text-center">
                    <i 
                      className="bi bi-person-plus" 
                      style={{ fontSize: '3rem', color: '#3498db' }}
                    ></i>
                  </Col>
                  <Col md={7}>
                    <h4 className="mb-2 fw-bold" style={{ color: '#2c3e50' }}>
                      Ready to Order?
                    </h4>
                    <p className="text-muted mb-0">
                      Sign in to create your personalized order and enjoy our delicious food!
                    </p>
                  </Col>
                  <Col md={3} className="text-end">
                    <Link to="/login">
                      <Button 
                        size="lg"
                        className="px-4 py-3 fw-semibold rounded-pill"
                        style={{
                          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                          border: 'none'
                        }}
                      >
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login to Order
                      </Button>
                    </Link>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* Base Dishes Column */}
        <Col lg={3} className="mb-4">
          <Card className="h-100 shadow-lg border-0 rounded-4">
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}
            >
              <h3 className="mb-0 fw-bold">
                <i className="bi bi-list me-3"></i>
                Dish Types
              </h3>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              {/* Display each base dish type */}
              {baseDishes.map((baseDish, index) => (
                <Card key={baseDish.id} className="mb-3 border-2 rounded-3 shadow-sm" style={{ marginBottom: index === baseDishes.length - 1 ? '0' : undefined }}>
                  <Card.Body className="p-4 text-center">
                    <h5 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                      {baseDish.name.charAt(0).toUpperCase() + baseDish.name.slice(1)}
                    </h5>
                    <div className="text-muted">
                      <i className={`${getDishIcon(baseDish.name)} me-1`}></i>
                      Customizable with<br />fresh ingredients
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Sizes Column */}
        <Col lg={4} className="mb-4">
          <Card className="h-100 shadow-lg border-0 rounded-4">
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}
            >
              <h3 className="mb-0 fw-bold">
                <i className="bi bi-arrows-angle-expand me-3" style={{ fontSize: '1.4rem'}}></i>
                Available Sizes
              </h3>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              {/* Display size options with pricing and capacity */}
              {sizes.map((size, index) => (
                <Card key={size.id} className="mb-3 border-2 rounded-3 shadow-sm" style={{ marginBottom: index === sizes.length - 1 ? '0' : undefined }}>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                          {size.label}
                        </h5>
                        <small className="text-muted">
                          <i className="bi bi-collection me-1"></i>
                          Max {size.maxIngredients} ingredients
                        </small>
                      </div>
                      <div className="text-end">
                        <div 
                          className="fs-4 fw-bold"
                          style={{ color: '#27ae60' }}
                        >
                          €{size.basePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Ingredients Column */}
        <Col lg={5} className="mb-4">
          <Card className="h-100 shadow-lg border-0 rounded-4">
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}
            >
              <h3 className="mb-0 fw-bold">
                <i className="bi bi-collection me-3"></i>
                Available Ingredients
              </h3>
            </Card.Header>
            <Card.Body className="p-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {/* Display ingredients with constraints and availability */}
              {ingredients.map(ingredient => (
                <Card key={ingredient.id} className="mb-3 border-2 rounded-3 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                          {ingredient.name}
                        </h6>
                        <div 
                          className="fs-5 fw-bold mb-2"
                          style={{ color: '#27ae60' }}
                        >
                          €{ingredient.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-end">
                        {/* Availability indicator */}
                        {ingredient.availability !== null && (
                          <div 
                            className="badge px-3 py-2 mb-2 rounded-pill"
                            style={{ 
                              background: ingredient.availability > 0 
                                ? 'rgba(39, 174, 96, 0.1)' 
                                : 'rgba(231, 76, 60, 0.1)',
                              color: ingredient.availability > 0 ? '#27ae60' : '#e74c3c'
                            }}
                          >
                            <i className="bi bi-box me-1"></i>
                            {ingredient.availability}
                          </div>
                        )}
                        {/* Requirements indicator */}
                        {ingredient.requires.length > 0 && (
                          <div className="mb-2">
                            <small 
                              className="px-2 py-1 rounded-pill"
                              style={{ 
                                background: 'rgba(243, 156, 18, 0.1)',
                                color: '#f39c12'
                              }}
                            >
                              <i className="bi bi-arrow-right me-1"></i>
                              Requires: {ingredient.requires.join(', ')}
                            </small>
                          </div>
                        )}
                        {/* Incompatibilities indicator */}
                        {ingredient.incompatible.length > 0 && (
                          <div>
                            <small 
                              className="px-2 py-1 rounded-pill"
                              style={{ 
                                background: 'rgba(231, 76, 60, 0.1)',
                                color: '#e74c3c'
                              }}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Incompatible: {ingredient.incompatible.join(', ')}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
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
  BrowseLayout, 
  ConfiguratorLayout, 
  OrdersLayout,
  LoginLayout, 
  TotpLayout,
  NotFoundLayout
};
