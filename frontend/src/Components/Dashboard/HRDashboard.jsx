import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
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

  // Yearly Attendance Matrix state
  const now = new Date();
  const [attendanceView, setAttendanceView] = useState('matrix'); // 'matrix' | 'daily'
  const [selectedYear, setSelectedYear]     = useState(now.getFullYear());
  const [selectedDept, setSelectedDept]     = useState('All');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [yearlyReportData, setYearlyReportData] = useState({ year: now.getFullYear(), totalEmployees: 0, report: [] });
  const [yearlyLoading, setYearlyLoading]   = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState(['All']);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const yearOptions = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/hr/stats', { headers });
        setStats(res.data);
      } catch { /* ignore */ }
    };
    if (token) fetchStats();
  }, [token, headers]);

  // Fetch yearly attendance report whenever Attendance tab, year, or department changes
  useEffect(() => {
    if (tab === 'Attendance' && token) {
      const fetchYearly = async () => {
        setYearlyLoading(true);
        try {
          const deptParam = selectedDept !== 'All' ? `&department=${encodeURIComponent(selectedDept)}` : '';
          const res = await axios.get(`/api/hr/attendance/yearly-report?year=${selectedYear}${deptParam}`, { headers });
          setYearlyReportData(res.data || { year: selectedYear, totalEmployees: 0, report: [] });

          if (res.data?.report) {
            const depts = new Set(['All']);
            res.data.report.forEach(r => {
              if (r.employee?.department) depts.add(r.employee.department);
            });
            setAvailableDepartments(Array.from(depts));
          }
        } catch (err) {
          console.error('Yearly report fetch error:', err);
          toast.error('Failed to load yearly attendance report');
        } finally {
          setYearlyLoading(false);
        }
      };
      fetchYearly();
    }
  }, [tab, selectedYear, selectedDept, token, headers]);

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
        } else if (tab === 'Attendance' && attendanceView === 'daily') {
          const res = await axios.get(`/api/hr/attendance/report?from=${new Date(now.getFullYear(), now.getMonth(), 1).toISOString()}&to=${new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString()}`, { headers });
          setAttendanceReport(res.data);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchByTab();
  }, [tab, attendanceView, token, headers]);

  // Filter yearly report by employee search
  const filteredYearlyReport = useMemo(() => {
    if (!yearlyReportData?.report) return [];
    const q = attendanceSearch.trim().toLowerCase();
    if (!q) return yearlyReportData.report;
    return yearlyReportData.report.filter(r => {
      const name = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
      const dept = (r.employee?.department || '').toLowerCase();
      const empId = (r.employee?.employeeId || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || empId.includes(q);
    });
  }, [yearlyReportData, attendanceSearch]);

  // Summary statistics for the filtered yearly list
  const annualSummaryStats = useMemo(() => {
    const list = filteredYearlyReport;
    const totalEmployees = list.length;
    let totalPresent = 0;
    let totalLeaves = 0;
    let totalWFH = 0;
    let totalHours = 0;
    let sumRates = 0;

    list.forEach(r => {
      totalPresent += (r.totalPresent || 0);
      totalLeaves  += (r.totalLeaves || 0);
      totalWFH     += (r.totalWFH || 0);
      totalHours   += (r.totalHours || 0);
      sumRates     += (r.annualAttendanceRate || 0);
    });

    const avgRate = totalEmployees > 0 ? Math.round(sumRates / totalEmployees) : 0;
    return { totalEmployees, totalPresent, totalLeaves, totalWFH, totalHours, avgRate };
  }, [filteredYearlyReport]);

  // Export yearly attendance report to Excel (.xlsx)
  const exportYearlyExcel = () => {
    if (!filteredYearlyReport || filteredYearlyReport.length === 0) {
      return toast.error('No attendance data available to export');
    }

    const rows = filteredYearlyReport.map(item => {
      const row = {
        'Employee ID': item.employee?.employeeId || 'N/A',
        'Employee Name': `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.trim(),
        'Department': item.employee?.department || 'General',
        'Role': item.employee?.role || 'Employee',
      };

      MONTH_NAMES.forEach((mName, idx) => {
        const m = item.months?.[idx] || { present: 0, leaves: 0, wfh: 0, late: 0 };
        row[`${mName} Present (Days)`] = m.present || 0;
        row[`${mName} Late (Days)`]    = m.late || 0;
        row[`${mName} Leaves (Days)`]  = m.leaves || 0;
        row[`${mName} WFH (Days)`]     = m.wfh || 0;
      });

      row['Annual Total Present'] = item.totalPresent || 0;
      row['Annual Total Leaves']  = item.totalLeaves || 0;
      row['Annual Total WFH']     = item.totalWFH || 0;
      row['Annual Total Late']    = item.totalLate || 0;
      row['Annual Work Hours']    = item.totalHours || 0;
      row['Annual Attendance Rate'] = `${item.annualAttendanceRate || 0}%`;

      return row;
    });

    const monthlySummaryRows = MONTH_NAMES.map((mName, idx) => {
      let mPresent = 0;
      let mLeaves = 0;
      let mWFH = 0;
      let mLate = 0;

      filteredYearlyReport.forEach(item => {
        const m = item.months?.[idx];
        if (m) {
          mPresent += (m.present || 0);
          mLeaves  += (m.leaves || 0);
          mWFH     += (m.wfh || 0);
          mLate    += (m.late || 0);
        }
      });

      return {
        'Month': mName,
        'Year': selectedYear,
        'Total Present Days': mPresent,
        'Total Leave Days': mLeaves,
        'Total WFH Days': mWFH,
        'Total Late Instances': mLate,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(rows);
    const ws2 = XLSX.utils.json_to_sheet(monthlySummaryRows);

    XLSX.utils.book_append_sheet(wb, ws1, 'Annual Attendance Matrix');
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Totals');

    const fileName = `TeamPulse_Annual_Attendance_${selectedYear}${selectedDept !== 'All' ? `_${selectedDept}` : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Downloaded ${fileName}! 📊`, {
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
    });
  };

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
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <div className="border-b border-white/[0.07] bg-[#111318]/95 sticky top-0 z-20 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button onClick={onBack} className="hover:text-white transition-colors">← Dashboard</button>
          <span>/</span><span className="text-white font-semibold">HR Dashboard</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">People & Operations Portal</h1>
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

        {tab === 'Overview' && (
          <>
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

        {tab === 'Attendance' && (
          <div className="space-y-5">
            {/* Header & Control Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📅</span> Annual Attendance & Leave Matrix
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track and report monthly attendance, leaves, and attendance rates for all employees for {selectedYear}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Switcher */}
                <div className="flex bg-white/[0.05] p-0.5 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setAttendanceView('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      attendanceView === 'matrix'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📊 12-Month Matrix
                  </button>
                  <button
                    onClick={() => setAttendanceView('daily')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      attendanceView === 'daily'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📋 Daily Logs
                  </button>
                </div>

                {/* Year Select */}
                <div className="flex items-center gap-1.5 bg-[#161b26] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                  <span className="text-gray-500 font-medium">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y} className="bg-[#111827] text-white">{y}</option>
                    ))}
                  </select>
                </div>

                {/* Department Select */}
                <div className="flex items-center gap-1.5 bg-[#161b26] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                  <span className="text-gray-500 font-medium">Dept:</span>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                  >
                    {availableDepartments.map(d => (
                      <option key={d} value={d} className="bg-[#111827] text-white">{d}</option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={attendanceSearch}
                    onChange={e => setAttendanceSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="bg-[#161b26] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-44 transition-all"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                  {attendanceSearch && (
                    <button
                      onClick={() => setAttendanceSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Export Excel Button */}
                <button
                  onClick={exportYearlyExcel}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                  title="Download full 12-month report with employee matrix and monthly totals in Excel format"
                >
                  <span>📥</span>
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Matrix View Content */}
            {attendanceView === 'matrix' && (
              <>
                {/* Key Metric Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-[#111827]/80 border border-white/[0.07] rounded-xl p-3.5">
                    <p className="text-2xl font-black text-white">{annualSummaryStats.totalEmployees}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Active Staff</p>
                  </div>
                  <div className="bg-[#111827]/80 border border-emerald-500/20 rounded-xl p-3.5">
                    <p className="text-2xl font-black text-emerald-400">{annualSummaryStats.totalPresent} <span className="text-xs font-normal text-emerald-500/80">days</span></p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Total Present</p>
                  </div>
                  <div className="bg-[#111827]/80 border border-rose-500/20 rounded-xl p-3.5">
                    <p className="text-2xl font-black text-rose-400">{annualSummaryStats.totalLeaves} <span className="text-xs font-normal text-rose-500/80">days</span></p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Total Leaves</p>
                  </div>
                  <div className="bg-[#111827]/80 border border-blue-500/20 rounded-xl p-3.5">
                    <p className="text-2xl font-black text-blue-400">{annualSummaryStats.totalWFH} <span className="text-xs font-normal text-blue-500/80">days</span></p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Total WFH</p>
                  </div>
                  <div className="bg-[#111827]/80 border border-indigo-500/20 rounded-xl p-3.5 col-span-2 sm:col-span-1">
                    <p className="text-2xl font-black text-indigo-400">{annualSummaryStats.avgRate}%</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Avg Annual Rate</p>
                  </div>
                </div>

                {/* 12-Month Matrix Table */}
                {yearlyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredYearlyReport.length === 0 ? (
                  <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-gray-400 font-semibold">No attendance records found for {selectedYear}</p>
                    <p className="text-xs text-gray-600 mt-1">Try selecting a different year or department filter.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#111318]/90 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto max-h-[650px] relative">
                      <table className="w-full text-xs text-left border-collapse">
                        {/* Table Header */}
                        <thead className="bg-[#161b26] sticky top-0 z-20 text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                          <tr>
                            <th className="py-3 px-4 sticky left-0 z-30 bg-[#161b26] min-w-[190px] shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                              Employee
                            </th>
                            {MONTH_NAMES.map(m => (
                              <th key={m} className="py-3 px-2 text-center min-w-[70px] border-l border-white/[0.05]">
                                {m}
                              </th>
                            ))}
                            <th className="py-3 px-3 text-center min-w-[75px] border-l border-white/10 bg-[#1a202c]">
                              Present
                            </th>
                            <th className="py-3 px-3 text-center min-w-[70px] bg-[#1a202c]">
                              Late
                            </th>
                            <th className="py-3 px-3 text-center min-w-[70px] bg-[#1a202c]">
                              Leaves
                            </th>
                            <th className="py-3 px-3 text-center min-w-[70px] bg-[#1a202c]">
                              Rate
                            </th>
                          </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredYearlyReport.map((item, idx) => {
                            const emp = item.employee || {};
                            const rateColor = item.annualAttendanceRate >= 85
                              ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                              : item.annualAttendanceRate >= 70
                              ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                              : 'text-rose-400 bg-rose-500/15 border-rose-500/30';

                            return (
                              <tr
                                key={emp._id || idx}
                                className="hover:bg-white/[0.03] transition-colors group"
                              >
                                {/* Sticky Employee Column */}
                                <td className="py-2.5 px-4 sticky left-0 z-10 bg-[#111318] group-hover:bg-[#161a24] shadow-[2px_0_5px_rgba(0,0,0,0.5)] transition-colors">
                                  <div
                                    className="flex items-center gap-2.5 cursor-pointer"
                                    onClick={() => setSelectedProfile(emp._id)}
                                    title="View employee profile"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                                      {emp.firstName?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-white truncate text-xs group-hover:text-indigo-400 transition-colors">
                                        {emp.firstName} {emp.lastName || ''}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-gray-400 font-medium truncate max-w-[90px]">
                                          {emp.department || 'General'}
                                        </span>
                                        {emp.employeeId && (
                                          <span className="text-[9px] text-gray-600 font-mono">
                                            #{emp.employeeId}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 12 Month Cells */}
                                {MONTH_NAMES.map((_, mIdx) => {
                                  const mData = item.months?.[mIdx] || { present: 0, leaves: 0, wfh: 0, late: 0 };
                                  const hasActivity = (mData.present > 0 || mData.leaves > 0 || mData.wfh > 0);

                                  return (
                                    <td
                                      key={mIdx}
                                      className="py-2 px-1 text-center border-l border-white/[0.04] align-middle"
                                    >
                                      {hasActivity ? (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          {mData.present > 0 && (
                                            <span
                                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 leading-none"
                                              title={`${mData.present} day(s) present in ${MONTH_NAMES[mIdx]}`}
                                            >
                                              P: {mData.present}
                                            </span>
                                          )}
                                          {mData.late > 0 && (
                                            <span
                                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25 leading-none"
                                              title={`${mData.late} day(s) late check-in (after 9:30 AM) in ${MONTH_NAMES[mIdx]}`}
                                            >
                                              Late: {mData.late}
                                            </span>
                                          )}
                                          {mData.leaves > 0 && (
                                            <span
                                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 leading-none"
                                              title={`${mData.leaves} day(s) on leave in ${MONTH_NAMES[mIdx]}`}
                                            >
                                              L: {mData.leaves}
                                            </span>
                                          )}
                                          {mData.wfh > 0 && (
                                            <span
                                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/15 text-blue-400 leading-none"
                                              title={`${mData.wfh} day(s) WFH in ${MONTH_NAMES[mIdx]}`}
                                            >
                                              W: {mData.wfh}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-700 font-mono text-xs">—</span>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Annual Summary Cells */}
                                <td className="py-2.5 px-3 text-center border-l border-white/10 bg-[#161a24]/50">
                                  <span className="text-xs font-bold text-emerald-400">
                                    {item.totalPresent}d
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center bg-[#161a24]/50">
                                  <span className={`text-xs font-bold ${item.totalLate > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                                    {item.totalLate || 0}d
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center bg-[#161a24]/50">
                                  <span className="text-xs font-bold text-rose-400">
                                    {item.totalLeaves}d
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center bg-[#161a24]/50">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${rateColor}`}>
                                    {item.annualAttendanceRate}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer & Legend */}
                    <div className="bg-[#161b26] border-t border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-semibold text-gray-300">Legend:</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                          <span><strong className="text-emerald-400">P</strong> = Present Days</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                          <span><strong className="text-amber-300">Late</strong> = Check-In After 9:30 AM</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                          <span><strong className="text-rose-400">L</strong> = Leave Days (Approved)</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                          <span><strong className="text-blue-400">W</strong> = Work From Home</span>
                        </span>
                      </div>
                      <div className="text-gray-500 text-[10px]">
                        Showing {filteredYearlyReport.length} of {yearlyReportData.totalEmployees || filteredYearlyReport.length} employees
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Daily Logs View Content */}
            {attendanceView === 'daily' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-bold text-white">Daily Attendance Records — Current Month</h3>
                  <span className="text-xs text-gray-500">Office Start: 9:30 AM · Logs after 9:30 AM marked as Late</span>
                </div>

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
                          <th className="text-left px-4 py-2.5">In (Check-In)</th>
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
                                (r.status === 'Late' || r.isLate) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                r.status === 'Present' ? 'bg-green-500/20 text-green-400' :
                                r.status === 'Absent'  ? 'bg-red-500/20 text-red-400'    :
                                r.status === 'WFH'     ? 'bg-blue-500/20 text-blue-400'  :
                                'bg-gray-500/20 text-gray-400'
                              }`}>{r.status === 'Late' || r.isLate ? 'Late' : r.status}</span>
                              {r.isOvertime && <span className="ml-1 text-[10px] text-yellow-400">OT</span>}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs">
                              {r.checkInTime ? (
                                <div>
                                  <span className={`font-semibold ${r.isLate || r.status === 'Late' ? 'text-amber-300' : 'text-gray-300'}`}>
                                    {new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {(r.isLate || r.status === 'Late') && (
                                    <span className="block text-[10px] text-amber-400/90 font-sans">
                                      {r.lateMinutes ? `+${r.lateMinutes}m late` : 'After 9:30 AM'}
                                    </span>
                                  )}
                                </div>
                              ) : '—'}
                            </td>
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
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
