import { Calendar, DollarSign, User } from "lucide-react";

export default function PaymentCard({ payment }) {
  return (
    <div className="bg-transparent border border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-1">
        <User size={16} /> {payment.tenantName || "Unknown Tenant"}
      </h3>

      <div className="text-sm text-gray-200 flex items-center gap-1 mb-1">
        <DollarSign size={14} /> R{payment.amount || 0}
      </div>

      <div className="text-sm text-gray-200 flex items-center gap-1 mb-1">
        <Calendar size={14} /> {new Date(payment.date).toLocaleDateString()}
      </div>

      <div className={`mt-2 text-xs font-medium px-2 py-1 rounded-full inline-block ${
        payment.status === 'Paid' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
      }`}>
        {payment.status || "Pending"}
      </div>
    </div>
  );
}
