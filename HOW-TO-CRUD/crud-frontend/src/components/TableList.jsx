export default function TableList({ tableData = [], searchTerm = "", handleOpen, handleDelete }) {
    const filteredClients = tableData.filter((client) =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div className="overflow-x-auto">
        <table className="table w-full border border-base-300 rounded-lg shadow-sm">
          <thead className="bg-base-200">
            <tr>
              <th className="text-left border-r border-base-300">Name</th>
              <th className="text-left border-r border-base-300">Email</th>
              <th className="text-left border-r border-base-300">Phone</th>
              <th className="text-left border-r border-base-300">Location</th>
              <th className="text-left border-r border-base-300">Room No</th>
              <th className="text-left border-r border-base-300">Rent</th>
              <th className="text-left border-r border-base-300">Job</th>
              <th className="text-left border-r border-base-300">Status</th>
              <th className="text-left">Actions</th> {/* no border on last column */}
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client, idx) => (
              <tr
                key={client._id}
                className={`transition-colors duration-200 ${
                  idx % 2 === 0 ? 'bg-base-100' : 'bg-base-200'
                } hover:bg-base-300`}
              >
                <td className="border-r border-base-300">{client.name}</td>
                <td className="border-r border-base-300">{client.email}</td>
                <td className="border-r border-base-300">{client.phone}</td>
                <td className="border-r border-base-300">{client.propertyLocation}</td>
                <td className="border-r border-base-300">{client.roomNumber}</td>
                <td className="border-r border-base-300">R {client.rate}</td>
                <td className="border-r border-base-300">{client.job || "N/A"}</td>
                <td className="border-r border-base-300">
                  <span className={`badge ${client.status === "Paid" ? "badge-success" : "badge-error"}`}>
                    {client.status || "Pending"}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline btn-info"
                    onClick={() => handleOpen("edit", client)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline btn-error"
                    onClick={() => handleDelete(client._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center text-gray-500 py-4">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  