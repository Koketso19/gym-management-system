export default function NavBar({ title = "Clients", onSearch, onOpen }) {
    const handleSearchChange = (event) => {
      onSearch(event.target.value);
    };
  
    return (
      <div className="navbar bg-base-100 shadow-sm p-4 mb-6 rounded-lg">
        {/* Left Title */}
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl normal-case">{title}</a>
        </div>
  
        {/* Center Search */}
        <div className="navbar-center">
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            className="input input-bordered w-48 md:w-64"
            onChange={handleSearchChange}
          />
        </div>
  
        {/* Right Side: Add Button + Avatar */}
        <div className="navbar-end flex items-center gap-3">
          <button className="btn btn-primary" onClick={onOpen}>
            + Add {title}
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
  