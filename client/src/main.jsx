/**
 * Application entry point
 * Sets up React root with routing and strict mode
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router';
import App from './App.jsx'

// Create and render the React application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables client-side routing */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
