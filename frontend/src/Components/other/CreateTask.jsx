import React, { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../Context/AuthProvider";

const CreateTask = ({ onTaskCreated }) => {
  const { token } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [category, setCategory] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get("/api/projects", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (error) {
        console.error("Failed to fetch projects");
      }
    };
    fetchProjects();
  }, [token]);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/api/admin/tasks", {
        title,
        description,
        date,
        category,
        assignTo,
        projectId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Task created successfully!");
      if (onTaskCreated) onTaskCreated();
      
      setTitle("");
      setCategory("");
      setAssignTo("");
      setDate("");
      setDescription("");
      setProjectId("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create task");
    }
  };

  return (
    <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 mt-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group transition-all duration-300">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
      <form
        onSubmit={submitHandler}
        className="flex w-full flex-wrap items-start justify-between relative z-10"
      >
        <div className="w-full lg:w-1/2 lg:pr-8">
          <div className="mb-5">
            <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Task Title</h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 mb-2 text-white transition-all duration-300 shadow-inner placeholder-gray-500"
              type="text"
              placeholder="E.g. Design Homepage UI"
              required
            />
          </div>
          <div className="flex gap-4 mb-5">
            <div className="w-1/2">
              <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Date</h3>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 text-white transition-all duration-300 shadow-inner [color-scheme:dark]"
                type="date"
                required
              />
            </div>
            <div className="w-1/2">
              <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Category</h3>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 text-white transition-all duration-300 shadow-inner placeholder-gray-500"
                type="text"
                placeholder="Design, Dev, Marketing..."
                required
              />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Assign To</h3>
            <input
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 text-white transition-all duration-300 shadow-inner placeholder-gray-500"
              type="text"
              placeholder="E.g. Employee ID / Username"
              required
            />
          </div>
          <div className="mt-5">
            <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Project (Optional)</h3>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 text-white transition-all duration-300 shadow-inner"
            >
              <option value="" className="bg-gray-800 text-gray-400">No Project</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id} className="bg-gray-800 text-white">
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="w-full lg:w-1/2 flex flex-col items-start lg:pl-4 mt-8 lg:mt-0">
          <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Description</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm py-4 px-4 w-full h-48 rounded-xl outline-none bg-white/5 border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 text-white transition-all duration-300 shadow-inner resize-none placeholder-gray-500 custom-scrollbar"
            placeholder="Detailed description of the task..."
            required
          ></textarea>

          <button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 py-3.5 px-6 rounded-xl text-sm font-bold tracking-wider text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2">
            <span>Create Task</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
        </div>
      </form>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}} />
    </div>
  );
};

export default CreateTask;
