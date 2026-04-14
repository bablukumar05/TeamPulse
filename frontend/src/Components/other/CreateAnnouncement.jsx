import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';
import toast from 'react-hot-toast';

const CreateAnnouncement = ({ refreshTrigger }) => {
    const { token } = useContext(AuthContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('Normal');

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/culture/announcements', { title, content, priority }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Announcement posted successfully!");
            setTitle('');
            setContent('');
            setPriority('Normal');
            if(refreshTrigger) refreshTrigger(); // Might use to refresh feed below it if we render feed in Admin too
        } catch (error) {
            toast.error("Failed to post announcement");
        }
    };

    return (
        <div className="p-8 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-xl border border-blue-500/20 mt-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <span className="text-blue-400">📢</span> Broadcast Company Announcement
            </h2>
            <form onSubmit={submitHandler} className="space-y-4">
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
                    ></textarea>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all">
                    Broadcast Announcement
                </button>
            </form>
        </div>
    );
};

export default CreateAnnouncement;
