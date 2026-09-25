import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
    ClockIcon,  
} from '@heroicons/react/24/outline';

// ---- Menu structure ----
const NAV_GROUPS = [
  {
    section: 'Overview',
    items: [
      { to: '/',        label: 'Dashboard',  Icon: HomeIcon },
      { to: '/in-gym',  label: 'In Gym Now', Icon: UserGroupIcon },
    ],
  },
  {
    section: 'Members',
    items: [
      { to: '/clients',  label: 'Clients',  Icon: UsersIcon },
      { to: '/payments', label: 'Payments', Icon: BanknotesIcon },
    ],
  },
  {
    section: 'Activity',
    items: [
     { to: '/clock',   label: 'Clock In / Out', Icon: ClockIcon },
      { to: '/today',   label: "Today's Visits", Icon: CalendarDaysIcon },
      { to: '/history', label: 'Check-In Log',   Icon: BookOpenIcon },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/users',    label: 'Staff / Admins', Icon: ShieldCheckIcon },
      { to: '/settings', label: 'Settings',       Icon: Cog6ToothIcon },
    ],
  },
];

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="drawer-side">
      <label htmlFor="sidebar-toggle" className="drawer-overlay"></label>

      <aside className="menu p-4 w-64 min-h-full bg-base-100 text-base-content flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-6 px-2">
          <span className="text-2xl">🏋️</span>
          <div>
            <h2 className="text-base font-bold leading-tight">Iron Temple</h2>
            <p className="text-xs opacity-60">Gym Management</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.section} className="mb-4">
              <p className="px-3 mb-1 text-[10px] uppercase tracking-wider opacity-50">
                {group.section}
              </p>
              <ul className="menu menu-sm gap-1">
                {group.items.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg ${
                          isActive
                            ? 'bg-primary text-primary-content font-medium'
                            : 'hover:bg-base-200'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-base-300 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-error hover:bg-error/10 transition"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;