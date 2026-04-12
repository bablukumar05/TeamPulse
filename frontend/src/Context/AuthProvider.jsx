import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(res => {
        setAuthUser({ role: res.data.role.toLowerCase(), data: res.data });
      }).catch(err => {
        console.error("Auth token invalid", err);
        setAuthUser(null);
        setToken(null);
        localStorage.removeItem("token");
      });
    } else {
      setAuthUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
