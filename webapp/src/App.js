import React, { useState, useRef, useEffect } from "react";
import { FaMoon, FaSun, FaHome, FaUser } from "react-icons/fa";
import { GiPokerHand } from "react-icons/gi";
import CamDiv from "./CamDiv";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import { io } from "socket.io-client";
import "./styles.css";

const socket = io("https://127.0.0.1:5000", {
  transports: ["websocket"],
  secure: true,
  rejectUnauthorized: false,
});

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);

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
          <button
            className={`nav-button ${currentPage === "home" ? "active" : ""}`}
            onClick={() => navigateTo("home")}
            aria-label="Home"
          >
            <FaHome className="nav-icon" />
          </button>

          <button
            className={`nav-button ${currentPage === "profile" ? "active" : ""}`}
            onClick={() => navigateTo("profile")}
            aria-label="Profile"
          >
            <FaUser className="nav-icon" />
          </button>

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <main>
        {currentPage === "home" && (
          <HomePage socket={socket} darkMode={darkMode} />
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
