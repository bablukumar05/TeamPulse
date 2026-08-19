import React, { useState, useContext } from "react";
import ProfileSettings from "./ProfileSettings";
import LeaveRequestPanel from "./LeaveRequestPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import { AuthContext } from "../../Context/AuthProvider";

const Header = (props) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showLeavePanel, setShowLeavePanel] = useState(false);
  const { authUser } = useContext(AuthContext);

  const logOutUser = () => {
   if (props.changeUser) props.changeUser();
  };

  const isEmployee = authUser?.data?.role === 'Employee' || props.data;

  return (
    <div className="flex items-end justify-between transition-all duration-500 ease-in-out pb-4 z-40 relative">
      <h1 className="text-2xl font-medium text-gray-300">
        Hello <br /> <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-md"> {props.data?.firstName || "Admin"} 👋</span>
      </h1>
      <div className="flex items-center gap-3">
        {props.changePage && (
          <>
            <button
              onClick={() => props.changePage('dashboard')}
              className="group relative inline-flex items-center justify-center px-4 py-2.5 text-base font-bold text-gray-300 transition-all duration-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shadow-lg hover:scale-[1.02]"
            >
              Dashboard
            </button>
            <button
              onClick={() => props.changePage('culture')}
              className="group relative inline-flex items-center justify-center px-4 py-2.5 text-base font-bold text-amber-400 transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg shadow-lg hover:scale-[1.02]"
            >
              🎉 Culture
            </button>
          </>
        )}
        {isEmployee && (
          <button
            onClick={() => setShowLeavePanel(true)}
            className="group relative inline-flex items-center justify-center px-6 py-2.5 text-base font-bold text-teal-400 transition-all duration-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg shadow-lg hover:scale-[1.02]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Time Off
          </button>
        )}
        <NotificationCenter />
        <button
          onClick={() => setShowProfile(true)}
          className="group relative inline-flex items-center justify-center px-6 py-2.5 text-base font-semibold text-white transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg shadow-lg hover:scale-[1.02]"
        >
          <span className="mr-2">Profile</span>
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
        <button
          onClick={logOutUser}
          className="group relative inline-flex items-center justify-center px-6 py-2.5 text-base font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-500 to-rose-600 border border-transparent rounded-lg shadow-lg hover:shadow-red-500/40 hover:scale-[1.02] focus:outline-none"
        >
          <span className="mr-2">Log Out</span>
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>

      {showLeavePanel && <LeaveRequestPanel onClose={() => setShowLeavePanel(false)} />}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Header;
