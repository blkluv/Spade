import React, { useState } from "react";

function ProfilePage({ user, onLogin, onLogout, navigateToHome }) {
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.avatar || "default");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const availableAvatars = [
    "default",
    "player1",
    "player2",
    "player3",
    "player4",
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    // Simulate a login - in a real app, this would make an API call
    setError("");
    onLogin({
      username,
      email: `${username.toLowerCase()}@example.com`,
      avatar: "default",
      chips: 1000,
      gamesPlayed: 0,
      wins: 0,
    });
    setSuccessMessage("Login successful!");
    setTimeout(() => {
      setSuccessMessage("");
      navigateToHome();
    }, 1500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!username || !email) {
      setError("Username and email are required");
      return;
    }

    // Update user profile
    const updatedUser = {
      ...user,
      username,
      email,
      avatar,
    };

    onLogin(updatedUser);
    setIsEditing(false);
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  if (!user) {
    // Login form
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Login to SPADE Poker</h2>

          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="primary-button">
              Login
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account? Use any username and password to create
              one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User Profile View
  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Player Profile</h2>

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="profile-header">
          <div className={`avatar avatar-${user.avatar}`}>
            {user.username.charAt(0).toUpperCase()}
          </div>

          {!isEditing ? (
            <div className="profile-info">
              <h3>{user.username}</h3>
              <p>{user.email}</p>
            </div>
          ) : null}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="edit-username">Username</label>
              <input
                type="text"
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input
                type="email"
                id="edit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Select Avatar</label>
              <div className="avatar-selector">
                {availableAvatars.map((avatarOption) => (
                  <div
                    key={avatarOption}
                    className={`avatar avatar-${avatarOption} ${
                      avatar === avatarOption ? "selected" : ""
                    }`}
                    onClick={() => setAvatar(avatarOption)}
                  >
                    {username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="primary-button">
                Save Changes
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-value">
                  {user.chips?.toLocaleString() || 1000}
                </span>
                <span className="stat-label">Chips</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.gamesPlayed || 0}</span>
                <span className="stat-label">Games</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.wins || 0}</span>
                <span className="stat-label">Wins</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="primary-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button className="secondary-button" onClick={onLogout}>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
