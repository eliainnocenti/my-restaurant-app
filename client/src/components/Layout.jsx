/**
 * Layout components for the Restaurant application
 * Provides different page layouts for browsing, ordering, and user management
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

import { Row, Col, Button, Spinner, Alert, Card, Container } from 'react-bootstrap';
import { Outlet, Link, useNavigate } from 'react-router';

import { Navigation } from './Navigation';
import { RestaurantConfigurator } from './RestaurantConfigurator';
import { OrdersList } from './OrdersList';
import { LoginForm, TotpForm } from './Auth';

/**
 * Generic layout with navigation and message handling
 */
function GenericLayout(props) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Navigation 
        loggedIn={props.loggedIn} 
        user={props.user} 
        loggedInTotp={props.loggedInTotp} 
        logout={props.logout} 
      />

      <Container fluid className="py-4">
        {props.message && (
          <Row>
            <Col>
              <Alert 
                className='mb-4 border-0 rounded-3 shadow-sm' 
                onClose={() => props.setMessage('')} 
                variant='danger' 
                dismissible
                style={{ background: 'rgba(220, 53, 69, 0.1)' }}
              >
                <i className="bi bi-exclamation-triangle me-2"></i>
                {props.message}
              </Alert>
            </Col>
          </Row>
        )}

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
          <Outlet />
        )}
      </Container>
    </div>
  );
}

/**
 * Browse layout - shows dishes and ingredients (public access)
 */
function BrowseLayout(props) {
  const { dishes, baseDishes, sizes, ingredients, loggedIn } = props;
  const navigate = useNavigate();

  return (
    <Container>
      <Row className="mb-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '3rem' }}>
                <i className="bi bi-shop me-3" style={{ color: '#f39c12' }}></i>
                Restaurant Menu
              </h1>
              <p className="text-muted fs-5">Discover our delicious dishes and fresh ingredients</p>
            </div>
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

      <Row>
        <Col lg={3} className="mb-4">
          <Card className="h-100 shadow-lg border-0 rounded-4">
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}
            >
              <h3 className="mb-0 fw-bold">
                <i className="bi bi-bowl me-3"></i>
                Dish Types
              </h3>
            </Card.Header>
            <Card.Body className="p-4">
              {baseDishes.map(baseDish => (
                <Card key={baseDish.id} className="mb-3 border-2 rounded-3 shadow-sm">
                  <Card.Body className="p-4 text-center">
                    <h5 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                      {baseDish.name.charAt(0).toUpperCase() + baseDish.name.slice(1)}
                    </h5>
                    <div className="text-muted">
                      <i className="bi bi-star me-1"></i>
                      Customizable with fresh ingredients
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} className="mb-4">
          <Card className="h-100 shadow-lg border-0 rounded-4">
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}
            >
              <h3 className="mb-0 fw-bold">
                <i className="bi bi-rulers me-3"></i>
                Available Sizes
              </h3>
            </Card.Header>
            <Card.Body className="p-4">
              {sizes.map(size => (
                <Card key={size.id} className="mb-3 border-2 rounded-3 shadow-sm">
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

        <Col lg={6} className="mb-4">
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

      {!loggedIn && (
        <Row className="mt-5">
          <Col className="text-center">
            <Card 
              className="mx-auto shadow-lg border-0 rounded-4"
              style={{ maxWidth: '500px', background: 'rgba(255, 255, 255, 0.9)' }}
            >
              <Card.Body className="p-5">
                <i 
                  className="bi bi-person-plus" 
                  style={{ fontSize: '3rem', color: '#3498db' }}
                ></i>
                <h4 className="mt-3 mb-3" style={{ color: '#2c3e50' }}>
                  Ready to Order?
                </h4>
                <p className="text-muted mb-4">
                  Sign in to create your personalized order and enjoy our delicious food!
                </p>
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

/**
 * Order configurator layout
 */
function ConfiguratorLayout(props) {
  return (
    <Container>
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
 * Orders list layout
 */
function OrdersLayout(props) {
  return (
    <Container>
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

      <OrdersList 
        orders={props.orders}
        dishes={props.dishes}
        ingredients={props.ingredients}
        cancelOrder={props.cancelOrder}
        canCancel={props.canCancel}
      />
    </Container>
  );
}

/**
 * Login layout
 */
function LoginLayout(props) {
  return <LoginForm login={props.login} />;
}

/**
 * TOTP layout for 2FA
 */
function TotpLayout(props) {
  return <TotpForm totpSuccessful={props.totpSuccessful} />;
}

/**
 * 404 Not Found layout
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
  NotFoundLayout, 
  BrowseLayout, 
  ConfiguratorLayout, 
  OrdersLayout,
  LoginLayout, 
  TotpLayout 
};
