import React, { useState } from 'react';
import Login from '../Components/Auth/Login';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Context where work happens',
    description: 'Discussions that occur in transient chat threads rarely make it back to the task. TeamPulse keeps discussions, commit links, and status changes pinned directly to the project.'
  },
  {
    number: '02',
    title: 'Realistic velocity over optimism',
    description: 'Projects slip when estimates ignore reality. Story points and sprint tracking reflect actual completion pace, making it easy to identify bottlenecks before deadlines pass.'
  },
  {
    number: '03',
    title: 'Focus without surveillance',
    description: 'High-performing engineers need uninterrupted blocks of time. Built-in focus intervals and availability indicators signal when someone is in deep flow and should not be disturbed.'
  }
];

const CAPABILITIES = [
  {
    title: 'Sprint & Task Boards',
    category: 'Execution',
    description: 'Kanban boards designed for speed. Track items from backlog to production with clear assignees, priority indicators, and story points.'
  },
  {
    title: 'Real-Time Team Messaging',
    category: 'Communication',
    description: 'Direct messaging and department channels built on WebSockets. Fast, responsive, and tied directly into your active workspace.'
  },
  {
    title: 'Attendance & Time Records',
    category: 'Operations',
    description: 'Frictionless daily check-in, break tracking, and automated work logs. Accurate time records without micromanagement.'
  },
  {
    title: 'Role-Based Access Control',
    category: 'Security',
    description: 'Strict separation of concerns. Developers focus on their deliverables, leads oversee sprints, and HR manages personnel records securely.'
  },
  {
    title: 'Audit Logs & Timeline',
    category: 'Governance',
    description: 'A transparent timeline of task status transitions, join requests, and administrative approvals for complete operational clarity.'
  },
  {
    title: 'Structured Reporting',
    category: 'Analytics',
    description: 'Export sprint velocity, attendance summaries, and department metrics to PDF or Excel for team retrospectives and planning.'
  }
];

const ROLES = [
  {
    role: 'Software Engineers',
    highlight: 'Build with uninterrupted clarity',
    points: [
      'Personal task queue organized by priority',
      'One-click Focus Mode for Pomodoro intervals',
      'Fast inline status updates and clear acceptance criteria'
    ]
  },
  {
    role: 'Engineering Leads',
    highlight: 'See sprint health in real time',
    points: [
      'Sprint backlog grooming and story point allocation',
      'Team workload distribution at a single glance',
      'Immediate visibility into blockers and overdue items'
    ]
  },
  {
    role: 'Operations & HR',
    highlight: 'Manage requests without paperwork',
    points: [
      'Centralized leave approvals and balance tracking',
      'Candidate screening, verification, and document vault',
      'Clean directory segmented by 8 technical departments'
    ]
  }
];

const METRICS = [
  { label: 'Technical Departments', value: '8 Fields', subtext: 'Frontend to DevOps & Security' },
  { label: 'Sprint Delivery', value: 'Bi-Weekly', subtext: 'Continuous sprint cadence' },
  { label: 'WebSocket Sync', value: '< 30ms', subtext: 'Real-time event synchronization' },
  { label: 'Core Architecture', value: 'MERN Stack', subtext: 'React 19, Express 5, MongoDB' }
];

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      
      <header className="sticky top-0 z-40 bg-[#0c0d0e]/90 backdrop-blur-md border-b border-zinc-800/80 px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-xs text-zinc-200">
            TP
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              TeamPulse
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              v2.0
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <a href="#overview" className="hover:text-zinc-100 transition-colors">Overview</a>
          <a href="#principles" className="hover:text-zinc-100 transition-colors">Principles</a>
          <a href="#capabilities" className="hover:text-zinc-100 transition-colors">Capabilities</a>
          <a href="#roles" className="hover:text-zinc-100 transition-colors">Workflows</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 rounded-lg bg-transparent hover:bg-zinc-800/60 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            Open Workspace
          </button>
        </div>
      </header>

      <section id="overview" className="px-6 lg:px-12 pt-20 pb-16 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Internal engineering and operations workspace</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.15] mb-6 text-zinc-100">
          A calm workspace for teams who take execution seriously.
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed mb-10">
          When projects grow, context fractures across different chat tools, issue trackers, and spreadsheets. TeamPulse keeps the thread intact: sprint planning, daily execution, team availability, and direct communication in one coherent system.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16 w-full sm:w-auto">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            Enter Platform Dashboard
          </button>
          <a
            href="#capabilities"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-sm font-medium text-zinc-300 transition-colors text-center"
          >
            View Architecture & Features
          </a>
        </div>

        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-left">
          {METRICS.map((m, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-xl sm:text-2xl font-semibold text-zinc-100 block mb-0.5 tracking-tight">{m.value}</span>
              <span className="text-xs font-medium text-zinc-300 block">{m.label}</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">{m.subtext}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="principles" className="px-6 lg:px-12 py-16 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Design Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Built on how high-performing teams actually work
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl">
              Most productivity tools create more busywork than they eliminate. We structured TeamPulse around three fundamental tenets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRINCIPLES.map((p, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono text-zinc-500 block mb-4">
                    {p.number}
                  </span>
                  <h3 className="text-base font-medium text-zinc-100 mb-2.5">
                    {p.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="px-6 lg:px-12 py-16 border-t border-zinc-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Essential tools, tightly integrated
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl">
              Every feature serves a direct purpose in the development and delivery lifecycle without superfluous layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/70 hover:border-zinc-700/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 rounded">
                    {cap.category}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-zinc-100 mb-1.5">
                  {cap.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="px-6 lg:px-12 py-16 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Role Separation
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Clear responsibilities for every team member
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl">
              Granular access controls ensure engineers, technical managers, and people operations have the exact views they need to do their jobs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((r, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">
                    {r.role}
                  </h3>
                  <p className="text-xs text-zinc-400 mb-5">
                    {r.highlight}
                  </p>
                  <ul className="space-y-2.5">
                    {r.points.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-zinc-500 mt-0.5 select-none">—</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-6 border-t border-zinc-800/70">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Sign in as {r.role.split(' ')[0]}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 border-t border-zinc-800/80 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-lg sm:text-xl text-zinc-300 italic font-serif leading-relaxed mb-4">
            "Engineering teams don't need more notifications. They need fewer interruptions, clear agreements on what ships next, and an honest record of velocity."
          </p>
          <span className="text-xs font-mono text-zinc-500">
            TeamPulse Core Operating Principle
          </span>
          <div className="mt-8">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-zinc-800/80 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full">
        <div>
          <span>TeamPulse Workspace</span>
          <span className="mx-2">·</span>
          <span>React 19, Express 5, Node.js & MongoDB Atlas</span>
        </div>
        <div className="text-zinc-600">
          Crafted for calm, reliable engineering operations.
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-9 right-0 text-zinc-400 hover:text-zinc-100 font-medium text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md transition-colors z-50 cursor-pointer"
            >
              ✕ Close
            </button>
            <Login />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
