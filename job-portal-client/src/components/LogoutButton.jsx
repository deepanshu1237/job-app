import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = ({ className = '' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('companyEmail');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className={`bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition ${className}`}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
