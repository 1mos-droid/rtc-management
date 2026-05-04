import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { WorkspaceProvider } from './context/WorkspaceProvider';
import { AuthProvider } from './context/AuthProvider';
import './index.css';

// 🌿 Font Loading Optimization
// Switches media from 'print' to 'all' once the page starts loading to prevent FOUC
// and satisfy strict Content Security Policy (CSP).
const fontSheet = document.getElementById('font-stylesheet');
if (fontSheet) {
  fontSheet.media = 'all';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <App />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
