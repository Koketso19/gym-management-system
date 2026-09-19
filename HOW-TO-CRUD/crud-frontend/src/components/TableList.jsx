export default function TableList({
  tableData = [],
  searchTerm = '',
  handleOpen,
  handleDelete,
  handleMarkPaid,
  handleMarkUnpaid,
  handleCheckIn,
  handleCheckOut,
}) {
  // --- filter by search ---
  const filteredClients = tableData.filter((c) => {
    const term = searchTerm.toLowerCase();
    const hay = `${c.FirstName} ${c.LastName} ${c.UserID} ${c.email} ${c.phone}`.toLowerCase();
    return hay.includes(term);
  });

  return (
    <div className="overflow-x-auto px-4 pb-6">
      <table className="table w-full border border-base-300 rounded-lg shadow-sm">
        <thead className="bg-base-200">
          <tr>
            <th className="text-left border-r border-base-300">Name</th>
            <th className="text-left border-r border-base-300">UserID</th>
            <th className="text-left border-r border-base-300">Email</th>
            <th className="text-left border-r border-base-300">Phone</th>
            <th className="text-left border-r border-base-300">Rate</th>
            <th className="text-left border-r border-base-300">Payment</th>
            <th className="text-left border-r border-base-300">Visits</th>
            <th className="text-left border-r border-base-300">In Gym</th>
            <th className="text-left border-r border-base-300">Last Check-In</th>
            <th className="text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredClients.map((c, idx) => {
            const paid = c.payment?.status === 'Paid';
            const rate = c.membership?.rate ?? 0;

            return (
              <tr
                key={c._id}
                className={`transition-colors duration-200 ${
                  idx % 2 === 0 ? 'bg-base-100' : 'bg-base-200'
                } hover:bg-base-300`}
              >
                {/* Name */}
                <td className="border-r border-base-300 font-medium">
                  {c.FirstName} {c.LastName}
                </td>

                {/* UserID */}
                <td className="border-r border-base-300">{c.UserID}</td>

                {/* Email */}
                <td className="border-r border-base-300">{c.email}</td>

                {/* Phone */}
                <td className="border-r border-base-300">{c.phone}</td>

                {/* Rate */}
                <td className="border-r border-base-300">R {rate}</td>

                {/* Payment badge */}
                <td className="border-r border-base-300">
                  <span className={`badge ${paid ? 'badge-success' : 'badge-error'}`}>
                    {paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td>

                {/* Visits */}
                <td className="border-r border-base-300">
                  {c.totalVisitsThisMonth || 0}
                </td>

                {/* In Gym badge */}
                <td className="border-r border-base-300">
                  {c.currentlyInGym ? (
                    <span className="badge badge-info">Inside</span>
                  ) : (
                    <span className="text-xs opacity-40">—</span>
                  )}
                </td>

                {/* Last check-in */}
                <td className="border-r border-base-300 text-xs">
                  {c.lastCheckIn || '—'}
                </td>

                {/* Actions */}
                <td className="flex flex-wrap gap-1">
                  {c.currentlyInGym ? (
                    <button
                      className="btn btn-xs btn-warning"
                      onClick={() => handleCheckOut(c._id)}
                    >
                      Check Out
                    </button>
                  ) : (
                    <button
                      className="btn btn-xs btn-info"
                      onClick={() => handleCheckIn(c._id)}
                    >
                      Check In
                    </button>
                  )}

                  {paid ? (
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => handleMarkUnpaid(c._id)}
                    >
                      Unpaid
                    </button>
                  ) : (
                    <button
                      className="btn btn-xs btn-success"
                      onClick={() => handleMarkPaid(c._id)}
                    >
                      Paid
                    </button>
                  )}

                  <button
                    className="btn btn-xs btn-outline btn-info"
                    onClick={() => handleOpen('edit', c)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-xs btn-outline btn-error"
                    onClick={() => handleDelete(c._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}

          {filteredClients.length === 0 && (
            <tr>
              <td colSpan="10" className="text-center text-gray-500 py-4">
                No clients found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}