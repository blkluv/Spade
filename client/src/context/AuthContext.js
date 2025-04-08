// client/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

// Create context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error("Failed to fetch user data:", err);
          AuthService.clearToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setError(null);
    try {
      const data = await AuthService.login(credentials);
      // The backend returns { token, user } - set user from the response
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const data = await AuthService.register(userData);
      return data;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    AuthService.clearToken();
    setUser(null);
  };

  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;