export default function PaymentNavbar({ onOpen, onSearch }) {
    return (
      <div className="navbar bg-base-100 shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Payments</h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search payments"
            className="input input-bordered"
            onChange={(e) => onSearch(e.target.value)}
          />
          <button onClick={onOpen} className="btn btn-primary">
            + Add Payment
          </button>
        </div>
      </div>
    );
  }
  