import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaExclamationTriangle } from "react-icons/fa";
import ApiService from "./ApiService";

function ProfilePage({ user, onLogin, onLogout, navigateToHome }) {
  // State for form fields
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  // State for avatar
  const [avatar, setAvatar] = useState(user?.avatar || "default");
  const [customAvatar, setCustomAvatar] = useState(user?.customAvatar || null);

  // State for UI feedback
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for views
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);

  const fileInputRef = useRef(null);

  // Available avatar options
  const availableAvatars = [
    "default",
    "player1",
    "player2",
    "player3",
    "player4",
  ];

  // Function to handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      // Call the login API
      const loginResponse = await ApiService.login({
        username,
        password,
      });

      // Get user details after login
      const userData = loginResponse.user;

      onLogin({
        ...userData,
        avatar: userData.avatar || "default",
        customAvatar: userData.avatar ? null : userData.customAvatar,
      });

      setSuccessMessage("Login successful!");
      setTimeout(() => {
        setSuccessMessage("");
        navigateToHome();
      }, 1500);
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password || !email) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      // Register the user
      await ApiService.register({
        username,
        password,
        email,
      });

      // Login with the new credentials
      const loginResponse = await ApiService.login({
        username,
        password,
      });

      onLogin({
        ...loginResponse.user,
        avatar: "default",
        customAvatar: null,
      });

      setSuccessMessage("Registration successful!");
      setTimeout(() => {
        setSuccessMessage("");
        navigateToHome();
      }, 1500);
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update user profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !email) {
      setError("Username and email are required");
      setIsLoading(false);
      return;
    }

    try {
      // Update user profile
      const updatedUser = await ApiService.updateUser({
        username,
        email,
      });

      onLogin({
        ...updatedUser,
        avatar: avatar,
        customAvatar: customAvatar,
      });

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error) {
      setError(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Call API to update password
      await ApiService.updatePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setSuccessMessage("Password updated successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error) {
      setError(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.match("image.*")) {
      setError("Please select an image file");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }

    setIsLoading(true);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomAvatar(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to server if logged in
      if (user) {
        const formData = new FormData();
        formData.append("avatar", file);

        const updatedUser = await ApiService.uploadAvatar(formData);

        onLogin({
          ...updatedUser,
          customAvatar: URL.createObjectURL(file),
        });

        setSuccessMessage("Profile picture updated!");
        setTimeout(() => setSuccessMessage(""), 2000);
      }
    } catch (error) {
      setError("Failed to upload avatar: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to trigger file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Function to remove custom avatar
  const removeCustomAvatar = async () => {
    setCustomAvatar(null);

    if (user) {
      try {
        setIsLoading(true);
        // This should be implemented on your backend - for now we'll just update the local state
        onLogin({
          ...user,
          customAvatar: null,
          avatar: "default",
        });

        setSuccessMessage("Profile picture removed!");
        setTimeout(() => setSuccessMessage(""), 2000);
      } catch (error) {
        setError("Failed to remove avatar");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      // Clear token from ApiService
      ApiService.clearToken();
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // If user is not logged in, show login/register form
  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${showLoginForm ? 'active' : ''}`}
              onClick={() => setShowLoginForm(true)}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!showLoginForm ? 'active' : ''}`}
              onClick={() => setShowLoginForm(false)}
            >
              Register
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {showLoginForm ? (
            // Login Form
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            // Registration Form
            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="reg-username">Username</label>
                <input
                  type="text"
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input
                  type="email"
                  id="reg-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <input
                  type="password"
                  id="reg-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>
              {showLoginForm
                ? "Don't have an account? Click Register to create one."
                : "Already have an account? Click Login to sign in."}
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
          <div className="avatar-container">
            <div
              className={`avatar ${
                customAvatar ? "custom" : `avatar-${avatar}`
              }`}
              style={
                customAvatar ? { backgroundImage: `url(${customAvatar})` } : {}
              }
            >
              {!customAvatar && user.username.charAt(0).toUpperCase()}

              <div className="avatar-overlay" onClick={triggerFileInput}>
                <FaCamera className="camera-icon" />
                <span>Change</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="file-input"
              disabled={isLoading}
            />
          </div>

          {!isEditing && !isChangingPassword ? (
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
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input
                type="email"
                id="edit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {!customAvatar && (
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
            )}

            {customAvatar && (
              <div className="form-group">
                <label>Profile Picture</label>
                <div className="custom-avatar-preview">
                  <img src={customAvatar} alt="Custom avatar" />
                  <button
                    type="button"
                    className="remove-avatar-btn"
                    onClick={removeCustomAvatar}
                    disabled={isLoading}
                  >
                    Remove and use default
                  </button>
                </div>
              </div>
            )}

            <div className="form-buttons">
              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : isChangingPassword ? (
          <form onSubmit={handlePasswordChange} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-buttons">
              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsChangingPassword(false)}
                disabled={isLoading}
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
                  {user.balance?.toLocaleString() || 1000}
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
                disabled={isLoading}
              >
                Edit Profile
              </button>
              <button
                className="secondary-button"
                onClick={() => setIsChangingPassword(true)}
                disabled={isLoading}
              >
                Change Password
              </button>
              <button
                className="secondary-button danger"
                onClick={handleLogout}
                disabled={isLoading}
              >
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