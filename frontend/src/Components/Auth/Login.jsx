import React, { useState, useContext } from "react";
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const { setToken, setAuthUser } = useContext(AuthContext);

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const resetMode = (registerMode) => {
    setIsRegistering(registerMode);
    setIsForgotPassword(false);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    const loadingToast = toast.loading(isRegistering ? "Creating account..." : "Authenticating...");
    try {
      let response;
      if (isRegistering) {
        const payload = {
          firstName: firstName.trim(),
          email: email.trim(),
          password,
          department: department || "General",
        };
        if (inviteCode.trim()) {
          payload.inviteCode = inviteCode.trim();
        }

        response = await axios.post("/api/auth/register", payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 45000,
        });
      } else {
        response = await axios.post("/api/auth/login", {
          email: email.trim(),
          password,
        }, { timeout: 45000 });
      }

      toast.dismiss(loadingToast);

      if (response.data.token) {
        const userObj = {
          role: (response.data.role || response.data.user?.role || "Employee").toLowerCase(),
          data: response.data.user || response.data,
        };

        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
        setAuthUser(userObj);

        toast.success(response.data.message || (isRegistering ? "Registration successful!" : "Welcome back!"));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      const errMsg = error.response?.data?.message || (isRegistering ? "Registration failed" : "Invalid email or password");
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#0c0d0e] p-4 sm:p-6">
      <div className={`relative z-10 w-full ${isRegistering ? 'max-w-lg' : 'max-w-md'} rounded-2xl border border-zinc-800/90 bg-[#131418] p-8 sm:p-9 shadow-2xl transition-all duration-200`}>
        <div className="flex flex-col items-center">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700/80 shadow-sm">
              <span className="text-sm font-bold tracking-wider text-zinc-100">TP</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              {isForgotPassword ? "Password Recovery" : (isRegistering ? "Create Employee Account" : "Sign In to Workspace")}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {isForgotPassword
                ? "Enter your email to receive recovery instructions"
                : (isRegistering
                  ? "Enter your employee details to set up your corporate account"
                  : "Enter your credentials to continue")}
            </p>
          </div>

          <form onSubmit={submitHandler} className="w-full space-y-4">
            {isRegistering && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                  type="text"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Work Email Address <span className="text-emerald-400">*</span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                type="email"
                required
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                  Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm pr-10 transition-colors"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>

                {isRegistering && (
                  <div className="mt-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2.5">
                    <p className="text-[11px] font-medium text-zinc-400 mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasMinLength ? '✓' : '•'}</span> 8+ Characters
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasUpper ? '✓' : '•'}</span> Uppercase (A-Z)
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasLower ? '✓' : '•'}</span> Lowercase (a-z)
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasNumber ? '✓' : '•'}</span> Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1.5 col-span-2 ${hasSymbol ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        <span>{hasSymbol ? '✓' : '•'}</span> Special Symbol (!@#$%...)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                  Confirm Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm pr-10 transition-colors"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1.5 text-[11px] font-medium ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
            )}

            {isRegistering && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Department <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-zinc-100 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-xs transition-colors"
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
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Invite Code <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. INV-XXXXX"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                    type="text"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
              {!isForgotPassword && !isRegistering && (
                <label className="flex cursor-pointer items-center gap-2 group">
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
                  <span className="group-hover:text-zinc-300 transition-colors">Remember me</span>
                </label>
              )}

              {!isRegistering && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="hover:text-zinc-200 transition-colors ml-auto cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button
              disabled={isSubmitting || isSubmittingForgot}
              className="mt-5 w-full rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
              type="submit"
            >
              {isForgotPassword
                ? (isSubmittingForgot ? "Sending..." : "Send Recovery Link")
                : (isRegistering
                  ? (isSubmitting ? "Creating Account..." : "Create Account")
                  : (isSubmitting ? "Signing In..." : "Sign In"))}
            </button>

            <div className="mt-5 text-center text-xs text-zinc-400">
              {!isForgotPassword ? (
                !isRegistering ? (
                  <p>
                    Need to join the team?{" "}
                    <button
                      type="button"
                      onClick={() => resetMode(true)}
                      className="text-zinc-200 hover:text-white font-medium transition-colors ml-1 inline-block cursor-pointer"
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
                      className="text-zinc-200 hover:text-white font-medium transition-colors ml-1 inline-block cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => resetMode(false)}
                  className="hover:text-zinc-200 transition-colors font-medium inline-block cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
