import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gym_settings';

const DEFAULT_SETTINGS = {
  gymName: 'Iron Temple Gym',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  currency: 'R',
  monthlyRate: 500,
  openTime: '05:00',
  closeTime: '22:00',
  allowUnpaidCheckIn: false,
  gracePeriodDays: 3,
  reminderMessage: 'Hi {name}, your gym membership for {month} is due. Please settle at reception.',
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }, []);

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-base-content/60">
            Gym configuration and preferences
          </p>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            Reset
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {saved ? '✅ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="alert alert-info mb-6">
        <span className="text-sm">
          ℹ️ Settings are saved in your browser for now. We'll wire them to the backend next.
        </span>
      </div>

      {/* Gym info */}
      <section className="bg-base-100 border border-base-300 rounded-lg p-5 mb-5">
        <h2 className="font-semibold mb-4">Gym Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label"><span className="label-text">Gym Name</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={settings.gymName}
              onChange={(e) => handleChange('gymName', e.target.value)}
            />
          </div>

          <div>
            <label className="label"><span className="label-text">Owner Name</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={settings.ownerName}
              onChange={(e) => handleChange('ownerName', e.target.value)}
            />
          </div>

          <div>
            <label className="label"><span className="label-text">Phone</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div>
            <label className="label"><span className="label-text">Email</span></label>
            <input
              type="email"
              className="input input-bordered w-full"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label"><span className="label-text">Address</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Membership */}
      <section className="bg-base-100 border border-base-300 rounded-lg p-5 mb-5">
        <h2 className="font-semibold mb-4">Membership</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label"><span className="label-text">Currency Symbol</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
            />
          </div>

          <div>
            <label className="label"><span className="label-text">Default Monthly Rate</span></label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={settings.monthlyRate}
              onChange={(e) => handleChange('monthlyRate', Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label"><span className="label-text">Grace Period (days)</span></label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={settings.gracePeriodDays}
              onChange={(e) => handleChange('gracePeriodDays', Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Operating hours */}
      <section className="bg-base-100 border border-base-300 rounded-lg p-5 mb-5">
        <h2 className="font-semibold mb-4">Operating Hours</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label"><span className="label-text">Open Time</span></label>
            <input
              type="time"
              className="input input-bordered w-full"
              value={settings.openTime}
              onChange={(e) => handleChange('openTime', e.target.value)}
            />
          </div>
          <div>
            <label className="label"><span className="label-text">Close Time</span></label>
            <input
              type="time"
              className="input input-bordered w-full"
              value={settings.closeTime}
              onChange={(e) => handleChange('closeTime', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="bg-base-100 border border-base-300 rounded-lg p-5 mb-5">
        <h2 className="font-semibold mb-4">Rules</h2>

        <label className="label cursor-pointer justify-start gap-3 mb-4">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={settings.allowUnpaidCheckIn}
            onChange={(e) => handleChange('allowUnpaidCheckIn', e.target.checked)}
          />
          <span className="label-text">
            Allow unpaid members to check in
          </span>
        </label>

        <div>
          <label className="label">
            <span className="label-text">Payment Reminder Template</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            value={settings.reminderMessage}
            onChange={(e) => handleChange('reminderMessage', e.target.value)}
          />
          <p className="text-xs text-base-content/60 mt-1">
            Use <code>{'{name}'}</code> and <code>{'{month}'}</code> as placeholders.
          </p>
        </div>
      </section>
    </div>
  );
}