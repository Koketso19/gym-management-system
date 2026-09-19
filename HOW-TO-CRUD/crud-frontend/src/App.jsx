import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthPage from './pages/login';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Payments from './pages/payments';
import TodayVisits from './pages/TodayVisits';
import CheckInLog from './pages/CheckInLog';
import Users from './pages/workers';
import Settings from './pages/Settings';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  return (
    <Router>
      <Routes>
        {/* Login */}
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
                      <Route path="/"          element={<Home />} />
                      <Route path="/in-gym"    element={<Home />} />
                      <Route path="/clients"   element={<Clients />} />
                      <Route path="/payments"  element={<Payments />} />
                      <Route path="/today"     element={<TodayVisits />} />
                      <Route path="/history"   element={<CheckInLog />} />
                      <Route path="/users"     element={<Users />} />
                      <Route path="/settings"  element={<Settings />} />
                      <Route path="*"          element={<Navigate to="/" />} />
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