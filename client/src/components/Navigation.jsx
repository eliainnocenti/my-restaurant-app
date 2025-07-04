/* Navigation Component for Restaurant Application */

/* This component provides a responsive navigation bar with user authentication controls. */

import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, Form, Button } from 'react-bootstrap';
import { LoginButton, LogoutButton } from './Auth';

/**
 * Main navigation component for the application header
 * @param {Object} props - Component properties
 * @param {boolean} props.loggedIn - Whether user is authenticated
 * @param {Object} props.user - Current user object with authentication details
 * @param {Function} props.logout - Logout function
 * @param {Function} props.upgradeTo2FA - Function to upgrade user to 2FA
 * @returns {JSX.Element} Navigation bar with authentication controls
 */
const Navigation = (props) => {
  return (
    <Navbar 
      expand="md" 
      variant="dark" 
      className="px-4 py-3 shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      }}
    >
      {/* Restaurant brand and logo */}
      <Navbar.Brand 
        className="fw-bold fs-3"
        style={{ color: 'white' }}
      >
        <i 
          className="bi bi-shop me-3" 
          style={{ color: '#f39c12', fontSize: '2rem' }}
        />
        Restaurant
      </Navbar.Brand>
      
      {/* Right side navigation items */}
      <Nav className="ms-auto align-items-center">
        {/* User authentication status display */}
        <Navbar.Text className="me-4 fs-5 text-light fw-medium">
          {props.user && props.user.name && (
            <>
              <i 
                className={`${props.user.isTotp ? 'bi-shield-fill-check' : 'bi-shield-fill-minus'} me-2`}
                style={{ color: 'white' }}
              />
              {`Logged in ${props.user.isTotp ? '[2FA]' : ''} as: ${props.user.name}`}
            </>
          )}
        </Navbar.Text>
        
        {/* 2FA upgrade button for users with partial authentication */}
        {/* Only show if user is logged in, has 2FA capability, but hasn't completed 2FA */}
        {props.loggedIn && props.user && props.user.canDoTotp && !props.user.isTotp && (
          <Button 
            variant="outline-warning"
            size="sm"
            onClick={props.upgradeTo2FA}
            className="me-3 fw-semibold px-3 py-2 rounded-pill"
            style={{ 
              borderColor: '#f39c12',
              color: '#f39c12',
              borderWidth: '2px'
            }}
          >
            <i className="bi bi-shield-check me-2"></i>
            Complete 2FA
          </Button>
        )}
        
        {/* Login/Logout button based on authentication status */}
        <Form>
          {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
        </Form>
      </Nav>
    </Navbar>
  );
}

export { Navigation };
