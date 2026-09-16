import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const LeaveApprovals = ({ refreshTrigger }) => {
    const { token } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await axios.get('/api/admin/leave-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRequests(res.data);
            } catch (err) {
                console.error("Failed to fetch leave requests", err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchLeaves();
    }, [token, refreshTrigger]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`/api/admin/leave-requests/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Leave request ${status}`);
            setRequests(requests.map(req => req._id === id ? { ...req, status } : req));
        } catch (err) {
            toast.error(`Failed to ${status.toLowerCase()} request`);
        }
    };

    if (loading) return null;

    const pendingRequests = requests.filter(r => r.status === 'Pending');

    if (pendingRequests.length === 0) return null;

    return (
        <div className="mt-8 bg-[#161a23]/60 border border-white/10 rounded-[30px] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/60">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Time-Off Requests</h2>
                    <p className="text-zinc-400 text-xs mt-0.5">Review and approve employee absence applications</p>
                </div>
                <span className="ml-auto bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-mono px-3 py-1 rounded-md">
                    {pendingRequests.length} pending
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map(req => (
                    <div key={req._id} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-white font-bold text-lg">{req.employeeId?.firstName} {req.employeeId?.lastName}</h3>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">{req.employeeId?.team || 'General'}</p>
                                </div>
                                <div className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300 font-mono">
                                    {new Date(req.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(req.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </div>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-3 mb-4 italic border-l-2 border-white/20 pl-3">"{req.reason}"</p>
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <button onClick={() => handleUpdateStatus(req._id, 'Approved')} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10">Approve</button>
                            <button onClick={() => handleUpdateStatus(req._id, 'Denied')} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/10">Deny</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveApprovals;
