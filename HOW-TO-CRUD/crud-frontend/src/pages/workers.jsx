import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function Workers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editUser, setEditUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    userGroup: 'Administrators',
  });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/list`, authHeader());
      setUsers(res.data.users || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setModalMode('add');
    setEditUser(null);
    setForm({ username: '', password: '', firstName: '', lastName: '', userGroup: 'Administrators' });
    setIsModalOpen(true);
  };

  const openEdit = (u) => {
    setModalMode('edit');
    setEditUser(u);
    setForm({
      username: u.UserID,
      password: '',
      firstName: u.FirstName,
      lastName: u.LastName,
      userGroup: (u.UserGroup && u.UserGroup[0]) || 'Administrators',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await axios.post(`${API_URL}/api/users/create`, {
          username: form.username,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          userGroup: [form.userGroup],
        }, authHeader());
      } else {
        const body = {
          id: editUser._id,
          firstName: form.firstName,
          lastName: form.lastName,
          userGroup: [form.userGroup],
        };
        if (form.password) body.password = form.password;
        await axios.post(`${API_URL}/api/users/update`, body, authHeader());
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.UserID}"?`)) return;
    try {
      await axios.post(`${API_URL}/api/users/delete`, { id: u._id }, authHeader());
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = users.filter((u) => {
    const t = searchTerm.toLowerCase();
    return (
      u.UserID?.toLowerCase().includes(t) ||
      u.FirstName?.toLowerCase().includes(t) ||
      u.LastName?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff / Admins</h1>
          <p className="text-sm text-base-content/60">
            Users who can log in to the management system
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search by username, first or last name…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered input-sm w-full max-w-md"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
      {error && !loading && (
        <div className="alert alert-error"><span>{error}</span></div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <table className="table w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Groups</th>
                <th>Created</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="hover">
                  <td className="font-medium">{u.UserID}</td>
                  <td>{u.FirstName} {u.LastName}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(u.UserGroup || []).map((g) => (
                        <span key={g} className="badge badge-outline badge-sm">{g}</span>
                      ))}
                    </div>
                  </td>
                  <td className="text-xs opacity-70">{u.CreateDate || '—'}</td>
                  <td className="text-xs opacity-70">{u.LastUpdate || '—'}</td>
                  <td className="flex gap-1">
                    <button className="btn btn-xs btn-outline btn-info" onClick={() => openEdit(u)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-xs btn-outline btn-error"
                      onClick={() => handleDelete(u)}
                      disabled={u.UserID === 'admin'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-base-content/60">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {modalMode === 'add' ? 'Add User' : `Edit ${editUser?.UserID}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label"><span className="label-text">Username</span></label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={modalMode === 'edit'}
                  required={modalMode === 'add'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><span className="label-text">First Name</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label"><span className="label-text">Last Name</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">
                    Password {modalMode === 'edit' && '(leave blank to keep current)'}
                  </span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={modalMode === 'add'}
                />
              </div>

              <div>
                <label className="label"><span className="label-text">Group</span></label>
                <select
                  className="select select-bordered w-full"
                  value={form.userGroup}
                  onChange={(e) => setForm({ ...form, userGroup: e.target.value })}
                >
                  <option value="Administrators">Administrators</option>
                  <option value="Managers">Managers</option>
                  <option value="Trainers">Trainers</option>
                </select>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
}