import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'year'
  const [month, setMonth]       = useState(now.getMonth());
  const [year, setYear]         = useState(now.getFullYear());
  const [allRecords, setAllRecords] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Available year options (e.g. 2 years prior to next year)
  const currentYear = now.getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Fetch complete yearly attendance on year or userId change
  useEffect(() => {
    let isMounted = true;
    const fetchYearlyData = async () => {
      setLoading(true);
      try {
        const uid = userId ? `&userId=${userId}` : '';
        const res = await axios.get(`/api/attendance/yearly?year=${year}${uid}`, { headers });
        if (isMounted && res.data) {
          setAllRecords(res.data.records || []);
          setMonthlySummary(res.data.monthlySummary || []);
        }
      } catch {
        if (isMounted) {
          setAllRecords([]);
          setMonthlySummary([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchYearlyData();
    return () => { isMounted = false; };
  }, [year, userId, headers]);

  // Filter records for the active selected month
  const activeMonthRecords = useMemo(() => {
    return allRecords.filter(r => {
      const d = new Date(r.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month;
    });
  }, [allRecords, year, month]);

  // Map of active month's records by day
  const recordMap = useMemo(() => {
    const map = {};
    activeMonthRecords.forEach(r => {
      const d = new Date(r.date).getUTCDate();
      map[d] = r;
    });
    return map;
  }, [activeMonthRecords]);

  // Calendar cells calculation
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = useMemo(() => {
    const list = [];
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    return list;
  }, [firstDay, daysInMonth]);

  // Stats for the active month
  const monthStats = useMemo(() => {
    const present = activeMonthRecords.filter(r => r.status === 'Present').length;
    const late    = activeMonthRecords.filter(r => r.isLate).length;
    const absent  = activeMonthRecords.filter(r => r.status === 'Absent').length;
    const wfh     = activeMonthRecords.filter(r => r.status === 'WFH').length;
    const leave   = activeMonthRecords.filter(r => r.status === 'On Leave').length;
    const totalMinutes = activeMonthRecords.reduce((acc, r) => acc + (r.totalWorkMinutes || 0), 0);
    const avgWork = activeMonthRecords.length > 0 ? Math.round(totalMinutes / activeMonthRecords.length) : 0;
    
    return { present, late, absent, wfh, leave, avgWork, totalMinutes };
  }, [activeMonthRecords]);

  // Annual Year Stats across all 12 months
  const yearStats = useMemo(() => {
    const present = allRecords.filter(r => r.status === 'Present').length;
    const late    = allRecords.filter(r => r.isLate).length;
    const absent  = allRecords.filter(r => r.status === 'Absent').length;
    const wfh     = allRecords.filter(r => r.status === 'WFH').length;
    const leave   = allRecords.filter(r => r.status === 'On Leave').length;
    const totalMinutes = allRecords.reduce((acc, r) => acc + (r.totalWorkMinutes || 0), 0);
    const trackedDays  = present + absent + wfh + leave;
    const attendanceRate = trackedDays > 0 ? Math.round(((present + wfh) / trackedDays) * 100) : 0;

    return { present, late, absent, wfh, leave, totalMinutes, attendanceRate, totalLogged: allRecords.length };
  }, [allRecords]);

  // Navigation handlers
  const goBackMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goForwardMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const jumpToToday = () => {
    setMonth(now.getMonth());
    setYear(now.getFullYear());
    setViewMode('month');
  };

  const selectMonthCard = (mIndex) => {
    setMonth(mIndex);
    setViewMode('month');
  };

  return (
    <div className="bg-[#111827] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header Controls */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0B0F19]/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-zinc-100">
              {viewMode === 'year' ? `Yearly Attendance Overview (${year})` : `${MONTH_NAMES[month]} ${year}`}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {viewMode === 'year' ? '12 Months' : 'Monthly Detail'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {viewMode === 'year'
              ? 'Annual workforce analytics & month-by-month breakdown'
              : 'Daily check-in, check-out, break logs & work hours'}
          </p>
        </div>

        {/* Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📅 Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'year'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📊 Pure Year (12M)
            </button>
          </div>

          {/* Year Picker Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[11px] text-zinc-500 font-medium">Year:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-zinc-100 outline-none cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y} className="bg-slate-900 text-zinc-100">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Stepper Buttons (only visible in Month view) */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-1">
              <button
                onClick={goBackMonth}
                title="Previous Month"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-300 transition-colors cursor-pointer text-sm"
              >
                ‹
              </button>
              <button
                onClick={goForwardMonth}
                title="Next Month"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-300 transition-colors cursor-pointer text-sm"
              >
                ›
              </button>
            </div>
          )}

          {/* Jump to Today Button */}
          <button
            onClick={jumpToToday}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700/60 font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* 12-Month Navigation Pills Bar */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0B0F19]/40 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mr-1 hidden sm:inline-block">
            Months:
          </span>
          {MONTH_SHORT.map((mName, idx) => {
            const summary = monthlySummary.find(s => s.month === idx);
            const presentCount = summary ? summary.present : 0;
            const isSelected = month === idx && viewMode === 'month';
            const isCurrentMonth = idx === now.getMonth() && year === now.getFullYear();

            return (
              <button
                key={mName}
                onClick={() => selectMonthCard(idx)}
                className={`relative px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-md ring-1 ring-indigo-400/40'
                    : 'bg-slate-900/80 border border-slate-800/80 text-zinc-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{mName}</span>
                {presentCount > 0 && (
                  <span className={`text-[10px] px-1 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {presentCount}d
                  </span>
                )}
                {isCurrentMonth && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Current Month" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Annual Summary Metrics Strip (Shown in Year Mode) */}
      {viewMode === 'year' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 border-b border-slate-800/80 bg-[#0B0F19]/50">
          <div className="p-3 border-r border-b sm:border-b-0 border-slate-800/70 text-center">
            <p className="text-xl font-black text-emerald-400">{yearStats.present}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Present Days</p>
          </div>
          <div className="p-3 border-r border-b sm:border-b-0 border-slate-800/70 text-center">
            <p className="text-xl font-black text-blue-400">{yearStats.wfh}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">WFH Days</p>
          </div>
          <div className="p-3 border-r border-b sm:border-b-0 border-slate-800/70 text-center">
            <p className="text-xl font-black text-amber-400">{yearStats.late}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Late Marks</p>
          </div>
          <div className="p-3 border-r border-b sm:border-b-0 border-slate-800/70 text-center">
            <p className="text-xl font-black text-pink-400">{yearStats.leave}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Leaves Taken</p>
          </div>
          <div className="p-3 border-r border-slate-800/70 text-center">
            <p className="text-xl font-black text-indigo-400">{yearStats.attendanceRate}%</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Annual Rate</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xl font-black text-zinc-100">{Math.round(yearStats.totalMinutes / 60)} hrs</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Total Hours Logged</p>
          </div>
        </div>
      )}

      {/* Month Metrics Strip (Shown in Month Mode) */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-slate-800/80 bg-[#0B0F19]/50">
          {[
            { label: 'Present', value: monthStats.present, color: 'text-emerald-400' },
            { label: 'Late',    value: monthStats.late,    color: 'text-amber-400'   },
            { label: 'Absent',  value: monthStats.absent,  color: 'text-red-400'     },
            { label: 'WFH',     value: monthStats.wfh,     color: 'text-blue-400'    },
            { label: 'Leave',   value: monthStats.leave,   color: 'text-pink-400'    },
            { label: 'Avg Work',value: `${Math.floor(monthStats.avgWork / 60)}h ${monthStats.avgWork % 60}m`, color: 'text-zinc-100' },
          ].map(s => (
            <div key={s.label} className="text-center py-2.5 px-2 border-r border-slate-800/70 last:border-0">
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-zinc-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      {loading ? (
        <div className="p-6">
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-400 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading {year} attendance records…</span>
          </div>
        </div>
      ) : viewMode === 'year' ? (
        /* YEARLY VIEW: 12 Month Cards Grid */
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {MONTH_NAMES.map((mName, mIdx) => {
              const summary = monthlySummary.find(s => s.month === mIdx) || {
                present: 0, late: 0, absent: 0, wfh: 0, leave: 0, totalWorkMinutes: 0
              };
              const isCurrent = mIdx === now.getMonth() && year === now.getFullYear();
              const isSelected = mIdx === month;
              const workDaysInMonth = new Date(year, mIdx + 1, 0).getDate();
              const loggedDays = summary.present + summary.absent + summary.wfh + summary.leave;
              const rate = loggedDays > 0 ? Math.round(((summary.present + summary.wfh) / loggedDays) * 100) : 0;

              return (
                <div
                  key={mName}
                  onClick={() => selectMonthCard(mIdx)}
                  className={`group rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-slate-900/90 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-lg'
                      : isSelected
                        ? 'bg-slate-900/80 border-slate-700 shadow-md'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    {/* Card Month Title */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100 group-hover:text-indigo-400 transition-colors">
                          {mName}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {rate > 0 ? `${rate}%` : '—'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>

                    {/* Mini Stats Grid */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="bg-slate-800/50 rounded-lg p-1.5 border border-slate-800/80">
                        <span className="block text-[10px] text-zinc-400">Present</span>
                        <span className="font-bold text-emerald-400">{summary.present}</span>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-1.5 border border-slate-800/80">
                        <span className="block text-[10px] text-zinc-400">WFH</span>
                        <span className="font-bold text-blue-400">{summary.wfh}</span>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-1.5 border border-slate-800/80">
                        <span className="block text-[10px] text-zinc-400">Leaves</span>
                        <span className="font-bold text-pink-400">{summary.leave}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Link */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-indigo-300 transition-colors">
                    <span>
                      {summary.totalWorkMinutes > 0
                        ? `${Math.floor(summary.totalWorkMinutes / 60)}h ${summary.totalWorkMinutes % 60}m worked`
                        : `${workDaysInMonth} days`}
                    </span>
                    <span className="font-semibold flex items-center gap-0.5">
                      View Calendar <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MONTHLY VIEW: Calendar Grid */
        <div>
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-800/80 bg-[#0B0F19]/60">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-zinc-400 uppercase py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 p-3 gap-1.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const rec = recordMap[day];
              const style = rec ? STATUS_STYLES[rec.status] : null;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isFuture = new Date(year, month, day) > now;
              const isSelectedDay = selected && new Date(selected.date).getUTCDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => rec && setSelected(isSelectedDay ? null : rec)}
                  className={`relative h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    style
                      ? `${style.bg} ${style.text} hover:opacity-90 shadow-sm`
                      : isFuture
                        ? 'text-zinc-600 bg-slate-900/30 cursor-default'
                        : 'bg-slate-900/60 text-zinc-400 hover:bg-slate-800/80 hover:text-zinc-200'
                  } ${isToday ? 'ring-2 ring-indigo-400 font-extrabold' : ''} ${
                    isSelectedDay ? 'ring-2 ring-white scale-95' : ''
                  }`}
                >
                  <span className="text-xs">{day}</span>
                  {rec && (
                    <span className="text-[9px] font-medium opacity-90 leading-tight">
                      {rec.status === 'Present' ? (rec.isLate ? 'Late' : 'P') :
                       rec.status === 'WFH' ? 'WFH' :
                       rec.status === 'On Leave' ? 'Leave' :
                       rec.status === 'Half-Day' ? 'Half' :
                       rec.status === 'Absent' ? 'A' : ''}
                    </span>
                  )}
                  {rec?.isOvertime && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-300" title="Overtime" />
                  )}
                  {rec?.isLate && rec.status === 'Present' && (
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-orange-300" title="Late Arrival" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Expanded Detail Inspector */}
      {selected && viewMode === 'month' && (
        <div className="border-t border-slate-800/80 px-5 py-4 bg-[#0B0F19]/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
              {new Date(selected.date).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex gap-4 flex-wrap text-xs text-zinc-300">
            {selected.checkInTime && (
              <div>
                <span className="text-zinc-500">Check-In: </span>
                <span className={`font-semibold ${selected.isLate ? 'text-amber-300 font-bold' : 'text-white'}`}>
                  {new Date(selected.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {selected.isLate && (
                  <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
                    {selected.lateMinutes ? `+${selected.lateMinutes}m late (After 9:30 AM)` : 'Late (After 9:30 AM)'}
                  </span>
                )}
              </div>
            )}
            {selected.checkOutTime && (
              <div>
                <span className="text-zinc-500">Check-Out: </span>
                <span className="text-white font-semibold">
                  {new Date(selected.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {selected.totalWorkMinutes > 0 && (
              <div>
                <span className="text-zinc-500">Work Time: </span>
                <span className="text-emerald-400 font-semibold">
                  {Math.floor(selected.totalWorkMinutes / 60)}h {selected.totalWorkMinutes % 60}m
                </span>
              </div>
            )}
            {selected.breaks?.length > 0 && (
              <div>
                <span className="text-zinc-500">Breaks: </span>
                <span className="text-blue-400 font-semibold">
                  {selected.totalBreakMinutes}m ({selected.breaks.length}x)
                </span>
              </div>
            )}
            {selected.status && (
              <div>
                <span className="text-zinc-500">Status: </span>
                <span className={`font-semibold ${selected.isLate ? 'text-amber-300' : 'text-zinc-100'}`}>
                  {selected.isLate ? 'Late' : selected.status}
                </span>
              </div>
            )}
            {selected.isLate && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                ⚠️ Late Entry Logged
              </span>
            )}
            {selected.isOvertime && (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                Overtime Logged
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="border-t border-slate-800/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#0B0F19]/90 text-[10px] text-zinc-400">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${v.bg}`} />
              <span>{k}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-300" /> Late
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" /> Overtime
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
