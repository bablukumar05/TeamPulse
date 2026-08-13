import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';
import EmployeeProfile from '../Dashboard/EmployeeProfile';

const HR_TABS = ['Overview', 'Leave Approvals', 'Employees', 'Attendance'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const HRDashboard = ({ onBack }) => {
  const { token } = useContext(AuthContext);
  const [tab, setTab]               = useState('Overview');
  const [stats, setStats]           = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [attendanceReport, setAttendanceReport] = useState({ records: [], summary: {} });
  const [loading, setLoading]       = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };
  const now = new Date();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/hr/stats', { headers });
        setStats(res.data);
      } catch { /* ignore */ }
    };
    fetchStats();
  }, [token]);

  useEffect(() => {
    const fetchByTab = async () => {
      setLoading(true);
      try {
        if (tab === 'Leave Approvals') {
          const res = await axios.get('/api/hr/leave-requests', { headers });
          setLeaveRequests(res.data);
        } else if (tab === 'Employees') {
          const res = await axios.get('/api/hr/employees', { headers });
          setEmployees(res.data);
        } else if (tab === 'Attendance') {
          const res = await axios.get(`/api/hr/attendance/report?from=${new Date(now.getFullYear(), now.getMonth(), 1).toISOString()}&to=${new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString()}`, { headers });
          setAttendanceReport(res.data);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchByTab();
  }, [tab, token]);

  const handleLeaveAction = async (id, status) => {
    try {
      await axios.put(`/api/hr/leave-requests/${id}`, { status }, { headers });
      toast.success(`Leave ${status.toLowerCase()}`, { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
      setLeaveRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    } catch { toast.error('Action failed'); }
  };

  if (selectedProfile) {
    return <EmployeeProfile userId={selectedProfile} onBack={() => setSelectedProfile(null)} />;
  }

  const pending = leaveRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-[#0a0c11] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.07] bg-[#111318]/95 sticky top-0 z-20 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button onClick={onBack} className="hover:text-white transition-colors">← Dashboard</button>
          <span>/</span><span className="text-white font-semibold">HR Dashboard</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">HR Dashboard</h1>
          {pending > 0 && (
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-full">{pending} pending leaves</span>
          )}
        </div>
        <div className="flex gap-0 mt-3 overflow-x-auto border-t border-white/[0.06] -mx-6 px-6">
          {HR_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t ? 'border-rose-500 text-rose-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Employees',       value: stats?.totalEmployees ?? '…', icon: '👥', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400'   },
                { label: 'Present Today',   value: stats?.todayPresent   ?? '…', icon: '✅', color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400' },
                { label: 'Pending Leaves',  value: stats?.pendingLeaves  ?? '…', icon: '📋', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400' },
                { label: 'Open Tasks',      value: stats?.openTasks      ?? '…', icon: '⚡', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400' },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-2xl p-5`}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-black ${s.color.split(' ').find(c => c.startsWith('text-'))}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'View Leave Requests', action: () => setTab('Leave Approvals'), color: 'bg-amber-600 hover:bg-amber-500', icon: '📋' },
                  { label: 'Employee Directory',  action: () => setTab('Employees'),       color: 'bg-blue-600 hover:bg-blue-500',   icon: '👥' },
                  { label: 'Attendance Report',   action: () => setTab('Attendance'),      color: 'bg-green-600 hover:bg-green-500', icon: '📅' },
                  { label: 'Pending: ' + (stats?.pendingLeaves || 0), action: () => setTab('Leave Approvals'), color: 'bg-rose-600 hover:bg-rose-500', icon: '⏳' },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    className={`${a.color} text-white text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-colors`}>
                    <span>{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── LEAVE APPROVALS ── */}
        {tab === 'Leave Approvals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Leave Requests</h2>
              <div className="flex gap-2 text-xs">
                {['All', 'Pending', 'Approved', 'Denied'].map(f => (
                  <span key={f} className="text-gray-500">{f}: {leaveRequests.filter(r => f === 'All' || r.status === f).length}</span>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-12"><div className="text-4xl mb-2">📋</div><p className="text-gray-500">No leave requests.</p></div>
            ) : (
              leaveRequests.slice().sort((a,b) => {
                const order = { Pending: 0, Approved: 1, Denied: 2 };
                return (order[a.status] ?? 3) - (order[b.status] ?? 3);
              }).map(req => {
                const start = new Date(req.startDate);
                const end   = new Date(req.endDate);
                const days  = Math.ceil((end - start) / 86400000) + 1;
                return (
                  <div key={req._id} className={`flex items-start gap-4 flex-wrap bg-white/[0.03] border rounded-2xl p-4 transition-all ${
                    req.status === 'Pending' ? 'border-amber-500/30' :
                    req.status === 'Approved' ? 'border-green-500/20' : 'border-white/[0.07]'
                  }`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {req.employeeId?.firstName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{req.employeeId?.firstName} {req.employeeId?.lastName || ''}</p>
                      <p className="text-xs text-gray-500">{req.employeeId?.department} · {req.employeeId?.role}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        📅 {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} <span className="text-gray-600">({days} day{days !== 1 ? 's' : ''})</span>
                      </p>
                      {req.reason && <p className="text-xs text-gray-600 mt-1 italic">"{req.reason}"</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {req.status === 'Pending' ? (
                        <>
                          <button onClick={() => handleLeaveAction(req._id, 'Approved')}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors">
                            ✓ Approve
                          </button>
                          <button onClick={() => handleLeaveAction(req._id, 'Denied')}
                            className="text-xs bg-red-600/80 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors">
                            ✕ Deny
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                          req.status === 'Approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>{req.status}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── EMPLOYEES ── */}
        {tab === 'Employees' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Employee Directory</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {employees.map(emp => (
                  <div key={emp._id} onClick={() => setSelectedProfile(emp._id)}
                    className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.14] transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                      {emp.firstName?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{emp.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">{emp.role}</span>
                        {emp.departmentId?.name && <span className="text-[10px] text-gray-600">{emp.departmentId.name}</span>}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${emp.isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ATTENDANCE REPORT ── */}
        {tab === 'Attendance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Attendance Report — {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</h2>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'Records',  value: attendanceReport.summary?.total    || 0, color: 'text-white'      },
                { label: 'Present',  value: attendanceReport.summary?.present   || 0, color: 'text-emerald-400'},
                { label: 'Late',     value: attendanceReport.summary?.late      || 0, color: 'text-amber-400'  },
                { label: 'Absent',   value: attendanceReport.summary?.absent    || 0, color: 'text-red-400'    },
                { label: 'WFH',      value: attendanceReport.summary?.wfh       || 0, color: 'text-blue-400'   },
                { label: 'Avg Work', value: (() => { const m = attendanceReport.summary?.avgWorkMinutes||0; return `${Math.floor(m/60)}h ${m%60}m`; })(), color: 'text-indigo-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Records table */}
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : attendanceReport.records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records for this period.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.04] text-[10px] text-gray-500 uppercase tracking-widest">
                      <th className="text-left px-4 py-2.5">Employee</th>
                      <th className="text-left px-4 py-2.5">Date</th>
                      <th className="text-left px-4 py-2.5">Status</th>
                      <th className="text-left px-4 py-2.5">In</th>
                      <th className="text-left px-4 py-2.5">Out</th>
                      <th className="text-left px-4 py-2.5">Work</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReport.records.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-white">{r.user?.firstName} {r.user?.lastName || ''}</span>
                          <span className="block text-[10px] text-gray-600">{r.user?.department}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'Present' ? 'bg-green-500/20 text-green-400' :
                            r.status === 'Late'    ? 'bg-amber-500/20 text-amber-400' :
                            r.status === 'Absent'  ? 'bg-red-500/20 text-red-400'    :
                            r.status === 'WFH'     ? 'bg-blue-500/20 text-blue-400'  :
                            'bg-gray-500/20 text-gray-400'
                          }`}>{r.status}</span>
                          {r.isOvertime && <span className="ml-1 text-[10px] text-yellow-400">OT</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="px-4 py-2.5 text-gray-300 font-semibold text-xs">{r.totalWorkMinutes ? `${Math.floor(r.totalWorkMinutes/60)}h ${r.totalWorkMinutes%60}m` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
