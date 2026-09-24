export default function TableList({
  tableData = [],
  handleOpen,
  handleDelete,
  handleMarkPaid,
  handleMarkUnpaid,
  handleCheckIn,
  handleCheckOut,
  handlePay,
  handleLedger,
}) {
  const badgeClass = (status) =>
    status === 'Paid'    ? 'badge-success' :
    status === 'Partial' ? 'badge-warning' :
                           'badge-error';

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
          {tableData.map((c, idx) => {
            const status = c.payment?.status || 'Unpaid';
            const rate   = c.membership?.rate ?? 0;
            const bal    = c.payment?.balance || 0;
            const due    = c.payment?.dueThisMonth || 0;

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

                {/* Payment badge + credit + due */}
                <td className="border-r border-base-300">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={`badge ${badgeClass(status)}`}>
                      {status}
                    </span>
                    {bal > 0 && (
                      <span className="badge badge-info" title="Prepaid credit">
                        +R{bal}
                      </span>
                    )}
                    {due > 0 && status !== 'Paid' && (
                      <span className="text-xs text-error" title="Outstanding">
                        −R{due}
                      </span>
                    )}
                  </div>
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
                <td>
                  <div className="flex flex-wrap gap-1">
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

                    <button
                      className="btn btn-xs btn-success"
                      onClick={() => handlePay(c)}
                    >
                      Pay
                    </button>

                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => handleLedger(c)}
                    >
                      Ledger
                    </button>

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
                  </div>
                </td>
              </tr>
            );
          })}

          {tableData.length === 0 && (
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