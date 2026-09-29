import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthPage from './pages/login';
import Sidebar from './components/sidebar';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Payments from './pages/payments';
import TodayVisits from './pages/TodayVisits';
import CheckInLog from './pages/CheckInLog';
import InGym from './pages/InGym';
import Users from './pages/workers';
import Settings from './pages/Settings';
import ClientDetail from './pages/ClientDetail';
import Clock from './pages/Clock';
import BrandIcon from './components/BrandIcon';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('token')
  );
  const [gymName, setGymName] = useState('Iron Temple');
  const [role] = useState(() => localStorage.getItem('role') || 'member');

  useEffect(() => {
    // --- Load gym name from settings ---
    try {
      const s = JSON.parse(localStorage.getItem('gym_settings') || '{}');
      if (s.gymName) setGymName(s.gymName);
    } catch {}

    // --- Auto-logout if the stored token is already expired ---
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* ---- Public: login ---- */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />
          }
        />

        {/* ---- Private: everything else ---- */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <div className="drawer lg:drawer-open min-h-screen bg-base-200">
                <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

                <div className="drawer-content flex flex-col">
                  {/* ---- Mobile top bar ---- */}
                  <header className="lg:hidden sticky top-0 z-30 bg-base-100 border-b border-base-300 px-3 py-2 flex items-center gap-3">
                    <label
                      htmlFor="sidebar-toggle"
                      className="btn btn-sm btn-ghost btn-square drawer-button"
                      aria-label="Open menu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    </label>

                    <BrandIcon className="w-4 h-4" />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm">{gymName}</p>
                    </div>

                    <div className="badge badge-primary badge-sm capitalize">{role}</div>
                  </header>

                  {/* ---- Page content ---- */}
                  <main className="p-4 min-h-screen">
                    <Routes>
                      <Route path="/"             element={<Home />} />
                      <Route path="/in-gym"       element={<InGym />} />
                      <Route path="/clients"      element={<Clients />} />
                      <Route path="/clients/:id"  element={<ClientDetail />} />
                      <Route path="/payments"     element={<Payments />} />
                      <Route path="/today"        element={<TodayVisits />} />
                      <Route path="/history"      element={<CheckInLog />} />
                      <Route path="/users"        element={<Users />} />
                      <Route path="/settings"     element={<Settings />} />
                      <Route path="/clock"        element={<Clock />} />
                      <Route path="*"             element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>

                <Sidebar onLogout={handleLogout} gymName={gymName} />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;