/* Browse Layout for Restaurant Application */

/* Public menu browsing layout component. */

import { Row, Col, Button, Card, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';

/**
 * Menu browser for public menu viewing
 * Displays dishes, sizes, and ingredients without requiring authentication
 * Includes call-to-action buttons for logged-in users
 * @param {Object} props - Menu data and authentication status
 * @returns {JSX.Element} Public menu browsing interface
 */
function MenuBrowser(props) {
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

export { MenuBrowser };
