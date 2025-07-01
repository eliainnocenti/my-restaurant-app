/**
 * Authentication Components
 * 
 * Provides comprehensive authentication interface including:
 * - LoginButton & LogoutButton: Navigation authentication controls
 * - LoginForm: Username/password authentication with validation
 * - TotpForm: Two-factor authentication with TOTP code verification
 * - Modal-based 2FA skip confirmation with feature limitations explanation
 * 
 * Implements responsive design with Bootstrap components and handles
 * various authentication states and error conditions gracefully.
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

import { useState } from 'react';
import { Form, Button, Alert, Col, Row, Card, Container, Modal } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router';
import API from '../API.js';

/**
 * Login button for navigation bar
 * Navigates to login page when clicked
 * @returns {JSX.Element} Styled login button
 */
function LoginButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline-light"
      onClick={() => navigate('/login')}
      className="fw-semibold px-4 py-2 rounded-pill"
      style={{ transition: 'all 0.3s ease', border: '2px solid white' }}
    >
      <i className="bi bi-box-arrow-in-right me-2"></i>
      Login
    </Button>
  );
}

/**
 * Logout button for navigation bar
 * Calls logout function when clicked
 * @param {Object} props - Component properties
 * @param {Function} props.logout - Logout handler function
 * @returns {JSX.Element} Styled logout button
 */
function LogoutButton(props) {
  return (
    <Button
      variant="outline-light"
      onClick={props.logout}
      className="fw-semibold px-4 py-2 rounded-pill"
      style={{ transition: 'all 0.3s ease', border: '2px solid white' }}
    >
      <i className="bi bi-box-arrow-right me-2"></i>
      Logout
    </Button>
  );
}

/**
 * Login form component for username/password authentication
 * Provides full-page login interface with validation and error handling
 * @param {Object} props - Component properties
 * @param {Function} props.login - Login handler function that returns a promise
 * @param {Object} props.user - Current user object (for 2FA upgrade flow)
 * @returns {JSX.Element} Full-page login form
 */
