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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#181a1b] p-4 sm:p-6 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/5 bg-[#25282a] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Subdued Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7cc5d9]/40 via-[#9bb5c9]/40 to-[#7a8c9e]/40"></div>

        <div className="flex flex-col items-center">
          
          {/* Logo & Subtitle */}
          <div className="mb-6 flex flex-col items-center text-center">
             <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2c3033] to-[#3a3f44] border border-white/10 shadow-lg">
                <span className="text-2xl font-black tracking-widest text-[#7cc5d9]">TP</span>
             </div>
             <h1 className="text-xl font-bold tracking-wider text-gray-200">
               {isForgotPassword ? 'PASSWORD RECOVERY' : (isRegistering ? 'JOIN TEAMPULSE' : 'TEAMPULSE LOGIN')}
             </h1>
             <p className="text-xs text-[#8a99a8] mt-1">
               {isForgotPassword ? 'Enter your email to receive recovery instructions' : (isRegistering ? 'Fill details to submit join request' : 'Sign in to access your workspace dashboard')}
             </p>
          </div>

          <form onSubmit={submitHandler} className="w-full space-y-4">
            
            {isRegistering && (
              <div className="relative">
                <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Full Name *</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm"
                  type="text"
                  required
                />
              </div>
            )}

            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Email Address *</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm"
                type="email"
                required
              />
            </div>

            {!isForgotPassword && (
            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Password *</label>
              <div className="relative flex items-center">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm pr-12"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#8a99a8] hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-[18px] w-[18px]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-[18px] w-[18px]">
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
                <div className="flex gap-4">
                  <div className="relative w-1/2">
                    <label className="mb-2 block text-xs font-medium text-[#8a99a8]">10th Marks (%) *</label>
                    <input
                      value={tenthMarks}
                      onChange={(e) => setTenthMarks(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm"
                      type="number"
                      required
                    />
                  </div>
                  <div className="relative w-1/2">
                    <label className="mb-2 block text-xs font-medium text-[#8a99a8]">12th Marks (%) *</label>
                    <input
                      value={twelfthMarks}
                      onChange={(e) => setTwelfthMarks(e.target.value)}
                      placeholder="e.g. 80"
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm"
                      type="number"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="relative w-1/2">
                    <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Graduation Degree</label>
                    <input
                      value={graduationDegree}
                      onChange={(e) => setGraduationDegree(e.target.value)}
                      placeholder="e.g. B.Tech CS"
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm"
                      type="text"
                    />
                  </div>
                  <div className="relative w-1/2">
                    <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Invite Code</label>
                    <input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Optional Code"
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none text-sm"
                      type="text"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Upload Resume *</label>
                  <input
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-2 text-gray-200 text-xs focus:border-white/20 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#7cc5d9]/20 file:text-[#7cc5d9] hover:file:bg-[#7cc5d9]/30"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Skills (comma separated)</label>
                  <input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Node.js..."
                    className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 outline-none text-sm"
                    type="text"
                  />
                </div>
                </>
            )}

            <div className="flex items-center justify-between mt-1 text-xs text-[#8a99a8]">
              {!isForgotPassword && !isRegistering && (
                <label className="flex cursor-pointer items-center gap-2 group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer h-3.5 w-3.5 appearance-none rounded-[3px] border border-[#8a99a8] bg-transparent checked:bg-transparent checked:border-[#7cc5d9] transition-all" />
                    <svg className="absolute w-[10px] h-[10px] text-[#7cc5d9] opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="group-hover:text-white transition-colors">Remember me</span>
                </label>
              )}
              
              {!isRegistering && !isForgotPassword && (
                 <button type="button" onClick={() => setIsForgotPassword(true)} className="hover:text-white transition-colors ml-auto">Forgot password?</button>
              )}
            </div>

            <button
              disabled={isSubmittingForgot}
              className="mt-6 mx-auto w-2/3 rounded-full bg-[#7a8c9e] py-3.5 text-[13px] font-semibold tracking-widest text-[#a8dff5] shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#8e9eb0] active:translate-y-0 disabled:opacity-50 flex items-center justify-center cursor-pointer"
              type="submit"
            >
              {isForgotPassword ? (isSubmittingForgot ? 'SENDING...' : 'SEND LINK') : (isRegistering ? 'REGISTER' : 'SIGN IN')}
            </button>
            
            <div className="mt-6 text-center text-xs text-[#8a99a8]">
                {!isForgotPassword ? (
                   !isRegistering ? (
                      <p>Don't have an account? <button type="button" onClick={() => setIsRegistering(true)} className="text-[#7cc5d9] hover:text-white font-bold transition-colors ml-1 tracking-wider inline-block">CREATE ACCOUNT</button></p>
                   ) : (
                      <p>Already have an account? <button type="button" onClick={() => setIsRegistering(false)} className="text-[#7cc5d9] hover:text-white font-bold transition-colors ml-1 tracking-wider inline-block">LOGIN HERE</button></p>
                   )
                ) : (
                   <button type="button" onClick={() => setIsForgotPassword(false)} className="hover:text-white transition-colors font-bold tracking-wider inline-block">← BACK TO LOGIN</button>
                )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
