import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const LeaveRequestPanel = ({ onClose }) => {
  const { token } = useContext(AuthContext);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastRequests, setPastRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('/api/employee/leave-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPastRequests(res.data);
      } catch (error) {
        console.error("Failed to fetch past requests");
      }
    };
    if (token) fetchRequests();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return toast.error('All fields are required');
    
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/employee/leave-request', { startDate, endDate, reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Leave request submitted!');
      setPastRequests([res.data.leaveRequest, ...pastRequests]);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'Denied') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border-l border-white/10 shadow-2xl h-full w-full max-w-md overflow-y-auto animate-slide-left flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Request Time Off
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]" />
              </div>
           </div>

           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required rows="3" placeholder="Explain why you need this time off..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"></textarea>
           </div>

           <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
           </button>
        </form>

        <div className="flex-1 bg-black/20 p-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Past Requests</h3>
            <div className="space-y-3">
               {pastRequests.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center italic py-4">No leave requests found.</p>
               ) : (
                  pastRequests.map(req => (
                     <div key={req._id} className="bg-white/5 border border-white/5 rounded-xl p-4 transition-all hover:bg-white/10">
                        <div className="flex justify-between items-start mb-2">
                           <div className="text-sm text-white font-medium">
                              {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getStatusColor(req.status)}`}>
                              {req.status}
                           </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{req.reason}</p>
                     </div>
                  ))
               )}
            </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default LeaveRequestPanel;
