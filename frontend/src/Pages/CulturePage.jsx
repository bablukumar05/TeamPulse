import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../Context/AuthProvider';
import toast from 'react-hot-toast';
import Header from '../Components/other/Header';

const CulturePage = (props) => {
  const { token, authUser } = useContext(AuthContext);
  const [kudos, setKudos] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [kudosRes, leaderRes] = await Promise.all([
        axios.get('/api/culture/kudos', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/culture/leaderboard', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setKudos(kudosRes.data);
      setLeaderboard(leaderRes.data);
    } catch (error) {
      toast.error('Failed to load culture data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSendKudo = async (e) => {
    e.preventDefault();
    try {
      if (!receiverId || !message) return toast.error('Fill all fields');
      await axios.post('/api/culture/kudos', { receiverId, message }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Kudo sent successfully! (+10 XP to them)');
      setMessage('');
      setReceiverId('');
      fetchData(); // Refresh Data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send Kudo');
    }
  };

  return (
    <div className='p-8 min-h-screen w-full bg-gradient-to-br from-[#0B0B0B] via-[#151515] to-[#1A1A1A] text-white selection:bg-emerald-500/30 flex flex-col'>
      <div className='max-w-7xl mx-auto w-full flex flex-col gap-4 flex-1'>
        <Header changeUser={props.changeUser} changePage={props.changePage} />

        <div className="flex justify-between items-center mt-8 mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white border-b-2 border-emerald-500 pb-2">Company Culture</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Send Kudo Form */}
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-6xl text-emerald-500 pointer-events-none">✨</div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Send a Shoutout</h2>
              <form onSubmit={handleSendKudo} className="space-y-4 relative z-10">
                <div>
                  <select 
                    value={receiverId} 
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
                  >
                    <option value="" className="bg-gray-800 text-gray-400">Select a Colleague...</option>
                    {leaderboard.map(u => {
                      if (u._id === authUser?.data?._id) return null; // Don't allow self-Kudo
                      return (
                        <option key={u._id} value={u._id} className="bg-gray-800 text-white">
                          {u.firstName} ({u.team})
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="E.g. Thanks for helping me debug the deployment issue yesterday! 🚀"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none focus:border-emerald-500 focus:bg-white/10 h-24 resize-none transition-all custom-scrollbar"
                  ></textarea>
                </div>
                <button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2 w-full justify-center">
                  <span>Send Kudo</span>
                </button>
              </form>
            </div>

            {/* Kudos Feed */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 mt-4 text-emerald-400">👏 Recent Kudos</h2>
              {loading ? (
                <div className="text-gray-500 text-center py-4">Loading...</div>
              ) : kudos.length === 0 ? (
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center text-gray-400">No kudos yet. Be the first to appreciate someone!</div>
              ) : (
                kudos.map(k => (
                  <div key={k._id} className="p-5 bg-white/5 backdrop-blur-md border border-white/5 hover:border-emerald-500/20 rounded-2xl transition-all shadow-lg flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                      {k.sender?.firstName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-white">{k.sender?.firstName}</span>
                        <span className="text-gray-400 text-sm">gave a shoutout to</span>
                        <span className="font-bold text-emerald-400">{k.receiver?.firstName}</span>
                      </div>
                      <p className="text-gray-300 italic text-sm mt-2 p-3 bg-white/5 rounded-xl border border-white/5 relative">
                        "{k.message}"
                      </p>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(k.createdAt).toLocaleDateString()} at {new Date(k.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Leaderboard Sidebar */}
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-purple-500/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-300">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                XP Leaderboard
              </h2>
              
              <div className="space-y-3">
                {leaderboard.length === 0 && !loading && <p className="text-gray-400 text-sm">No members to rank yet.</p>}
                {leaderboard.map((u, index) => (
                  <div key={u._id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                    <div className="flex items-center justify-center w-6 font-bold text-gray-400">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold shrink-0">
                       {u.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-sm text-white truncate">{u.firstName}</div>
                      <div className="text-[10px] text-purple-300 truncate uppercase mt-0.5 tracking-wider">{u.badges[0] || 'Rookie'}</div>
                    </div>
                    <div className="font-bold text-emerald-400 text-sm">{u.xp} XP</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 bg-white/5 border border-emerald-500/20 backdrop-blur-xl rounded-2xl relative overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur opacity-30"></div>
                <div className="relative z-10 text-center">
                    <h3 className="font-bold text-lg mb-2">How to earn XP?</h3>
                    <p className="text-sm text-gray-400">Complete tasks to earn XP. When a colleague sends you a Shoutout Kudo, you receive a <span className="text-emerald-400 font-bold">+10 XP</span> bonus!</p>
                </div>
            </div>

          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default CulturePage;
