import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/payments/paymentNavbar';
import PaymentCard from '../components/payments/paymentCard';
import ModalForm from '../components/payments/paymentModal';

const API_URL = import.meta.env.VITE_API_URL;

export default function Payments() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payments`);
      setPayments(response.data);
    } catch (err) {
      console.error('Error fetching payments:', err.message);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    const filtered = payments.filter((payment) => {
      const name = payment.tenantName || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  const handleOpen = (mode, payment) => {
    setPaymentData(payment);
    setModalMode(mode);
    setIsOpen(true);
  };

  const handleSubmit = async (newPaymentData) => {
    try {
      if (modalMode === 'add') {
        const response = await axios.post(`${API_URL}/api/payments`, newPaymentData);
        setPayments((prev) => [...prev, response.data]);
      } else {
        const response = await axios.put(`${API_URL}/api/payments/${paymentData._id}`, newPaymentData);
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentData._id ? response.data : p))
        );
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
    setIsOpen(false);
  };

  return (
    <>
      <NavBar onOpen={() => handleOpen('add')} onSearch={setSearchTerm} />

      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPayments.map((payment) => (
            <div key={payment._id} onClick={() => handleOpen('edit', payment)}>
              <PaymentCard payment={payment} />
            </div>
          ))}
        </div>
      </div>

      <ModalForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={modalMode}
        clientData={paymentData}
        OnSubmit={handleSubmit}
      />
    </>
  );
}
