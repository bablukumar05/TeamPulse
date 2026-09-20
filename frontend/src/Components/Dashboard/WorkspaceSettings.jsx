import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' }
];

const TIMEOUT_OPTIONS = [
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours (Recommended)', value: 120 },
  { label: '4 Hours', value: 240 },
  { label: '8 Hours', value: 480 }
];

const WorkspaceSettings = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [form, setForm] = useState({
    name: 'TeamPulse Enterprise',
    slug: 'teampulse-workspace',
    logo: '',
    currency: 'USD',
    timezone: 'Asia/Kolkata',
    workingHours: '09:00 - 18:00',
    enforce2FA: false,
    sessionTimeoutMinutes: 120,
    allowPublicJoin: false,
    requireAdminApproval: true,
  });

  const fetchWorkspace = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/workspace/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.workspace) {
        const ws = res.data.workspace;
        setForm({
          name: ws.name || 'TeamPulse Enterprise',
          slug: ws.slug || 'teampulse-workspace',
          logo: ws.logo || '',
          currency: ws.currency || 'USD',
          timezone: ws.settings?.timezone || 'Asia/Kolkata',
          workingHours: ws.settings?.workingHours || '09:00 - 18:00',
          enforce2FA: !!ws.security?.enforce2FA,
          sessionTimeoutMinutes: ws.security?.sessionTimeoutMinutes || 120,
          allowPublicJoin: !!ws.security?.allowPublicJoin,
          requireAdminApproval: ws.security?.requireAdminApproval !== false,
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to retrieve workspace configuration.' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!token) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: form.name,
        logo: form.logo,
        currency: form.currency,
        settings: {
          timezone: form.timezone,
          workingHours: form.workingHours
        },
        security: {
          enforce2FA: form.enforce2FA,
          sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes),
          allowPublicJoin: form.allowPublicJoin,
          requireAdminApproval: form.requireAdminApproval
        }
      };

      const res = await axios.put('/api/workspace/current', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setStatusMsg({ type: 'success', text: 'Workspace configuration saved successfully.' });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update workspace settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500 text-xs">
        Loading organization settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Organization & Workspace Settings</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure enterprise security policies, multi-factor authentication, and operational localization.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100 text-sm cursor-pointer">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-[#0E1321] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white">General Workspace Profile</h3>
            <p className="text-xs text-zinc-500">Visible across invitation emails, notifications, and navigation header.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Workspace Organization Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Workspace Identifier (Slug)</label>
              <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-400">
                <span className="text-zinc-500 mr-1 font-mono">teampulse.io/org/</span>
                <span className="text-white font-mono">{form.slug}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Company Logo URL</label>
              <input
                type="url"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0E1321] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white">Regional & Operational Localization</h3>
            <p className="text-xs text-zinc-500">Determines task deadlines, report exports, and financial reporting units.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Standard Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Primary Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-[#0D121F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Operating Working Hours</label>
              <input
                type="text"
                value={form.workingHours}
                onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="09:00 - 18:00"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0E1321] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white">Security Governance & Multi-Factor Authentication</h3>
            <p className="text-xs text-zinc-500">Access controls, session management, and authentication policies for all workspace members.</p>
          </div>

          <div className="divide-y divide-white/5">
            <div className="flex items-center justify-between py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">Enforce Organization-Wide Two-Factor Authentication (2FA)</p>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    TOTP RFC 6238
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Mandates all administrators, managers, and employees to verify an authenticator token (Google Authenticator, Microsoft Authenticator) upon login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, enforce2FA: !form.enforce2FA })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  form.enforce2FA ? 'bg-indigo-600' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    form.enforce2FA ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-xs font-semibold text-white">Require Admin Approval for New Signups</p>
                <p className="text-[11px] text-zinc-500">Prevent unknown individuals from joining the workspace without explicit administrator review.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, requireAdminApproval: !form.requireAdminApproval })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  form.requireAdminApproval ? 'bg-indigo-600' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    form.requireAdminApproval ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-xs font-semibold text-white">Allow Public Join URL</p>
                <p className="text-[11px] text-zinc-500">Allow prospective team members to register directly via the public workspace portal.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, allowPublicJoin: !form.allowPublicJoin })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  form.allowPublicJoin ? 'bg-indigo-600' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    form.allowPublicJoin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-xs font-semibold text-white">Session Inactivity Timeout</p>
                <p className="text-[11px] text-zinc-500">Automatically expire and revoke access tokens after a prolonged period of user inactivity.</p>
              </div>
              <select
                value={form.sessionTimeoutMinutes}
                onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: Number(e.target.value) })}
                className="bg-[#0D121F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {TIMEOUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Updating Settings...' : 'Save Workspace Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceSettings;
