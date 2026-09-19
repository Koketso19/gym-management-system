import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/Navbar';
import TableList from '../components/TableList';
import ClientModal from '../components/ClientModal';

const API_URL = import.meta.env.VITE_API_URL;

export default function Clients() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All | Paid | Unpaid | InGym
  const [clientData, setClientData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- auth header (JWT) ----
  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // ---- fetch clients ----
  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/api/clients/list`, authHeader());
      const list = response.data.clients || [];
      setTableData(list);
      console.log('Fetched clients:', list.length);
    } catch (err) {
      console.error('Error fetching clients:', err.message);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpen = (mode, client) => {
    setClientData(client);
    setModalMode(mode);
    setIsOpen(true);
  };

  // ---- create / update ----
  const handleSubmit = async (newClientData) => {
    try {
      if (modalMode === 'add') {
        await axios.post(
          `${API_URL}/api/clients/create`,
          newClientData,
          authHeader()
        );
      } else {
        await axios.post(
          `${API_URL}/api/clients/update`,
          { id: clientData._id, ...newClientData },
          authHeader()
        );
      }
      setIsOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error submitting client data:', error);
      alert(error.response?.data?.message || 'Failed to save client');
    }
  };

  // ---- delete ----
  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await axios.post(
        `${API_URL}/api/clients/delete`,
        { id: clientId },
        authHeader()
      );
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  // ---- mark paid / unpaid ----
  const handleMarkPaid = async (clientId) => {
    try {
      await axios.post(
        `${API_URL}/api/clients/mark-paid`,
        { id: clientId },
        authHeader()
      );
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark paid');
    }
  };

  const handleMarkUnpaid = async (clientId) => {
    try {
      await axios.post(
        `${API_URL}/api/clients/mark-unpaid`,
        { id: clientId },
        authHeader()
      );
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark unpaid');
    }
  };

  // ---- check in / check out ----
  const handleCheckIn = async (clientId) => {
    try {
      await axios.post(
        `${API_URL}/api/clients/checkin`,
        { id: clientId },
        authHeader()
      );
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check in');
    }
  };

  const handleCheckOut = async (clientId) => {
    try {
      await axios.post(
        `${API_URL}/api/clients/checkout`,
        { id: clientId },
        authHeader()
      );
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check out');
    }
  };

  // ---- client-side filter + search ----
  const filteredData = tableData.filter((c) => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const hay = `${c.FirstName} ${c.LastName} ${c.UserID} ${c.email} ${c.phone}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (filterStatus === 'Paid'   && c.payment?.status !== 'Paid')   return false;
    if (filterStatus === 'Unpaid' && c.payment?.status !== 'Unpaid') return false;
    if (filterStatus === 'InGym'  && !c.currentlyInGym)              return false;
    return true;
  });

  return (
    <>
      <NavBar
        title="Clients"
        onOpen={() => handleOpen('add')}
        onSearch={setSearchTerm}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3">
        {['All', 'Paid', 'Unpaid', 'InGym'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-1 rounded-full text-sm border ${
              filterStatus === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto text-sm text-gray-500">
          {filteredData.length} / {tableData.length}
        </div>
      </div>

      {loading && <p className="p-4 text-gray-500">Loading clients…</p>}
      {error   && <p className="p-4 text-red-500">{error}</p>}

      {!loading && !error && (
        <TableList
          tableData={filteredData}
          handleOpen={handleOpen}
          handleDelete={handleDelete}
          handleMarkPaid={handleMarkPaid}
          handleMarkUnpaid={handleMarkUnpaid}
          handleCheckIn={handleCheckIn}
          handleCheckOut={handleCheckOut}
        />
      )}

      {isOpen && (
        <ClientModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          OnSubmit={handleSubmit}
          mode={modalMode}
          clientData={clientData}
        />
      )}
    </>
  );
}