import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Login from './Login.jsx';
import UserHome from './UserHome.jsx';
import DentistHome from './DenstistHome.jsx';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);

  const handleLogin = (newToken, userRole) => {
    setToken(newToken);
    setRole(userRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', userRole);
    try {
      const decoded = window.jwt_decode(newToken);
      localStorage.setItem('userId', decoded.id);
      console.log('Stored userId:', decoded.id);
    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  };
console.log("the userid is ",localStorage.getItem('userId'))
  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  if (role === 'user') {
    return <UserHome onLogout={handleLogout} />;
  }

  if (role === 'dentist') {
    return <DentistHome onLogout={handleLogout} />;
  }

  return null;
};



export default App;