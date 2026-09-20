import React, { useState, useEffect } from 'react';
import Login from '../Components/Auth/Login';
import LegalModal from '../Components/other/LegalModal';
import ArchitectureModal from '../Components/other/ArchitectureModal';

const METRICS = [
  { label: 'WebSocket Event Sync', value: '< 30ms', subtext: 'Multi-room real-time pipeline' },
  { label: 'Two-Factor Security', value: 'RFC 6238', subtext: 'TOTP & 5 offline emergency keys' },
  { label: 'Access Control', value: '3 Tiers', subtext: 'Employee, Team Lead, Admin RBAC' },
  { label: 'Ecosystem Triggers', value: 'GitHub / GitLab', subtext: 'Auto status shifts on commit & PR' }
];

const FAQS = [
  {
    question: "How does Two-Factor Authentication (2FA) protect our workspace?",
    answer: "TeamPulse supports standard RFC 6238 TOTP Multi-Factor Authentication compatible with Google Authenticator, Microsoft Authenticator, and 1Password. Workspace administrators can mandate 2FA across all accounts, and users are issued 5 offline emergency recovery backup codes."
  },
  {
    question: "How do GitHub and GitLab webhooks auto-transition tasks?",
    answer: "When an engineer includes a task reference (e.g. #TP-104) in a commit message, TeamPulse automatically shifts the task to In Progress. When a Pull Request or Merge Request merges into the primary branch, the associated task is closed or forwarded to Quality Review."
  },
  {
    question: "What access tiers and squad roles are supported?",
    answer: "TeamPulse provides three isolated role tiers: Employees (personal task queue, focus timer, leave requests), Team Leaders (sprint planning, squad quality review gate, workload distribution), and Administrators (squad management, audit logs, and integrations governance)."
  },
  {
    question: "Can we export sprint velocity and attendance records?",
    answer: "Yes. Both Admin and Lead consoles offer instant one-click exports to structured PDF reports and Microsoft Excel (.xlsx) spreadsheets, complete with story point completion ratios and employee check-in timelines."
  },
  {
    question: "How does the real-time sync operate without browser lag?",
    answer: "TeamPulse is built on native WebSockets with multi-room clustering. Task status transitions, chat messages, and member availability are dispatched as lightweight delta payloads in under 30 milliseconds, ensuring zero page reload and minimal overhead."
  }
];

