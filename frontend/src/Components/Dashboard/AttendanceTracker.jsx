import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const STATUS_SEQUENCE = ['Not Checked In', 'Checked In', 'On Break', 'Checked Out'];

const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const AttendanceTracker = ({ onUpdate }) => {
  const { token } = useContext(AuthContext);
  const [record, setRecord]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [elapsed, setElapsed]   = useState(0); // live seconds since check-in
  const headers = { Authorization: `Bearer ${token}` };

  const fetchToday = async () => {
    try {
      const res = await axios.get('/api/attendance/today', { headers });
      setRecord(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchToday(); }, []);

  // Live clock ticker
  useEffect(() => {
    if (!record?.checkInTime || record.checkOutTime) return;
    const tick = setInterval(() => {
      const seconds = Math.floor((Date.now() - new Date(record.checkInTime)) / 1000);
      setElapsed(seconds);
    }, 1000);
    return () => clearInterval(tick);
  }, [record]);

  const act = async (endpoint, payload = {}) => {
    setActing(true);
    try {
      await axios.post(`/api/attendance/${endpoint}`, payload, { headers });
      await fetchToday();
      if (onUpdate) onUpdate();
      toast.success(
        endpoint === 'checkin'  ? '✅ Checked in!'    :
        endpoint === 'checkout' ? '👋 Checked out!'   :
        payload.action === 'start' ? '☕ Break started' : '▶ Break ended',
        { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setActing(false); }
  };

  // Derive state
  const isNotStarted  = !record?.checkInTime;
  const isOnBreak     = record?.checkInTime && !record?.checkOutTime && record?.breaks?.some(b => !b.endTime);
  const isCheckedOut  = !!record?.checkOutTime;
  const isWorking     = record?.checkInTime && !isOnBreak && !isCheckedOut;

  const liveWorkMin = isWorking ? Math.max(0, Math.floor(elapsed / 60) - (record?.totalBreakMinutes || 0)) : (record?.totalWorkMinutes || 0);

  const STATUS_MAP = {
    'Not Checked In': { label: 'Not Started',  dot: 'bg-gray-500', bar: 'bg-gray-600/20 border-gray-700' },
    'Present':        { label: 'Working',       dot: 'bg-green-400 animate-pulse', bar: 'bg-green-500/10 border-green-500/30' },
    'Late':           { label: 'Working (Late)',dot: 'bg-amber-400 animate-pulse', bar: 'bg-amber-500/10 border-amber-500/30' },
    'On Break':       { label: 'On Break',      dot: 'bg-blue-400 animate-pulse',  bar: 'bg-blue-500/10 border-blue-500/30' },
    'Checked Out':    { label: 'Done for Today',dot: 'bg-indigo-400',              bar: 'bg-indigo-500/10 border-indigo-500/30' },
  };

  const currentStatus = isCheckedOut ? 'Checked Out' : isOnBreak ? 'On Break' : (record?.status || 'Not Checked In');
  const statusInfo = STATUS_MAP[currentStatus] || STATUS_MAP['Not Checked In'];

  const liveDisplay = isWorking
    ? (() => { const h = Math.floor(liveWorkMin / 60), m = liveWorkMin % 60; return `${h}h ${String(m).padStart(2,'0')}m`; })()
    : formatDuration(liveWorkMin);

  if (loading) return (
    <div className="h-20 bg-white/[0.03] border border-white/10 rounded-2xl animate-pulse" />
  );

  return (
    <div className={`border rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap transition-all ${statusInfo.bar}`}>
      {/* Status dot + label */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`} />
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</p>
          <p className="text-sm font-bold text-white">{statusInfo.label}</p>
        </div>
      </div>

      {/* Live timer */}
      {record?.checkInTime && (
        <div className="flex-shrink-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Work Time</p>
          <p className="text-lg font-black text-white font-mono tracking-wider">{liveDisplay}</p>
        </div>
      )}

      {/* Break count */}
      {record?.breaks?.length > 0 && (
        <div className="flex-shrink-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Break</p>
          <p className="text-sm font-bold text-blue-300">{formatDuration(record.totalBreakMinutes)}</p>
        </div>
      )}

      {/* Check-in time */}
      {record?.checkInTime && (
        <div className="flex-shrink-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">In</p>
          <p className="text-sm font-bold text-white">{new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}

      {record?.isLate && (
        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Late</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex gap-2 flex-shrink-0 flex-wrap">
        {isNotStarted && (
          <button onClick={() => act('checkin')} disabled={acting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            {acting ? '…' : '▶ Check In'}
          </button>
        )}
        {isWorking && (
          <>
            <button onClick={() => act('break', { action: 'start' })} disabled={acting}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              {acting ? '…' : '☕ Break'}
            </button>
            <button onClick={() => act('checkout')} disabled={acting}
              className="bg-rose-600/80 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              {acting ? '…' : '⏹ Check Out'}
            </button>
          </>
        )}
        {isOnBreak && (
          <button onClick={() => act('break', { action: 'end' })} disabled={acting}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            {acting ? '…' : '▶ Resume Work'}
          </button>
        )}
        {isCheckedOut && (
          <div className="text-sm text-emerald-400 font-bold flex items-center gap-2">
            ✅ Done · {formatDuration(record.totalWorkMinutes)} worked
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
