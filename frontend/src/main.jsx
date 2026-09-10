import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import { SocketProvider } from './state/SocketContext.jsx';
import { Toaster } from './components/Toaster.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PageErrorBoundary from './components/PageErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <SocketProvider>
            <App />
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
