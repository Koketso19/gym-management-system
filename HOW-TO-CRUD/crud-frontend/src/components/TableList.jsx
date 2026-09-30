import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function TableList({
  tableData = [],
  handleOpen,
  handleMarkPaid,
  handleRefund,
  handleLedger,
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return tableData.slice(start, start + PAGE_SIZE);
  }, [tableData, safePage]);

  // outline badges (matches workers table style)
  const badgeClass = (status) =>
    status === 'Paid'    ? 'badge-outline badge-success' :
    status === 'Partial' ? 'badge-outline badge-warning' :
                           'badge-outline badge-error';

  // outline action buttons (matches workers table style)
  const Actions = ({ c }) => (
    <div className="flex flex-wrap gap-1">
      <button
        className="btn btn-xs btn-outline btn-success"
        onClick={() => handleMarkPaid(c._id)}
      >
        Paid
      </button>
      <button
        className="btn btn-xs btn-outline btn-warning"
        onClick={() => handleRefund(c._id)}
      >
        Unpaid
      </button>
      <button
        className="btn btn-xs btn-outline btn-info"
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
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4 px-1">
      <button
        className="btn btn-sm btn-outline"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={safePage <= 1}
      >
        ← Prev
      </button>

      <div className="text-sm text-gray-500">
        Page <b>{safePage}</b> of <b>{totalPages}</b>
        <span className="hidden sm:inline">
          {' '}· {tableData.length} total
        </span>
      </div>

      <button
        className="btn btn-sm btn-outline"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={safePage >= totalPages}
      >
        Next →
      </button>
    </div>
  );

  if (tableData.length === 0) {
    return (
      <div className="px-4 pb-6">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body text-center text-gray-500 py-10">
            No clients found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">

      {/* PHONE */}
      <div className="md:hidden space-y-2">
        {paginated.map((c, idx) => {
          const status = c.payment?.status || 'Unpaid';

          return (
            <div
              key={c._id}
              className={`rounded-lg border border-base-300 p-3 ${
                idx % 2 === 0 ? 'bg-base-100' : 'bg-base-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Link
                  to={`/clients/${c._id}`}
                  className="link link-primary font-semibold truncate"
                >
                  {c.FirstName} {c.LastName}
                </Link>
                <span className={`badge badge-sm ${badgeClass(status)} shrink-0`}>
                  {status}
                </span>
              </div>

              <Actions c={c} />
            </div>
          );
        })}
      </div>

      {/* TABLET + DESKTOP */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-md w-full border border-base-300 rounded-lg shadow-sm">
          <thead className="bg-base-200">
            <tr>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Name</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">UserID</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Email</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Phone</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Rate</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Payment</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Visits</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">In Gym</th>
              <th className="text-left border-r border-base-300 whitespace-nowrap">Last Check-In</th>
              <th className="text-left whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((c, idx) => {
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
                  <td className="border-r border-base-300 font-medium whitespace-nowrap">
                    <Link
                      to={`/clients/${c._id}`}
                      className="link link-primary hover:underline"
                    >
                      {c.FirstName} {c.LastName}
                    </Link>
                  </td>
                  <td className="border-r border-base-300 whitespace-nowrap">{c.UserID}</td>
                  <td className="border-r border-base-300">{c.email}</td>
                  <td className="border-r border-base-300 whitespace-nowrap">{c.phone}</td>
                  <td className="border-r border-base-300 whitespace-nowrap">R {rate}</td>

                  <td className="border-r border-base-300 whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`badge badge-sm ${badgeClass(status)}`}>
                        {status}
                      </span>
                      {bal > 0 && (
                        <span className="badge badge-sm badge-outline badge-info">
                          +R{bal}
                        </span>
                      )}
                      {due > 0 && status !== 'Paid' && (
                        <span className="text-xs text-error">−R{due}</span>
                      )}
                    </div>
                  </td>

                  <td className="border-r border-base-300 text-center">
                    {c.totalVisitsThisMonth || 0}
                  </td>

                  <td className="border-r border-base-300 whitespace-nowrap">
                    {c.currentlyInGym
                      ? <span className="badge badge-sm badge-outline badge-info">Inside</span>
                      : <span className="text-xs opacity-40">—</span>}
                  </td>

                  <td className="border-r border-base-300 text-xs whitespace-nowrap">
                    {c.lastCheckIn || '—'}
                  </td>

                  <td className="whitespace-nowrap">
                    <Actions c={c} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination />

    </div>
  );
}