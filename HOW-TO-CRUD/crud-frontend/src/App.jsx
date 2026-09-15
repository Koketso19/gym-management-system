import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthPage from './pages/login';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import Clients from './pages/Clients';
import DateManagement from './pages/DateManagement';
import Events from './pages/events';
import Payments from './pages/payments';
import Rooms from './pages/Rooms';
import Properties from './pages/properties';
import Workers from './pages/workers';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <AuthPage onLogin={handleLogin} />
          }
        />

        {/* Protected App */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <div className="drawer lg:drawer-open min-h-screen bg-base-200">
                <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

                <div className="drawer-content flex flex-col">
                  <label
                    htmlFor="sidebar-toggle"
                    className="btn btn-primary drawer-button lg:hidden m-4"
                  >
                    Open Sidebar
                  </label>

                  <div className="p-4 min-h-screen">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/date-management" element={<DateManagement />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/workers" element={<Workers />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/properties" element={<Properties />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </div>
                </div>

                <Sidebar />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
