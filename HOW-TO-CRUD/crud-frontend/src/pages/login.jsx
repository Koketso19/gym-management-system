import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';

const API_URL = import.meta.env.VITE_API_URL;

const AuthPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid username or password');
      }

      // Password change required (admins only)
      if (data.requiresPasswordChange) {
        alert('Password change required — contact your admin.');
        return;
      }

      // Decode JWT to enrich the stored user object
      let jwtPayload = {};
      try {
        jwtPayload = JSON.parse(atob(data.token.split('.')[1]));
      } catch (e) {
        console.warn('Could not decode JWT payload', e);
      }

      const normalizedUser = {
        ...(data.user || {}),
        ...jwtPayload,
        UserID: (
          data.user?.UserID ||
          data.user?.username ||
          jwtPayload.username ||
          ''
        ).toLowerCase(),
        username: data.user?.username || jwtPayload.username || '',
      };

      // Save auth state
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role || 'member');
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      onLogin();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="max-w-md w-full bg-base-100 p-6 md:p-8 rounded-2xl shadow-lg">
        {/* Brand + heading */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Gym Login</h2>
          <p className="text-sm text-base-content/60">
            Admins and members use the same login
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
            disabled={busy}
            className="input input-bordered w-full"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
            disabled={busy}
            className="input input-bordered w-full"
          />
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={busy}
          >
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;