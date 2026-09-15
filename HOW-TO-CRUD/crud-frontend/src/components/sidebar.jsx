import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Optional, if you use token-based auth
    onLogout();
    navigate('/login');
  };

  return (
    <div className="drawer-side">
      <label htmlFor="sidebar-toggle" className="drawer-overlay"></label>
      <aside className="menu p-4 w-64 min-h-full bg-base-100 text-base-content">
        <h2 className="text-lg font-bold mb-4">Dashboard</h2>
        <ul className="menu">
          <li><NavLink to="/properties">🏠 Properties</NavLink></li>
          <li><NavLink to="/clients">👥 Add Clients</NavLink></li>
          <li><NavLink to="/rooms">🛏️ Room Numbers</NavLink></li>
          <li><NavLink to="/date-management">🗓️ Date Management</NavLink></li>
          <li><NavLink to="/events">📅 Events</NavLink></li>
          <li><NavLink to="/workers">👷 Workers</NavLink></li>
          <li><NavLink to="/payments">💰 Payments</NavLink></li>
          <li>
            <button onClick={handleLogout} className="text-left w-full">
              🚪 Logout
            </button>
          </li>
        </ul>
      </aside>
    </div>
  );
};

export default Sidebar;




