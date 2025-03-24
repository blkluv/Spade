import React, { useState, useRef, useEffect } from "react";
import { FaMoon, FaSun, FaHome, FaUser, FaCog } from "react-icons/fa";
import { GiPokerHand } from "react-icons/gi";
import { BsCircleFill } from "react-icons/bs";
import CamDiv from "./CamDiv";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import CalibrationPage from "./CalibrationPage";
import ApiService from "./ApiService";
import { io } from "socket.io-client";
import "./styles.css";

// Socket connection
const socket = io("http://localhost:5001", {
  rejectUnauthorized: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 10000,
});

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(true);

  // Navigation state
  const [currentPage, setCurrentPage] = useState("home");

  // User state
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Socket state
  const [socketConnected, setSocketConnected] = useState(false);

  // Modify the useEffect in App.js to properly handle avatar on refresh
  useEffect(() => {
    // Apply theme class to body
    document.body.className = darkMode ? "dark-theme" : "light-theme";

    // Load user data if token exists
    const token = localStorage.getItem("token");
    if (token) {
      // First check if we have cached user data in localStorage
      const cachedUserData = localStorage.getItem("pokerUser");
      if (cachedUserData) {
        try {
          // Set initial user state from localStorage while we wait for API
          const parsedUser = JSON.parse(cachedUserData);
          setUser(parsedUser);

          // If the cached user has a custom avatar flag but no avatar data,
          // we need to load the full user data from the API
          loadUserData();
        } catch (error) {
          console.error("Error parsing cached user data:", error);
          loadUserData();
        }
      } else {
        loadUserData();
      }
    } else {
      setIsLoadingUser(false);
    }
  }, [darkMode]);

// Modify the loadUserData function in App.js
  const loadUserData = async () => {
    setIsLoadingUser(true);
    try {
      const userData = await ApiService.getCurrentUser();

      // Process avatar data based on backend response format
      let processedAvatarData = null;

      // If backend now uses avatarBase64 instead of avatar
      if (userData.avatarBase64) {
        processedAvatarData = `data:image/jpeg;base64,${userData.avatarBase64}`;
      }
      // Fallback for legacy format
      else if (userData.avatar) {
        processedAvatarData = ApiService.processAvatarData(userData.avatar);
      }

      // Store the complete user data including processed avatar
      const userWithAvatar = {
        ...userData,
        avatar: processedAvatarData ? null : "default", // Use default avatar if no custom avatar
        customAvatar: processedAvatarData, // Store processed avatar data URL
      };

      setUser(userWithAvatar);

      // Store in localStorage for persistence
      // For better performance with localStorage, we'll store minimal user data
      const userForStorage = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        balance: userData.balance,
        isAdmin: userData.isAdmin,
        avatar: processedAvatarData ? null : "default",
        customAvatar: processedAvatarData, // Store the actual image data this time
      };

      localStorage.setItem("pokerUser", JSON.stringify(userForStorage));
    } catch (error) {
      console.error("Failed to load user data:", error);
      // Clear token if authentication failed
      ApiService.clearToken();
      localStorage.removeItem("pokerUser");
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Setup socket connection listeners
  useEffect(() => {
    const onConnect = () => {
      setSocketConnected(true);
      console.log("Socket connected");
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      console.log("Socket disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Set initial connection state
    setSocketConnected(socket.connected);

    // Clean up event listeners
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // Handle login from ProfilePage
  const handleLogin = (userData) => {
    // Process avatar data if it exists
    let processedAvatarData = null;
    if (userData.avatar) {
      processedAvatarData = ApiService.processAvatarData(userData.avatar);
    }

    const userWithProcessedAvatar = {
      ...userData,
      avatar: processedAvatarData ? null : "default", // Use default if no custom avatar
      customAvatar: processedAvatarData, // Store processed avatar URL
    };

    setUser(userWithProcessedAvatar);

    // Store limited user data in localStorage to avoid size issues
    const userForStorage = { ...userWithProcessedAvatar };
    if (processedAvatarData) {
      userForStorage.hasCustomAvatar = true;
      userForStorage.customAvatar = null; // Don't store image data in localStorage
    }
    localStorage.setItem("pokerUser", JSON.stringify(userForStorage));
  };

  // Handle logout
  const handleLogout = () => {
    ApiService.clearToken();
    setUser(null);
    localStorage.removeItem("pokerUser");
    setCurrentPage("home");
  };

  // Handle navigation
  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  return (
      <div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
        <header className="app-header">
          <div className="logo" onClick={() => navigateTo("home")}>
            <GiPokerHand className="logo-icon" />
            <h1>SPADE</h1>
          </div>

          <div className="header-controls">
            <div className="connection-indicator">
              <BsCircleFill
                  className={`status-circle ${socketConnected ? "connected" : "disconnected"}`}
              />
            </div>
            {user && (
                <>
                  <button
                      className={`nav-button ${currentPage === "home" ? "active" : ""}`}
                      onClick={() => navigateTo("home")}
                      aria-label="Home"
                  >
                    <FaHome className="nav-icon"/>
                  </button>

                  <button
                      className={`nav-button ${currentPage === "calibration" ? "active" : ""}`}
                      onClick={() => navigateTo("calibration")}
                      aria-label="Calibration"
                  >
                    <FaCog className="nav-icon"/>
                  </button>
                </>
            )}

            <button
                className={`nav-button ${
                    currentPage === "profile" ? "active" : ""
                }`}
                onClick={() => navigateTo("profile")}
                aria-label="Profile"
            >
              {user ? (
                  <div
                      className={`mini-avatar ${
                          user.customAvatar ? "custom" : `avatar-${user.avatar}`
                      }`}
                      style={
                        user.customAvatar
                            ? {backgroundImage: `url(${user.customAvatar})`}
                            : {}
                      }
                  >
                    {!user.customAvatar && user.username.charAt(0).toUpperCase()}
                  </div>
              ) : (
                  <FaUser className="nav-icon"/>
              )}
            </button>

            <button
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle theme"
            >
              {darkMode ? <FaSun/> : <FaMoon/>}
            </button>
          </div>
        </header>

        <main>
          {isLoadingUser ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
          ) : !user && currentPage !== "profile" ? (
              // If not logged in and not on profile page, show auth required message
              <div className="auth-required">
                <div className="auth-required-card">
                  <GiPokerHand className="auth-icon" />
                  <h2>Welcome to SPADE Poker</h2>
                  <p>Please log in or create an account to continue</p>
                  <button
                      className="primary-button"
                      onClick={() => navigateTo("profile")}
                  >
                    Login / Register
                  </button>
                </div>
              </div>
          ) : (
              <>
                {currentPage === "home" && (
                    <HomePage
                        socket={socket}
                        socketConnected={socketConnected}
                        darkMode={darkMode}
                        user={user}
                    />
                )}

                {currentPage === "calibration" && (
                    <CalibrationPage
                        socket={socket}
                        socketConnected={socketConnected}
                    />
                )}

                {currentPage === "profile" && (
                    <ProfilePage
                        user={user}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                        navigateToHome={() => navigateTo("home")}
                    />
                )}
              </>
          )}
        </main>
      </div>
  );
}

export default App;