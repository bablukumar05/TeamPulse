import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';
import toast from 'react-hot-toast';
import EmployeeProfile from '../Dashboard/EmployeeProfile';

const ROLE_COLORS = {
  Admin:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Manager:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Employee: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const ManageEmployees = ({ refreshTrigger }) => {
  const { token } = useContext(AuthContext);
  const [activeEmployees, setActiveEmployees]     = useState([]);
  const [terminatedEmployees, setTerminatedEmployees] = useState([]);
  const [viewTerminated, setViewTerminated]       = useState(false);
  const [search, setSearch]                       = useState('');
  const [departmentFilter, setDepartmentFilter]   = useState('All');
  const [roleFilter, setRoleFilter]               = useState('All');
  const [viewMode, setViewMode]                   = useState('grid'); // 'grid' or 'table'
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [loading, setLoading]                     = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activeRes, termRes] = await Promise.all([
        axios.get('/api/admin/employees', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/employees/terminated', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setActiveEmployees(activeRes.data || []);
      setTerminatedEmployees(termRes.data || []);
    } catch {
      toast.error('Failed to fetch employee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, refreshTrigger]);

  const [terminateUser, setTerminateUser]           = useState(null); // User currently being terminated
  const [termReason, setTermReason]                 = useState('Performance Standards Not Met');
  const [termDetails, setTermDetails]               = useState('');
  const [termSeverance, setTermSeverance]           = useState('30 Days Notice Period / Full Settlement of Accrued Dues');
  const [submittingTerm, setSubmittingTerm]         = useState(false);

  const openTerminateModal = (e, emp) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!emp) return;
    setTerminateUser(emp);
    setTermReason('Performance Standards Not Met');
    setTermDetails(`Pursuant to company policy, this notice is to inform you that your employment with TeamPulse is being terminated. You have the right to request full final settlement within 14 days.`);
    setTermSeverance('30 Days Notice Period / Full Settlement of Accrued Dues');
  };

  const handleProcessTermination = async (e) => {
    e.preventDefault();
    if (!terminateUser) return;
    setSubmittingTerm(true);

    try {
      await axios.put(`/api/admin/employees/${terminateUser._id}/terminate`, {
        reason: termReason,
        details: termDetails,
        severanceNotice: termSeverance,
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(`Termination letter generated and notification sent to ${terminateUser.firstName}.`, {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
        duration: 5000
      });
      setTerminateUser(null);
      fetchData();
    } catch {
      toast.error('Failed to process termination.');
    } finally {
      setSubmittingTerm(false);
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restore access for ${name}?`)) return;
    try {
      await axios.put(`/api/admin/employees/${id}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${name} restored.`);
      fetchData();
    } catch {
      toast.error('Failed to restore employee.');
    }
  };

  if (selectedProfileId) {
    return <EmployeeProfile userId={selectedProfileId} onBack={() => setSelectedProfileId(null)} />;
  }

  const currentList = viewTerminated ? terminatedEmployees : activeEmployees;

  // Department & Role options for dropdown
  const departments = ['All', ...new Set(currentList.map(e => e.department || e.departmentId?.name).filter(Boolean))];
  const roles       = ['All', 'Admin', 'Manager', 'Employee'];

  // Filtered employees
  const filteredList = currentList.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName || ''}`.toLowerCase();
    const emailMatch = emp.email?.toLowerCase().includes(search.toLowerCase());
    const nameMatch  = fullName.includes(search.toLowerCase());
    const empIdMatch = emp.employeeId?.toLowerCase().includes(search.toLowerCase());

    const matchesSearch = !search || nameMatch || emailMatch || empIdMatch;
    const matchesDept   = departmentFilter === 'All' || (emp.department || emp.departmentId?.name) === departmentFilter;
    const matchesRole   = roleFilter === 'All' || emp.role === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="bg-[#12141d]/90 border border-white/[0.08] p-6 rounded-3xl shadow-2xl backdrop-blur-2xl mt-4 select-none">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black bg-gradient-to-r from-teal-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {viewTerminated ? 'Alumni & Terminated Staff' : 'Active Employees Directory'}
            </h2>
            <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
              {filteredList.length} members
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage corporate employee profiles, roles, departments, workload statistics, and access credentials.
          </p>
        </div>

        {/* View Mode Toggle & Terminated Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grid/Table Toggle */}
          <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              田 Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              ☰ Table
            </button>
          </div>

          {/* Toggle Active / Terminated */}
          <button
            onClick={() => setViewTerminated(!viewTerminated)}
            className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
              viewTerminated
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            {viewTerminated ? '👥 View Active Staff' : `🚫 View Terminated (${terminatedEmployees.length})`}
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or employee ID…"
          className="text-xs px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors"
        />

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="text-xs px-3 py-2.5 bg-[#181a24] border border-white/10 rounded-xl text-gray-300 outline-none focus:border-indigo-500"
        >
          <option value="All">All Departments</option>
          {departments.filter(d => d !== 'All').map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="text-xs px-3 py-2.5 bg-[#181a24] border border-white/10 rounded-xl text-gray-300 outline-none focus:border-indigo-500"
        >
          {roles.map(r => (
            <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
          ))}
        </select>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-gray-400 font-bold text-sm">No employees match your filters.</p>
          <p className="text-gray-600 text-xs mt-1">Try clearing your search query or department filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARDS VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(emp => {
            const taskStats = emp.taskCount || { active: 0, newTask: 0, completed: 0, failed: 0 };
            return (
              <div
                key={emp._id}
                className="bg-white/[0.03] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg group relative overflow-hidden"
              >
                {/* Top Row: Avatar + Name + Role */}
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-lg border border-white/20 shadow-md">
                      {emp.firstName?.charAt(0) || '?'}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#12141d] ${
                      emp.isOnline ? 'bg-green-400' : 'bg-gray-600'
                    }`} title={emp.isOnline ? 'Online' : 'Offline'} />
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                        {emp.firstName} {emp.lastName || ''}
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{emp.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${ROLE_COLORS[emp.role] || ROLE_COLORS.Employee}`}>
                        {emp.role}
                      </span>
                      {emp.employeeId && (
                        <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {emp.employeeId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Info: Dept & Salary */}
                <div className="my-4 pt-3 border-t border-white/[0.05] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 block text-[9px] uppercase tracking-widest font-bold">Department</span>
                    <span className="text-gray-300 font-semibold truncate block">
                      {emp.department || emp.departmentId?.name || 'General'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[9px] uppercase tracking-widest font-bold">Base Salary</span>
                    <span className="text-emerald-400 font-semibold block">
                      {emp.baseSalaryLPA ? `₹${emp.baseSalaryLPA} LPA` : 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Workload Stats Row */}
                <div className="grid grid-cols-4 gap-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2 text-center text-[10px] mb-4">
                  <div>
                    <span className="text-indigo-400 font-bold block">{taskStats.newTask}</span>
                    <span className="text-gray-600 uppercase text-[8px]">To Do</span>
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold block">{taskStats.active}</span>
                    <span className="text-gray-600 uppercase text-[8px]">Active</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-bold block">{taskStats.completed}</span>
                    <span className="text-gray-600 uppercase text-[8px]">Done</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold block">{taskStats.failed}</span>
                    <span className="text-gray-600 uppercase text-[8px]">Blocked</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setSelectedProfileId(emp._id)}
                    className="flex-1 text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold py-2 rounded-xl transition-all border border-indigo-500/30 text-center"
                  >
                    View Profile
                  </button>

                  {!viewTerminated ? (
                    <button
                      type="button"
                      onClick={(e) => openTerminateModal(e, emp)}
                      className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold px-3 py-2 rounded-xl border border-rose-500/20 transition-all"
                      title="Issue Formal Termination"
                    >
                      Fire
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestore(emp._id, emp.firstName)}
                      className="text-xs bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-bold px-3 py-2 rounded-xl border border-emerald-500/30 transition-all"
                      title="Restore Access"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DATA TABLE VIEW ── */
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-white/[0.04] text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/[0.08]">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Workload Tasks</th>
                <th className="px-4 py-3">Salary (LPA)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredList.map(emp => {
                const taskStats = emp.taskCount || { active: 0, newTask: 0, completed: 0, failed: 0 };
                return (
                  <tr key={emp._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                          {emp.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{emp.firstName} {emp.lastName || ''}</p>
                          <p className="text-[10px] text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${ROLE_COLORS[emp.role] || ROLE_COLORS.Employee}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-semibold">
                      {emp.department || emp.departmentId?.name || 'General'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-green-400 font-bold">{taskStats.completed} done</span>
                        <span className="text-amber-400 font-bold">{taskStats.active} in-progress</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-bold font-mono">
                      {emp.baseSalaryLPA ? `₹${emp.baseSalaryLPA} LPA` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProfileId(emp._id)}
                          className="text-[11px] bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                        >
                          Profile
                        </button>
                        {!viewTerminated ? (
                          <button
                            type="button"
                            onClick={(e) => openTerminateModal(e, emp)}
                            className="text-[11px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            Fire
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(emp._id, emp.firstName)}
                            className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FORMAL TERMINATION & RIGHTS MODAL ── */}
      {terminateUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#141622] border border-rose-500/30 rounded-3xl w-full max-w-lg p-6 space-y-4 text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-rose-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xl font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-400">Formal Termination & Rights Notice</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Issuing termination for <span className="text-white font-bold">{terminateUser.firstName} {terminateUser.lastName || ''}</span> ({terminateUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTerminateUser(null)}
                className="text-gray-400 hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessTermination} className="space-y-4">
              {/* Reason Dropdown */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Primary Reason for Termination *
                </label>
                <select
                  value={termReason}
                  onChange={e => setTermReason(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#181a24] border border-white/10 rounded-xl text-white outline-none focus:border-rose-500"
                >
                  <option value="Performance Standards Not Met">Performance Standards Not Met</option>
                  <option value="Conduct & Policy Violation">Conduct & Policy Violation</option>
                  <option value="Company Restructuring / Layoff">Company Restructuring / Layoff</option>
                  <option value="Probation Unsuccessful">Probation Unsuccessful</option>
                  <option value="Unexcused Absence / Abandonment">Unexcused Absence / Abandonment</option>
                </select>
              </div>

              {/* Employee Rights & Explanation */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Detailed Explanation & Employee Rights Statement *
                </label>
                <textarea
                  required
                  rows={4}
                  value={termDetails}
                  onChange={e => setTermDetails(e.target.value)}
                  placeholder="Explain reason, exit clearance instructions, and employee rights…"
                  className="w-full text-xs p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              {/* Severance & Notice Terms */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Severance & Notice Period Terms *
                </label>
                <input
                  type="text"
                  required
                  value={termSeverance}
                  onChange={e => setTermSeverance(e.target.value)}
                  placeholder="e.g. 30 Days Notice / Full Settlement of Dues"
                  className="w-full text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-rose-500"
                />
              </div>

              {/* Rights Notice Info Box */}
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 leading-relaxed">
                📌 <strong>What will happen:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-gray-400">
                  <li>Employee login access will be revoked immediately.</li>
                  <li>An official <strong>Termination & Rights Notice Letter</strong> will be auto-generated and stored in the employee's Document Vault.</li>
                  <li>A <strong>System Notification</strong> will be sent to the employee detailing their reason & rights.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingTerm}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  {submittingTerm ? 'Processing…' : 'Issue Termination & Send Rights Letter'}
                </button>
                <button
                  type="button"
                  onClick={() => setTerminateUser(null)}
                  className="px-4 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEmployees;
