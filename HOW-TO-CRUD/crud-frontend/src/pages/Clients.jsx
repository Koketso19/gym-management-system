import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/Navbar';
import TableList from '../components/TableList';


const API_URL = import.meta.env.VITE_API_URL;

export default function Clients() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientData, setClientData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [properties, setProperties] = useState([]); // Add this for property selection

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients`);
      console.log('Fetched clients:', response.data);
      setTableData(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err.message);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/properties`);
      setProperties(response.data);
    } catch (err) {
      console.error('Error fetching properties:', err.message);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchProperties();
  }, []);

  const handleOpen = (mode, client) => {
    setClientData(client);
    setModalMode(mode);
    setIsOpen(true);
  };

  const handleSubmit = async (newClientData) => {
    try {
      if (modalMode === 'add') {
        const response = await axios.post(`${API_URL}/api/clients`, newClientData);
        setTableData((prevData) => [...prevData, response.data]);
      } else {
        const response = await axios.put(`${API_URL}/api/clients/${clientData._id}`, newClientData);
        setTableData((prevData) =>
          prevData.map((client) =>
            client._id === clientData._id ? response.data : client
          )
        );
      }
      setIsOpen(false);
      fetchClients(); // Refresh after submit
    } catch (error) {
      console.error('Error submitting client data:', error);
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`${API_URL}/api/clients/${clientId}`);
        fetchClients(); // Refresh after delete
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <>
      <NavBar 
        title="Clients" 
        onOpen={() => handleOpen('add')} 
        onSearch={setSearchTerm} 
      />
      <TableList
        tableData={tableData}
        handleOpen={handleOpen}
        handleDelete={handleDelete}
        searchTerm={searchTerm}
      />
      <ClientModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        OnSubmit={handleSubmit}
        mode={modalMode}
        clientData={clientData}
        properties={properties}
      />
    </>
  );
}