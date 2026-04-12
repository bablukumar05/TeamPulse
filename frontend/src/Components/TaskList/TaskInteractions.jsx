import React, { useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const TaskInteractions = ({ task, onUpdate }) => {
  const { token, authUser } = useContext(AuthContext);
  const [commentText, setCommentText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await axios.post(`/api/employee/tasks/${task._id}/comment`, 
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Comment added!");
      setCommentText('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      await axios.post(`/api/employee/tasks/${task._id}/upload`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      toast.success("File uploaded!");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  // Only employees assigned or admins should interact? 
  // We assume if this component renders, the user has access.

  return (
    <div className="mt-4 pt-4 border-t border-white/10 relative z-10 font-sans">
      {/* Attachments Section */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mb-3">
          <h4 className="text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Attachments</h4>
          <div className="flex flex-col gap-1">
            {task.attachments.map((file, idx) => (
              <a 
                key={idx} 
                href={`http://localhost:5000${file.url}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 truncate transition-colors flex items-center gap-1 bg-blue-500/10 w-max px-2 py-1 rounded"
              >
                📎 {file.filename}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <h4 className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Comments ({task.comments?.length || 0})</h4>
      <div className="max-h-28 overflow-y-auto mb-3 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {task.comments && task.comments.map((c, i) => (
          <div key={i} className="bg-black/20 rounded p-2 border border-white/5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-gray-200">{c.userName || 'User'}</span>
              <span className="text-[9px] text-gray-500">{new Date(c.date).toLocaleDateString()}</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-tight">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Inputs */}
      <React.Fragment>
      <form onSubmit={handleAddComment} className="flex gap-2 items-center mb-2">
        <input 
          type="text" 
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50" disabled={!commentText.trim()}>Post</button>
      </form>
      
      <div>
         <label className={`cursor-pointer text-[10px] bg-white/10 border border-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg inline-block transition-all ${isUploading ? 'animate-pulse' : ''} active:scale-95`}>
            {isUploading ? 'Uploading...' : '📎 Attach File'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
         </label>
      </div>
      </React.Fragment>
    </div>
  );
};

export default TaskInteractions;
