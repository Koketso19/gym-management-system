import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  UsersIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  // who am I?
  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch {}
  const role = (localStorage.getItem('role') || 'member').toLowerCase();
  const isAdmin = role === 'admin';
  const isMember = !isAdmin;

  // admins get tabs; members just see their own dashboard
  const [tab, setTab] = useState(isAdmin ? 'gym' : 'me');

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {greeting()} 👋
        </h1>
        <p className="text-sm text-base-content/60">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {/* Tabs (admin only) */}
      {isAdmin && (
        <div className="tabs tabs-boxed w-fit">
          <button
            className={`tab ${tab === 'gym' ? 'tab-active' : ''}`}
            onClick={() => setTab('gym')}
          >
            🏢 Gym Overview
          </button>
          <button
            className={`tab ${tab === 'me' ? 'tab-active' : ''}`}
            onClick={() => setTab('me')}
          >
            👤 My Activity
          </button>
        </div>
      )}

      {(isMember || tab === 'me') && <MyDashboard user={user} />}
      {isAdmin && tab === 'gym' && <GymDashboard />}

    </div>
  );
}

// ================================================================
// GYM DASHBOARD (admin)
// ================================================================
function GymDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clients/dashboard-summary`, authHeader());
      setData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const id = setInterval(fetchDashboard, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtDuration = (startStr) => {
    if (!startStr) return '—';
    const start = new Date(startStr.replace(' ', 'T'));
    const mins = Math.max(0, Math.floor((now - start) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fmtTime = (s) => (s ? s.split(' ')[1]?.slice(0, 5) : '—');
  const fmtDay  = (s) => new Date(s).toLocaleDateString('en-ZA', { weekday: 'short' });
  const fmtR    = (n) => 'R ' + Number(n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 });

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  const s = data.summary;
  const maxVisits = Math.max(1, ...s.visitsPerDay.map(d => d.count));

  return (
    <div className="space-y-6">

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Kpi icon={<UsersIcon className="w-6 h-6" />} label="Total Members" value={s.totalMembers} tone="primary" to="/clients" />
        <Kpi icon={<UserGroupIcon className="w-6 h-6" />} label="In Gym Now" value={s.inGym} tone="info" to="/in-gym" pulse={s.inGym > 0} />
        <Kpi icon={<CalendarDaysIcon className="w-6 h-6" />} label="Today's Visits" value={s.todayVisits} tone="success" to="/today" />
        <Kpi icon={<ExclamationTriangleIcon className="w-6 h-6" />} label="Unpaid Members" value={s.unpaid} tone="error" to="/clients" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weekly visits */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title text-base">Weekly Activity</h2>
              <span className="text-xs text-base-content/60">Last 7 days</span>
            </div>

            <div className="flex items-end justify-between gap-2 h-40">
              {s.visitsPerDay.map((d) => {
                const pct = Math.max(4, (d.count / maxVisits) * 100);
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium">{d.count}</span>
                    <div
                      className={`w-full rounded-t transition-all ${isToday ? 'bg-primary' : 'bg-primary/40'}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[10px] uppercase opacity-60">{fmtDay(d.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title text-base">Revenue — {s.month}</h2>
              <ArrowTrendingUpIcon className="w-5 h-5 opacity-60" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-success/10 p-3">
                <BanknotesIcon className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold">{fmtR(s.revenueThisMonth)}</p>
                <p className="text-xs text-base-content/60">Collected this month</p>
              </div>
            </div>
            <div className="stats stats-vertical md:stats-horizontal bg-base-200">
              <div className="stat py-3"><div className="stat-title text-xs">Members</div><div className="stat-value text-xl">{s.totalMembers}</div></div>
              <div className="stat py-3"><div className="stat-title text-xs">Unpaid</div><div className="stat-value text-xl text-error">{s.unpaid}</div></div>
              <div className="stat py-3"><div className="stat-title text-xs">Visits today</div><div className="stat-value text-xl">{s.todayVisits}</div></div>
            </div>
          </div>
        </div>

      </div>

      {/* Lists row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* In gym now */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title text-base">
                In Gym Now
                <span className="badge badge-sm badge-outline badge-info">{s.inGym}</span>
              </h2>
              <Link to="/in-gym" className="link link-primary text-xs">View all</Link>
            </div>
            {data.inGymList.length === 0 ? (
              <p className="text-sm text-base-content/60 py-6 text-center">Nobody is in the gym right now.</p>
            ) : (
              <ul className="space-y-2">
                {data.inGymList.map((m) => (
                  <li key={m._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8">
                        <span className="text-xs font-bold">{m.FirstName?.[0]}{m.LastName?.[0]}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.FirstName} {m.LastName}</p>
                      <p className="text-xs text-base-content/60 truncate">@{m.UserID}</p>
                    </div>
                    <span className="text-xs font-medium text-primary">{fmtDuration(m.lastCheckIn)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent visits */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title text-base">Recent Visits</h2>
              <Link to="/today" className="link link-primary text-xs">View all</Link>
            </div>
            {data.recentVisits.length === 0 ? (
              <p className="text-sm text-base-content/60 py-6 text-center">No visits recorded today yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentVisits.map((v) => (
                  <li key={v._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200">
                    <div className="avatar placeholder">
                      <div className="bg-base-300 text-base-content rounded-full w-8">
                        <span className="text-xs font-bold">{v.FirstName?.[0]}{v.LastName?.[0]}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.FirstName} {v.LastName}</p>
                      <p className="text-xs text-base-content/60 truncate">
                        In at {fmtTime(v.checkInTime)}
                        {v.checkOutTime ? ` · Out at ${fmtTime(v.checkOutTime)}` : ' · still inside'}
                      </p>
                    </div>
                    <span className="text-xs text-base-content/60">{v.durationMinutes > 0 ? `${v.durationMinutes}m` : '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link to="/clients" className="btn btn-outline btn-primary gap-2 justify-start"><UsersIcon className="w-4 h-4" /> Members</Link>
            <Link to="/clock" className="btn btn-outline btn-info gap-2 justify-start"><UserGroupIcon className="w-4 h-4" /> Clock In / Out</Link>
            <Link to="/payments" className="btn btn-outline btn-success gap-2 justify-start"><BanknotesIcon className="w-4 h-4" /> Payments</Link>
            <Link to="/users" className="btn btn-outline gap-2 justify-start"><ArrowRightIcon className="w-4 h-4" /> Staff</Link>
          </div>
        </div>
      </div>

    </div>
  );
}

// ================================================================
// MY DASHBOARD (member, or admin "My Activity" tab)
// ================================================================
function MyDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchMe = async () => {
    try {
      // find my client doc by username
      const id = user?.UserID || user?.username;
      if (!id) {
        setError('No user info — please log in again');
        setLoading(false);
        return;
      }

      const who = await axios.post(
        `${API_URL}/api/clients/get-by-userid`,
        { UserID: id.toLowerCase() },
        authHeader()
      );
      const me = who.data.client;

      const res = await axios.post(
        `${API_URL}/api/clients/my-summary`,
        { id: me._id },
        authHeader()
      );
      setData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError('Your account is not linked to a member record');
      } else {
        setError('Failed to load your activity');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const fmtDuration = (min) => {
    if (!min || min < 0) return '0m';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const fmtTime = (s) => (s ? s.split(' ')[1]?.slice(0, 5) : '—');
  const fmtDay  = (s) => new Date(s).toLocaleDateString('en-ZA', { weekday: 'long' });

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;

  const m = data.member;
  const w = data.week;
  const mo = data.month;

  const inGym = m.currentlyInGym;
  const paymentStatus = m.payment?.status || 'Unpaid';

  const maxMinutes = Math.max(1, ...w.days.map(d => d.minutes));

  return (
    <div className="space-y-6">

      {/* Header card */}
      <div className={`card shadow-sm border ${inGym ? 'bg-success/5 border-success/40' : 'bg-base-100 border-base-300'}`}>
        <div className="card-body flex-row items-center gap-4 flex-wrap">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-16">
              <span className="text-2xl font-bold">
                {m.FirstName?.[0]}{m.LastName?.[0]}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{m.FirstName} {m.LastName}</h2>
            <p className="text-sm text-base-content/60">@{m.UserID}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`badge badge-sm ${
                paymentStatus === 'Paid'    ? 'badge-outline badge-success' :
                paymentStatus === 'Partial' ? 'badge-outline badge-warning' :
                                              'badge-outline badge-error'
              }`}>
                {paymentStatus}
              </span>
              {inGym
                ? <span className="badge badge-sm badge-outline badge-info">Inside now</span>
                : <span className="badge badge-sm badge-outline">Outside</span>}
            </div>
          </div>

          {/* Big action */}
          <Link to="/clock" className={`btn ${inGym ? 'btn-error' : 'btn-primary'}`}>
            {inGym ? 'Clock Out' : 'Clock In'}
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<CalendarDaysIcon className="w-6 h-6" />} label="Visits this week" value={w.totalVisits} tone="primary" />
        <Kpi icon={<ClockIcon className="w-6 h-6" />} label="Time this week" value={fmtDuration(w.totalMinutes)} tone="success" />
        <Kpi icon={<CalendarDaysIcon className="w-6 h-6" />} label="Visits this month" value={mo.totalVisits} tone="info" />
        <Kpi icon={<ClockIcon className="w-6 h-6" />} label="Time this month" value={fmtDuration(mo.totalMinutes)} tone="warning" />
      </div>

      {/* This week — bars + table */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title text-base">This Week</h2>
            <span className="text-xs text-base-content/60">
              {w.totalVisits} visits · {fmtDuration(w.totalMinutes)}
            </span>
          </div>

          {/* Bar chart of minutes per day */}
          <div className="flex items-end justify-between gap-2 h-32 mb-4">
            {w.days.map((d) => {
              const pct = Math.max(4, (d.minutes / maxMinutes) * 100);
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] opacity-60">{d.minutes > 0 ? fmtDuration(d.minutes) : '—'}</span>
                  <div
                    className={`w-full rounded-t transition-all ${isToday ? 'bg-primary' : 'bg-primary/40'}`}
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-[10px] uppercase opacity-60">{fmtDay(d.date).slice(0,3)}</span>
                </div>
              );
            })}
          </div>

          {/* Detailed table */}
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {w.days.map((d) => (
                  <tr key={d.date}>
                    <td className="whitespace-nowrap">{fmtDay(d.date)}</td>
                    <td>{fmtTime(d.checkInTime)}</td>
                    <td>{d.checkOutTime ? fmtTime(d.checkOutTime) : (d.visits > 0 ? <span className="badge badge-sm badge-outline badge-info">Inside</span> : '—')}</td>
                    <td>{d.minutes > 0 ? fmtDuration(d.minutes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent visits */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">Recent Visits</h2>
          {data.recentVisits.length === 0 ? (
            <p className="text-sm text-base-content/60 py-6 text-center">No visits yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentVisits.map((v) => (
                <li key={v._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
                  <div>
                    <p className="text-sm font-medium">{v.date}</p>
                    <p className="text-xs text-base-content/60">
                      {fmtTime(v.checkInTime)} → {v.checkOutTime ? fmtTime(v.checkOutTime) : 'still inside'}
                    </p>
                  </div>
                  <span className="text-xs font-medium">{v.durationMinutes > 0 ? fmtDuration(v.durationMinutes) : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

// ================================================================
// Small UI helpers
// ================================================================
function Kpi({ icon, label, value, tone = 'primary', to, pulse = false }) {
  const toneMap = {
    primary: 'text-primary border-primary/30 bg-primary/5',
    info:    'text-info border-info/30 bg-info/5',
    success: 'text-success border-success/30 bg-success/5',
    error:   'text-error border-error/30 bg-error/5',
    warning: 'text-warning border-warning/30 bg-warning/5',
  };
  const inner = (
    <div className={`card border ${toneMap[tone]} shadow-sm hover:shadow-md transition`}>
      <div className="card-body p-4 flex-row items-center gap-3">
        <div className={`rounded-lg p-2 ${toneMap[tone]}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide opacity-70 truncate">{label}</p>
          <p className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {value}
            {pulse && value > 0 && <span className={`w-2 h-2 rounded-full bg-${tone} animate-pulse`} />}
          </p>
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="alert alert-error"><span>{msg}</span></div>
  );
}

// greeting helper (top-level)
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}