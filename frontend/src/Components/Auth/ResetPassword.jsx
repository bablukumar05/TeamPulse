import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating password...");

    try {
      await axios.put(`/api/auth/resetpassword/${token}`, { password });
      toast.success("Password reset successfully!", { id: loadingToast });
      setIsSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password. Link may be expired.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#11141c] font-sans">
        <div className="relative z-10 w-full max-w-[500px] px-6 py-10">
          <div className="rounded-[40px] border border-white/10 bg-[#161a23]/40 px-10 py-16 text-center shadow-[0_20px_60px_0_rgba(0,0,0,0.6)] backdrop-blur-[24px]">
            <div className="w-20 h-20 mx-auto bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Password Reset!</h2>
            <p className="text-[#8a99a8] mb-8">Your password has been successfully updated. You can now log in with your new credentials.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-[13px] font-bold tracking-widest text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              RETURN TO LOGIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#11141c] font-sans">
      <div className="relative z-10 w-full max-w-[500px] px-6 py-10">
        <div className="rounded-[40px] border border-white/10 bg-[#161a23]/40 px-10 py-12 shadow-[0_20px_60px_0_rgba(0,0,0,0.6)] backdrop-blur-[24px]">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-bold tracking-widest text-[#7cc5d9] uppercase">
              Set New Password
            </h1>
            <p className="mt-3 text-xs text-[#8a99a8]">Please enter your new desired password.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[#8a99a8] tracking-widest uppercase">New Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-white/10 px-5 py-3 text-white transition-all focus:border-[#7cc5d9] focus:outline-none focus:ring-1 focus:ring-[#7cc5d9]"
                type="password"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-[#8a99a8] tracking-widest uppercase">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-white/10 px-5 py-3 text-white transition-all focus:border-[#7cc5d9] focus:outline-none focus:ring-1 focus:ring-[#7cc5d9]"
                type="password"
              />
            </div>

            <button
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-[13px] font-bold tracking-widest text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/30 active:translate-y-0 disabled:opacity-50"
              type="submit"
            >
              {isSubmitting ? 'UPDATING...' : 'RESET PASSWORD'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
