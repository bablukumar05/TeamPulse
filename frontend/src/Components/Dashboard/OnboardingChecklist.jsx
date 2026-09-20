import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';

const OnboardingChecklist = ({ setActiveNav }) => {
  const { token } = useContext(AuthContext);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem('teampulse_onboarding_dismissed') === 'true'
  );
  const [checklist, setChecklist] = useState({
    workspaceReady: true,
    squadsSeeded: false,
    membersActive: false,
    tasksAssigned: false,
    securityReviewed: false
  });

  useEffect(() => {
    if (!token) return;

    const checkReadiness = async () => {
      try {
        const [teamsRes, usersRes, tasksRes, wsRes] = await Promise.allSettled([
          axios.get('/api/workspace/teams/all', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/workspace/users/directory', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/tasks/all', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/workspace/current', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const hasTeams = teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.data) && teamsRes.data.length > 0;
        const hasMembers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.data) && usersRes.data.length > 1;
        const hasTasks = tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.data) && tasksRes.data.length > 0;
        const hasSec = wsRes.status === 'fulfilled' && wsRes.data?.workspace?.security;

        setChecklist({
          workspaceReady: true,
          squadsSeeded: hasTeams,
          membersActive: hasMembers,
          tasksAssigned: hasTasks,
          securityReviewed: !!hasSec
        });
      } catch {
        // Fallback default states
      }
    };

    checkReadiness();
  }, [token]);

  const items = [
    {
      id: 'workspace',
      title: 'Enterprise Workspace Initialized',
      desc: 'Organization branding, subdomain slug, and primary currency configured.',
      completed: checklist.workspaceReady,
      targetNav: 'settings'
    },
    {
      id: 'squads',
      title: 'Specialized Squads Provisioned',
      desc: 'Engineering, AI, QA, and Product teams created with dedicated leads.',
      completed: checklist.squadsSeeded,
      targetNav: 'teams'
    },
    {
      id: 'members',
      title: 'Colleagues & Personnel Enrolled',
      desc: 'Employees onboarded with professional designations and department ties.',
      completed: checklist.membersActive,
      targetNav: 'hr'
    },
    {
      id: 'tasks',
      title: 'Workflow Deliverables Assigned',
      desc: 'Active tasks distributed via single, multi-select, or 1-click squad mode.',
      completed: checklist.tasksAssigned,
      targetNav: 'tasks'
    },
    {
      id: 'security',
      title: 'Enterprise Security Policies Enforced',
      desc: 'Session expiration, signup approvals, and subscription seat quotas tuned.',
      completed: checklist.securityReviewed,
      targetNav: 'settings'
    }
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('teampulse_onboarding_dismissed', 'true');
  };

  const handleRestore = () => {
    setIsDismissed(false);
    localStorage.removeItem('teampulse_onboarding_dismissed');
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span>🚀 Organization Readiness:</span>
          <span className="font-semibold text-emerald-400">{progressPercent}% complete</span>
        </span>
        <button
          onClick={handleRestore}
          className="text-indigo-400 hover:text-indigo-300 font-medium text-[11px]"
        >
          View Onboarding Steps →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-950/30 via-[#0D1220] to-[#0D1220] border border-indigo-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🚀</span>
            <h3 className="text-sm font-bold text-white tracking-tight">Enterprise Launch & Workspace Readiness</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {completedCount} / {items.length} Completed
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Key operational milestones to get your organization running at peak productivity.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-zinc-300 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 self-start"
        >
          Dismiss Checklist
        </button>
      </div>

      <div className="mt-3.5 space-y-1.5 mb-4">
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveNav && setActiveNav(item.targetNav)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              item.completed
                ? 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40'
                : 'bg-white/[0.02] border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                  item.completed
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-white/10 text-zinc-400 font-mono text-[10px]'
                }`}
              >
                {item.completed ? '✓' : '○'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${item.completed ? 'text-zinc-200' : 'text-white'}`}>
                  {item.title}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
