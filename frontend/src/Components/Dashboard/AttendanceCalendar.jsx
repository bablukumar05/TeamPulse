import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_STYLES = {
  Present:    { bg: 'bg-emerald-500',  text: 'text-white',     label: '● Present'    },
  Late:       { bg: 'bg-amber-500',    text: 'text-white',     label: '● Late'       },
  Absent:     { bg: 'bg-red-500/80',   text: 'text-white',     label: '● Absent'     },
  WFH:        { bg: 'bg-blue-500',     text: 'text-white',     label: '● WFH'        },
  'Half-Day': { bg: 'bg-orange-400',   text: 'text-white',     label: '● Half-Day'   },
  Holiday:    { bg: 'bg-purple-500',   text: 'text-white',     label: '● Holiday'    },
  'On Leave': { bg: 'bg-pink-500',     text: 'text-white',     label: '● On Leave'   },
};

const AttendanceCalendar = ({ userId }) => {
  const { token } = useContext(AuthContext);
  const now = new Date();
  const [month, setMonth]     = useState(now.getMonth());
  const [year, setYear]       = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const uid = userId || '';
        const res = await axios.get(`/api/attendance/calendar?month=${month}&year=${year}${uid ? `&userId=${uid}` : ''}`, { headers });
        setRecords(res.data || []);
      } catch { setRecords([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [month, year, userId, token]);

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const recordMap = {};
  records.forEach(r => {
    const d = new Date(r.date).getDate();
    recordMap[d] = r;
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goBack    = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goForward = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Stats
  const stats = {
    Present:  records.filter(r => r.status === 'Present').length,
    Late:     records.filter(r => r.isLate).length,
    Absent:   records.filter(r => r.status === 'Absent').length,
    WFH:      records.filter(r => r.status === 'WFH').length,
    Leave:    records.filter(r => r.status === 'On Leave').length,
    avgWork:  records.length > 0 ? Math.round(records.reduce((a,r) => a + (r.totalWorkMinutes||0), 0) / records.length) : 0,
  };

  return (
    <div className="bg-[#111318] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div>
          <h3 className="font-bold text-white">{MONTH_NAMES[month]} {year}</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Attendance Calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">‹</button>
          <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 transition-colors">Today</button>
          <button onClick={goForward} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">›</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-white/[0.06]">
        {[
          { label: 'Present', value: stats.Present, color: 'text-emerald-400' },
          { label: 'Late',    value: stats.Late,    color: 'text-amber-400'   },
          { label: 'Absent',  value: stats.Absent,  color: 'text-red-400'     },
          { label: 'WFH',     value: stats.WFH,     color: 'text-blue-400'    },
          { label: 'Leave',   value: stats.Leave,   color: 'text-pink-400'    },
          { label: 'Avg Work',value: `${Math.floor(stats.avgWork/60)}h ${stats.avgWork%60}m`, color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="text-center py-2 px-1 border-r border-white/[0.04] last:border-0">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-600 uppercase py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="grid grid-cols-7 p-3 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 p-3 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const rec = recordMap[day];
            const style = rec ? STATUS_STYLES[rec.status] : null;
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const isFuture = new Date(year, month, day) > now;

            return (
              <button
                key={day}
                onClick={() => rec && setSelected(selected?.date === rec.date ? null : rec)}
                className={`relative h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  style ? `${style.bg} ${style.text} hover:opacity-90 shadow-sm` :
                  isFuture ? 'text-gray-700 cursor-default' :
                  'bg-white/[0.03] text-gray-500 hover:bg-white/[0.08]'
                } ${isToday ? 'ring-2 ring-white/40' : ''}`}
              >
                {day}
                {rec?.isOvertime && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400" title="Overtime" />}
                {rec?.isLate && rec.status === 'Present' && <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-orange-300" title="Late" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected day detail */}
      {selected && (
        <div className="border-t border-white/[0.06] px-5 py-4 flex items-start gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
              {new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex gap-3 flex-wrap">
              {selected.checkInTime && (
                <div className="text-xs"><span className="text-gray-600">In: </span><span className="text-white font-semibold">{new Date(selected.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
              )}
              {selected.checkOutTime && (
                <div className="text-xs"><span className="text-gray-600">Out: </span><span className="text-white font-semibold">{new Date(selected.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
              )}
              {selected.totalWorkMinutes > 0 && (
                <div className="text-xs"><span className="text-gray-600">Worked: </span><span className="text-emerald-400 font-semibold">{Math.floor(selected.totalWorkMinutes/60)}h {selected.totalWorkMinutes%60}m</span></div>
              )}
              {selected.breaks?.length > 0 && (
                <div className="text-xs"><span className="text-gray-600">Breaks: </span><span className="text-blue-400 font-semibold">{selected.totalBreakMinutes}m ({selected.breaks.length}x)</span></div>
              )}
              {selected.isLate   && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Late</span>}
              {selected.isOvertime && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">Overtime</span>}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-white/[0.06] px-5 py-3 flex flex-wrap gap-3">
        {Object.entries(STATUS_STYLES).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-sm ${v.bg}`} />{k}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