const ROLES = [
  {
    role: 'Software Engineers',
    highlight: 'Build with uninterrupted flow state',
    points: [
      'Personal sprint queue organized by priority',
      'One-click Pomodoro Focus Mode with ambient interval timer',
      'Instant task updates and transparent acceptance criteria'
    ]
  },
  {
    role: 'Engineering Leads',
    highlight: 'Govern sprint quality before deployment',
    points: [
      'Squad Quality Review gate for code approvals',
      'Sprint backlog grooming and story point allocation',
      'Live visibility into blockers and overdue deliverables'
    ]
  },
  {
    role: 'Workspace Admins & HR',
    highlight: 'Enterprise compliance & organization settings',
    points: [
      'Organization-wide 2FA enforcement & session timeouts',
      'Centralized team directory across 8 engineering departments',
      'Immutable audit trail logging every administrative event'
    ]
  }
];

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [prefillCreds, setPrefillCreds] = useState(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('privacy');
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [teamSize, setTeamSize] = useState(25);
  const [hourlyRate, setHourlyRate] = useState(65);
  const [activeFeatureTab, setActiveFeatureTab] = useState('kanban');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const openLegal = (tab) => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  const handleDemoLogin = (role = 'admin') => {
    if (role === 'admin') {
      setPrefillCreds({ email: 'admin@me.com', password: '123', autoSubmit: true });
    } else {
      setPrefillCreds({ email: 'employee1@example.com', password: '123', autoSubmit: true });
    }
    setShowAuthModal(true);
  };

  const hoursSavedPerEng = 18;
  const totalHoursSavedMonth = teamSize * hoursSavedPerEng;
  const monthlyCostSavings = totalHoursSavedMonth * hourlyRate;
  const annualCostSavings = monthlyCostSavings * 12;

  useEffect(() => {
    const handleClose = () => setShowAuthModal(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowAuthModal(false);
    };

    window.addEventListener('closeAuthModal', handleClose);
    if (showAuthModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('closeAuthModal', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAuthModal]);

  return (
    <div className="min-h-screen bg-[#090D16] text-zinc-100 flex flex-col font-sans selection:bg-indigo-950 selection:text-white">
      
      <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-bold text-xs text-zinc-200">
            TP
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">
              TeamPulse
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              v2.0
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <a href="#overview" className="hover:text-zinc-100 transition-colors">Overview</a>
          <a href="#capabilities" className="hover:text-zinc-100 transition-colors">Platform</a>
          <a href="#roles" className="hover:text-zinc-100 transition-colors">Roles</a>
          <a href="#roi" className="hover:text-zinc-100 transition-colors">ROI Calculator</a>
          <a href="#faq" className="hover:text-zinc-100 transition-colors">FAQ</a>
          <button
            onClick={() => setArchitectureModalOpen(true)}
            className="text-indigo-400 hover:text-indigo-200 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>⚡</span>
            <span>Architecture</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPrefillCreds(null);
              setShowAuthModal(true);
            }}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      <section id="overview" className="px-4 sm:px-6 lg:px-12 pt-14 sm:pt-16 pb-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>Developer-first sprint execution with zero Jira clutter</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.12] mb-5 text-white">
          A calm workspace built for engineering velocity.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed mb-8">
          Real-time Kanban execution, sub-30ms WebSocket sync, Squad Quality Review gates, and RFC 6238 Two-Factor Authentication in one coherent system.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-10 w-full sm:w-auto">
          <button
            onClick={() => {
              setPrefillCreds(null);
              setShowAuthModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Open Platform Dashboard →
          </button>
          <a
            href="#capabilities"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors text-center"
          >
            Explore System Architecture
          </a>
        </div>

        <div className="w-full max-w-5xl rounded-xl border border-zinc-800 bg-[#0E1321] shadow-2xl overflow-hidden text-left">
          <div className="px-3 sm:px-4 py-2.5 bg-[#090D16] border-b border-zinc-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block flex-shrink-0"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block flex-shrink-0"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block flex-shrink-0"></span>
              <span className="ml-1 sm:ml-2 text-[11px] font-mono text-zinc-500 truncate max-w-[130px] sm:max-w-none">teampulse.io/org/workspace/sprint-14</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="hidden sm:inline">WebSocket Synced </span>(12ms)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[350px]">
            <div className="hidden md:block md:col-span-3 bg-[#0B0F19] border-r border-zinc-800/60 p-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Engineering Squads</div>
                <div className="space-y-1 text-xs">
                  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-zinc-200 font-medium flex items-center justify-between">
                    <span>⚡ Core Platform</span>
                    <span className="text-[10px] bg-zinc-700/60 px-1.5 py-0.2 rounded font-mono text-zinc-300">14 tasks</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 flex items-center justify-between">
                    <span>🛡️ Security & 2FA</span>
                    <span className="text-[10px] text-zinc-600 font-mono">6 tasks</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 flex items-center justify-between">
                    <span>🤖 DevOps & CI/CD</span>
                    <span className="text-[10px] text-zinc-600 font-mono">8 tasks</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Sprint 14 Velocity</div>
                <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Sprint Target</span>
                    <span className="text-zinc-300 font-mono">88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 w-[88%] rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>42 pts shipped</span>
                    <span>6 pts in review</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">GitHub Webhook Status</div>
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px]">#TP-104</span>
                  <span className="text-zinc-300 text-[11px]">Commit Auto-Shift</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-9 p-4 bg-[#0E1321] overflow-x-auto">
              <div className="grid grid-cols-3 gap-3 min-w-[540px]">
                <div className="bg-[#0B0F19]/80 rounded-lg p-3 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800/80">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                      In Progress
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-850 px-1.5 py-0.5 rounded">2</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/90 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-zinc-300 font-semibold">TP-104</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700/60">Urgent</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-medium leading-snug">RFC 6238 TOTP Multi-Factor Authentication Engine</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                      <span className="font-mono bg-zinc-800 px-1 rounded text-zinc-400">5 pts</span>
                      <span className="text-zinc-400">Bablu Kumar</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/90 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-zinc-300 font-semibold">TP-108</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium border border-zinc-750">High</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-medium leading-snug">Sub-30ms WebSocket Multi-Room Pipeline</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                      <span className="font-mono bg-zinc-800 px-1 rounded text-zinc-400">3 pts</span>
                      <span className="text-zinc-400">Sarah Chen</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B0F19]/80 rounded-lg p-3 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800/80">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                      Quality Review
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-850 px-1.5 py-0.5 rounded">1</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/90 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-zinc-300 font-semibold">TP-102</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700/60">Review Gate</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-medium leading-snug">Squad Quality Review Gate & PR #42 Verification</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                      <span className="font-mono bg-zinc-800 px-1 rounded text-zinc-400">8 pts</span>
                      <span className="text-zinc-400">Alex Mercer</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B0F19]/80 rounded-lg p-3 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800/80">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                      Shipped
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-850 px-1.5 py-0.5 rounded">1</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/90 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-zinc-300 font-semibold">TP-098</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium border border-zinc-750">Live</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-medium leading-snug">3-Tier Enterprise RBAC & Immutable Audit Logs</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                      <span className="font-mono bg-zinc-800 px-1 rounded text-zinc-400">5 pts</span>
                      <span className="text-zinc-400">✓ Deployed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-center gap-6 py-4 text-xs text-zinc-500 flex-wrap">
          <span>GitHub Webhooks</span>
          <span>·</span>
          <span>GitLab CI/CD</span>
          <span>·</span>
          <span>Slack & Teams Bot</span>
          <span>·</span>
          <span>RFC 6238 2FA</span>
          <span>·</span>
          <span>Apple / Google iCal Sync</span>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 py-10 border-t border-zinc-800/80 bg-zinc-950/60">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {METRICS.map((m, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/70 text-left">
              <span className="text-xl sm:text-2xl font-semibold text-white block mb-0.5 tracking-tight font-mono">{m.value}</span>
              <span className="text-xs font-medium text-zinc-300 block">{m.label}</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">{m.subtext}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="px-4 sm:px-6 lg:px-12 py-14 sm:py-16 border-t border-zinc-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Core Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Engineered for developer productivity
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Every workflow is unified inside a single clean interface without external microservice fragmentation.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setActiveFeatureTab('kanban')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFeatureTab === 'kanban'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Sprint Kanban
            </button>
            <button
              onClick={() => setActiveFeatureTab('review')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFeatureTab === 'review'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Quality Review Gate
            </button>
            <button
              onClick={() => setActiveFeatureTab('governance')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFeatureTab === 'governance'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Two-Factor 2FA & Audit
            </button>
            <button
              onClick={() => setActiveFeatureTab('analytics')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFeatureTab === 'analytics'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Focus & Reports
            </button>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 sm:p-8">
            {activeFeatureTab === 'kanban' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4 text-left">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Agile Sprint Execution</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Kanban built for developer flow state</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Prioritize tasks, estimate story points, and monitor due-date countdowns. When code commits include task IDs (like #TP-104), status transitions automatically over WebSockets.
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Drag-and-drop status lanes with multi-room broadcast</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Subtask checklists with progress ratios</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Relative date countdowns with overdue highlights</li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-[#090D16] border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/80">
                    <span className="font-semibold text-white">Sprint 14: Core Engine</span>
                    <span className="font-mono text-zinc-300 text-[10px]">42/48 pts (88%)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-mono text-zinc-200 font-semibold">TP-104</span>
                        <span className="text-zinc-400 font-bold text-[10px]">In Progress</span>
                      </div>
                      <p className="text-xs text-zinc-200 font-medium">RFC 6238 TOTP Authenticator Security Challenge</p>
                      <div className="flex justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                        <span>5 Story Points</span>
                        <span>Assignee: Alex Mercer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'review' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4 text-left">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Quality Assurance Gate</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Team Leader review & approval delegation</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Developers submit PR links and artifacts for quality review before deployment. Team Leads can approve, request changes, or delegate seamlessly.
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Pull Request URL and documentation links verification</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Interactive rejection feedback with rework requirements</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> One-click approval shifting task to Shipped</li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-[#090D16] border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/80">
                    <span className="font-semibold text-white">Review Request #TP-102</span>
                    <span className="font-mono text-zinc-400 text-[10px]">Pending Approval</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <p className="text-xs text-zinc-200 font-medium">Pull Request #42: WebSocket Multi-Room Clustering</p>
                    <div className="text-[11px] text-zinc-400 font-mono bg-zinc-950 p-2 rounded border border-zinc-850">
                      git checkout -b feature/tp-102-ws-clustering
                    </div>
                    <div className="flex gap-2 pt-1">
                      <span className="px-3 py-1 rounded bg-zinc-800 text-zinc-200 text-xs font-semibold">✓ Approve & Ship</span>
                      <span className="px-3 py-1 rounded bg-zinc-900 text-zinc-400 text-xs border border-zinc-800">Request Changes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'governance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4 text-left">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Enterprise Security</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Two-Factor Authentication & Granular RBAC</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Protect organization assets with industry-standard RFC 6238 TOTP multi-factor security. Compatible with Google Authenticator and Microsoft Authenticator, backed by immutable audit trails.
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> RFC 6238 Time-based One-Time Password (TOTP) QR code pairing</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> 5 offline SHA-256 hashed emergency recovery backup codes</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Organization-wide 2FA mandate with immutable audit trail</li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-[#090D16] border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/80">
                    <span className="font-semibold text-white">Security & 2FA Governance</span>
                    <span className="font-mono text-zinc-400 text-[10px]">Active</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">TOTP Multi-Factor Auth</span>
                      <span className="text-zinc-300 font-mono text-[11px]">RFC 6238 Standard</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Supported: Google Authenticator, Microsoft Authenticator, 1Password
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/80">
                      <span>Emergency Fallback: 5 Recovery Keys</span>
                      <span>✓ SHA-256 Hashed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4 text-left">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Developer Velocity & Reporting</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Focus intervals & one-click velocity reports</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Integrated Pomodoro focus sessions keep engineers in the zone, while 1-click PDF and Excel exports provide transparent delivery logs for sprint retrospectives.
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> 25-minute Pomodoro timer with automatic break tracking</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> One-click PDF velocity report export with story point breakdown</li>
                    <li className="flex items-center gap-2"><span className="text-zinc-400 font-bold">✓</span> Excel (.xlsx) attendance & work hours export</li>
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-[#090D16] border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/80">
                    <span className="font-semibold text-white">Sprint Velocity Report</span>
                    <span className="font-mono text-zinc-400 text-[10px]">Export Ready</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">Completion Velocity</span>
                      <span className="font-mono text-zinc-200">88% (42 Pts)</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <span className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 text-xs font-medium">📄 Download PDF</span>
                      <span className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">📊 Export Excel</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="roi" className="px-4 sm:px-6 lg:px-12 py-12 sm:py-16 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Engineering Productivity
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Calculate engineering time reclaimed
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Eliminate daily status sync friction and recover up to 18 productive engineering hours per developer monthly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 sm:p-8">
            <div className="lg:col-span-6 space-y-5 text-left">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-zinc-300">Engineering Team Size</span>
                  <span className="text-white font-mono">{teamSize} Engineers</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="250"
                  step="5"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full accent-zinc-200 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>5</span>
                  <span>100</span>
                  <span>250+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-zinc-300">Blended Hourly Rate</span>
                  <span className="text-white font-mono">${hourlyRate} / hr</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="150"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full accent-zinc-200 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>$25</span>
                  <span>$85</span>
                  <span>$150</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                Benchmark based on 18 hours reclaimed per engineer monthly across automated sprint tracking, GitHub commit triggers, and unified quality reviews.
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#090D16] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between text-left">
              <div className="grid grid-cols-2 gap-4 pb-5 border-b border-zinc-800">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Hours Reclaimed / Mo</div>
                  <div className="text-2xl font-bold text-white mt-1 font-mono">
                    {totalHoursSavedMonth.toLocaleString()} <span className="text-xs font-normal text-zinc-500">hrs</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Estimated Monthly Value</div>
                  <div className="text-2xl font-bold text-white mt-1 font-mono">
                    ${monthlyCostSavings.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="py-4">
                <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Projected Annual Savings</div>
                <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                  ${annualCostSavings.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Reclaimed engineering hours through automated sprints, instant WebSocket sync, and unified QA gates.
                </p>
              </div>

              <button
                onClick={() => {
                  setPrefillCreds(null);
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Sign In to Workspace →
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="px-4 sm:px-6 lg:px-12 py-12 sm:py-16 border-t border-zinc-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Role Separation
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Clear responsibilities for every role
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Strict 3-tier access control ensures team members only access what they need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROLES.map((r, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {r.role}
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    {r.highlight}
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {r.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-zinc-500 mt-0.5 select-none">—</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 sm:px-6 lg:px-12 py-12 sm:py-16 border-t border-zinc-800/80">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Enterprise Inquiries
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-zinc-400">
              Clear answers to technical, security, and governance considerations.
            </p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors text-left"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span className="text-zinc-500 font-mono text-sm leading-none flex-shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3.5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 py-12 sm:py-14 border-t border-zinc-800/80 text-center bg-zinc-950/40">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Ready to experience TeamPulse?</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Explore the entire workspace with full administrative privileges instantly in a single click.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => handleDemoLogin('admin')}
              className="px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer inline-flex items-center gap-2"
            >
              <span>⚡</span>
              <span>1-Click Live Demo</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-6 lg:px-12 py-8 border-t border-zinc-800/80 text-xs text-zinc-400 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0">
              BK
            </div>
            <div>
              <p className="text-zinc-200 font-semibold text-xs">
                Designed & Engineered by <span className="text-white font-bold">Bablu Kumar</span>
              </p>
              <p className="text-[11px] text-zinc-500">
                B.Tech Computer Science & Engineering · Full Stack Engineer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="https://github.com/bablukumar05"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors text-xs font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
            <button
              onClick={() => setArchitectureModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 transition-colors text-xs font-medium cursor-pointer"
            >
              <span>⚡</span>
              <span>Architecture Specs</span>
            </button>
            <a
              href="mailto:kumarbablu74824@gmail.com"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors text-xs font-medium cursor-pointer"
            >
              <span>✉️</span>
              <span>Contact</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span>TeamPulse Workspace</span>
            <span>·</span>
            <span>React 18 & Express 5</span>
            <span>·</span>
            <span>Socket.io Realtime</span>
            <span>·</span>
            <span>RFC 6238 2FA</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 flex-wrap justify-center sm:justify-end">
            <button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => openLegal('terms')} className="hover:text-white transition-colors cursor-pointer">
              Terms of Service
            </button>
            <button onClick={() => openLegal('gdpr')} className="hover:text-white transition-colors cursor-pointer">
              GDPR Compliance
            </button>
          </div>
        </div>
      </footer>

      <ArchitectureModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />

      {showAuthModal && (
        <div 
          onClick={() => setShowAuthModal(false)}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center py-4 my-auto">
            <Login onClose={() => setShowAuthModal(false)} prefill={prefillCreds} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
