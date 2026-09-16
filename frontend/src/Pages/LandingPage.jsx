import React, { useState } from 'react';
import Login from '../Components/Auth/Login';

const CAPABILITIES = [
  {
    icon: '💬',
    title: 'Real-Time WebSockets Engine',
    description: 'Multi-room team chat, direct messaging, real-time typing indicators, and @username mentions powered by Socket.IO.',
    badge: 'Socket.IO 4'
  },
  {
    icon: '📋',
    title: 'Agile Sprints & Kanban Boards',
    description: 'Interactive drag-and-drop task boards, story points, sprint velocity benchmarking, and milestone timelines.',
    badge: 'Agile Workflows'
  },
  {
    icon: '👥',
    title: 'HR & 8 IT Departments',
    description: 'Structured corporate hierarchy across Frontend, Backend, DevOps, QA, Data Science, CyberSecurity, Product, and HR.',
    badge: 'Enterprise Hierarchy'
  },
  {
    icon: '⏱️',
    title: 'Attendance & Work Timers',
    description: 'Daily check-in/check-out, break logging, overtime tracking, and automated interactive attendance calendars.',
    badge: 'Time Tracking'
  },
  {
    icon: '📊',
    title: 'Analytics & PDF/Excel Exports',
    description: 'Interactive Recharts productivity dashboards with 1-click automated PDF and Excel report downloads.',
    badge: 'Data Intelligence'
  },
  {
    icon: '🤖',
    title: 'AI Workforce Assistant',
    description: 'Embedded AI assistant drawer for task breakdown, daily work summaries, and intelligent priority advice.',
    badge: 'AI Powered'
  }
];

const METRICS = [
  { label: 'Active Team Members', value: '150+', change: '+12% this month' },
  { label: 'Completed Sprints', value: '22 Sprints', change: '100% velocity tracked' },
  { label: 'Corporate IT Departments', value: '8 Specializations', change: 'Full workforce coverage' },
  { label: 'Cloud API Uptime', value: '99.99%', change: 'Production deployment' }
];

const WORKFLOWS = [
  {
    role: 'Software Engineers & Developers',
    description: 'Manage personal task queues, track daily work hours, drag task cards on Kanban boards, and collaborate via Socket.IO chat.',
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
  },
  {
    role: 'Project Managers & Tech Leads',
    description: 'Create tasks, assign story points, track sprint velocity charts, manage milestone timelines, and monitor team productivity.',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  },
  {
    role: 'HR Directors & Administrators',
    description: 'Approve leave requests, manage employee onboarding/exit records, access document vaults, and view company-wide audit logs.',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
  }
];

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('capabilities');

  return (
    <div className="min-h-screen bg-[#11141c] text-white flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#11141c]/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#11141c] rounded-[15px] flex items-center justify-center">
              <span className="text-lg font-black tracking-wider text-cyan-400">TP</span>
            </div>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              TeamPulse
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Enterprise v2.0
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
          <a href="#overview" className="hover:text-white transition-colors">Overview</a>
          <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
          <a href="#workflows" className="hover:text-white transition-colors">Workflows</a>
          <a href="#metrics" className="hover:text-white transition-colors">Live Stats</a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Get Started →
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="relative z-10 px-6 lg:px-12 pt-16 pb-20 max-w-7xl mx-auto text-center flex flex-col items-center">
        
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-in fade-in duration-500">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Full-Stack MERN Workforce & Project Management Platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl leading-[1.1] mb-6">
          Unifying Team Operations, Sprints & HR into One{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Intelligent Platform
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-gray-400 max-w-3xl leading-relaxed mb-10">
          TeamPulse centralizes real-time Socket.IO multi-room team chat, drag-and-drop Kanban task boards, sprint velocity metrics, automated attendance tracking, and AI assistance for modern engineering teams.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-3"
          >
            <span>Launch Platform Dashboard</span>
            <span>→</span>
          </button>
          <a
            href="#capabilities"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-gray-300 transition-all text-center"
          >
            Explore Capabilities
          </a>
        </div>

        {/* Live Metrics Grid */}
        <div id="metrics" className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
          {METRICS.map((m, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
              <span className="text-2xl sm:text-3xl font-black text-white block mb-1">{m.value}</span>
              <span className="text-xs font-bold text-gray-300 block">{m.label}</span>
              <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">{m.change}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="relative z-10 px-6 lg:px-12 py-20 border-t border-white/5 bg-[#0e1017]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Everything Your Team Needs to Build & Scale
            </h2>
            <p className="text-sm text-gray-400 mt-3">
              Engineered with full-stack performance, role-based security, and real-time synchronization across all corporate roles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/40 transition-all group hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{cap.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                  {cap.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows & Roles Section */}
      <section id="workflows" className="relative z-10 px-6 lg:px-12 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
              Corporate Hierarchy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Tailored Experiences for Every Role
            </h2>
            <p className="text-sm text-gray-400 mt-3">
              Granular Role-Based Access Control (RBAC) ensures Engineers, Managers, and Directors have exact privileges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOWS.map((wf, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl bg-gradient-to-b ${wf.color} border backdrop-blur-md flex flex-col justify-between`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">
                    Role Workspace {idx + 1}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {wf.role}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {wf.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Custom Dashboard</span>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-xs font-bold text-indigo-300 hover:text-white transition-colors"
                  >
                    Explore Role →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative z-10 px-6 lg:px-12 py-16 border-t border-white/5 bg-gradient-to-b from-[#11141c] to-[#0a0c14] text-center">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-cyan-900/40 border border-white/10 shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-4">
            Ready to Streamline Your Team Operations?
          </h2>
          <p className="text-sm text-gray-300 max-w-xl mx-auto mb-8">
            Access your personalized workspace dashboard or register your employee account in under 30 seconds.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 rounded-2xl bg-white text-gray-900 hover:bg-gray-100 text-sm font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Sign In / Create Account Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-white/5 text-center text-xs text-gray-500">
        <p>© 2026 TeamPulse Platform. Built with React 19, Express 5, Node.js & MongoDB Atlas.</p>
      </footer>

      {/* Auth Modal Backdrop */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white font-bold text-sm bg-white/10 px-3 py-1 rounded-full transition-colors z-50"
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
