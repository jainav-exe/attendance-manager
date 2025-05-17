import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  // Simple auth state management (replace with proper auth later)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Protected route wrapper component
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    if (requireAdmin && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <div className="app">
        {/* Show navbar only on authenticated routes */}
        {isAuthenticated && <Navbar onLogout={() => setIsAuthenticated(false)} />}
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Login 
                  onLogin={(isAdmin) => {
                    setIsAuthenticated(true);
                    setIsAdmin(isAdmin);
                  }} 
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
