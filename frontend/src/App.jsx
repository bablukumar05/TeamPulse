import React, { useContext, useEffect, lazy, Suspense } from "react";
import Login from "./Components/Auth/Login";
import { AuthContext } from "./Context/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

// Lazy-loaded routes for ultra-fast initial page load
const EmployeeDashboard = lazy(() => import("./Components/Dashboard/EmployeeDashboard"));
const AdminDashboard    = lazy(() => import("./Components/Dashboard/AdminDashboard"));
const ResetPassword     = lazy(() => import("./Components/Auth/ResetPassword"));
const WaitlistScreen    = lazy(() => import("./Components/Auth/WaitlistScreen"));
const CulturePage       = lazy(() => import("./Pages/CulturePage"));

export let socket;

const FastLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#11141c]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Loading TeamPulse…</span>
    </div>
  </div>
);

const App = () => {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const { authUser, setAuthUser, setToken } = useContext(AuthContext);

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('resetToken');

  useEffect(() => {
    if (authUser) {
      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnectionAttempts: 10,
      });

      if (authUser.role === 'employee') {
        socket.emit('authenticate', authUser.data._id);

        socket.on('newTaskAssigned', (data) => {
          toast.success(data.message, { duration: 5000, position: "top-center" });
          window.dispatchEvent(new Event('newTaskRefetch'));
        });
      } else if (authUser.role === 'admin' || authUser.role === 'manager') {
        socket.emit('adminConnect');
        
        socket.on('adminTaskNotification', (data) => {
          const bgIcon = data.status === 'Failed' ? '⚠️' : '✅';
          toast(`${data.message}`, {
              icon: bgIcon,
              duration: 6000, 
              position: "top-right",
              style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
              }
          });
          window.dispatchEvent(new Event('adminDataRefetch'));
        });
      }

      return () => {
        if (socket) socket.disconnect();
      };
    }
  }, [authUser]);

  const handleLogout = () => {
    setAuthUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    if (socket) socket.disconnect();
  };

  if (resetToken) {
    return (
      <>
        <Toaster position="top-right" />
        <Suspense fallback={<FastLoader />}>
          <ResetPassword token={resetToken} />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<FastLoader />}>
        {!authUser && <Login />}
        {authUser && currentPage === 'culture' && <CulturePage changeUser={handleLogout} changePage={setCurrentPage} />}
        {authUser && currentPage === 'dashboard' && (authUser?.role === "admin" || authUser?.role === "manager") && <AdminDashboard changeUser={handleLogout} changePage={setCurrentPage} />}
        {authUser && currentPage === 'dashboard' && authUser?.role === "employee" && (
          authUser.isApproved === false ? (
            <WaitlistScreen changeUser={handleLogout} />
          ) : (
            <EmployeeDashboard changeUser={handleLogout} data={authUser.data} changePage={setCurrentPage} />
          )
        )}
      </Suspense>
    </>
  );
};

export default App;