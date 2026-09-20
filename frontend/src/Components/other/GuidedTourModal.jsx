import React, { useState } from 'react';

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Enterprise Workspace & Brand Identity',
    tagline: 'Custom Organization Setup',
    icon: '🏢',
    accent: 'from-blue-600 to-indigo-600',
    description:
      'TeamPulse provides multi-workspace isolation. Customize your organization name, slug, security policies (2FA, session timeouts), and company logo from the Workspace Settings tab.',
    highlights: [
      'Multi-tenant workspace isolation with strict RBAC',
      'Configurable working hours & timezone synchronization',
      'Granular security & employee approval gates'
    ]
  },
  {
    step: 2,
    title: 'Specialized Squad Architecture',
    tagline: 'Domain-Driven Team Management',
    icon: '🛡️',
    accent: 'from-purple-600 to-pink-600',
    description:
      'Eliminate flat hierarchies. Structure your workforce into specialized squads like AI & Data Science, Testing & QA, Cloud & Database, and Full Stack Engineering.',
    highlights: [
      'Dedicated Team Leader appointed per squad',
      '1-Click entire squad bulk task assignments',
      'Squad-level velocity & performance tracking'
    ]
  },
  {
    step: 3,
    title: 'Hierarchical Task Assignment Engine',
    tagline: 'Team Leader Delegation',
    icon: '⚡',
    accent: 'from-amber-600 to-orange-600',
    description:
      'Admins no longer micro-manage individual contributors. Assign sprint goals to Team Leaders, and let Leaders assign tasks to employees with story points and checklists.',
    highlights: [
      'Single employee, multi-select, or entire squad assignment',
      'Story points, estimated hours, and sprint association',
      'Real-time kanban boards and project roadmap milestones'
    ]
  },
  {
    step: 4,
    title: 'Quality Review Engine & Integrations',
    tagline: 'GitHub Sync & Deliverable Approvals',
    icon: '🚀',
    accent: 'from-emerald-600 to-teal-600',
    description:
      'Developers submit work with GitHub PRs, live demo URLs, and notes. Team Leaders review submissions with 1-click Approval (+50 XP) or request rework with guided feedback.',
    highlights: [
      'Automated status updates via GitHub commits (#TASK-ID)',
      'Deliverable review queue with live external preview links',
      'RFC 5545 iCalendar feed & Slack interactive bot notifications'
    ]
  }
];

const GuidedTourModal = ({ isOpen, onClose, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('teampulse_tour_completed', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('teampulse_tour_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Top Gradient Banner */}
        <div className={`h-2 bg-gradient-to-r ${current.accent} transition-all duration-500`}></div>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 shadow-inner">
              {current.icon}
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Step {current.step} of {TOUR_STEPS.length} • {current.tagline}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">{current.title}</h2>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-zinc-300 text-sm leading-relaxed">{current.description}</p>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Enterprise Highlights</h4>
            {current.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-8 bg-indigo-500'
                    : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors ${
              isFirst
                ? 'opacity-30 border-transparent text-zinc-600 cursor-not-allowed'
                : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              {isLast ? 'Complete & Get Started 🚀' : 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTourModal;
