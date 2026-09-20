import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../Context/AuthProvider";

const DEPARTMENTS = [
  "Engineering",
  "Product & Design",
  "Quality Assurance",
  "DevOps & Infrastructure",
  "Data Science & AI",
  "Human Resources (HR)",
  "Marketing & Sales",
  "Operations & Finance",
  "General",
];

const Login = ({ onClose, prefill }) => {
  const [email, setEmail] = useState(prefill?.email || "");
  const [password, setPassword] = useState(prefill?.password || "");

  useEffect(() => {
    if (prefill?.email) setEmail(prefill.email);
    if (prefill?.password) setPassword(prefill.password);
    if (prefill?.autoSubmit && prefill?.email && prefill?.password) {
      executeLogin(prefill.email, prefill.password);
    }
  }, [prefill]);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [department, setDepartment] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Two-Factor Authentication Challenge State
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const { setToken, setAuthUser } = useContext(AuthContext);

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.dispatchEvent(new CustomEvent("closeAuthModal"));
    }
  };

  const resetMode = (registerMode) => {
    setIsRegistering(registerMode);
    setIsForgotPassword(false);
    setTwoFactorData(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      return toast.error(useRecoveryCode ? "Please enter your recovery code" : "Please enter the 6-digit code");
    }

    setIsVerifying2FA(true);
    const loadingToast = toast.loading("Verifying authentication code...");

    try {
      const res = await axios.post("/api/auth/2fa/login-verify", {
        tempToken: twoFactorData.tempToken,
        code: twoFactorCode.trim(),
        isRecoveryCode: useRecoveryCode,
      });

      toast.dismiss(loadingToast);

      if (res.data.token) {
        const userObj = {
          role: (res.data.role || res.data.user?.role || "Employee").toLowerCase(),
          data: res.data.user || res.data,
        };

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("authUser", JSON.stringify(userObj));
        setToken(res.data.token);
        setAuthUser(userObj);

        toast.success(res.data.message || "2FA verified! Welcome back.");
        handleClose();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || "Invalid authentication code";
      toast.error(errMsg);
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const executeLogin = async (loginEmail, loginPassword) => {
    if (!loginEmail || !loginPassword) {
      return toast.error("Please enter email and password");
    }

    setEmail(loginEmail);
    setPassword(loginPassword);
    setIsSubmitting(true);
    const loadingToast = toast.loading("Authenticating...");

    try {
      const response = await axios.post("/api/auth/login", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      }, { timeout: 20000 });

      toast.dismiss(loadingToast);

      if (response.data.require2FA) {
        setTwoFactorData({
          tempToken: response.data.tempToken,
          email: response.data.email || loginEmail.trim().toLowerCase(),
        });
        setTwoFactorCode("");
        setUseRecoveryCode(false);
        toast.success("Two-Factor Authentication required. Check your authenticator app.");
        return;
      }

      if (response.data.token) {
        const userObj = {
          role: (response.data.role || response.data.user?.role || "Employee").toLowerCase(),
          data: response.data.user || response.data,
        };

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("authUser", JSON.stringify(userObj));
        setToken(response.data.token);
        setAuthUser(userObj);

        toast.success(response.data.message || "Welcome back!");
        handleClose();
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      const errMsg = error.response?.data?.message || "Invalid email or password";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (isForgotPassword) {
      if (!email.trim()) return toast.error("Please enter your registered email address");
      setIsSubmittingForgot(true);
      const loadingToast = toast.loading("Sending reset link...");
      try {
        await axios.post("/api/auth/forgotpassword", { email: email.trim() });
        toast.dismiss(loadingToast);
        toast.success("Password reset instructions sent to your email!");
        setIsForgotPassword(false);
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error(err.response?.data?.message || "Failed to send reset email");
      } finally {
        setIsSubmittingForgot(false);
      }
      return;
    }

    if (!isRegistering) {
      return executeLogin(email.trim().toLowerCase(), password);
    }

    if (!email.trim() || !password) {
      return toast.error("Please enter email and password");
    }

    if (isRegistering) {
      if (!firstName.trim()) {
        return toast.error("Please enter your full name");
      }
      if (!hasMinLength) {
        return toast.error("Password must be at least 8 characters long");
      }
      if (!hasUpper) {
        return toast.error("Password must contain at least one uppercase letter");
      }
      if (!hasLower) {
        return toast.error("Password must contain at least one lowercase letter");
      }
      if (!hasNumber) {
        return toast.error("Password must contain at least one number");
      }
      if (!hasSymbol) {
        return toast.error("Password must contain at least one special character or symbol");
      }
      if (password !== confirmPassword) {
        return toast.error("Confirm password does not match");
      }
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating account...");
    try {
      const payload = {
        firstName: firstName.trim(),
        email: email.trim(),
        password,
        department: department || "General",
      };
      if (inviteCode.trim()) {
        payload.inviteCode = inviteCode.trim();
      }

      const response = await axios.post("/api/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      });

      toast.dismiss(loadingToast);

      if (response.data.token) {
        const userObj = {
          role: (response.data.role || response.data.user?.role || "Employee").toLowerCase(),
          data: response.data.user || response.data,
        };

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("authUser", JSON.stringify(userObj));
        setToken(response.data.token);
        setAuthUser(userObj);

        toast.success(response.data.message || "Registration successful!");
        handleClose();
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      const errMsg = error.response?.data?.message || "Registration failed";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardContent = (
    <div className={`relative z-10 w-full ${isRegistering ? 'max-w-md' : 'max-w-sm'} rounded-xl border border-slate-800/90 bg-[#111827] p-5 sm:p-6 shadow-2xl transition-all duration-200`}>
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/60 transition-all cursor-pointer z-20 group touch-manipulation"
        title="Close"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {twoFactorData ? (
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">
            {useRecoveryCode ? "Emergency Recovery Code" : "Two-Factor Authentication"}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-[280px]">
            {useRecoveryCode
              ? "Enter one of your 8-character backup recovery codes to access your account."
              : `Enter the 6-digit verification code from your authenticator app for ${twoFactorData.email}`}
          </p>

          <form onSubmit={handleTwoFactorSubmit} className="w-full mt-5 space-y-4">
            <div>
              {useRecoveryCode ? (
                <input
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="w-full text-center tracking-widest text-sm font-mono rounded-lg border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none"
                  required
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] text-xl font-mono rounded-lg border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none"
                  required
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying2FA}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isVerifying2FA ? "Verifying..." : "Verify & Sign In"}
            </button>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setTwoFactorCode("");
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {useRecoveryCode ? "Use authenticator app code instead" : "Lost access to authenticator? Use backup code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorData(null);
                  setTwoFactorCode("");
                  setUseRecoveryCode(false);
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/90 border border-zinc-700/80 shadow-sm">
              <span className="text-xs font-bold tracking-wider text-zinc-100">TP</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100">
              {isForgotPassword ? "Password Recovery" : (isRegistering ? "Create Employee Account" : "Sign In to Workspace")}
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {isForgotPassword
                ? "Enter your email to receive recovery instructions"
                : (isRegistering
                  ? "Enter your details to create your account"
                  : "Enter your credentials to continue")}
            </p>
          </div>

          {!isRegistering && !isForgotPassword && (
            <div className="w-full mb-3 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/90 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">⚡ 1-Click Recruiter Demo Access</span>
                <span className="text-[9px] text-zinc-500 font-mono">Password: 123</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => executeLogin("admin@me.com", "123")}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 active:scale-[0.99] border border-zinc-700/60 text-zinc-200 text-[11px] font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <span>👑</span>
                  <span className="truncate">Admin (admin@me.com)</span>
                </button>
                <button
                  type="button"
                  onClick={() => executeLogin("employee@me.com", "123")}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 active:scale-[0.99] border border-zinc-700/60 text-zinc-200 text-[11px] font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <span>👤</span>
                  <span className="truncate">Employee (employee@me.com)</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={submitHandler} className="w-full space-y-3">
            {isRegistering && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm sm:text-xs transition-colors"
                  type="text"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                Work Email Address <span className="text-emerald-400">*</span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm sm:text-xs transition-colors"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                  Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm sm:text-xs pr-9 transition-colors"
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 transition-colors p-1 touch-manipulation"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>

                {isRegistering && (
                  <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2">
                    <p className="text-[10px] font-medium text-zinc-400 mb-1.5">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasMinLength ? '✓' : '•'}</span> 8+ Chars
                      </span>
                      <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasUpper ? '✓' : '•'}</span> Uppercase (A-Z)
                      </span>
                      <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasLower ? '✓' : '•'}</span> Lowercase (a-z)
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasNumber ? '✓' : '•'}</span> Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1 col-span-2 ${hasSymbol ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasSymbol ? '✓' : '•'}</span> Symbol (!@#$%...)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                  Confirm Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-xs pr-9 transition-colors"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1 text-[10px] font-medium ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
            )}

            {isRegistering && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                    Department <span className="text-zinc-500 font-normal">(Opt)</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-zinc-100 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-xs transition-colors"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-zinc-900 text-zinc-100">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-300">
                    Invite Code <span className="text-zinc-500 font-normal">(Opt)</span>
                  </label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="INV-XXXXX"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-xs transition-colors"
                    type="text"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-0.5 text-xs text-zinc-400">
              {!isForgotPassword && !isRegistering && (
                <label className="flex cursor-pointer items-center gap-1.5 group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer h-3.5 w-3.5 appearance-none rounded border border-zinc-700 bg-zinc-900 checked:bg-zinc-100 checked:border-zinc-100 transition-colors"
                    />
                    <svg
                      className="absolute w-[10px] h-[10px] text-zinc-950 opacity-0 peer-checked:opacity-100 pointer-events-none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="group-hover:text-zinc-300 text-[11px] transition-colors">Remember me</span>
                </label>
              )}

              {!isRegistering && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="hover:text-zinc-200 text-[11px] transition-colors ml-auto cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button
              disabled={isSubmitting || isSubmittingForgot}
              className="mt-3.5 w-full rounded-lg bg-zinc-100 hover:bg-white active:bg-zinc-200 text-zinc-950 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer touch-manipulation active:scale-[0.99]"
              type="submit"
            >
              {isForgotPassword
                ? (isSubmittingForgot ? "Sending..." : "Send Recovery Link")
                : (isRegistering
                  ? (isSubmitting ? "Creating Account..." : "Create Account")
                  : (isSubmitting ? "Signing In..." : "Sign In"))}
            </button>

            <div className="mt-3.5 text-center text-[11px] text-zinc-400">
              {!isForgotPassword ? (
                !isRegistering ? (
                  <p>
                    Need to join the team?{" "}
                    <button
                      type="button"
                      onClick={() => resetMode(true)}
                      className="text-zinc-200 hover:text-white font-medium transition-colors ml-1 inline-block cursor-pointer touch-manipulation"
                    >
                      Create account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => resetMode(false)}
                      className="text-zinc-200 hover:text-white font-medium transition-colors ml-1 inline-block cursor-pointer touch-manipulation"
                    >
                      Sign in here
                    </button>
                  </p>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => resetMode(false)}
                  className="hover:text-zinc-200 transition-colors font-medium inline-block cursor-pointer touch-manipulation"
                >
                  ← Back to Sign In
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (onClose) {
    return cardContent;
  }

  return (
    <div className="relative flex min-h-screen w-full items-start sm:items-center justify-center bg-[#0B0F19] p-3 sm:p-4 overflow-y-auto">
      <div className="w-full flex justify-center py-4 my-auto">
        {cardContent}
      </div>
    </div>
  );
};

export default Login;
