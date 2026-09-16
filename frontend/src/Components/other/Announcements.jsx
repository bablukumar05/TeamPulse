import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const Announcements = ({ allowCreate = false, refreshTrigger }) => {
  const { token } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/culture/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data || []);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(
        '/api/culture/announcements',
        { title, content, priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Announcement broadcasted');
      setTitle('');
      setContent('');
      setPriority('Normal');
      fetchAnnouncements();
      if (refreshTrigger) refreshTrigger();
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {allowCreate && (
        <div className="p-8 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-xl border border-blue-500/20 mt-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <span className="text-blue-400">📢</span> Broadcast Company Announcement
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  placeholder="Announcement Title"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold"
                  required
                />
              </div>
              <div className="w-1/4">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                >
                  <option value="Normal" className="bg-gray-800">Normal Priority</option>
                  <option value="High" className="bg-gray-800 font-bold text-rose-400">High Priority</option>
                </select>
              </div>
            </div>
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed message..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:bg-white/10 h-24 resize-none transition-all custom-scrollbar"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all"
            >
              {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </form>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="mt-6 mb-2">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <span className="text-blue-400">📢</span> Company Announcements
          </h3>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a._id}
                className="p-4 bg-white/5 border border-white/10 hover:border-blue-500/20 backdrop-blur-md rounded-xl transition-all shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-lg flex items-center gap-2">
                      {a.title}
                      {a.priority === 'High' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                          Urgent
                        </span>
                      )}
                    </h4>
                    <p className="text-gray-300 mt-1 text-sm whitespace-pre-wrap">{a.content}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-xs text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-semibold text-blue-400 mt-1">
                      {a.author?.firstName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
