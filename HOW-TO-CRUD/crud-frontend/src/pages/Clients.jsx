import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/Navbar';
import TableList from '../components/TableList';
import ClientModal from '../components/ClientModal';
import LedgerModal from '../components/LedgerModal';

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

  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerClient, setLedgerClient] = useState(null);

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

  // ---- mark paid (record full monthly payment) ----
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

const handleRefund = async (clientId) => {
  const reason = window.prompt(
    'Reason for refund?',
    'Marked Paid by mistake'
  );
  if (reason === null) return;

  try {
    const res = await axios.post(
      `${API_URL}/api/clients/reverse-payment`,
      { id: clientId, reason },
      authHeader()
    );
    console.log('refund success:', res.status, res.data);
    fetchClients();
  } catch (err) {
    console.error('=== REFUND ERROR ===');
    console.error('status  :', err.response?.status);
    console.error('data    :', err.response?.data);
    console.error('message :', err.message);
    console.error('url     :', err.config?.url);
    console.error('headers :', err.config?.headers);
    console.error('payload :', err.config?.data);

    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'unknown';
    alert(`Refund failed (${err.response?.status || 'no status'}): ${msg}`);
  }
};

  // ---- ledger modal ----
  const handleLedger = (client) => {
    setLedgerClient(client);
    setLedgerOpen(true);
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
      {error && <p className="p-4 text-red-500">{error}</p>}

      {!loading && !error && (
        <TableList
          tableData={filteredData}
          handleOpen={handleOpen}
          handleMarkPaid={handleMarkPaid}
          handleRefund={handleRefund}
          handleLedger={handleLedger}
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

      {ledgerOpen && (
        <LedgerModal
          isOpen={ledgerOpen}
          onClose={() => setLedgerOpen(false)}
          client={ledgerClient}
        />
      )}
    </>
  );
}