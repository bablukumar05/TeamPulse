import React, { useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const EditEmployeeModal = ({ employee, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [team, setTeam] = useState(employee.team || 'General');
  const [role, setRole] = useState(employee.role || 'Employee');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.put(`/api/admin/employees/${employee._id}`, 
        { team, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Employee updated!');
      onSuccess();
    } catch (err) {
      toast.error('Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white tracking-wide">Edit Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
           <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white">{employee.firstName}</h3>
              <p className="text-sm text-gray-400">{employee.email}</p>
           </div>

           <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Department / Team</label>
              <select 
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="General" className="bg-[#1A1A1A]">General</option>
                <option value="Engineering" className="bg-[#1A1A1A]">Engineering</option>
                <option value="Marketing" className="bg-[#1A1A1A]">Marketing</option>
                <option value="Design" className="bg-[#1A1A1A]">Design</option>
                <option value="HR" className="bg-[#1A1A1A]">HR</option>
              </select>
           </div>

           <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Role Level</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="Employee" className="bg-[#1A1A1A]">Employee</option>
                <option value="Manager" className="bg-[#1A1A1A]">Manager</option>
                <option value="Admin" className="bg-[#1A1A1A]">System Admin</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">Managers can only assign tasks and view stats for their own team. Full Admins have global access.</p>
           </div>

           <div className="pt-4 border-t border-white/10 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-semibold text-white transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-lg text-sm font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                 Save
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
