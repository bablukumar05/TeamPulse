import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const TaskReviewHub = () => {
  const { token } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeModalTask, setActiveModalTask] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' or 'request_changes'
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviewQueue = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [queueRes, teamsRes] = await Promise.allSettled([
        axios.get('/api/admin/tasks/review-queue', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/workspace/teams/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (queueRes.status === 'fulfilled' && Array.isArray(queueRes.data)) {
        setTasks(queueRes.data);
      }
      if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.data)) {
        setTeams(teamsRes.data);
      }
    } catch {
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReviewQueue();

    const handleDataRefetch = () => fetchReviewQueue();
    window.addEventListener('adminDataRefetch', handleDataRefetch);
    return () => window.removeEventListener('adminDataRefetch', handleDataRefetch);
  }, [fetchReviewQueue]);

  const filteredTasks = tasks.filter((task) => {
    const matchesTeam =
      selectedTeam === 'all' ||
      task.teamId?._id === selectedTeam ||
      task.teamId === selectedTeam;

    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !s ||
      task.title.toLowerCase().includes(s) ||
      task.assignedTo?.firstName?.toLowerCase().includes(s) ||
      task.assignedTo?.lastName?.toLowerCase().includes(s) ||
      task.teamId?.name?.toLowerCase().includes(s);

    return matchesTeam && matchesSearch;
  });

  const openActionModal = (task, type) => {
    setActiveModalTask(task);
    setModalType(type);
    setFeedbackText(
      type === 'approve'
        ? 'Great execution! Deliverable passed quality standards.'
        : 'Please address the following items before sign-off:'
    );
  };

  const handleExecuteReview = async () => {
    if (!activeModalTask || !token) return;
    setIsSubmitting(true);
    try {
      const payload = {
        decision: modalType,
        feedback: feedbackText.trim()
      };

      const res = await axios.put(`/api/admin/tasks/${activeModalTask._id}/review`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        toast.success(
          modalType === 'approve'
            ? 'Task approved & completed! (+50 XP awarded)'
            : 'Changes requested. Task returned to In Progress.'
        );
        setActiveModalTask(null);
        setModalType(null);
        setFeedbackText('');
        fetchReviewQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Squad Review & Quality Check Hub</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {tasks.length} Awaiting Inspection
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Review engineering deliverables, code PRs, design mockups, and grant completion sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title or engineer..."
            className="bg-[#0E1321] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-52"
          />

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-[#0E1321] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Specialized Squads ({tasks.length})</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
          Loading squad review queue...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-[#0E1321] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-xl">
            ✨
          </div>
          <h3 className="text-base font-bold text-white">Review Queue Clean & Clear</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            There are currently no tasks awaiting quality sign-off. When engineers submit their deliverables from the squad dashboard, they will populate here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const assignee = task.assignedTo;
            const deliverable = task.reviewDetails?.deliverableLink;
            const notes = task.reviewDetails?.submissionNotes;

            return (
              <div
                key={task._id}
                className="bg-[#0E1321] border border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {task.teamId?.name || task.category || 'General'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {task.priority} Priority
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      {task.reviewDetails?.submittedAt
                        ? new Date(task.reviewDetails.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently submitted'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Submitted Deliverable:</span>
                      {deliverable ? (
                        <a
                          href={deliverable}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition-colors"
                        >
                          <span>Open Output URL</span>
                          <span className="text-xs">↗</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">No external URL provided</span>
                      )}
                    </div>

                    {notes && (
                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                          Engineer Notes
                        </span>
                        <p className="text-xs text-zinc-300 bg-black/30 p-2 rounded-lg border border-white/5 font-sans leading-relaxed">
                          "{notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {assignee?.avatar ? (
                      <img
                        src={assignee.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold">
                        {assignee?.firstName?.[0] || 'E'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">
                        {assignee ? `${assignee.firstName} ${assignee.lastName || ''}` : 'Assigned Engineer'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {assignee?.designation || 'Software Engineer'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openActionModal(task, 'request_changes')}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-all"
                    >
                      Request Rework
                    </button>
                    <button
                      onClick={() => openActionModal(task, 'approve')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      ✓ Approve Deliverable
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeModalTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-[#0D121F] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  {modalType === 'approve' ? 'Approve Task Deliverable' : 'Request Rework & Revision'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Task: <span className="text-white font-medium">{activeModalTask.title}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveModalTask(null)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                {modalType === 'approve' ? 'Quality Sign-Off Comments (Optional)' : 'Specify Actionable Revision Feedback'}
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={
                  modalType === 'approve'
                    ? 'e.g. Code reviewed and verified on staging. Great job!'
                    : 'e.g. Please add error handling for null payloads and update documentation.'
                }
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                required={modalType === 'request_changes'}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalTask(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || (modalType === 'request_changes' && !feedbackText.trim())}
                onClick={handleExecuteReview}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                  modalType === 'approve'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30'
                }`}
              >
                {isSubmitting
                  ? 'Processing...'
                  : modalType === 'approve'
                  ? 'Confirm Sign-Off'
                  : 'Send Rework Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskReviewHub;
