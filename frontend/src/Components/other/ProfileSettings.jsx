import React, { useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const ProfileSettings = ({ onClose }) => {
  const { authUser, setAuthUser, token } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password && !avatar) return toast.error('Nothing to update!');
    
    setIsSubmitting(true);
    const formData = new FormData();
    if (password) formData.append('password', password);
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await axios.put('/api/auth/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAuthUser({ ...authUser, data: res.data });
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white tracking-wide">Profile Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 hover:border-emerald-500/50 transition-all shadow-lg">
                  {authUser?.data?.avatar ? (
                     <img src={`http://localhost:5000${authUser.data.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                        {authUser?.data?.firstName?.charAt(0) || 'U'}
                     </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] text-white font-bold tracking-widest uppercase">Upload</span>
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setAvatar(e.target.files[0])} accept="image/*" />
                  </div>
              </div>
           </div>

           {avatar && <p className="text-center text-xs text-emerald-400">Selected: {avatar.name}</p>}

           <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
               <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Department</span>
                  <span className="text-sm font-bold text-white bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/30">{authUser?.data?.team || 'General'}</span>
               </div>
               <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Role</span>
                  <span className="text-sm font-bold text-gray-300">{authUser?.data?.role || 'Employee'}</span>
               </div>
           </div>

           <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Change Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
           </div>

           <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex gap-4">
                 <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors text-white">Cancel</button>
                 <button type="submit" disabled={isSubmitting || (!password && !avatar)} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                 </button>
              </div>
           </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default ProfileSettings;
