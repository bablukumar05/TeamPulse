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
      axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(res => {
        const userObj = { role: res.data.role.toLowerCase(), data: res.data };
        setAuthUser(userObj);
        localStorage.setItem("authUser", JSON.stringify(userObj));
      }).catch(err => {
        console.error("Auth token invalid", err);
        setAuthUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("authUser");
      });
    } else {
      setAuthUser(null);
      localStorage.removeItem("authUser");
    }
  }, [token]);

  const updateToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
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
