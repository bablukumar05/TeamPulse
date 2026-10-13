import React, { useState, useContext, useRef, useEffect } from "react";
import ProfileSettings from "./ProfileSettings";
import LeaveRequestPanel from "./LeaveRequestPanel";
import NotificationCenter from "../notifications/NotificationCenter";
import { AuthContext } from "../../Context/AuthProvider";

const Header = (props) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showLeavePanel, setShowLeavePanel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { authUser } = useContext(AuthContext);

  const logOutUser = () => {
   if (props.changeUser) props.changeUser();
  };

  const isAdmin = authUser?.role === 'admin' || authUser?.data?.role === 'Admin' || (!props.data && authUser?.role === 'admin');
  const isManager = !isAdmin && (authUser?.role === 'manager' || authUser?.data?.role === 'Manager');
  const isEmployee = !isAdmin && !isManager && (authUser?.data?.role === 'Employee' || props.data);

  const user = props.data || authUser?.data;
  const displayName = user?.firstName ? `Welcome, ${user.firstName}` : (isAdmin ? 'Workspace Admin' : 'Welcome');

  // Close mobile dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-4 z-40 relative border-b border-zinc-800/80">
      {/* User Greeting & Badges */}
      <div className="w-full sm:w-auto flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-zinc-100">
            {displayName}
          </h1>
          {isAdmin ? (
            <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 shadow-sm">
              👑 Admin
            </span>
          ) : isManager ? (
            <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1 shadow-sm">
              🛡️ Manager
            </span>
          ) : (
            user?.designation && (
              <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                💼 {user.designation}
              </span>
            )
          )}
          {!isAdmin && (user?.teamId?.name || (user?.team && user.team !== 'General')) && (
            <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              🛡️ {user.teamId?.name || user.team}
            </span>
          )}
        </div>
        {isAdmin ? (
          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span>🛡️ Central Organization & System Oversight</span>
          </p>
        ) : (
          (user?.departmentId?.name || (user?.department && user.department !== 'General')) && (
            <p className="text-[11px] text-zinc-400 mt-0.5">
              🏢 {user.departmentId?.name || user.department} {user.employeeId ? `• ID: ${user.employeeId}` : ''}
            </p>
          )
        )}
      </div>

      {/* Action Navigation */}
      <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
        {/* DESKTOP / TABLET BUTTONS (Visible on md screens and above) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openCommandPalette'))}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
            title="Spotlight Search (Ctrl + K)"
          >
            <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-zinc-400">
              Ctrl K
            </kbd>
          </button>

          {props.changePage && (
            <>
              <button
                onClick={() => props.changePage('dashboard')}
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
              >
                Dashboard
              </button>
              <button
                onClick={() => props.changePage('culture')}
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
              >
                Culture
              </button>
            </>
          )}

          {isEmployee && (
            <button
              onClick={() => setShowLeavePanel(true)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Time Off
            </button>
          )}

          <NotificationCenter />

          <button
            onClick={() => setShowProfile(true)}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
          >
            <span className="mr-1.5">Profile</span>
            <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            onClick={logOutUser}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors bg-zinc-900/60 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 rounded-lg cursor-pointer"
          >
            <span className="mr-1.5">Log Out</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* MOBILE CONTROLS (Visible on screens < md) */}
        <div className="flex md:hidden items-center gap-1.5 relative" ref={menuRef}>
          {/* Quick Search Trigger Icon */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openCommandPalette'))}
            className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer transition-colors"
            title="Spotlight Search"
            aria-label="Search"
          >
            <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Notifications Bell */}
          <NotificationCenter />

          {/* ☰ Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
              isMobileMenuOpen
                ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                : "bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-800"
            }`}
            title="Menu"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* SMOOTH MOBILE DROPDOWN MENU */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl bg-zinc-900/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
              {/* User Summary Header */}
              <div className="px-2.5 py-2 border-b border-zinc-800/80 mb-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">{displayName}</p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {user?.email || (isAdmin ? "admin@me.com" : "employee@me.com")}
                </p>
              </div>

              {/* Dashboard Link */}
              {props.changePage && (
                <>
                  <button
                    onClick={() => {
                      props.changePage('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </button>

                  {/* Culture Link */}
                  <button
                    onClick={() => {
                      props.changePage('culture');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>Culture</span>
                  </button>
                </>
              )}

              {/* Time Off (for Employees) */}
              {isEmployee && (
                <button
                  onClick={() => {
                    setShowLeavePanel(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Time Off</span>
                </button>
              )}

              {/* Profile Settings */}
              <button
                onClick={() => {
                  setShowProfile(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Profile Settings</span>
              </button>

              <div className="border-t border-zinc-800/80 my-1" />

              {/* Log Out (Red Highlight) */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logOutUser();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showLeavePanel && <LeaveRequestPanel onClose={() => setShowLeavePanel(false)} />}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Header;
