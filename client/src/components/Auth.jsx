/**
 * Authentication components for login and TOTP verification
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

import { useState } from 'react';
import { Form, Button, Alert, Col, Row, Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import API from '../API.js';

function LoginButton() {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="outline-light" 
      onClick={() => navigate('/login')}
      className="fw-semibold px-4 py-2 rounded-pill"
      style={{ 
        transition: 'all 0.3s ease',
        border: '2px solid white'
      }}
    >
      <i className="bi bi-box-arrow-in-right me-2"></i>
      Login
    </Button>
  );
}

function LogoutButton(props) {
  return (
    <Button 
      variant="outline-light" 
      onClick={props.logout}
      className="fw-semibold px-4 py-2 rounded-pill"
      style={{ 
        transition: 'all 0.3s ease',
        border: '2px solid white'
      }}
    >
      <i className="bi bi-box-arrow-right me-2"></i>
      Logout
    </Button>
  );
}

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const doLogIn = (credentials) => {
    props.login(credentials)
      .then(() => {
        setErrorMessage('');
        // Don't navigate here - let the parent component handle routing
        // Navigation will happen automatically based on authentication state
      })
      .catch((err) => {
        if (err.error) {
          setErrorMessage(err.error);
        } else {
          setErrorMessage('Wrong username or password');
        }
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');
    const credentials = { username, password };

    if (username === '' || password === '') {
      setErrorMessage('Please fill all the fields');
    } else {
      doLogIn(credentials);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh'
      }}
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Card 
            className="shadow-lg border-0"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px'
            }}
          >
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i 
                  className="bi bi-person-circle" 
                  style={{ fontSize: '4rem', color: '#2c3e50' }}
                ></i>
                <h2 className="mt-3 mb-2 fw-bold" style={{ color: '#2c3e50' }}>
                  Welcome Back
                </h2>
                <p className="text-muted">Please sign in to your account</p>
              </div>

              <Form onSubmit={handleSubmit}>
                {errorMessage && (
                  <Alert 
                    variant='danger' 
                    dismissible 
                    onClick={() => setErrorMessage('')}
                    className="border-0 rounded-3"
                    style={{ background: 'rgba(220, 53, 69, 0.1)' }}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errorMessage}
                  </Alert>
                )}
                
                <Form.Group controlId='username' className="mb-4">
                  <Form.Label className="fw-semibold" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-person me-2"></i>
                    Username
                  </Form.Label>
                  <Form.Control 
                    type='text' 
                    value={username} 
                    onChange={ev => setUsername(ev.target.value)}
                    placeholder="Enter your username"
                    className="py-3 rounded-3 border-2"
                    style={{ 
                      borderColor: '#e9ecef',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
                
                <Form.Group controlId='password' className="mb-4">
                  <Form.Label className="fw-semibold" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-lock me-2"></i>
                    Password
                  </Form.Label>
                  <Form.Control 
                    type='password' 
                    value={password} 
                    onChange={ev => setPassword(ev.target.value)}
                    placeholder="Enter your password"
                    className="py-3 rounded-3 border-2"
                    style={{ 
                      borderColor: '#e9ecef',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
                
                <div className="d-grid gap-3 mt-4">
                  <Button 
                    type='submit' 
                    size="lg"
                    className="py-3 fw-semibold rounded-3"
                    style={{
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                      border: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </Button>
                  <Button 
                    variant='outline-secondary' 
                    onClick={() => navigate('/')}
                    className="py-3 fw-semibold rounded-3"
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Menu
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

function TotpForm(props) {
  const [totpCode, setTotpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const doTotpVerify = () => {
    API.totpVerify(totpCode)
      .then(() => {
        setErrorMessage('');
        props.totpSuccessful(); // This will handle navigation
      })
      .catch(() => {
        setErrorMessage('Wrong code, please try again');
      })
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');

    let valid = true;
    if (totpCode === '' || totpCode.length !== 6)
      valid = false;

    if (valid) {
      doTotpVerify(totpCode);
    } else {
      setErrorMessage('Invalid content in form: either empty or not 6-char long');
    }
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh'
      }}
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Card 
            className="shadow-lg border-0"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px'
            }}
          >
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i 
                  className="bi bi-phone" 
                  style={{ fontSize: '4rem', color: '#f39c12' }}
                ></i>
                <h3 className="mt-3 mb-2 fw-bold" style={{ color: '#2c3e50' }}>
                  Two-Factor Authentication
                </h3>
                <p className="text-muted">Enter the 6-digit code from your authenticator app</p>
              </div>

              <Form onSubmit={handleSubmit}>
                {errorMessage && (
                  <Alert 
                    variant='danger' 
                    dismissible 
                    onClick={() => setErrorMessage('')} 
                    className="border-0 rounded-3"
                    style={{ background: 'rgba(220, 53, 69, 0.1)' }}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errorMessage}
                  </Alert>
                )}
                
                <Form.Group controlId='totpCode' className="mb-4">
                  <Form.Label className="fw-semibold" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-key me-2"></i>
                    Verification Code
                  </Form.Label>
                  <Form.Control 
                    type='text' 
                    value={totpCode} 
                    onChange={ev => setTotpCode(ev.target.value)}
                    placeholder="Enter 6-digit code"
                    className="text-center py-3 rounded-3 border-2"
                    style={{
                      fontSize: '1.5rem', 
                      letterSpacing: '0.3rem',
                      borderColor: '#e9ecef'
                    }}
                    maxLength={6}
                  />
                </Form.Group>
                
                <div className="d-grid gap-3">
                  <Button 
                    type='submit' 
                    size="lg"
                    className="py-3 fw-semibold rounded-3"
                    style={{
                      background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Verify Code
                  </Button>
                  <Button 
                    variant='outline-secondary' 
                    onClick={() => navigate('/login')}
                    className="py-3 fw-semibold rounded-3"
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Login
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

export { LoginButton, LogoutButton, LoginForm, TotpForm };
