import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';

const AnnouncementsFeed = () => {
    const { token } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState([]);
    
    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get('/api/culture/announcements', { headers: { Authorization: `Bearer ${token}` } });
            setAnnouncements(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (token) fetchAnnouncements();
    }, [token]);

    if(announcements.length === 0) return null;

    return (
        <div className="mt-6 mb-2">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span className="text-blue-400">📢</span> Company Announcements
            </h3>
            <div className="space-y-3">
                {announcements.map((a) => (
                    <div key={a._id} className="p-4 bg-white/5 border border-white/10 hover:border-blue-500/20 backdrop-blur-md rounded-xl transition-all shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                    {a.title}
                                    {a.priority === 'High' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/20 uppercase tracking-widest">Urgent</span>}
                                </h4>
                                <p className="text-gray-300 mt-1 text-sm whitespace-pre-wrap">{a.content}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                                <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs font-semibold text-blue-400 mt-1">{a.author?.firstName}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnnouncementsFeed;