function LoginForm(props) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if this is a 2FA completion request
  const require2fa = searchParams.get('require2fa') === 'true';
  const prefilledUsername = searchParams.get('username') || '';
  
  // If user is already logged in and this is 2FA upgrade, use their username
  const effectiveUsername = require2fa && props.user?.username ? props.user.username : prefilledUsername;
  
  // Debug logging
  console.log('LoginForm - require2fa:', require2fa);
  console.log('LoginForm - prefilledUsername:', prefilledUsername);
  console.log('LoginForm - user:', props.user);
  console.log('LoginForm - effectiveUsername:', effectiveUsername);
  
  // Form state management
  const [username, setUsername] = useState(effectiveUsername);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Handle login API call with error handling
   * @param {Object} credentials - Username and password object
   */
  const doLogIn = ({ username, password }) => {
    props
      .login({ username, password })
      .then(() => setErrorMessage('')) // Clear errors on success
      .catch((err) => setErrorMessage(err.error || 'Wrong username or password'));
  };

  /**
   * Handle form submission with validation
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!username || !password) {
      setErrorMessage('Please fill all the fields');
      return;
    }
    
    // Attempt login
    doLogIn({ username, password });
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Card
            className="shadow-lg border-0"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
            }}
          >
            <Card.Body className="p-5">
              {/* Login form header */}
              <div className="text-center mb-4">
                <i className="bi bi-person-circle" style={{ fontSize: '4rem', color: '#2c3e50' }}></i>
                <h2 className="mt-3 mb-2 fw-bold" style={{ color: '#2c3e50' }}>
                  {require2fa ? 'Complete 2FA Setup' : 'Welcome Back'}
                </h2>
                <p className="text-muted">
                  {require2fa 
                    ? 'Please re-authenticate to enable two-factor authentication' 
                    : 'Please sign in to your account'}
                </p>
                {require2fa && (
                  <Alert variant="info" className="mt-3 border-0 rounded-3" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
                    <i className="bi bi-info-circle me-2"></i>
                    You'll need to complete 2FA to access all features
                    {effectiveUsername && (
                      <div className="mt-2">
                        <strong>Username: {effectiveUsername}</strong>
                      </div>
                    )}
                  </Alert>
                )}
              </div>

              <Form onSubmit={handleSubmit}>
                {/* Error message display */}
                {errorMessage && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setErrorMessage('')}
                    className="border-0 rounded-3"
                    style={{ background: 'rgba(220, 53, 69, 0.1)' }}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errorMessage}
                  </Alert>
                )}

                {/* Username input field */}
                <Form.Group controlId="username" className="mb-4">
                  <Form.Label className="fw-semibold" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-person me-2"></i>Username
                    {require2fa && effectiveUsername && <span className="text-muted ms-2">(locked for 2FA completion)</span>}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="py-3 rounded-3 border-2"
                    style={{ 
                      borderColor: '#e9ecef', 
                      transition: 'all 0.3s ease',
                      backgroundColor: (require2fa && effectiveUsername) ? '#f8f9fa' : 'white',
                      cursor: (require2fa && effectiveUsername) ? 'not-allowed' : 'text'
                    }}
                    readOnly={require2fa && effectiveUsername}
                    disabled={require2fa && effectiveUsername}
                  />
                  {require2fa && effectiveUsername && (
                    <Form.Text className="text-muted">
                      <i className="bi bi-lock me-1"></i>
                      Username is locked for 2FA completion
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Password input field */}
                <Form.Group controlId="password" className="mb-4">
                  <Form.Label className="fw-semibold" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-lock me-2"></i>Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="py-3 rounded-3 border-2"
                    style={{ borderColor: '#e9ecef', transition: 'all 0.3s ease' }}
                  />
                </Form.Group>

                {/* Form action buttons */}
                <div className="d-grid gap-3 mt-4">
                  {/* Submit button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="py-3 fw-semibold rounded-3"
                    style={{ 
                      background: require2fa 
                        ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                        : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      border: 'none', 
                      transition: 'all 0.3s ease' 
                    }}
                  >
                    <i className={`bi ${require2fa ? 'bi-shield-check' : 'bi-box-arrow-in-right'} me-2`}></i>
                    {require2fa ? 'Sign In for 2FA' : 'Sign In'}
                  </Button>
                  {/* Back to menu button */}
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/')} 
                    className="py-3 fw-semibold rounded-3"
                  >
                    <i className="bi bi-arrow-left me-2"></i>Back to Menu
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

/**
 * TOTP (Two-Factor Authentication) form component
 * Handles TOTP code verification with option to skip 2FA
 * @param {Object} props - Component properties
 * @param {Function} props.totpSuccessful - Handler for successful TOTP verification
 * @param {Function} props.skipTotpSuccessful - Handler for skipping TOTP verification
 * @returns {JSX.Element} TOTP verification form with skip option
 */
function TotpForm(props) {
  // Form and modal state management
  const [totpCode, setTotpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const navigate = useNavigate();

  /**
   * Handle TOTP verification API call
   * Verifies the 6-digit TOTP code with the server
   */
  const doTotpVerify = () => {
    API.totpVerify(totpCode)
      .then(() => props.totpSuccessful()) // Success - upgrade to full authentication
      .catch(() => setErrorMessage('Wrong code, please try again')); // Error handling
  };

  /**
   * Handle skipping 2FA verification
   * Allows user to proceed with partial authentication
   */
  const handleSkip2FA = () => {
    API.skipTotp()
      .then(() => props.skipTotpSuccessful()) // Success - partial authentication
      .catch(() => setErrorMessage('Failed to skip 2FA. Please try again.')); // Error handling
  };

  /**
   * Handle form submission with validation
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate TOTP code length (must be exactly 6 digits)
    if (totpCode.length === 6) {
      doTotpVerify();
    } else {
      setErrorMessage('Invalid content: code must be 6 digits');
    }
  };

  return (
    <>
      {/* Skip 2FA confirmation modal */}
      <Modal show={showSkipConfirmation} onHide={() => setShowSkipConfirmation(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Skip Two-Factor Authentication?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You can proceed without 2FA, but you'll have <strong>limited access</strong>:
          </p>
          {/* Feature limitations list */}
          <ul>
            <li><i className="bi bi-check2 text-success me-2"></i>Browse menu and create orders</li>
            <li><i className="bi bi-x text-danger me-2"></i>Cannot cancel orders</li>
          </ul>
          <p>You can complete 2FA authentication later to unlock all features.</p>
        </Modal.Body>
        <Modal.Footer>
          {/* Modal action buttons */}
          <Button onClick={handleSkip2FA} className="fw-semibold">
            Continue without 2FA
          </Button>
          <Button variant="secondary" onClick={() => setShowSkipConfirmation(false)}>
            Back to 2FA
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Main TOTP form */}
      <Container
        fluid
        className="vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card
              className="shadow-lg border-0"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
              }}
            >
              <Card.Body className="p-5">
                {/* TOTP form header */}
                <div className="text-center mb-4">
                  <i className="bi bi-phone" style={{ fontSize: '4rem', color: '#f39c12' }}></i>
                  <h3 className="mt-3 mb-2 fw-bold" style={{ color: '#2c3e50' }}>
                    Two-Factor Authentication
                  </h3>
                  <p className="text-muted">Enter the 6-digit code from your authenticator app</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  {/* Error message display */}
                  {errorMessage && (
                    <Alert
                      variant="danger"
                      dismissible
                      onClose={() => setErrorMessage('')}
                      className="border-0 rounded-3"
                      style={{ background: 'rgba(220, 53, 69, 0.1)' }}
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {errorMessage}
                    </Alert>
                  )}

                  {/* TOTP code input field */}
                  <Form.Group controlId="totpCode" className="mb-4">
                    <Form.Label className="fw-semibold" style={{ color: '#2c3e50' }}>
                      <i className="bi bi-key me-2"></i>Verification Code
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="text-center py-3 rounded-3 border-2"
                      style={{ 
                        fontSize: '1.5rem', 
                        letterSpacing: '0.3rem', 
                        borderColor: '#e9ecef' 
                      }}
                      maxLength={6} // Restrict input to 6 characters
                    />
                  </Form.Group>

                  {/* Form action buttons */}
                  <div className="d-grid gap-3">
                    {/* Verify TOTP code button */}
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="py-3 fw-semibold rounded-3" 
                      style={{ 
                        background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', 
                        border: 'none' 
                      }}
                    >
                      <i className="bi bi-check-circle me-2"></i>Verify Code
                    </Button>

                    {/* Skip 2FA button */}
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setShowSkipConfirmation(true)} 
                      className="py-3 fw-semibold rounded-3"
                    >
                      <i className="bi bi-skip-forward me-2"></i>Skip 2FA
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export { LoginButton, LogoutButton, LoginForm, TotpForm };
