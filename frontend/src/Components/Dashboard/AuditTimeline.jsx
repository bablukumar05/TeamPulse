import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../../Context/AuthProvider";

const AuditTimeline = ({ refreshTrigger }) => {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/admin/audit', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to load audit logs");
      }
    };
    if (token) fetchLogs();
  }, [token, refreshTrigger]);

  const getActionColor = (action) => {
    if (action.includes('CREATED')) return 'from-blue-500 to-indigo-600';
    if (action.includes('UPDATED') || action.includes('ADDED') || action.includes('Active') || action.includes('Completed')) return 'from-emerald-500 to-teal-600';
    if (action.includes('FAILED') || action.includes('DELETED')) return 'from-red-500 to-rose-600';
    return 'from-gray-500 to-slate-600';
  };

  return (
    <div className="w-full mt-8 bg-white/5 border border-white/10 backdrop-blur-md p-6 lg:p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">System Audit Timeline</h2>
      
      <div className="relative border-l border-white/10 ml-3 md:ml-6 mt-4 space-y-8 pb-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
        {logs.map((log) => (
          <div key={log._id} className="relative pl-6 md:pl-8">
            <div className={`absolute w-4 h-4 bg-gradient-to-br ${getActionColor(log.action)} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] border-2 border-[#1A1A1A] -left-[9px] top-1`}></div>
            <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-4 shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors tracking-wide">{log.performedByName}</span>
                <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{log.details}</p>
              <div className="mt-2 text-right">
                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{log.action.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="pl-8 text-gray-500 italic">No system activities recorded yet.</div>
        )}
      </div>
    </div>
  );
};

export default AuditTimeline;
