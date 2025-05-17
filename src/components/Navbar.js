import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin">Admin</Link>
        </div>
        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar; 