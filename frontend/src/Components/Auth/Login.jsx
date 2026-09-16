import React, { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../Context/AuthProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [skills, setSkills] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [tenthMarks, setTenthMarks] = useState("");
  const [twelfthMarks, setTwelfthMarks] = useState("");
  const [graduationDegree, setGraduationDegree] = useState("");
  const [postGraduationDegree, setPostGraduationDegree] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  
  const { setToken, setAuthUser } = useContext(AuthContext);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (isForgotPassword) {
      if (!email) return toast.error("Please enter your registered email address");
      setIsSubmittingForgot(true);
      const loadingToast = toast.loading("Sending reset link...");
      try {
        await axios.post("/api/auth/forgotpassword", { email });
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

    if (!email || !password) {
      return toast.error("Please enter email and password");
    }

    const loadingToast = toast.loading("Authenticating...");
    try {
      let response;
      if (isRegistering) {
         const formData = new FormData();
         formData.append('firstName', firstName);
         formData.append('email', email);
         formData.append('password', password);
         formData.append('skills', skills);
         formData.append('inviteCode', inviteCode);
         formData.append('tenthMarks', tenthMarks);
         formData.append('twelfthMarks', twelfthMarks);
         formData.append('graduationDegree', graduationDegree);
         formData.append('postGraduationDegree', postGraduationDegree);
         if (resumeFile) formData.append('resume', resumeFile);

         response = await axios.post("/api/auth/register", formData, {
           headers: { "Content-Type": "multipart/form-data" },
           timeout: 45000
         });
      } else {
         response = await axios.post("/api/auth/login", { email, password }, { timeout: 45000 });
      }

      toast.dismiss(loadingToast);

      if (response.data.token) {
        const userObj = {
          role: (response.data.role || 'employee').toLowerCase(),
          data: response.data.user || response.data
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
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#0c0d0e] p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800/90 bg-[#131418] p-8 sm:p-9 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="mb-7 flex flex-col items-center text-center">
             <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700/80 shadow-sm">
                <span className="text-sm font-bold tracking-wider text-zinc-100">TP</span>
             </div>
             <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
               {isForgotPassword ? 'Password Recovery' : (isRegistering ? 'Create Account' : 'Sign In to Workspace')}
             </h1>
             <p className="text-xs text-zinc-400 mt-1">
               {isForgotPassword ? 'Enter your email to receive recovery instructions' : (isRegistering ? 'Fill details to submit your candidate request' : 'Enter your credentials to continue')}
             </p>
          </div>

          <form onSubmit={submitHandler} className="w-full space-y-4">
            
            {isRegistering && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">Full Name *</label>
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
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email Address *</label>
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
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Password *</label>
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
            </div>
            )}

            {isRegistering && (
                <>
                <div className="flex gap-3">
                  <div className="w-1/2">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">10th Marks (%) *</label>
                    <input
                      value={tenthMarks}
                      onChange={(e) => setTenthMarks(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                      type="number"
                      required
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">12th Marks (%) *</label>
                    <input
                      value={twelfthMarks}
                      onChange={(e) => setTwelfthMarks(e.target.value)}
                      placeholder="e.g. 80"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                      type="number"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-1/2">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Graduation Degree</label>
                    <input
                      value={graduationDegree}
                      onChange={(e) => setGraduationDegree(e.target.value)}
                      placeholder="e.g. B.Tech CS"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                      type="text"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Invite Code</label>
                    <input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Optional Code"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                      type="text"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">Resume File *</label>
                  <input
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-300 text-xs focus:border-zinc-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">Skills (comma separated)</label>
                  <input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Node.js, TypeScript..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900 outline-none text-sm transition-colors"
                    type="text"
                  />
                </div>
                </>
            )}

            <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
              {!isForgotPassword && !isRegistering && (
                <label className="flex cursor-pointer items-center gap-2 group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer h-3.5 w-3.5 appearance-none rounded border border-zinc-700 bg-zinc-900 checked:bg-zinc-100 checked:border-zinc-100 transition-colors" />
                    <svg className="absolute w-[10px] h-[10px] text-zinc-950 opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="group-hover:text-zinc-300 transition-colors">Remember me</span>
                </label>
              )}
              
              {!isRegistering && !isForgotPassword && (
                 <button type="button" onClick={() => setIsForgotPassword(true)} className="hover:text-zinc-200 transition-colors ml-auto">Forgot password?</button>
              )}
            </div>

            <button
              disabled={isSubmittingForgot}
              className="mt-5 w-full rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
              type="submit"
            >
              {isForgotPassword ? (isSubmittingForgot ? 'Sending...' : 'Send Recovery Link') : (isRegistering ? 'Submit Application' : 'Sign In')}
            </button>
            
            <div className="mt-5 text-center text-xs text-zinc-400">
                {!isForgotPassword ? (
                   !isRegistering ? (
                      <p>Need to join the team? <button type="button" onClick={() => setIsRegistering(true)} className="text-zinc-200 hover:text-white font-medium transition-colors ml-1 inline-block">Create account</button></p>
                   ) : (
                      <p>Already have an account? <button type="button" onClick={() => setIsRegistering(false)} className="text-zinc-200 hover:text-white font-medium transition-colors ml-1 inline-block">Sign in here</button></p>
                   )
                ) : (
                   <button type="button" onClick={() => setIsForgotPassword(false)} className="hover:text-zinc-200 transition-colors font-medium inline-block">← Back to Sign In</button>
                )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
