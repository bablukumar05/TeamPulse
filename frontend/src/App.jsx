import React, { useContext, useEffect } from "react";
import Login from "./Components/Auth/Login";
import EmployeeDashboard from "./Components/Dashboard/EmployeeDashboard";
import AdminDashboard from "./Components/Dashboard/AdminDashboard";
import ResetPassword from "./Components/Auth/ResetPassword";
import WaitlistScreen from "./Components/Auth/WaitlistScreen";
import { AuthContext } from "./Context/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import TeamChat from "./Components/other/TeamChat";
import CulturePage from "./Pages/CulturePage";

export let socket;

const App = () => {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const { authUser, setAuthUser, setToken } = useContext(AuthContext);

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('resetToken');

  useEffect(() => {
    if (authUser) {
      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      socket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
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
    if (socket) socket.disconnect();
  };

  if (resetToken) {
    return (
      <>
        <Toaster position="top-right" />
        <ResetPassword token={resetToken} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
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
      {authUser && authUser.isApproved !== false && <TeamChat />}
    </>
  );
};

export default App;