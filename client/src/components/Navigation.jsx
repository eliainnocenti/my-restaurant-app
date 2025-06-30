/**
 * Navigation component for the Restaurant application
 * Shows brand, user info, and login/logout functionality
 */

// TODO: review completely this file: remove unused code, simplify where possible, ensure best practices and add comments

import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, Form } from 'react-bootstrap';
import { LoginButton, LogoutButton } from './Auth';

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
      
      <Nav className="ms-auto align-items-center">
        <Navbar.Text className="me-4 fs-5 text-light fw-medium">
          {props.user && props.user.name && 
          `Logged in ${props.user.isTotp ? '(2FA)' : ''} as: ${props.user.name}`}
        </Navbar.Text>
        <Form>
          {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
        </Form>
      </Nav>
    </Navbar>
  );
}

export { Navigation };
