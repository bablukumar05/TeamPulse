import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';
import AttendanceCalendar from '../Dashboard/AttendanceCalendar';

const TABS = ['Overview', 'Tasks', 'Attendance', 'Performance', 'Documents'];

const BADGE_COLORS = {
  'Rookie':           'from-gray-500 to-gray-600',
  'Bronze Challenger':'from-amber-700 to-amber-600',
  'Silver Specialist':'from-gray-400 to-gray-300',
  'Gold Elite':       'from-yellow-500 to-amber-400',
  'Platinum Master':  'from-cyan-400 to-indigo-500',
};

const ROLE_COLOR = {
  Admin:    'bg-red-500/20 text-red-400 border-red-500/30',
  Manager:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Employee: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const EmployeeProfile = ({ userId, onBack }) => {
  const { token, authUser } = useContext(AuthContext);
  const [profile, setProfile]   = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('Overview');
  const [docUploading, setDocUploading] = useState(false);
  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'manager';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [profileRes, tasksRes] = await Promise.all([
          axios.get(`/api/hr/employees/${userId}`, { headers }),
          axios.get(`/api/admin/tasks/all`, { headers }),
        ]);
        setProfile(profileRes.data);
        setTasks(tasksRes.data.filter(t => t.assignedTo?._id === userId || t.assignedTo === userId));
      } catch (err) {
        toast.error('Failed to load profile');
      } finally { setLoading(false); }
    };
    if (userId) fetch();
  }, [userId, token]);

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('name', file.name);
      fd.append('type', 'Document');
      const res = await axios.post(`/api/hr/employees/${userId}/documents`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setProfile(p => ({ ...p, documents: res.data.documents }));
      toast.success('Document uploaded', { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
    } catch { toast.error('Upload failed'); }
    finally { setDocUploading(false); }
  };

  const handleDeleteDoc = async (idx) => {
    if (!window.confirm('Remove this document?')) return;
    try {
      const res = await axios.delete(`/api/hr/employees/${userId}/documents/${idx}`, { headers });
      setProfile(p => ({ ...p, documents: res.data.documents }));
      toast.success('Document removed');
    } catch { toast.error('Failed to remove document'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c11] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading profile…</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#0a0c11] flex items-center justify-center">
      <p className="text-gray-400">Profile not found.</p>
    </div>
  );

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overdueTasks   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const initials = `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#0a0c11] text-white">
      {/* Profile Hero */}
      <div className="bg-gradient-to-b from-indigo-900/20 to-[#0a0c11] border-b border-white/[0.07] px-6 py-8">
        <button onClick={onBack} className="text-xs text-gray-500 hover:text-white mb-6 flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <div className="flex items-start gap-5 flex-wrap max-w-4xl">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.firstName} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white border-2 border-indigo-500/40">
                {initials}
              </div>
            )}
            <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-[#0a0c11] ${profile.isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-black text-white">{profile.firstName} {profile.lastName}</h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[profile.role] || ROLE_COLOR.Employee}`}>{profile.role}</span>
              {profile.employeeId && <span className="text-[11px] text-gray-500 font-mono">{profile.employeeId}</span>}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
              {profile.departmentId?.name && <span>🏢 {profile.departmentId.name}</span>}
              {profile.teamId?.name       && <span>👥 {profile.teamId.name}</span>}
              {profile.email              && <span>✉ {profile.email}</span>}
              {profile.phone              && <span>📞 {profile.phone}</span>}
            </div>

            {profile.bio && <p className="text-sm text-gray-500 max-w-xl mb-3">{profile.bio}</p>}

            {/* Manager */}
            {profile.managerId && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Reports to:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                    {profile.managerId.firstName?.charAt(0)}
                  </div>
                  <span className="text-gray-300 font-semibold">{profile.managerId.firstName} {profile.managerId.lastName}</span>
                </div>
              </div>
            )}
          </div>

          {/* XP / Badge */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-black text-white mb-0.5">{profile.xp || 0} <span className="text-sm text-gray-500 font-normal">XP</span></div>
            {profile.badges?.slice(-1).map(b => (
              <span key={b} className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${BADGE_COLORS[b] || 'from-gray-500 to-gray-600'}`}>{b}</span>
            ))}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0 mt-6 overflow-x-auto border-t border-white/[0.06] -mx-6 px-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Body */}
      <div className="px-6 py-6 max-w-4xl">

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Tasks',    value: tasks.length,     color: 'text-blue-400',    icon: '📋' },
                { label: 'Completed',      value: completedTasks,   color: 'text-green-400',   icon: '✅' },
                { label: 'Overdue',        value: overdueTasks,     color: 'text-red-400',     icon: '⚠️' },
                { label: 'Completion',     value: `${completionRate}%`, color: 'text-indigo-400', icon: '📊' },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(s => (
                    <span key={s} className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Experience</h3>
                <div className="space-y-2">
                  {profile.experience.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">💼</div>
                      <div>
                        <p className="text-sm font-semibold text-white">{e.title}</p>
                        <p className="text-xs text-gray-500">{e.company} · {e.years} yr{e.years !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Join Date',    value: profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Timezone',     value: profile.timezone || '—' },
                  { label: 'Status',       value: profile.status   || '—' },
                  { label: 'Employment',   value: profile.employmentStatus || '—' },
                  { label: 'Salary',       value: profile.baseSalaryLPA ? `₹${profile.baseSalaryLPA} LPA` : '—' },
                  { label: 'Department',   value: profile.department || profile.departmentId?.name || '—' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-2.5">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS ── */}
        {tab === 'Tasks' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white">Task History</h3>
              <span className="text-xs text-gray-500">{tasks.length} total · {completedTasks} completed</span>
            </div>
            {tasks.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No tasks assigned.</p>
            ) : (
              tasks.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => (
                <div key={t._id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <span className="text-sm">{t.status === 'Completed' ? '✅' : t.status === 'Blocked' ? '🚫' : '⬜'}</span>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-sm font-semibold truncate ${t.status === 'Completed' ? 'text-gray-500 line-through' : 'text-white'}`}>{t.title}</p>
                    <p className="text-[10px] text-gray-600">{t.status} · {t.priority}</p>
                  </div>
                  {t.dueDate && (
                    <p className={`text-[10px] font-semibold flex-shrink-0 ${new Date(t.dueDate) < new Date() && t.status !== 'Completed' ? 'text-red-400' : 'text-gray-600'}`}>
                      {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {tab === 'Attendance' && (
          <AttendanceCalendar userId={userId} />
        )}

        {/* ── PERFORMANCE ── */}
        {tab === 'Performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'XP Points',   value: profile.xp || 0,             sub: 'Total experience points', icon: '⚡', color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/20' },
                { label: 'Completion %', value: `${completionRate}%`,        sub: `${completedTasks}/${tasks.length} tasks`, icon: '🎯', color: 'from-green-500/20 to-emerald-500/10 border-green-500/20' },
                { label: 'Current Badge',value: profile.badges?.slice(-1)[0] || 'Rookie', sub: 'Earned through XP', icon: '🏅', color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/20' },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-2xl p-5`}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-sm font-semibold text-gray-300 mt-0.5">{s.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Badge history */}
            {profile.badges?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Badge History</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b, i) => (
                    <span key={i} className={`text-sm font-bold px-4 py-2 rounded-full text-white bg-gradient-to-r ${BADGE_COLORS[b] || 'from-gray-500 to-gray-600'}`}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* XP Progress bar to next badge */}
            {(() => {
              const xp = profile.xp || 0;
              const tiers = [
                { name: 'Bronze Challenger', threshold: 200  },
                { name: 'Silver Specialist',  threshold: 500  },
                { name: 'Gold Elite',          threshold: 1000 },
                { name: 'Platinum Master',     threshold: 5000 },
              ];
              const next = tiers.find(t => xp < t.threshold);
              if (!next) return <div className="bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 rounded-2xl p-4 text-center"><p className="text-sm text-cyan-400 font-bold">🏆 Max rank achieved — Platinum Master!</p></div>;
              const prev = tiers[tiers.indexOf(next) - 1];
              const prevThreshold = prev?.threshold || 0;
              const pct = Math.round(((xp - prevThreshold) / (next.threshold - prevThreshold)) * 100);
              return (
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400 font-semibold">Progress to {next.name}</span>
                    <span className="text-white font-mono">{xp} / {next.threshold} XP</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1.5">{pct}% there · {next.threshold - xp} XP needed</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === 'Documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Documents</h3>
              {isAdmin && (
                <label className={`bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors ${docUploading ? 'opacity-50 cursor-wait' : ''}`}>
                  {docUploading ? 'Uploading…' : '+ Upload Document'}
                  <input type="file" className="hidden" onChange={handleDocUpload} disabled={docUploading} />
                </label>
              )}
            </div>

            {(!profile.documents || profile.documents.length === 0) ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-gray-500 text-sm">No documents yet.</p>
                {isAdmin && <p className="text-gray-700 text-xs mt-1">Upload offer letters, ID proofs, contracts…</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {profile.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg flex-shrink-0">
                      {doc.type === 'Offer Letter' ? '📜' : doc.type === 'Contract' ? '📑' : '📄'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-600">{doc.type} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                        View
                      </a>
                      {isAdmin && (
                        <button onClick={() => handleDeleteDoc(i)}
                          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
