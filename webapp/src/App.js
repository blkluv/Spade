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

  // Check theme preference and load user data on mount
  useEffect(() => {
    // Apply theme class to body
    document.body.className = darkMode ? "dark-theme" : "light-theme";

    // Load user data if token exists
    const token = localStorage.getItem("token");
    if (token) {
      loadUserData();
    } else {
      setIsLoadingUser(false);
    }
  }, [darkMode]);

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

  // Load user data from API
  const loadUserData = async () => {
    setIsLoadingUser(true);
    try {
      const userData = await ApiService.getCurrentUser();

      // Store the complete user data including any player or table information
      const userWithAvatar = {
        ...userData,
        avatar: userData.avatar ? null : "default",
        customAvatar: userData.avatar,
      };

      setUser(userWithAvatar);

      // Store in localStorage for persistence
      localStorage.setItem("pokerUser", JSON.stringify(userWithAvatar));
    } catch (error) {
      console.error("Failed to load user data:", error);
      // Clear token if authentication failed
      ApiService.clearToken();
      localStorage.removeItem("pokerUser");
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Handle login from ProfilePage
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("pokerUser", JSON.stringify(userData));
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