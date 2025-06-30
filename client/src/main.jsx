/**
 * React Application Entry Point
 * 
 * Initializes the React application with:
 * - StrictMode for development warnings and checks
 * - BrowserRouter for client-side routing
 * - Root component mounting
 * 
 * Serves as the bootstrap point for the entire frontend application.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router';
import App from './App.jsx'

// Create and render the React application
// StrictMode enables additional checks and warnings during development
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables client-side routing with HTML5 history API */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
