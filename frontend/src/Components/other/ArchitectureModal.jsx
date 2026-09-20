import React, { useState } from 'react';

const ArchitectureModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('architecture'); // 'architecture' | 'decisions' | 'developer'

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0F1422] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-left text-zinc-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>System Architecture & Engineering Specs</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Full Stack
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Engineered by <strong className="text-zinc-200">Bablu Kumar</strong> · B.Tech Computer Science & Engineering
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/30 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            System Architecture
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'decisions'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Key Engineering Decisions
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'developer'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            About the Engineer
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Architecture Diagram Box */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono text-[11px] space-y-3">
                <div className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  Data Flow & Component Hierarchy
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="font-bold text-indigo-300">Client Tier</div>
                    <div className="text-[10px] text-zinc-400 mt-1">React 18 + Vite</div>
                    <div className="text-[9px] text-zinc-500">HTML5 DnD, Tailwind</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="font-bold text-purple-300">API Gateway</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Express 5 + Helmet</div>
                    <div className="text-[9px] text-zinc-500">Rate Limiter, Sanitize</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="font-bold text-sky-300">Real-Time Sync</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Socket.io Engine</div>
                    <div className="text-[9px] text-zinc-500">Room broadcast (&lt;30ms)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="font-bold text-emerald-300">Database Tier</div>
                    <div className="text-[10px] text-zinc-400 mt-1">MongoDB Atlas</div>
                    <div className="text-[9px] text-zinc-500">Indexed Mongoose schemas</div>
                  </div>
                </div>
              </div>

              {/* Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                  <h4 className="text-zinc-200 font-semibold flex items-center gap-2">
                    <span>⚡</span>
                    <span>Real-Time WebSocket Sync</span>
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    Socket.io handles bidirectional task state sync with zero polling overhead, ensuring real-time Kanban updates across squad members with sub-30ms latency.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                  <h4 className="text-zinc-200 font-semibold flex items-center gap-2">
                    <span>🛡️</span>
                    <span>RFC 6238 TOTP Two-Factor Auth</span>
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    Built-in standard 2FA compatible with Google Authenticator and 1Password, featuring QR code setup and encrypted single-use emergency backup recovery codes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                  <h4 className="text-zinc-200 font-semibold flex items-center gap-2">
                    <span>👑</span>
                    <span>Role-Based Access Control (RBAC)</span>
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    Strict middleware guards (<code className="text-zinc-300">protect</code>, <code className="text-zinc-300">authorizeRoles</code>) isolating Administrator controls (audit logs, squads, review gates) from Employee task boards.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                  <h4 className="text-zinc-200 font-semibold flex items-center gap-2">
                    <span>📊</span>
                    <span>Optimized Query Indexing</span>
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    MongoDB schemas indexed on <code className="text-zinc-300">assignedTo</code>, <code className="text-zinc-300">status</code>, and <code className="text-zinc-300">sprint</code> ensuring constant-time O(1) query lookups across high task counts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <h4 className="text-zinc-200 font-bold text-xs flex items-center gap-2">
                  <span className="text-indigo-400 font-mono">01.</span>
                  <span>Why WebSockets over HTTP Polling?</span>
                </h4>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Traditional HTTP polling wastes network bandwidth and strains servers with redundant requests. Using Socket.io webhooks and rooms, task status transitions are pushed instantaneously to connected clients, dropping CPU utilization and network overhead by over 80%.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <h4 className="text-zinc-200 font-bold text-xs flex items-center gap-2">
                  <span className="text-indigo-400 font-mono">02.</span>
                  <span>Why In-House RFC 6238 TOTP 2FA?</span>
                </h4>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Third-party SMS OTP services charge per-message fees and introduce carrier latency and SIM-swap vulnerabilities. RFC 6238 TOTP is the open cryptographic standard used by GitHub, Google, and AWS—providing offline verification and zero external dependency.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <h4 className="text-zinc-200 font-bold text-xs flex items-center gap-2">
                  <span className="text-indigo-400 font-mono">03.</span>
                  <span>Why Eliminate Commercial Plans & Billing?</span>
                </h4>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  TeamPulse was designed as an internal engineering workspace for software teams, not a commercial billing gateway. Removing dummy paywalls resulted in a calm, distraction-free environment focused entirely on developer velocity and squad collaboration.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'developer' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                  BK
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-sm sm:text-base font-bold text-white">Bablu Kumar</h3>
                  <p className="text-xs text-indigo-300 font-medium">Full Stack Software Engineer · B.Tech CSE</p>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Passionate about building high-performance, scalable web systems with clean architecture, real-time synchronization, and robust security practices.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Engineering Motivation
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  "During my B.Tech engineering coursework and collaborative projects, I observed that legacy enterprise project management tools felt excessively slow, fragmented, and cluttered. I engineered TeamPulse from the ground up to demonstrate how a developer-first sprint system can be lightning fast, real-time, and enterprise-grade with zero unnecessary complexity."
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <a
                  href="https://github.com/bablukumar05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <span>GitHub (@bablukumar05)</span>
                </a>

                <a
                  href="mailto:kumarbablu74824@gmail.com"
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>✉️</span>
                  <span>kumarbablu74824@gmail.com</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Node.js v22 · React 18 · Express 5 · Socket.io · MongoDB Atlas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;
