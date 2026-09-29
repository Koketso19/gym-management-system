export default function NavBar({ title = "Clients", onSearch, onOpen }) {
  const handleSearchChange = (event) => {
    onSearch(event.target.value);
  };

  return (
    <div className="navbar bg-base-100 shadow-sm px-3 py-2 md:px-4 md:py-3 mb-3 md:mb-6 rounded-lg gap-2">
      {/* Title */}
      <div className="navbar-start w-auto flex-none">
        <a className="text-lg md:text-xl font-bold whitespace-nowrap">{title}</a>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <input
          type="text"
          placeholder={`Search…`}
          className="input input-bordered input-sm md:input-md w-full max-w-[160px] sm:max-w-xs md:max-w-sm"
          onChange={handleSearchChange}
        />
      </div>

      {/* Add button + avatar */}
      <div className="navbar-end flex-none flex items-center gap-2">
        <button
          className="btn btn-primary btn-sm md:btn-md"
          onClick={onOpen}
        >
          <span className="hidden sm:inline">+ Add {title}</span>
          <span className="sm:hidden">+ Add</span>
        </button>

        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-8 md:w-10 rounded-full">
              <img
                alt="User avatar"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box mt-3 w-52 p-2 shadow z-50"
          >
            <li><a className="justify-between">Profile <span className="badge">New</span></a></li>
            <li><a>Settings</a></li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}