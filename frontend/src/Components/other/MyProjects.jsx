import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../../Context/AuthProvider";

const MyProjects = () => {
  const { token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("/api/employee/projects", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProjects(response.data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    if (token) {
      fetchProjects();
    }
  }, [token]);

  if (!projects || projects.length === 0) {
    return null;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'On Hold': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Planning': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="w-full mt-8 bg-white/5 border border-white/10 backdrop-blur-md p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">
        My Assigned Projects
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project._id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors shadow-inner flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="text-xl font-semibold text-gray-200 line-clamp-1">{project.name}</h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                    {project.status || 'In Progress'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(project.priority)}`}>
                    {project.priority || 'Medium'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-400 line-clamp-3 mb-4">{project.description}</p>
            </div>
            
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                <span>End: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold tracking-wider uppercase">Members: {project.members?.length || 0}</span>
                <span className="text-blue-400 font-semibold tracking-wider uppercase">ID: ...{project._id.slice(-4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyProjects;
