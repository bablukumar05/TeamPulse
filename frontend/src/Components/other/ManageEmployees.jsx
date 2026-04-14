import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';
import toast from 'react-hot-toast';

const ManageEmployees = ({ refreshTrigger }) => {
    const { token } = useContext(AuthContext);
    const [activeEmployees, setActiveEmployees] = useState([]);
    const [terminatedEmployees, setTerminatedEmployees] = useState([]);
    const [viewTerminated, setViewTerminated] = useState(false);

    const fetchData = async () => {
        try {
            const [activeRes, termRes] = await Promise.all([
                axios.get('/api/admin/employees', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/employees/terminated', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setActiveEmployees(activeRes.data);
            setTerminatedEmployees(termRes.data);
        } catch (error) {
            console.error('Failed to fetch employee lists');
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token, refreshTrigger]);

    const handleTerminate = async (id, name) => {
        if (!window.confirm(`Are you sure you want to terminate ${name}? Their active tasks will be failed and their login revoked.`)) return;
        
        try {
            await axios.put(`/api/admin/employees/${id}/terminate`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`${name} has been terminated.`);
            fetchData();
        } catch (error) {
            toast.error('Failed to terminate employee.');
        }
    };

    const handleRestore = async (id, name) => {
        if (!window.confirm(`Are you sure you want to restore ${name}? They will be able to log in again.`)) return;
        
        try {
            await axios.put(`/api/admin/employees/${id}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`${name} has been Restored.`);
            fetchData();
        } catch (error) {
            toast.error('Failed to restore employee.');
        }
    };

    return (
        <div className="bg-[#161a23]/60 border border-white/10 p-6 rounded-[20px] shadow-2xl backdrop-blur-xl mt-4">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 tracking-wider">
                    {viewTerminated ? 'Alumni / Terminated Staff' : 'Active Employees Directory'}
                </h2>
                <button 
                    onClick={() => setViewTerminated(!viewTerminated)}
                    className="text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-4 py-2 rounded-xl transition-all"
                >
                    {viewTerminated ? 'View Active Staff' : `View Terminated (${terminatedEmployees.length})`}
                </button>
            </div>

            <div className="space-y-3">
                {!viewTerminated && activeEmployees.map(emp => (
                    <div key={emp._id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 transition-all hover:bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                                {emp.firstName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-white mb-1">{emp.firstName} <span className="text-gray-500 text-xs font-normal">({emp.email})</span></p>
                                <div className="text-xs text-gray-400">Team: <span className="text-teal-400">{emp.team}</span> | Base LPA: {emp.baseSalaryLPA || 0}</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleTerminate(emp._id, emp.firstName)}
                            title="Fire/Deactivate Employee"
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Terminate
                        </button>
                    </div>
                ))}
                {!viewTerminated && activeEmployees.length === 0 && <p className="text-gray-500 text-sm">No active employees found.</p>}

                {viewTerminated && terminatedEmployees.map(emp => (
                    <div key={emp._id} className="bg-rose-900/10 border border-rose-500/10 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 transition-all hover:bg-white/5">
                         <div className="flex items-center gap-4 opacity-70">
                            <div className="w-10 h-10 rounded-full bg-gray-500/20 text-gray-400 flex items-center justify-center font-bold">
                                {emp.firstName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-300 mb-1">{emp.firstName} <span className="text-gray-500 text-xs font-normal">({emp.email})</span></p>
                                <div className="text-xs text-rose-400 font-bold tracking-widest uppercase">Terminated / Formally Fired</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleRestore(emp._id, emp.firstName)}
                            title="Re-Hire/Restore Access"
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Restore
                        </button>
                    </div>
                ))}
                {viewTerminated && terminatedEmployees.length === 0 && <p className="text-gray-500 text-sm">No terminated employees record found.</p>}
            </div>
        </div>
    );
};

export default ManageEmployees;
