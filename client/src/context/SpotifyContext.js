import React, { createContext, useState, useEffect, useRef, useContext } from "react";

const SpotifyContext = createContext();

export const useSpotify = () => useContext(SpotifyContext);

export const SpotifyProvider = ({ children }) => {
  // Player state
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expirationTime, setExpirationTime] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Control states
  const [isControlBusy, setIsControlBusy] = useState(false);
  const [isPlayerHealthy, setIsPlayerHealthy] = useState(true);

  // Lyrics state
  const [lyrics, setLyrics] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [trackId, setTrackId] = useState(null);

  // Refs
  const playerRef = useRef(null);
  const progressInterval = useRef(null);
  const lastPositionUpdateRef = useRef(0);
  const lastPositionUpdateTimeRef = useRef(0);
  const previousTrackIdRef = useRef(null);
  const controlTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const lastPlayerActionTime = useRef(Date.now());

  // Initialize token from localStorage or URL hash on mount
  useEffect(() => {
    // Extract access token from URL hash if present
    const hash = window.location.hash;
    const accessToken = hash
      .substring(1)
      .split("&")
      .find((param) => param.startsWith("access_token"))
      ?.split("=")[1];

    const refreshTokenFromHash = hash
      .substring(1)
      .split("&")
      .find((param) => param.startsWith("refresh_token"))
      ?.split("=")[1];

    const expiresAt = hash
      .substring(1)
      .split("&")
      .find((param) => param.startsWith("expires_at"))
      ?.split("=")[1];

    if (accessToken) {
      console.log("Access Token Found in URL:", accessToken);
      setToken(accessToken);
      localStorage.setItem("spotifyAccessToken", accessToken);

      if (refreshTokenFromHash) {
        setRefreshToken(refreshTokenFromHash);
        localStorage.setItem("spotifyRefreshToken", refreshTokenFromHash);
      }

      if (expiresAt) {
        setExpirationTime(expiresAt);
        localStorage.setItem("spotifyExpiresAt", expiresAt);
      }

      // Clear URL hash to avoid token exposure
      window.location.hash = "";
    } else {
      // Check localStorage for existing tokens
      const storedToken = localStorage.getItem("spotifyAccessToken");
      const storedRefreshToken = localStorage.getItem("spotifyRefreshToken");
      const storedExpiresAt = localStorage.getItem("spotifyExpiresAt");

      if (storedToken) {
        console.log("Using Stored Token");
        setToken(storedToken);
        if (storedRefreshToken) setRefreshToken(storedRefreshToken);
        if (storedExpiresAt) setExpirationTime(storedExpiresAt);
      }
    }
  }, []);

  // Health check function to verify player is responding
  const checkPlayerHealth = async () => {
    if (!playerRef.current) return false;

    try {
      const state = await playerRef.current.getCurrentState();
      // If we get a valid response, the player is healthy
      setIsPlayerHealthy(true);
      return true;
    } catch (error) {
      console.error("Player health check failed:", error);
      setIsPlayerHealthy(false);
      return false;
    }
  };

  // Attempt to reconnect the player
  const attemptReconnect = async () => {
    if (!token || reconnectAttempts.current > 3) return false;

    console.log(`Attempting to reconnect Spotify player (attempt ${reconnectAttempts.current + 1})...`);

    try {
      if (playerRef.current) {
        await playerRef.current.disconnect();
      }

      // Small delay before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const success = await playerRef.current.connect();
      if (success) {
        console.log("Spotify player reconnected successfully!");
        setIsPlayerHealthy(true);
        reconnectAttempts.current = 0;
        return true;
      }
    } catch (error) {
      console.error("Error reconnecting player:", error);
    }

    reconnectAttempts.current++;
    return false;
  };

  // Initialize Spotify SDK when token is available
  useEffect(() => {
    if (!token) return;

    // Load Spotify SDK script
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    // Initialize player when SDK is loaded
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "SPADE Spotify Player",
        getOAuthToken: (cb) => cb(token),
        volume: volume / 100,
      });

      // Event listeners
      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID:", device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setIsPlayerHealthy(true);
        reconnectAttempts.current = 0;
      });

      spotifyPlayer.addListener("player_state_changed", (state) => {
        if (!state) return;

        // Mark player as healthy since we received a state update
        setIsPlayerHealthy(true);
        reconnectAttempts.current = 0;

        const track = state.track_window.current_track;

        // Check if this is a true track change
        const isNewTrack = track && (!previousTrackIdRef.current || track.id !== previousTrackIdRef.current);

        // Update player state
        setCurrentTrack(track);
        setIsPlaying(!state.paused);
        setTrackDuration(track.duration_ms);

        // Update both the current position and the timestamp of when we received it
        setTrackProgress(state.position);
        lastPositionUpdateRef.current = state.position;
        lastPositionUpdateTimeRef.current = Date.now();

        setIsShuffle(state.shuffle);

        // Only trigger lyrics fetch when the actual track changes
        if (isNewTrack) {
          console.log("Track changed, updating trackId:", track.id);
          setTrackId(track.id);
          previousTrackIdRef.current = track.id;
        }

        // Release control busy state after state update
        setIsControlBusy(false);
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
        setIsPlayerHealthy(false);
      });

      spotifyPlayer.addListener("initialization_error", ({ message }) => {
        console.error("Initialization error:", message);
        setIsPlayerHealthy(false);
      });

      spotifyPlayer.addListener("authentication_error", ({ message }) => {
        console.error("Authentication error:", message);
        setIsPlayerHealthy(false);
      });

      spotifyPlayer.addListener("account_error", ({ message }) => {
        console.error("Account error:", message);
        setIsPlayerHealthy(false);
      });

      // Connect player
      spotifyPlayer.connect()
        .then(success => {
          if (success) {
            console.log("Spotify Web Playback SDK connected successfully");
            setIsPlayerHealthy(true);
          } else {
            console.error("Failed to connect to Spotify Web Playback SDK");
            setIsPlayerHealthy(false);
          }
        });

      playerRef.current = spotifyPlayer;

      // Start progress update interval
      startProgressInterval();

      return () => {
        clearInterval(progressInterval.current);
      };
    };

    return () => {
      // We intentionally DO NOT disconnect the player on cleanup
      // This allows the player to persist between route changes
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
      clearInterval(progressInterval.current);
    };
  }, [token]);

  // Token refresh logic
  useEffect(() => {
    if (!refreshToken || !expirationTime) return;

    const refreshAccessToken = async () => {
      try {
        const response = await fetch(
          `/refresh_token?refresh_token=${refreshToken}`
        );
        if (response.ok) {
          const data = await response.json();
          const newToken = data.access_token;
          const newExpiresIn = data.expires_in; // Seconds

          // Update token and expiration time
          setToken(newToken);
          setExpirationTime(Date.now() + newExpiresIn * 1000);

          // Update localStorage
          localStorage.setItem("spotifyAccessToken", newToken);
          localStorage.setItem("spotifyExpiresAt", Date.now() + newExpiresIn * 1000);

          console.log("Token refreshed successfully");
        } else {
          console.error("Failed to refresh token:", response.statusText);
        }
      } catch (err) {
        console.error("Error refreshing token:", err);
      }
    };

    // Check token expiration periodically
    const interval = setInterval(() => {
      if (Date.now() >= expirationTime - 60000) {
        // Refresh token 1 minute before it expires
        refreshAccessToken();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [refreshToken, expirationTime]);

  // Fetch lyrics when trackId changes
  useEffect(() => {
    if (!trackId || !currentTrack) return;

    const fetchLyrics = () => {
      // Get artist and title from current track
      const artist = currentTrack.artists.map((a) => a.name).join(", ");
      const title = currentTrack.name;

      // Format artist and title according to the original implementation
      const formattedArtist = artist.includes(",") ? artist.split(",")[0] : artist;
      const formattedTitle = title.includes(" - ") ? title.split(" - ")[0] : title;

      console.log(`Fetching lyrics for: "${formattedTitle}" by ${formattedArtist}`);
      setLoadingLyrics(true);

      fetch(
        `https://localhost:5000/lyrics?artist=${encodeURIComponent(
          formattedArtist.trim()
        )}&title=${encodeURIComponent(formattedTitle.trim())}`
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch lyrics");
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            console.error("Error fetching lyrics:", data.error);
            setLyrics("Lyrics not found for this track.");
          } else {
            const currentArtists = currentTrack.artists.map((a) => a.name.toLowerCase());
            const fetchedArtist = data.artist?.toLowerCase();

            // Simple validation that fetched lyrics match current track
            // (commented out as per original, but kept for reference)
            //if (!currentArtists.includes(fetchedArtist)) {
            //  const newArtist = currentTrack.artists.map((a) => a.name).join(", ");
            //  const newTitle = currentTrack.name;
            //  fetchLyrics(newArtist, newTitle);
            //} else {
              setLyrics(data.lyrics);
              console.log("Lyrics fetched successfully");
            //}
          }
        })
        .catch((err) => {
          console.error("Error fetching lyrics:", err);
          setLyrics("An error occurred while fetching lyrics... ¯\\_(ツ)_/¯\n" +
              "\n" +
              "Maybe this song doesn't have any lyrics after all?");
        })
        .finally(() => {
          setLoadingLyrics(false);
        });
    };

    fetchLyrics();
  }, [trackId]); // Only depend on trackId, which only changes for new tracks

  // Player health check effect
  useEffect(() => {
    // Check player health if we haven't received any state updates in 15 seconds
    const healthCheckInterval = setInterval(async () => {
      const timeSinceLastAction = Date.now() - lastPlayerActionTime.current;

      // If it's been more than 15 seconds since the last action and we're supposedly playing
      if (isPlaying && timeSinceLastAction > 15000) {
        const isHealthy = await checkPlayerHealth();

        // If player is not healthy, try to reconnect
        if (!isHealthy) {
          attemptReconnect();
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isPlaying]);

  // Helper function to start progress interval with improved time tracking
  const startProgressInterval = () => {
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Start new interval to update progress more frequently (every 100ms)
    progressInterval.current = setInterval(() => {
      if (playerRef.current && isPlaying) {
        // Every 3 seconds, get the actual position from the player
        // This helps correct any drift that might occur
        if (Date.now() % 3000 < 100) {
          playerRef.current.getCurrentState().then((state) => {
            if (state) {
              setTrackProgress(state.position);
              lastPositionUpdateRef.current = state.position;
              lastPositionUpdateTimeRef.current = Date.now();
              lastPlayerActionTime.current = Date.now(); // Update the last action time
            }
          }).catch(err => {
            console.warn("Failed to get current state:", err);
            // This might indicate player health issues
            if (Date.now() - lastPlayerActionTime.current > 10000) {
              setIsPlayerHealthy(false);
            }
          });
        } else {
          // For smoother updates between actual position checks,
          // calculate the estimated position based on elapsed time
          const elapsedSinceLastUpdate = Date.now() - lastPositionUpdateTimeRef.current;
          const estimatedPosition = lastPositionUpdateRef.current + elapsedSinceLastUpdate;

          // Only update if we're not at the end of the track
          if (estimatedPosition < trackDuration) {
            setTrackProgress(estimatedPosition);
          } else if (trackProgress !== trackDuration) {
            // If we've reached the end, set to track duration
            setTrackProgress(trackDuration);
          }
        }
      }
    }, 100); // Update much more frequently for smoother progress
  };

  // Safe execute for player actions
  const safeExecutePlayerAction = async (action, fallbackAction = null) => {
    // Don't allow new actions if we're busy or player is unhealthy
    if (isControlBusy) {
      console.log("Control action ignored - controls are busy");
      return false;
    }

    // Set busy state to prevent multiple rapid actions
    setIsControlBusy(true);
    lastPlayerActionTime.current = Date.now();

    // Clear any existing timeout
    if (controlTimeoutRef.current) {
      clearTimeout(controlTimeoutRef.current);
    }

    try {
      // Check player health first
      const isHealthy = isPlayerHealthy || await checkPlayerHealth();

      if (!isHealthy) {
        console.log("Player is not healthy, attempting to reconnect...");
        const reconnected = await attemptReconnect();

        if (!reconnected) {
          console.error("Failed to reconnect player, action cannot be performed");
          setIsControlBusy(false);
          return false;
        }
      }

      // Execute the action
      await action();

      // Set a timeout to release the busy state if we don't get a state update
      controlTimeoutRef.current = setTimeout(() => {
        setIsControlBusy(false);
      }, 1500);

      return true;
    } catch (error) {
      console.error("Error executing player action:", error);

      // Try fallback action if provided
      if (fallbackAction) {
        try {
          await fallbackAction();
          console.log("Fallback action executed successfully");
        } catch (fallbackError) {
          console.error("Fallback action also failed:", fallbackError);
        }
      }

      // Release busy state
      setIsControlBusy(false);
      return false;
    }
  };

  // Player control functions with improved error handling
  const togglePlay = () => {
    // If we don't have a track playing and we have a device ID, start playlist
    if (currentTrack === null && deviceId) {
      startPlaylistPlayback(deviceId);
      return;
    }

    safeExecutePlayerAction(async () => {
      await playerRef.current.togglePlay();
      console.log("Toggle play executed");

      // Optimistic UI update
      setIsPlaying(!isPlaying);
    });
  };

  const skipToNext = () => {
    safeExecutePlayerAction(async () => {
      await playerRef.current.nextTrack();
      console.log("Skip to next executed");
    });
  };

  const skipToPrevious = () => {
    safeExecutePlayerAction(async () => {
      await playerRef.current.previousTrack();
      console.log("Skip to previous executed");
    });
  };

  const seek = (positionMs) => {
    safeExecutePlayerAction(async () => {
      await playerRef.current.seek(positionMs);
      console.log("Seek executed to position:", positionMs);

      // Update the progress immediately for better UX
      setTrackProgress(positionMs);
      lastPositionUpdateRef.current = positionMs;
      lastPositionUpdateTimeRef.current = Date.now();
    });
  };

  const setPlayerVolume = (value) => {
    safeExecutePlayerAction(async () => {
      const normalizedVolume = value / 100;
      await playerRef.current.setVolume(normalizedVolume);
      console.log("Volume set to:", value);

      // Update state
      setVolume(value);
      if (isMuted && value > 0) setIsMuted(false);
    });
  };

  const toggleMute = () => {
    safeExecutePlayerAction(async () => {
      if (isMuted) {
        await playerRef.current.setVolume(volume / 100);
        console.log("Unmuted to volume:", volume);
      } else {
        await playerRef.current.setVolume(0);
        console.log("Muted");
      }
      setIsMuted(!isMuted);
    });
  };

  const setShuffle = () => {
    if (!token || !deviceId) return;

    const newShuffleState = !isShuffle;

    // Optimistic UI update
    setIsShuffle(newShuffleState);

    fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
    .then((response) => {
      if (!response.ok) {
        // Revert on error
        setIsShuffle(!newShuffleState);
        throw new Error(`Failed to set shuffle state: ${response.statusText}`);
      }
      console.log(`Shuffle ${newShuffleState ? "enabled" : "disabled"}`);
    })
    .catch((err) => {
      console.error("Error setting shuffle:", err);
    });
  };

  const startPlaylistPlayback = (deviceId) => {
    if (!token || !deviceId) return;

    // Optimistic UI update - show as busy
    setIsControlBusy(true);

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: "spotify:playlist:3GuG2wiCsxXEbc1hfFP3xn", // Replace with your playlist URI
      }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to start playlist playback: ${response.statusText}`);
      }
      console.log("Playlist playback started successfully!");
      // State will be updated via player_state_changed
    })
    .catch((err) => {
      console.error("Error starting playlist playback:", err);
      setIsControlBusy(false);
    });
  };

  // Helper function to format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Logout function
  const logout = () => {
    if (playerRef.current) {
      playerRef.current.disconnect();
    }

    // Clear all Spotify data from localStorage
    localStorage.removeItem("spotifyAccessToken");
    localStorage.removeItem("spotifyRefreshToken");
    localStorage.removeItem("spotifyExpiresAt");

    // Reset state
    setToken(null);
    setRefreshToken(null);
    setExpirationTime(null);
    setDeviceId(null);
    setIsReady(false);
    setCurrentTrack(null);
    setIsPlaying(false);
    setTrackProgress(0);
    setTrackDuration(0);
    setLyrics(null);
    setTrackId(null);
    previousTrackIdRef.current = null;

    // Clear interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  // Effect to restart progress interval when play state changes
  useEffect(() => {
    if (isPlaying) {
      startProgressInterval();
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  // The context value that will be provided to consumers
  const contextValue = {
    // Authentication
    token,
    isReady,

    // Player state
    currentTrack,
    isPlaying,
    trackProgress,
    trackDuration,
    volume,
    isMuted,
    isShuffle,
    isControlBusy,
    isPlayerHealthy,

    // Lyrics
    lyrics,
    loadingLyrics,

    // Player controls
    togglePlay,
    skipToNext,
    skipToPrevious,
    seek,
    setVolume: setPlayerVolume,
    toggleMute,
    setShuffle,

    // Helper functions
    formatDuration,

    // Logout
    logout,
  };

  return (
    <SpotifyContext.Provider value={contextValue}>
      {children}
    </SpotifyContext.Provider>
  );
};