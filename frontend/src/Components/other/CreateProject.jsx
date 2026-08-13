import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../Context/AuthProvider";

const CreateProject = ({ refreshTrigger }) => {
  const { token } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [priority, setPriority] = useState("High");
  const [employees, setEmployees] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("/api/admin/employees", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(res.data);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    if (token) fetchEmployees();
  }, [token]);

  const handleMemberSelect = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedMembers(options);
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/api/projects", {
        name,
        description,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        priority,
        members: selectedMembers
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Project created successfully!");
      if (refreshTrigger) refreshTrigger();
      
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus("In Progress");
      setPriority("High");
      setSelectedMembers([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 mt-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group transition-all duration-300">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
      
      <div className="relative z-10 mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Create New Project</h2>
      </div>

      <form
        onSubmit={submitHandler}
        className="flex w-full flex-wrap items-start justify-between relative z-10 gap-y-4"
      >
        {/* Left Column */}
        <div className="w-full lg:w-[48%] flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Project Name</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner placeholder-gray-500"
              type="text"
              placeholder="E.g. E-Commerce Website"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-gray-900 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner"
              >
                <option value="In Progress">In Progress</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="w-1/2">
              <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Priority</h3>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-gray-900 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Start Date</h3>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner"
              />
            </div>

            <div className="w-1/2">
              <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">End Date</h3>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-white/5 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Team Members</h3>
            <select
              multiple
              value={selectedMembers}
              onChange={handleMemberSelect}
              className="text-sm py-3 px-4 w-full h-28 rounded-xl outline-none bg-white/5 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner custom-scrollbar"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id} className="bg-gray-800 text-white py-1">
                  {emp.firstName} {emp.lastName} ({emp.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Selected: {selectedMembers.length} member(s)</p>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="w-full lg:w-[48%] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-300 mb-2 tracking-widest uppercase">Description</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm py-4 px-4 w-full h-56 rounded-xl outline-none bg-white/5 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-300 shadow-inner resize-none placeholder-gray-500 custom-scrollbar"
              placeholder="Detailed description of the project..."
              required
            ></textarea>
          </div>

          <button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 py-3.5 px-6 rounded-xl text-sm font-bold tracking-wider text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2">
            <span>Create Project</span>
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
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}} />
    </div>
  );
};

export default CreateProject;
