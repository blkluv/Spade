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
      });

      spotifyPlayer.addListener("player_state_changed", (state) => {
        if (!state) return;

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
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      // Connect player
      spotifyPlayer.connect()
        .then(success => {
          if (success) {
            console.log("Spotify Web Playback SDK connected successfully");
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

  // Helper function to start progress interval with improved time tracking
  const startProgressInterval = () => {
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Start new interval to update progress more frequently (every 100ms)
    // This creates smoother progress updates between actual SDK state updates
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

  // Player control functions
  const togglePlay = () => {
    if (!playerRef.current) return;

    if (currentTrack === null && deviceId) {
      // Start playlist if no track is playing
      startPlaylistPlayback(deviceId);
    } else {
      playerRef.current.togglePlay().catch((err) => {
        console.error("Toggle play error:", err);
      });
    }
  };

  const skipToNext = () => {
    if (!playerRef.current) return;

    playerRef.current.nextTrack().catch((err) => {
      console.error("Next track error:", err);
    });
  };

  const skipToPrevious = () => {
    if (!playerRef.current) return;

    playerRef.current.previousTrack().catch((err) => {
      console.error("Previous track error:", err);
    });
  };

  const seek = (positionMs) => {
    if (!playerRef.current) return;

    playerRef.current.seek(positionMs).then(() => {
      setTrackProgress(positionMs);
      lastPositionUpdateRef.current = positionMs;
      lastPositionUpdateTimeRef.current = Date.now();
    }).catch((err) => {
      console.error("Seek error:", err);
    });
  };

  const setPlayerVolume = (value) => {
    if (!playerRef.current) return;

    const normalizedVolume = value / 100;
    playerRef.current.setVolume(normalizedVolume).then(() => {
      setVolume(value);
      if (isMuted && value > 0) setIsMuted(false);
    }).catch((err) => {
      console.error("Set volume error:", err);
    });
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.setVolume(volume / 100);
    } else {
      playerRef.current.setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const setShuffle = () => {
    if (!token || !deviceId) return;

    const newShuffleState = !isShuffle;

    fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to set shuffle state: ${response.statusText}`);
      }
      setIsShuffle(newShuffleState);
      console.log(`Shuffle ${newShuffleState ? "enabled" : "disabled"}`);
    })
    .catch((err) => {
      console.error("Error setting shuffle:", err);
    });
  };

  const startPlaylistPlayback = (deviceId) => {
    if (!token || !deviceId) return;

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
    })
    .catch((err) => {
      console.error("Error starting playlist playback:", err);
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