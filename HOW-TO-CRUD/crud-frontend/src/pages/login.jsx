import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const AuthPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // ---- password change required? ----
      if (data.requiresPasswordChange) {
        alert('Password change required — contact your admin.');
        return;
      }

      // ---- save auth state ----
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role || 'admin');
      localStorage.setItem('user', JSON.stringify(data.user || {}));

      console.log('Login OK — role:', data.role);

      onLogin();
      // App.jsx will redirect based on role
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="max-w-md w-full bg-base-100 p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏋️</div>
          <h2 className="text-2xl font-bold">Gym Login</h2>
          <p className="text-sm text-base-content/60">
            Admins and members use the same login
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
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
            className="input input-bordered w-full"
          />
          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;