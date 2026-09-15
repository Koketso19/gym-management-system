export default function Navbar({ searchTerm, setSearchTerm, onAddClick }) {
    return (
      <div className="navbar bg-base-100 shadow-sm mb-6">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl normal-case">Property Management</a>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search properties..."
            className="input input-bordered w-24 md:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={onAddClick}>
            + Add Property
          </button>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="User avatar"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box mt-3 w-52 p-2 shadow"
            >
              <li>
                <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li><a>Settings</a></li>
              <li><a>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  