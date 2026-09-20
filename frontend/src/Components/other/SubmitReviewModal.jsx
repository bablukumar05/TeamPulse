import React, { useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const DELIVERABLE_PRESETS = [
  { label: 'GitHub PR', prefix: 'https://github.com/' },
  { label: 'Figma Design', prefix: 'https://www.figma.com/' },
  { label: 'Staging Demo', prefix: 'https://' },
  { label: 'Google Doc', prefix: 'https://docs.google.com/' }
];

const SubmitReviewModal = ({ task, isOpen, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [deliverableLink, setDeliverableLink] = useState(task?.reviewDetails?.deliverableLink || '');
  const [submissionNotes, setSubmissionNotes] = useState(task?.reviewDetails?.submissionNotes || '');
  const [actualHours, setActualHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionNotes.trim() && !deliverableLink.trim()) {
      toast.error('Please provide a deliverable link or summary of work done.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        deliverableLink: deliverableLink.trim(),
        submissionNotes: submissionNotes.trim(),
        actualHours: actualHours ? Number(actualHours) : 0
      };

      const res = await axios.post(`/api/employee/tasks/${task._id}/submit-review`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        toast.success('Task submitted to Squad Lead for quality review!');
        if (onSuccess) onSuccess(res.data.task);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit task for review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#0D121F] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <h3 className="text-base font-bold text-white tracking-tight">Submit Task for Squad Review</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deliverables will be inspected by your Team Leader before final completion.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-sm px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <p className="text-xs font-semibold text-white truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
              {task.category || 'Engineering'}
            </span>
            <span>•</span>
            <span>Priority: <strong className="text-amber-400">{task.priority}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Deliverable URL (Pull Request, Figma, or Staging Link)
            </label>
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
              {DELIVERABLE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setDeliverableLink(p.prefix)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 whitespace-nowrap"
                >
                  +{p.label}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={deliverableLink}
              onChange={(e) => setDeliverableLink(e.target.value)}
              placeholder="https://github.com/org/repo/pull/42"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Summary of Work Done & Verification Notes
            </label>
            <textarea
              rows={3}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Describe changes made, test cases executed, and how the Team Leader can verify this output..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Additional Hours Spent on this Submission (Optional)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting to Lead...' : 'Submit to Squad Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReviewModal;
