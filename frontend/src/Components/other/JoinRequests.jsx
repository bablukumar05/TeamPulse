import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const JoinRequests = ({ refreshTrigger }) => {
    const [requests, setRequests] = useState([]);
    const { token } = useContext(AuthContext);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/admin/join-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch join requests");
        }
    };

    useEffect(() => {
        if (token) fetchRequests();
    }, [token, refreshTrigger]);

    const handleAction = async (id, action) => {
        let offerLPA = 0;
        if (action === 'approve') {
            const result = window.prompt("Enter Package Offer in LPA (e.g. 12.5):", "0");
            if (result === null) return toast.error('Approval cancelled');
            offerLPA = parseFloat(result) || 0;
        }

        try {
            await axios.put(`/api/admin/join-requests/${id}/approve`, { action, offerLPA }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Request ${action}d successfully`);
            fetchRequests();
        } catch (error) {
            toast.error(`Failed to ${action} request`);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="bg-[#161a23]/60 border border-white/10 p-6 rounded-[20px] shadow-2xl backdrop-blur-xl mt-4">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-4 tracking-wider uppercase">Pending Join Requests</h2>
            <div className="space-y-3">
                {requests.map(req => (
                    <div key={req._id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 transition-all hover:bg-white/5">
                        <div>
                            <p className="font-bold text-white mb-1">{req.userId?.firstName} <span className="text-gray-500 text-xs font-normal">({req.userId?.email})</span></p>
                            
                            {req.tenthMarks !== undefined && (
                                <div className="text-xs text-gray-400 mt-1 mb-1">
                                    <span className="font-bold text-gray-300">Academics:</span> 10th ({req.tenthMarks}%), 12th ({req.twelfthMarks}%)
                                </div>
                            )}
                            {req.graduationDegree && (
                                <div className="text-xs text-gray-400 mb-1">
                                    <span className="font-bold text-gray-300">Degrees:</span> {req.graduationDegree} {req.postGraduationDegree ? `| ${req.postGraduationDegree}` : ''}
                                </div>
                            )}
                            {req.resumeUrl && (
                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${req.resumeUrl}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 font-bold tracking-wider hover:underline mb-2 block">
                                    📄 VIEW RESUME
                                </a>
                            )}
                            
                            {req.skills && req.skills.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {req.skills.map((skill, i) => (
                                        <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-bold">{skill}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleAction(req._id, 'approve')}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Approve
                            </button>
                            <button 
                                onClick={() => handleAction(req._id, 'reject')}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JoinRequests;
