import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Show a user-friendly error message
  root.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Something went wrong</h1><p>Please try refreshing the page.</p></div>';
} 