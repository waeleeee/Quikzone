import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (!isLoggedIn || !currentUser) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute; 
