import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // Restore cached auth user instantly (0ms latency on page open)
  const getInitialUser = () => {
    try {
      const saved = localStorage.getItem("authUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const [authUser, setAuthUser] = useState(getInitialUser);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token in background with timeout
      axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000
      }).then(res => {
        if (res.data && res.data._id) {
          const userObj = { role: (res.data.role || 'Employee').toLowerCase(), data: res.data };
          setAuthUser(userObj);
          localStorage.setItem("authUser", JSON.stringify(userObj));
        }
      }).catch(err => {
        // ONLY clear session if server explicitly returns 401 (Unauthorized) or 403 (Forbidden)
        // Never wipe session due to slow network, offline mode, or temporary server cold-start!
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.warn("Session expired or token invalid (401/403). Logging out.");
          setAuthUser(null);
          setToken(null);
          localStorage.removeItem("token");
          localStorage.removeItem("authUser");
          delete axios.defaults.headers.common['Authorization'];
        } else {
          console.warn("Background auth sync deferred (server cold start or network delay). Keeping local session active.");
        }
      });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setAuthUser(null);
      localStorage.removeItem("authUser");
    }
  }, [token]);

  const updateToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
      delete axios.defaults.headers.common['Authorization'];
    }
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, token, setToken: updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
