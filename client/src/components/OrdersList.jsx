/* Orders List Component for Restaurant Application */

/* This component displays a user's order history with detailed information about each order. */

import { Card, Button, Badge, Row, Col, Container, Modal } from 'react-bootstrap';
import dayjs from 'dayjs';
import { Link } from 'react-router';
import { useState } from 'react';

/**
 * Main orders list component displaying user's order history
 * @param {Object} props - Component properties
 * @param {Array} props.orders - Array of user's orders with full details
 * @param {Function} props.cancelOrder - Function to cancel an order
 * @param {boolean} props.canCancel - Whether user can cancel orders (requires 2FA)
 * @param {Function} props.upgradeTo2FA - Function to upgrade user to 2FA authentication
 * @param {Object} props.user - Current user object with username
 * @returns {JSX.Element} Orders list interface with cancellation capabilities
 */
const OrdersList = (props) => {
  const { orders, cancelOrder, canCancel, upgradeTo2FA, user } = props;
  
  // Modal state for 2FA upgrade flow
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState(null);

  /**
   * Handle order cancellation with 2FA security check
   * Determines if user can cancel directly or needs 2FA upgrade
   * @param {number} orderId - ID of order to cancel
   */
  const handleCancelOrder = (orderId) => {
    if (!canCancel) {
      // User needs 2FA to cancel orders - show upgrade modal
      setPendingCancelOrderId(orderId);
      setShowUpgradeModal(true);
      return;
    }
    
    // User has 2FA - proceed with cancellation confirmation
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder(orderId);
    }
  };

  /**
   * Handle 2FA upgrade confirmation from order cancellation
   * Initiates the 2FA upgrade flow with username context and closes modal
   */
  const handleUpgradeTo2FA = () => {
    setShowUpgradeModal(false);
    // Call the upgrade function which will now include username in navigation
    upgradeTo2FA();
  };

  // Empty state - no orders found
  if (orders.length === 0) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card 
              className="text-center shadow-lg border-0 rounded-4"
              style={{ background: 'rgba(255, 255, 255, 0.9)' }}
            >
              <Card.Body className="p-5">
                {/* Empty state icon and messaging */}
                <i 
                  className="bi bi-basket" 
                  style={{ fontSize: '5rem', color: '#95a5a6', opacity: 0.5 }}
                ></i>
                <h3 className="mt-4 mb-3 fw-bold" style={{ color: '#2c3e50' }}>
                  No orders found
                </h3>
                <p className="text-muted fs-5 mb-4">
                  You haven't placed any orders yet. Start browsing our delicious menu!
                </p>
                {/* Call-to-action to create first order */}
                <Link to="/configure">
                  <Button 
                    size="lg"
                    className="px-4 py-3 fw-semibold rounded-pill"
                    style={{
                      background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Your First Order
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div>
      {/* 2FA Upgrade Modal - shown when user tries to cancel without 2FA */}
      <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">
            <i className="bi bi-shield-exclamation" style={{ color: '#f39c12', fontSize: '2rem' }}></i>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <h4 className="mb-3" style={{ color: '#2c3e50' }}>Two-Factor Authentication Required</h4>
          <p className="text-muted mb-4">
            To cancel orders, you need to complete two-factor authentication for security purposes.
          </p>
          {user && (
            <div className="mb-3 p-3 rounded-3" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
              <small className="text-muted">
                <i className="bi bi-person me-2"></i>
                Completing 2FA for: <strong>{user.username}</strong>
              </small>
            </div>
          )}
          <div className="d-grid gap-2">
            {/* Upgrade to 2FA button */}
            <Button 
              onClick={handleUpgradeTo2FA}
              className="py-2 fw-semibold rounded-3"
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                border: 'none'
              }}
            >
              <i className="bi bi-shield-check me-2"></i>
              Complete 2FA Now
            </Button>
            {/* Cancel modal button */}
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowUpgradeModal(false)}
              className="py-2 fw-semibold rounded-3"
            >
              Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Orders list - map through each order */}
      {orders.map(order => (
        <Card 
          key={order.id} 
          className={`mb-4 shadow-lg border-0 rounded-4 ${
            order.status === 'cancelled' ? '' : ''
          }`}
          style={{
            // Dynamic styling based on order status
            background: order.status === 'cancelled' 
              ? 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)'  // Red tint for cancelled
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', // Normal for confirmed
            opacity: order.status === 'cancelled' ? 0.8 : 1 // Reduced opacity for cancelled
          }}
        >
          <Card.Body className="p-4">
            <Row>
              {/* Left column - Order details */}
              <Col lg={8}>
                <div className="mb-4">
                  {/* Order header with ID and status */}
                  <div className="d-flex align-items-center mb-3">
                    <h4 className="mb-0 me-3 fw-bold" style={{ color: '#2c3e50' }}>
                      <i className="bi bi-receipt me-2"></i>
                      Order #{order.id}
                    </h4>
                    {/* Status badges with different styling */}
                    {order.status === 'cancelled' && (
                      <Badge 
                        className="px-3 py-2 rounded-pill fs-6"
                        style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancelled
                      </Badge>
                    )}
                    {order.status === 'confirmed' && (
                      <Badge 
                        className="px-3 py-2 rounded-pill fs-6"
                        style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Confirmed
                      </Badge>
                    )}
                  </div>
                  {/* Order date information */}
                  <div className="text-muted mb-4">
                    <i className="bi bi-calendar3 me-2"></i>
                    <strong>Ordered on:</strong> {dayjs(order.orderDate).format('MMMM D, YYYY HH:mm')}
                  </div>
                </div>

                {/* Dish information card */}
                <Card className="mb-4 border-2 rounded-3" style={{ borderColor: '#e9ecef' }}>
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <i 
                          className="bi bi-bowl me-3" 
                          style={{ color: '#e74c3c', fontSize: '1.5rem' }}
                        ></i>
                        <div>
                          <strong style={{ color: '#2c3e50' }}>
                            {order.dishName} - {order.dishSize}
                          </strong>
                        </div>
                      </div>
                      {/* Dish base price */}
                      <div 
                        className="fs-5 fw-bold"
                        style={{ color: '#27ae60' }}
                      >
                        €{order.dishPrice.toFixed(2)}
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Ingredients section - only show if order has ingredients */}
                {order.ingredients.length > 0 && (
                  <Card className="border-2 rounded-3" style={{ borderColor: '#e9ecef' }}>
                    <Card.Header 
                      className="border-0 py-3"
                      style={{ background: 'rgba(39, 174, 96, 0.1)' }}
                    >
                      <div className="d-flex align-items-center">
                        <i 
                          className="bi bi-collection me-2" 
                          style={{ color: '#27ae60', fontSize: '1.2rem' }}
                        ></i>
                        <strong style={{ color: '#2c3e50' }}>Ingredients:</strong>
                        <Badge 
                          className="ms-2 px-2 py-1 rounded-pill"
                          style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}
                        >
                          {order.ingredients.length}
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-3">
                      {/* Map through ingredients with pricing */}
                      {order.ingredients.map((ingredient, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                          <span style={{ color: '#2c3e50' }}>
                            • {ingredient}
                          </span>
                          <span 
                            className="fw-semibold"
                            style={{ color: '#27ae60' }}
                          >
                            €{order.ingredientPrices[index]?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}
              </Col>

              {/* Right column - Total price and actions */}
              <Col lg={4} className="text-end d-flex flex-column justify-content-between">
                <div>
                  {/* Total price display */}
                  <div 
                    className="p-4 mb-4 rounded-3 text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(39, 174, 96, 0.05) 100%)',
                      border: '2px dashed #27ae60'
                    }}
                  >
                    <i 
                      className="bi bi-calculator me-2" 
                      style={{ color: '#27ae60', fontSize: '1.2rem' }}
                    ></i>
                    <div 
                      className="fs-3 fw-bold"
                      style={{ color: '#27ae60' }}
                    >
                      Total: €{order.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Cancel button - only show for confirmed orders */}
                {order.status === 'confirmed' && (
                  <div>
                    <Button 
                      variant={canCancel ? "outline-danger" : "outline-warning"}
                      size="lg"
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-4 py-3 fw-semibold rounded-pill w-100"
                      style={{
                        // Dynamic styling based on user's cancellation capability
                        border: `2px solid ${canCancel ? '#e74c3c' : '#f39c12'}`,
                        color: canCancel ? '#e74c3c' : '#f39c12',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <i className={`bi ${canCancel ? 'bi-x-circle' : 'bi-shield-exclamation'} me-2`}></i>
                      {canCancel ? 'Cancel Order' : 'Cancel Order (Requires 2FA)'}
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export { OrdersList };
