import React, { useContext, useEffect } from 'react';
import { AuthContext } from "../../Context/AuthProvider";
import { socket } from "../../App";

const WaitlistScreen = ({ changeUser }) => {
  const { authUser, setAuthUser } = useContext(AuthContext);

  useEffect(() => {
    if (socket) {
      socket.on('joinRequestApproved', (data) => {
        // Optimistically update the authUser state to approved 
        // which will trigger App.jsx to unmount this screen and mount EmployeeDashboard
        if (authUser && authUser.data) {
          setAuthUser({
             ...authUser,
             data: { ...authUser.data, isApproved: true }
          });
        }
      });
    }
  }, [authUser, setAuthUser]);

  return (
    <div className="min-h-screen bg-[#11141c] flex flex-col justify-center items-center text-center p-6 relative overflow-hidden">
      {/* Animated Elements */}
      <div className="absolute top-[20%] left-[20%] w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      
      <div className="relative z-10 max-w-md bg-white/5 border border-white/10 p-10 rounded-[40px] shadow-2xl backdrop-blur-xl">
        <div className="text-6xl mb-6 animate-bounce">⏳</div>
        <h1 className="text-2xl font-bold text-white mb-3">Waiting for Approval</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
           Hi {authUser?.data?.firstName}, your join request has been sent successfully. An admin needs to review and approve your request before you can access the dashboard.
        </p>
        
        <div className="w-full bg-white/5 border border-white/10 rounded-full h-2 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full w-1/3 animate-pulse rounded-full"></div>
        </div>

        <button 
           onClick={changeUser}
           className="text-gray-400 hover:text-white transition-colors text-xs font-bold tracking-widest px-6 py-2 border border-white/10 rounded-full hover:bg-white/5"
        >
           LOGOUT
        </button>
      </div>
    </div>
  );
};

export default WaitlistScreen;
