import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from "../../Context/AuthProvider";

const ProfileSettings = ({ onClose }) => {
  const { authUser, setAuthUser, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | '2fa'

  // Profile Form State
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA Management State
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false, enforcedByWorkspace: false });
  const [loading2FA, setLoading2FA] = useState(false);
  const [setupStep, setSetupStep] = useState('idle'); // 'idle' | 'scan' | 'recovery'
  const [qrCodeData, setQrCodeData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetch2FAStatus = useCallback(async () => {
    if (!token) return;
    setLoading2FA(true);
    try {
      const res = await axios.get('/api/auth/2fa/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFactorStatus(res.data);
    } catch {
      // ignore
    } finally {
      setLoading2FA(false);
    }
  }, [token]);

  useEffect(() => {
    fetch2FAStatus();
  }, [fetch2FAStatus]);

  const handleSubmitProfile = async (e) => {
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
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart2FASetup = async () => {
    setIsActionLoading(true);
    try {
      const res = await axios.post('/api/auth/2fa/setup', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCodeData(res.data);
      setVerifyCode('');
      setSetupStep('scan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate 2FA setup');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return toast.error('Please enter the 6-digit code');

    setIsActionLoading(true);
    try {
      const res = await axios.post('/api/auth/2fa/confirm', { code: verifyCode.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecoveryCodes(res.data.recoveryCodes || []);
      setSetupStep('recovery');
      fetch2FAStatus();
      toast.success('Two-factor authentication enabled!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!disablePassword) return toast.error('Enter your password to disable 2FA');

    setIsActionLoading(true);
    try {
      await axios.post('/api/auth/2fa/disable', { password: disablePassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Two-factor authentication disabled');
      setShowDisableModal(false);
      setDisablePassword('');
      setSetupStep('idle');
      fetch2FAStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg || 'Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white tracking-wide">Account Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Profile & Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('2fa')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === '2fa' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Two-Factor (2FA)</span>
              {twoFactorStatus.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleSubmitProfile} className="p-6 space-y-5">
            <div className="flex justify-center mb-2">
              <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-4 border-white/10 hover:border-emerald-500/50 transition-all shadow-lg">
                {authUser?.data?.avatar ? (
                  <img src={authUser.data.avatar.startsWith('http') ? authUser.data.avatar : `${import.meta.env.VITE_API_URL || ''}${authUser.data.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {authUser?.data?.firstName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] text-white font-bold tracking-widest uppercase">Upload</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setAvatar(e.target.files[0])} accept="image/*" />
                </div>
              </div>
            </div>

            {avatar && <p className="text-center text-xs text-emerald-400">Selected: {avatar.name}</p>}

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Department</span>
                <span className="text-xs font-bold text-white bg-blue-500/20 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                  {authUser?.data?.role === 'Admin' ? (authUser?.data?.department || 'Executive Management') : (authUser?.data?.department || authUser?.data?.team || 'General')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Role</span>
                <span className="text-xs font-bold text-gray-300">
                  {authUser?.data?.role === 'Admin' ? '👑 Workspace Admin' : (authUser?.data?.role || 'Employee')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Change Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-colors text-white cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!password && !avatar)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {activeTab === '2fa' && (
          <div className="p-6 space-y-5">
            {loading2FA ? (
              <div className="py-12 text-center text-xs text-zinc-500">Checking 2FA security status...</div>
            ) : setupStep === 'idle' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className={`p-2 rounded-lg ${twoFactorStatus.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">
                        {twoFactorStatus.enabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Disabled'}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        twoFactorStatus.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {twoFactorStatus.enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {twoFactorStatus.enabled
                        ? 'Your account requires an authenticator app code (Google/Microsoft Authenticator) each time you log in.'
                        : 'Protect your account against unauthorized access with TOTP RFC 6238 two-factor authentication.'}
                    </p>
                  </div>
                </div>

                {twoFactorStatus.enforcedByWorkspace && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                    🛡️ <strong>Organization Policy:</strong> Workspace administrator has mandated Two-Factor Authentication for all members.
                  </div>
                )}

                {twoFactorStatus.enabled ? (
                  <div>
                    {!twoFactorStatus.enforcedByWorkspace && (
                      <button
                        type="button"
                        onClick={() => setShowDisableModal(true)}
                        className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Disable Two-Factor Authentication
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStart2FASetup}
                    disabled={isActionLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isActionLoading ? 'Preparing Setup...' : 'Set Up Two-Factor Authentication'}
                  </button>
                )}
              </div>
            ) : setupStep === 'scan' ? (
              <form onSubmit={handleConfirm2FA} className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold text-white">Scan with Authenticator App</h4>
                  <p className="text-[11px] text-zinc-400">
                    Use Google Authenticator, Microsoft Authenticator, or 1Password to scan this QR code:
                  </p>
                </div>

                {qrCodeData?.qrCode && (
                  <div className="flex justify-center p-3 bg-white rounded-xl mx-auto w-fit shadow-md">
                    <img src={qrCodeData.qrCode} alt="2FA QR Code" className="w-36 h-36" />
                  </div>
                )}

                {qrCodeData?.secret && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Or enter code manually:</span>
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl text-xs font-mono text-zinc-200">
                      <span className="tracking-wider">{qrCodeData.secret}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(qrCodeData.secret, 'Secret key copied!')}
                        className="text-indigo-400 hover:text-indigo-300 text-[11px] font-sans font-semibold cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Enter 6-Digit Code from App
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.4em] text-lg font-mono bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep('idle')}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading || verifyCode.length < 6}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isActionLoading ? 'Verifying...' : 'Activate 2FA'}
                  </button>
                </div>
              </form>
            ) : setupStep === 'recovery' ? (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-white">Save Your Emergency Backup Codes</h4>
                  <p className="text-[11px] text-zinc-400">
                    If you lose access to your phone or authenticator app, these one-time codes are the only way to recover your account:
                  </p>
                </div>

                <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center text-zinc-200">
                    {recoveryCodes.map((code, idx) => (
                      <div key={idx} className="bg-white/5 py-1.5 px-2 rounded-lg border border-white/5">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'All backup codes copied!')}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  📋 Copy All Backup Codes
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSetupStep('idle');
                    toast.success('Two-factor setup complete!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  I Have Saved My Codes
                </button>
              </div>
            ) : null}

            {showDisableModal && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
                <div className="bg-[#181C28] border border-white/10 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">Disable Two-Factor Authentication</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Enter your current account password to confirm disabling 2FA:
                    </p>
                  </div>
                  <form onSubmit={handleDisable2FA} className="space-y-3">
                    <input
                      type="password"
                      autoFocus
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Account password"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDisableModal(false);
                          setDisablePassword('');
                        }}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-zinc-400 text-xs font-semibold hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {isActionLoading ? 'Disabling...' : 'Confirm'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
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
