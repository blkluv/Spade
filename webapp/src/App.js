// Modified App.js to control Calibration tab visibility

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

  // Table state - new states for table ownership
  const [atTable, setAtTable] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [isTableOwner, setIsTableOwner] = useState(false);
  const [checkingTableStatus, setCheckingTableStatus] = useState(true);

  // Window width state for responsive header
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Check theme preference and load user data on mount
  useEffect(() => {
    // Apply theme class to body
    document.body.className = darkMode ? "dark-theme" : "light-theme";

    // Load user data if token exists
    const token = localStorage.getItem("token");
    if (token) {
      // First check if we have cached user data in localStorage
      const cachedUserData = localStorage.getItem("pokerUser");
      if (cachedUserData) {
        // Set initial user state from localStorage
        const parsedUser = JSON.parse(cachedUserData);
        setUser(parsedUser);
      }

      // Always load fresh data from API
      loadUserData();
    } else {
      setIsLoadingUser(false);
    }

    // Add window resize listener for responsive header
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  // Load table status when user is loaded
  useEffect(() => {
    if (user) {
      checkTableStatus();
    }
  }, [user]);

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

      // Process avatar data from backend
      let processedAvatarData = null;

      // Check for the base64 encoded avatar
      if (userData.avatarBase64) {
        processedAvatarData = `data:image/jpeg;base64,${userData.avatarBase64}`;
      }

      // Create user object with processed avatar
      const userWithAvatar = {
        ...userData,
        avatar: processedAvatarData ? null : "default",
        customAvatar: processedAvatarData,
      };

      setUser(userWithAvatar);

      // Store complete user data in localStorage for persistence
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

  // Check if the user is at a table
  const checkTableStatus = async () => {
    if (!user) {
      setAtTable(false);
      setCurrentTable(null);
      setIsTableOwner(false);
      setCheckingTableStatus(false);
      return;
    }

    setCheckingTableStatus(true);

    try {
      // Call the dedicated endpoint to get table status
      const tableStatus = await ApiService.getCurrentTable();

      if (tableStatus.isAtTable && tableStatus.tableId) {
        setAtTable(true);

        // Get table details if not included in the response
        const tableDetails = tableStatus.table || await ApiService.getTableById(tableStatus.tableId);
        setCurrentTable(tableDetails);

        // Check if the current user is the owner of the table
        setIsTableOwner(tableDetails.ownerId === user.id);
      } else {
        setAtTable(false);
        setCurrentTable(null);
        setIsTableOwner(false);
      }
    } catch (error) {
      console.error("Error checking table status:", error);
      setAtTable(false);
      setCurrentTable(null);
      setIsTableOwner(false);
    } finally {
      setCheckingTableStatus(false);
    }
  };

  // Handle login from ProfilePage
  const handleLogin = (userData) => {
    // Process avatar data if it exists
    let processedAvatarData = null;
    if (userData.avatarBase64) {
      processedAvatarData = `data:image/jpeg;base64,${userData.avatarBase64}`;
    }

    const userWithProcessedAvatar = {
      ...userData,
      avatar: processedAvatarData ? null : "default",
      customAvatar: processedAvatarData,
    };

    setUser(userWithProcessedAvatar);
    localStorage.setItem("pokerUser", JSON.stringify(userWithProcessedAvatar));

    // Check table status after login
    setTimeout(checkTableStatus, 500);
  };

  // Handle logout
  const handleLogout = () => {
    ApiService.clearToken();
    setUser(null);
    localStorage.removeItem("pokerUser");
    setCurrentPage("home");
    setAtTable(false);
    setCurrentTable(null);
    setIsTableOwner(false);
  };

  // Handle navigation
  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Determine if we should show the title based on window width
  const isCompactMode = windowWidth < 600;

  return (
      <div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
        <header className="app-header">
          <div className={`logo ${isCompactMode ? 'compact' : ''}`} onClick={() => navigateTo("home")}>
            <div className="logo-icon-container">
              <GiPokerHand className="logo-icon" />
            </div>
            <h1 className="logo-title">SPADE</h1>
          </div>

          <div className="header-controls">
            <div className="connection-indicator">
              <BsCircleFill
                  className={`status-circle ${socketConnected ? "connected" : "disconnected"}`}
              />
            </div>
            {user && (
                <div className="nav-buttons">
                  <button
                      className={`nav-button ${currentPage === "home" ? "active" : ""}`}
                      onClick={() => navigateTo("home")}
                      aria-label="Home"
                  >
                    <FaHome className="nav-icon"/>
                  </button>

                  {/* Only show Calibration tab if user is at a table AND is the table owner */}
                  {atTable && isTableOwner && (
                      <button
                          className={`nav-button ${currentPage === "calibration" ? "active" : ""}`}
                          onClick={() => navigateTo("calibration")}
                          aria-label="Calibration"
                      >
                        <FaCog className="nav-icon"/>
                      </button>
                  )}
                </div>
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
                        onTableStatusChange={checkTableStatus}
                    />
                )}

                {currentPage === "calibration" && atTable && isTableOwner && (
                    <CalibrationPage
                        socket={socket}
                        socketConnected={socketConnected}
                        tableId={currentTable?.id}
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