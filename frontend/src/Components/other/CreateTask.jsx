import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../Context/AuthProvider";

const LABEL_OPTIONS = [
  { value: 'Backend',       emoji: '⚙️',  color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { value: 'Frontend',      emoji: '🖥️',  color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { value: 'Bug',           emoji: '🐛',  color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { value: 'Feature',       emoji: '✨',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { value: 'Urgent',        emoji: '🚨',  color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { value: 'Documentation', emoji: '📝',  color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'Testing',       emoji: '🧪',  color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'Research',      emoji: '🔬',  color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'Design',        emoji: '🎨',  color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { value: 'DevOps',        emoji: '🐳',  color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
];

const CreateTask = ({ onTaskCreated }) => {
  const { token } = useContext(AuthContext);

  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [dueDate, setDueDate]           = useState("");
  const [startDate, setStartDate]       = useState("");
  const [assignTo, setAssignTo]         = useState("");
  const [priority, setPriority]         = useState("Medium");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [projects, setProjects]         = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [projectId, setProjectId]       = useState("");
  const [checklistItems, setChecklistItems] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, empRes] = await Promise.all([
          axios.get("/api/projects",         { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("/api/admin/employees",   { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setProjects(projRes.data);
        setEmployees(empRes.data);
      } catch (error) {
        console.error("Failed to fetch projects or employees");
      }
    };
    if (token) fetchData();
  }, [token]);

  const toggleLabel = (label) => {
    setSelectedLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const addChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    setChecklistItems(prev => [...prev, { title: newChecklistItem.trim(), completed: false }]);
    setNewChecklistItem("");
  };

  const removeChecklistItem = (index) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setStartDate("");
    setAssignTo("");
    setPriority("Medium");
    setEstimatedHours("");
    setSelectedLabels([]);
    setProjectId("");
    setChecklistItems([]);
    setNewChecklistItem("");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!assignTo) { toast.error("Please assign the task to an employee"); return; }

    setIsSubmitting(true);
    try {
      await axios.post("/api/admin/tasks", {
        title,
        description,
        dueDate:        dueDate || undefined,
        startDate:      startDate || undefined,
        priority,
        estimatedHours: Number(estimatedHours) || 0,
        assignTo,
        projectId:      projectId || undefined,
        labels:         selectedLabels,
        category:       selectedLabels[0] || 'General',
        checklist:      checklistItems,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("✅ Task created successfully!", {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      if (onTaskCreated) onTaskCreated();
      handleReset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/40 focus:border-emerald-500/70 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/15 text-white transition-all placeholder-gray-600 [color-scheme:dark]";
  const selectClass = "text-sm py-3 px-4 w-full rounded-xl outline-none bg-[#1a1d24] border border-white/[0.08] hover:border-emerald-500/40 focus:border-emerald-500/70 text-white transition-all cursor-pointer";
  const labelClass = "text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block";

  return (
    <div className="p-6 sm:p-8 bg-zinc-900/40 border border-zinc-800/80 mt-6 rounded-2xl relative overflow-hidden transition-all duration-300">
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Create New Task
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Assign requirements, story points, and priority to team members</p>
          </div>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,200px] gap-4">
            <div>
              <label className={labelClass}>Task Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputClass}
                type="text"
                placeholder="E.g. Implement JWT Authentication"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={selectClass}>
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Assign To *</label>
              {employees.length > 0 ? (
                <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className={selectClass} required>
                  <option value="">Select Employee…</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp.firstName}>
                      {emp.firstName} {emp.lastName || ''} ({emp.email})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={assignTo}
                  onChange={e => setAssignTo(e.target.value)}
                  className={inputClass}
                  type="text"
                  placeholder="Employee First Name"
                  required
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Project (Optional)</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={selectClass}>
                <option value="">No Project</option>
                {projects.map(proj => (
                  <option key={proj._id} value={proj._id}>{proj.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} type="date" />
            </div>
            <div>
              <label className={labelClass}>Due Date *</label>
              <input value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} type="date" required />
            </div>
            <div>
              <label className={labelClass}>Est. Hours</label>
              <input
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                className={inputClass}
                type="number"
                min="0"
                step="0.5"
                placeholder="E.g. 8"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Labels
              {selectedLabels.length > 0 && (
                <span className="ml-2 text-emerald-400 normal-case font-mono">({selectedLabels.length} selected)</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-white/[0.02] border border-white/[0.07] rounded-xl">
              {LABEL_OPTIONS.map(({ value, emoji, color }) => {
                const active = selectedLabels.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleLabel(value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      active
                        ? `${color} scale-105 shadow-md`
                        : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {emoji} {value} {active && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${inputClass} h-32 resize-none custom-scrollbar`}
              placeholder="Detailed description of the task, acceptance criteria, links…"
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Checklist
              {checklistItems.length > 0 && (
                <span className="ml-2 text-blue-400 normal-case font-mono">({checklistItems.length} items)</span>
              )}
            </label>
            
            {checklistItems.length > 0 && (
              <div className="space-y-2 mb-3">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 group">
                    <div className="w-4 h-4 rounded border-2 border-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-200 flex-1">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(i)}
                      className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a checklist item…"
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(e); } }}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold text-gray-300 transition-colors flex-shrink-0"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-5 rounded-lg text-xs font-semibold tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Assign Task
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
