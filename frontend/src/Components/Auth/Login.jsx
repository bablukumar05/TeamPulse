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
           timeout: 10000
         });
      } else {
         response = await axios.post("/api/auth/login", { email, password }, { timeout: 10000 });
      }

      toast.dismiss(loadingToast);

      if (response.data.token) {
        const userObj = {
          role: (response.data.role || 'employee').toLowerCase(),
          data: response.data.user || response.data
        };
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("authUser", JSON.stringify(userObj));
        setAuthUser(userObj);
        setToken(response.data.token);
        toast.success(response.data.message || "Welcome back!");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      let displayMsg = "Authentication failed.";

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        displayMsg = "Cannot connect to server. Please verify backend is running on port 5000.";
      } else if (error.response?.data?.errors?.length > 0) {
        displayMsg = error.response.data.errors.map(e => e.message).join(', ');
      } else if (error.response?.data?.message) {
        displayMsg = error.response.data.message;
      }

      toast.error(displayMsg, { duration: 5000 });
    }

    setEmail("");
    setPassword("");
  };

  const forgotPasswordHandler = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setIsSubmittingForgot(true);
    const loadingToast = toast.loading("Sending reset link...");
    try {
      await axios.post("/api/auth/forgotpassword", { email });
      toast.success("Password reset link sent to your email! (Check backend console for preview link)", { id: loadingToast, duration: 5000 });
      setIsForgotPassword(false);
    } catch (error) {
       toast.error(error.response?.data?.message || "Failed to send reset link.", { id: loadingToast });
    } finally {
       setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#11141c] font-sans">
      
      {/* 3D Floating White Spheres Background */}
      <div 
        className="absolute top-[8%] left-[28%] w-[160px] h-[160px] rounded-full bg-gradient-to-br from-[#ffffff] to-[#b0b8c4]"
        style={{ boxShadow: "inset -15px -15px 30px rgba(0,0,0,0.2), inset 10px 10px 30px rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.4)" }}
      />
      <div 
        className="absolute top-[35%] left-[8%] w-[260px] h-[260px] rounded-full bg-gradient-to-br from-[#ffffff] to-[#b0b8c4]"
        style={{ boxShadow: "inset -20px -20px 40px rgba(0,0,0,0.2), inset 15px 15px 40px rgba(255,255,255,1), 0 20px 50px rgba(0,0,0,0.4)" }}
      />
      <div 
        className="absolute bottom-[15%] right-[10%] w-[320px] h-[320px] rounded-full bg-gradient-to-br from-[#ffffff] to-[#b0b8c4]"
        style={{ boxShadow: "inset -30px -30px 60px rgba(0,0,0,0.2), inset 20px 20px 60px rgba(255,255,255,1), 0 30px 60px rgba(0,0,0,0.4)" }}
      />

      <div className="relative z-10 w-full max-w-[900px] px-6 py-10">
        {/* Dark Glassmorphism Card */}
        <div className="rounded-[40px] border border-white/10 bg-[#161a23]/40 px-10 py-20 shadow-[0_20px_60px_0_rgba(0,0,0,0.6)] backdrop-blur-[24px]">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-medium tracking-[0.2em] text-[#7cc5d9]">
              {isForgotPassword ? "RESET" : (isRegistering ? "REGISTER" : "LOGIN")}
            </h1>
            {isForgotPassword && <p className="mt-3 text-[#8a99a8] text-xs">Enter your email to receive a reset link</p>}
            {isRegistering && <p className="mt-3 text-[#8a99a8] text-xs">Join our platform today</p>}
          </div>

          <form onSubmit={isForgotPassword ? forgotPasswordHandler : submitHandler} className="mx-auto flex max-w-[420px] flex-col gap-6">
            {isRegistering && (
                <div className="relative">
                  <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Full Name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 focus:border-white/20 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#7cc5d9]/30"
                    type="text"
                  />
                </div>
            )}
            
            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-[#8a99a8]">
                Email address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 focus:border-white/20 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#7cc5d9]/30"
                type="email"
              />
            </div>

            {!isForgotPassword && (
            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-[#8a99a8]">
                Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 pr-12 text-gray-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-300 focus:border-white/20 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#7cc5d9]/30"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7cc5d9] hover:text-[#a5dfff] transition-colors"
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
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none"
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
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none"
                      type="number"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="relative w-1/2">
                    <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Graduation Degree Name</label>
                    <input
                      value={graduationDegree}
                      onChange={(e) => setGraduationDegree(e.target.value)}
                      placeholder="e.g. B.Tech CS"
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none"
                      type="text"
                    />
                  </div>
                  <div className="relative w-1/2">
                    <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Post Grad Degree (Optional)</label>
                    <input
                      value={postGraduationDegree}
                      onChange={(e) => setPostGraduationDegree(e.target.value)}
                      placeholder="e.g. MBA"
                      className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 focus:bg-white/15 outline-none"
                      type="text"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-xs font-medium text-[#8a99a8]">Upload Resume *</label>
                  <input
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3 text-gray-200 focus:border-white/20 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#7cc5d9]/20 file:text-[#7cc5d9] hover:file:bg-[#7cc5d9]/30"
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
                    className="w-full rounded-full border border-white/5 bg-white/10 px-6 py-3.5 text-gray-200 focus:border-white/20 outline-none"
                    type="text"
                  />
                </div>
                </>
            )}

            <div className="flex items-center justify-between mt-1 text-xs text-[#8a99a8]">
              { !isForgotPassword && !isRegistering && (
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
              className="mt-6 mx-auto w-2/3 rounded-full bg-[#7a8c9e] py-3.5 text-[13px] font-semibold tracking-widest text-[#a8dff5] shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#8e9eb0] active:translate-y-0 disabled:opacity-50"
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

