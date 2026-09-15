import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';      // for Add button + Search input
import TableList from '../components/TableList'; // table showing workers, delete, edit buttons
import ModalForm from '../components/ModalForm'; // modal for add/edit worker

const API_URL = import.meta.env.VITE_API_URL;

export default function Workers() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [workerData, setWorkerData] = useState(null);
  const [tableData, setTableData] = useState([]);

  // Fetch workers from backend
  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/workerRoutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTableData(response.data);
    } catch (err) {
      console.error('Error fetching workers:', err.message);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Open modal for add or edit
  const handleOpen = (mode, worker = null) => {
    setWorkerData(worker);
    setModalMode(mode);
    setIsOpen(true);
  };

  // Submit new or updated worker data
  const handleSubmit = async (newWorkerData) => {
    try {
      const token = localStorage.getItem('token');

      if (modalMode === 'add') {
        const response = await axios.post(
          `${API_URL}/api/workerRoutes`,
          newWorkerData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTableData((prevData) => [...prevData, response.data]);
      } else {
        const response = await axios.put(
          `${API_URL}/api/workerRoutes/${workerData._id}`,
          newWorkerData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTableData((prevData) =>
          prevData.map((worker) =>
            worker._id === workerData._id ? response.data : worker
          )
        );
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting worker data:', error);
    }
  };

  // Delete worker
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this worker?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/workerRoutes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTableData((prevData) => prevData.filter((w) => w._id !== id));
    } catch (error) {
      console.error('Error deleting worker:', error);
    }
  };

  return (
    <>
      <NavBar onOpen={() => handleOpen('add')} onSearch={setSearchTerm} />
      <TableList
        tableData={tableData}
        searchTerm={searchTerm}
        handleOpen={handleOpen}
        handleDelete={handleDelete}
      />
      <ModalForm
        isOpen={isOpen}
        onSubmit={handleSubmit}
        onClose={() => setIsOpen(false)}
        mode={modalMode}
        workerData={workerData}
      />
    </>
  );
}
