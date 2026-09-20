import React, { useState } from 'react';

const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'September 2026',
    sections: [
      {
        heading: '1. Commitment to Data Privacy',
        body: 'TeamPulse Inc. ("TeamPulse", "we", "us") respects your corporate data privacy. We strictly do NOT sell, rent, or monetize your company data or employee metadata under any circumstances. All operational telemetry and employee performance metrics are encrypted and isolated within your dedicated workspace tenant.'
      },
      {
        heading: '2. Information We Collect',
        body: 'We collect corporate email addresses, encrypted authentication tokens, task deliverables, time logs, and system audit trails generated during legitimate usage of the platform. We collect minimal telemetry necessary to provide 99.9% uptime and prevent fraudulent activities.'
      },
      {
        heading: '3. Data Security & Encryption Standards',
        body: 'All customer data at rest is encrypted using military-grade AES-256 encryption. All network communication between clients and our application servers is strictly enforced via TLS 1.3 with automated certificate renewal and HSTS protection.'
      },
      {
        heading: '4. Third-Party Integrations',
        body: 'When you configure GitHub, GitLab, Slack, or Calendar webhooks, data is exchanged strictly per your administrative permissions. Webhook secrets are hashed and protected in our secure key management vault.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'September 2026',
    sections: [
      {
        heading: '1. Platform Availability',
        body: 'TeamPulse provides a high-availability infrastructure for internal engineering operations, ensuring consistent real-time access to tasks, squads, and team collaboration.'
      },
      {
        heading: '2. Customer Intellectual Property',
        body: 'You retain full and unencumbered ownership of all intellectual property, proprietary code, task attachments, and project assets uploaded to or generated within TeamPulse. TeamPulse claims zero ownership over customer content.'
      },
      {
        heading: '3. Acceptable Use Policy',
        body: 'Customers agree not to utilize TeamPulse APIs or webhooks for unauthorized vulnerability scanning, distributed denial of service simulations, or transmitting unlawful content.'
      },
      {
        heading: '4. Workspace Administration & Governance',
        body: 'Workspace Administrators hold exclusive authority over employee onboarding, department provisioning, role delegation, and access governance across all internal teams.'
      }
    ]
  },
  gdpr: {
    title: 'GDPR Compliance Statement',
    lastUpdated: 'September 2026',
    sections: [
      {
        heading: '1. Data Controller vs Data Processor',
        body: 'Under Regulation (EU) 2016/679 (GDPR), the customer serves as the Data Controller regarding employee identities and work deliverables. TeamPulse operates strictly as the Data Processor, executing operations solely upon controller instructions.'
      },
      {
        heading: '2. Data Subject Rights',
        body: 'TeamPulse provides automated administrative mechanisms enabling data subjects to exercise the Right of Access, Right to Rectification, Right to Data Portability (JSON/CSV export), and the Right to Erasure ("Right to be Forgotten").'
      },
      {
        heading: '3. International Data Transfers',
        body: 'Where data transfers across EU/EEA boundaries occur, TeamPulse complies with the European Commission Standard Contractual Clauses (SCCs) to guarantee equivalent legal safeguards.'
      }
    ]
  },
  dpa: {
    title: 'Data Processing Agreement (DPA)',
    lastUpdated: 'September 2026',
    sections: [
      {
        heading: '1. Scope and Applicability',
        body: 'This Data Processing Agreement governs the processing of personal and corporate data in connection with the TeamPulse Enterprise SaaS Agreement.'
      },
      {
        heading: '2. Technical and Organizational Measures (TOMs)',
        body: 'TeamPulse implements strict role-based access control (RBAC), multi-factor authentication (2FA), automated vulnerability scanning, immutable audit logging, and isolated multi-tenant databases.'
      },
      {
        heading: '3. Security Incident & Breach Notification',
        body: 'In the unlikely event of a confirmed security incident affecting customer data, TeamPulse guarantees formal notification to the designated workspace administrator within 72 hours of verification.'
      }
    ]
  }
};

const LegalModal = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const currentDoc = LEGAL_DOCS[activeTab] || LEGAL_DOCS.privacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">TeamPulse Legal & Compliance Hub</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Commercial B2B SaaS Enterprise Standards</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'privacy', label: '🔒 Privacy Policy' },
            { id: 'terms',   label: '📜 Terms of Service' },
            { id: 'gdpr',    label: '🇪🇺 GDPR Statement' },
            { id: 'dpa',     label: '🤝 Data Processing (DPA)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-zinc-300">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <h3 className="text-lg font-bold text-white">{currentDoc.title}</h3>
            <span className="text-xs text-zinc-500 font-mono">Last revised: {currentDoc.lastUpdated}</span>
          </div>

          {currentDoc.sections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-sm font-bold text-indigo-300">{sec.heading}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Enterprise Grade Security • ISO 27001 & SOC-2 Aligned</span>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
