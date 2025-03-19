import React, { useState, useRef, useEffect } from "react";
import { FaMoon, FaSun, FaHome, FaUser, FaCog } from "react-icons/fa";
import { GiPokerHand } from "react-icons/gi";
import { BsCircleFill } from "react-icons/bs";
import CamDiv from "./CamDiv";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import CalibrationPage from "./CalibrationPage";
import { io } from "socket.io-client";
import "./styles.css";

const socket = io("http://192.168.178.112:5001", {
  rejectUnauthorized: false, // Important for self-signed certificates
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 10000,
});

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Apply theme class to body
    document.body.className = darkMode ? "dark-theme" : "light-theme";

    // Check if user is logged in from local storage
    const savedUser = localStorage.getItem("pokerUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("pokerUser");
      }
    }
  }, [darkMode]);

  useEffect(() => {
    // Socket connection event listeners
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

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("pokerUser", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("pokerUser");
  };

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
          <button
              className={`nav-button ${currentPage === "home" ? "active" : ""}`}
              onClick={() => navigateTo("home")}
              aria-label="Home"
          >
            <FaHome className="nav-icon"/>
          </button>

          {/* New Calibration Tab Button */}
          <button
              className={`nav-button ${currentPage === "calibration" ? "active" : ""}`}
              onClick={() => navigateTo("calibration")}
              aria-label="Calibration"
          >
            <FaCog className="nav-icon"/>
          </button>

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
        {currentPage === "home" && (
            <HomePage socket={socket} socketConnected={socketConnected} darkMode={darkMode}/>
        )}

        {/* New Calibration Page Rendering */}
        {currentPage === "calibration" && (
            <CalibrationPage socket={socket} socketConnected={socketConnected} />
        )}

        {currentPage === "profile" && (
            <ProfilePage
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                navigateToHome={() => navigateTo("home")}
            />
        )}
      </main>
    </div>
  );
}

export default App;