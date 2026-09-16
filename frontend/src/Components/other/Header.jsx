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
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-4 z-40 relative border-b border-zinc-800/80">
      <div>
        {/* <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block">Workspace</span> */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-0.5">
            {props.data?.firstName ? `Welcome, ${props.data.firstName}` : "Mr. Admin"}
          </h1>
          {props.data?.designation && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              💼 {props.data.designation}
            </span>
          )}
          {(props.data?.teamId?.name || (props.data?.team && props.data.team !== 'General')) && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              🛡️ {props.data.teamId?.name || props.data.team}
            </span>
          )}
        </div>
        {props.data?.departmentId?.name && (
          <p className="text-[11px] text-zinc-400 mt-0.5">
            🏢 {props.data.departmentId.name} {props.data.employeeId ? `• ID: ${props.data.employeeId}` : ''}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {props.changePage && (
          <>
            <button
              onClick={() => props.changePage('dashboard')}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => props.changePage('culture')}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
            >
              Culture
            </button>
          </>
        )}
        {isEmployee && (
          <button
            onClick={() => setShowLeavePanel(true)}
            className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
          >
            <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Time Off
          </button>
        )}
        <NotificationCenter />
        <button
          onClick={() => setShowProfile(true)}
          className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
        >
          <span className="mr-1.5">Profile</span>
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
        <button
          onClick={logOutUser}
          className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors bg-zinc-900/60 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 rounded-lg cursor-pointer"
        >
          <span className="mr-1.5">Log Out</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>

      {showLeavePanel && <LeaveRequestPanel onClose={() => setShowLeavePanel(false)} />}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Header;
