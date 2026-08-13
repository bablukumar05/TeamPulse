import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../Context/AuthProvider';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const REPORT_TABS = ['Productivity', 'Attendance', 'Sprint Velocity', 'Leave Balances'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ReportsPage = ({ onBack }) => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab]   = useState('Productivity');
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (activeTab === 'Productivity')    endpoint = '/api/reports/productivity';
        else if (activeTab === 'Attendance') endpoint = '/api/reports/attendance';
        else if (activeTab === 'Sprint Velocity') endpoint = '/api/reports/sprints';
        else if (activeTab === 'Leave Balances')   endpoint = '/api/reports/leaves';

        const res = await axios.get(endpoint, { headers });
        if (activeTab === 'Attendance') {
          setData(res.data.records || []);
        } else {
          setData(res.data || []);
        }
      } catch {
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReport();
  }, [activeTab, token]);

  // Export to Excel (.xlsx)
  const exportExcel = () => {
    if (data.length === 0) return toast.error('No data to export');
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
      if (activeTab === 'Productivity') {
        return {
          Name: `${item.user?.firstName || ''} ${item.user?.lastName || ''}`,
          Department: item.user?.department || '',
          TotalTasks: item.total,
          CompletedTasks: item.completed,
          OverdueTasks: item.overdue,
          CompletionRate: `${item.completionRate}%`,
          StoryPoints: item.storyPoints
        };
      } else if (activeTab === 'Sprint Velocity') {
        return {
          SprintName: item.name,
          Project: item.projectName,
          Status: item.status,
          TotalTasks: item.totalTasks,
          CompletedTasks: item.completedTasks,
          VelocityPoints: item.velocity
        };
      } else if (activeTab === 'Leave Balances') {
        return {
          Name: `${item.user?.firstName || ''} ${item.user?.lastName || ''}`,
          Department: item.user?.department || '',
          DaysUsed: item.daysUsed,
          AnnualRemaining: item.annualRemaining,
          ApprovedRequests: item.approved,
          PendingRequests: item.pending
        };
      }
      return item;
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `TeamPulse_${activeTab.replace(/\s+/g, '_')}_Report.xlsx`);
    toast.success('Excel report downloaded! 📊');
  };

  // Export to CSV
  const exportCSV = () => {
    if (data.length === 0) return toast.error('No data to export');
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TeamPulse_${activeTab.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded!');
  };

  // Export to PDF
  const exportPDF = () => {
    if (data.length === 0) return toast.error('No data to export');
    const doc = new jsPDF();
    doc.text(`TeamPulse — ${activeTab} Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    let head = [];
    let body = [];

    if (activeTab === 'Productivity') {
      head = [['Name', 'Department', 'Total', 'Completed', 'Overdue', 'Rate']];
      body = data.map(d => [
        `${d.user?.firstName || ''} ${d.user?.lastName || ''}`,
        d.user?.department || '-',
        d.total,
        d.completed,
        d.overdue,
        `${d.completionRate}%`
      ]);
    } else if (activeTab === 'Sprint Velocity') {
      head = [['Sprint', 'Project', 'Status', 'Tasks Done', 'Velocity Pts']];
      body = data.map(d => [d.name, d.projectName, d.status, `${d.completedTasks}/${d.totalTasks}`, d.velocity]);
    } else if (activeTab === 'Leave Balances') {
      head = [['Employee', 'Department', 'Days Used', 'Annual Remaining', 'Status']];
      body = data.map(d => [`${d.user?.firstName || ''} ${d.user?.lastName || ''}`, d.user?.department || '-', d.daysUsed, d.annualRemaining, 'Active']);
    } else {
      head = [['Record', 'Date', 'Status']];
      body = data.slice(0, 30).map(d => [d._id, new Date(d.date || d.createdAt).toLocaleDateString(), d.status || 'Active']);
    }

    doc.autoTable({
      head,
      body,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`TeamPulse_${activeTab.replace(/\s+/g, '_')}_Report.pdf`);
    toast.success('PDF report downloaded! 📄');
  };

  return (
    <div className="min-h-screen bg-[#0a0c11] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.07] bg-[#111318]/95 sticky top-0 z-20 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {onBack && <button onClick={onBack} className="hover:text-white transition-colors">← Dashboard</button>}
          {onBack && <span>/</span>}
          <span className="text-white font-semibold">Reports & Analytics</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Executive Reports
          </h1>
          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button onClick={exportPDF} className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl transition-colors">
              📄 PDF
            </button>
            <button onClick={exportExcel} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl transition-colors">
              📊 Excel
            </button>
            <button onClick={exportCSV} className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl transition-colors">
              💾 CSV
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0 mt-3 overflow-x-auto border-t border-white/[0.06] -mx-6 px-6">
          {REPORT_TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Chart Section */}
            {activeTab === 'Productivity' && data.length > 0 && (
              <div className="bg-[#12141c] border border-white/[0.07] rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-300">Task Completion per Team Member</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.map(d => ({ name: d.user?.firstName || 'User', Completed: d.completed, Total: d.total }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#181a24', borderColor: '#333' }} />
                      <Legend />
                      <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'Sprint Velocity' && data.length > 0 && (
              <div className="bg-[#12141c] border border-white/[0.07] rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-300">Sprint Velocity (Story Points Delivered)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.map(d => ({ name: d.name, Velocity: d.velocity, TotalPoints: d.totalPoints }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#181a24', borderColor: '#333' }} />
                      <Legend />
                      <Bar dataKey="Velocity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="TotalPoints" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="bg-[#12141c] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">{activeTab} Details</h3>
                <span className="text-xs text-gray-500">{data.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-white/[0.04] text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/[0.06]">
                      {activeTab === 'Productivity' && (
                        <>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Total Tasks</th>
                          <th className="px-4 py-3">Completed</th>
                          <th className="px-4 py-3">Overdue</th>
                          <th className="px-4 py-3">Completion Rate</th>
                        </>
                      )}
                      {activeTab === 'Sprint Velocity' && (
                        <>
                          <th className="px-4 py-3">Sprint Name</th>
                          <th className="px-4 py-3">Project</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Tasks (Done/Total)</th>
                          <th className="px-4 py-3">Velocity Points</th>
                        </>
                      )}
                      {activeTab === 'Leave Balances' && (
                        <>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3">Days Used</th>
                          <th className="px-4 py-3">Annual Remaining</th>
                          <th className="px-4 py-3">Approved Requests</th>
                        </>
                      )}
                      {activeTab === 'Attendance' && (
                        <>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Work Minutes</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-500">No data found.</td></tr>
                    ) : (
                      data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          {activeTab === 'Productivity' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-white">{row.user?.firstName} {row.user?.lastName}</td>
                              <td className="px-4 py-3 text-gray-400">{row.user?.department || '-'}</td>
                              <td className="px-4 py-3 text-gray-300">{row.total}</td>
                              <td className="px-4 py-3 text-emerald-400 font-bold">{row.completed}</td>
                              <td className="px-4 py-3 text-red-400">{row.overdue}</td>
                              <td className="px-4 py-3 text-indigo-400 font-bold">{row.completionRate}%</td>
                            </>
                          )}
                          {activeTab === 'Sprint Velocity' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                              <td className="px-4 py-3 text-gray-400">{row.projectName}</td>
                              <td className="px-4 py-3"><span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{row.status}</span></td>
                              <td className="px-4 py-3 text-gray-300">{row.completedTasks}/{row.totalTasks}</td>
                              <td className="px-4 py-3 text-purple-400 font-mono font-bold">{row.velocity} pts</td>
                            </>
                          )}
                          {activeTab === 'Leave Balances' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-white">{row.user?.firstName} {row.user?.lastName}</td>
                              <td className="px-4 py-3 text-amber-400 font-bold">{row.daysUsed} days</td>
                              <td className="px-4 py-3 text-emerald-400 font-bold">{row.annualRemaining} days</td>
                              <td className="px-4 py-3 text-gray-300">{row.approved}</td>
                            </>
                          )}
                          {activeTab === 'Attendance' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-white">{row.user?.firstName} {row.user?.lastName}</td>
                              <td className="px-4 py-3 text-gray-400">{new Date(row.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3"><span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{row.status}</span></td>
                              <td className="px-4 py-3 text-indigo-400 font-mono">{row.totalWorkMinutes} mins</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
