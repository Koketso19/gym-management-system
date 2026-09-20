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

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gymName, setGymName] = useState('Iron Temple Gym');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // load gym name from settings (localStorage for now)
    try {
      const s = JSON.parse(localStorage.getItem('gym_settings') || '{}');
      if (s.gymName) setGymName(s.gymName);
    } catch {}
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <AuthPage onLogin={handleLogin} />
          }
        />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <div className="drawer lg:drawer-open min-h-screen bg-base-200">
                <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

                <div className="drawer-content flex flex-col">
                  {/* ---- Mobile top bar ---- */}
                  <header className="lg:hidden sticky top-0 z-30 bg-base-100 border-b border-base-300 px-4 py-3 flex items-center gap-3">
                    <label
                      htmlFor="sidebar-toggle"
                      className="btn btn-sm btn-ghost btn-square drawer-button"
                      aria-label="Open menu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    </label>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">🏋️ {gymName}</p>
                    </div>
                    <div className="badge badge-primary badge-sm">Admin</div>
                  </header>

                  {/* ---- Page content ---- */}
                  <main className="p-4 min-h-screen">
                    <Routes>
                      <Route path="/"          element={<Home />} />
                      <Route path="/in-gym"    element={<InGym />} />
                      <Route path="/clients"   element={<Clients />} />
                      <Route path="/payments"  element={<Payments />} />
                      <Route path="/today"     element={<TodayVisits />} />
                      <Route path="/history"   element={<CheckInLog />} />
                      <Route path="/users"     element={<Users />} />
                      <Route path="/settings"  element={<Settings />} />
                      <Route path="*"          element={<Navigate to="/" />} />
                    </Routes>
                  </main>
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