// client/src/context/SpotifyContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import SpotifyApiService from '../layouts/spotify/SpotifyApiService';

// Create context
const SpotifyContext = createContext();
export const useSpotify = () => useContext(SpotifyContext);

export const SpotifyProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expireTime, setExpireTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isControlBusy, setIsControlBusy] = useState(false);
  const [isPlayerHealthy, setIsPlayerHealthy] = useState(true);

  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  const playerRef = useRef(null);
  const playerCheckIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastTrackIdRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const trackDurationRef = useRef(trackDuration);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    trackDurationRef.current = trackDuration;
  }, [trackDuration]);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshTokenValue = params.get('refresh_token');
    const expiresAt = params.get('expires_at');

    if (accessToken) {
      setToken(accessToken);
      if (refreshTokenValue) setRefreshToken(refreshTokenValue);
      if (expiresAt) setExpireTime(Number(expiresAt));
      window.history.replaceState(null, null, window.location.pathname);
    } else {
      const savedToken = localStorage.getItem('spotify_token');
      const savedRefreshToken = localStorage.getItem('spotify_refresh_token');
      const savedExpireTime = localStorage.getItem('spotify_expire_time');

      if (savedToken) {
        setToken(savedToken);
        if (savedRefreshToken) setRefreshToken(savedRefreshToken);
        if (savedExpireTime) setExpireTime(Number(savedExpireTime));
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('spotify_token', token);
      if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
      if (expireTime) localStorage.setItem('spotify_expire_time', expireTime);
      setIsReady(true);
    } else {
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_expire_time');
      setIsReady(false);
    }
  }, [token, refreshToken, expireTime]);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'SpadeBoot Web Player',
        getOAuthToken: cb => cb(localStorage.getItem('spotify_token')), // 🔥 dynamic token source
        volume: volume / 100
      });

      player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
        setIsPlayerHealthy(false);
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        setIsPlayerHealthy(false);
        refreshTokenHandler();
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        setIsPlayerHealthy(false);
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
        setIsPlayerHealthy(false);
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Web Player ready with device ID:', device_id);
        setIsPlayerHealthy(true);
        transferPlayback(device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.warn('Device ID went offline:', device_id);
        setIsPlayerHealthy(false);
      });

      player.addListener('player_state_changed', state => {
        if (!state) return;

        const currentTrackData = state.track_window.current_track;

        if (!lastTrackIdRef.current || currentTrackData.id !== lastTrackIdRef.current) {
          lastTrackIdRef.current = currentTrackData.id;
          fetchLyrics(currentTrackData);
        }

        setCurrentTrack(currentTrackData);
        setTrackDuration(state.duration);
        setIsPlaying(!state.paused);
        setIsShuffle(state.shuffle);
        setTrackProgress(state.position);
      });

      player.connect();
      playerRef.current = player;

      progressIntervalRef.current = setInterval(() => {
        if (isPlayingRef.current) {
          setTrackProgress(prev => {
            const newProgress = prev + 1000;
            return newProgress > trackDurationRef.current ? trackDurationRef.current : newProgress;
          });
        }
      }, 1000);

      playerCheckIntervalRef.current = setInterval(() => {
        player.getCurrentState().then(state => {
          setIsPlayerHealthy(!!state);
        });
      }, 5000);
    };

    return () => {
      if (playerRef.current) playerRef.current.disconnect();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerCheckIntervalRef.current) clearInterval(playerCheckIntervalRef.current);
      document.body.removeChild(script);
    };
  }, [token]);

  useEffect(() => {
    if (!refreshToken || !expireTime) return;
    const timeUntilExpire = expireTime - Math.floor(Date.now() / 1000);
    const refreshTime = Math.max(0, timeUntilExpire - 300) * 1000;

    const refreshTimeout = setTimeout(() => {
      refreshTokenHandler();
    }, refreshTime);

    return () => clearTimeout(refreshTimeout);
  }, [refreshToken, expireTime]);

  const refreshTokenHandler = useCallback(async () => {
    if (!refreshToken) return;

    try {
      const response = await SpotifyApiService.refreshToken(refreshToken);
      setToken(response.access_token);

      if (response.refresh_token) setRefreshToken(response.refresh_token);

      if (response.expires_at) {
        setExpireTime(response.expires_at);
      } else if (response.expires_in) {
        setExpireTime(Math.floor(Date.now() / 1000) + response.expires_in);
      }

      // 🔁 Optional: Resume playback if it was playing
      if (isPlayingRef.current && playerRef.current) {
        try {
          await playerRef.current.resume();
        } catch (e) {
          console.warn('Resume after token refresh failed:', e);
        }
      }

      return response.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      setToken(null);
      setRefreshToken(null);
      setExpireTime(0);
      return null;
    }
  }, [refreshToken]);

  const transferPlayback = useCallback(async (deviceId) => {
    if (!token || !deviceId) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [deviceId], play: false })
      });
    } catch (error) {
      console.error('Error transferring playback:', error);
    }
  }, [token]);

  const fetchLyrics = useCallback(async (track) => {
    if (!track) return;
    setLoadingLyrics(true);

    try {
      const artist = track.artists[0].name;
      const title = track.name;

      // Remove everything after "[" in both artist and title
      const cleanArtist = artist.split("[")[0].trim();
      const cleanTitle = title.split("[")[0].trim();
      const reallyCleanArtist = cleanArtist.split("(")[0].trim();
      const reallyCleanTitle = cleanTitle.split("(")[0].trim();

      // Format title (in case you still want to remove any " - " split)
      const formattedTitle = reallyCleanTitle.includes(" - ") ? reallyCleanTitle.split(" - ")[0] : reallyCleanTitle;

      const lyricsData = await SpotifyApiService.getLyrics(reallyCleanArtist, formattedTitle);

      if (lyricsData.error) {
        console.error('Lyrics error:', lyricsData.error);
        setLyrics('');
      } else {
        setLyrics(lyricsData.lyrics || '');
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      setLyrics('');
    } finally {
      setLoadingLyrics(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!playerRef.current || !isPlayerHealthy) return;
    setIsControlBusy(true);
    try {
      await playerRef.current.togglePlay();
    } catch (error) {
      console.error('Error toggling playback:', error);
    } finally {
      setIsControlBusy(false);
    }
  }, [isPlayerHealthy]);

  const skipToNext = useCallback(async () => {
    if (!playerRef.current || !isPlayerHealthy) return;
    setIsControlBusy(true);
    try {
      await playerRef.current.nextTrack();
    } catch (error) {
      console.error('Error skipping to next track:', error);
    } finally {
      setIsControlBusy(false);
    }
  }, [isPlayerHealthy]);

  const skipToPrevious = useCallback(async () => {
    if (!playerRef.current || !isPlayerHealthy) return;
    setIsControlBusy(true);
    try {
      await playerRef.current.previousTrack();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    } finally {
      setIsControlBusy(false);
    }
  }, [isPlayerHealthy]);

  const seek = useCallback(async (position) => {
    if (!playerRef.current || !isPlayerHealthy) return;
    setIsControlBusy(true);
    setTrackProgress(position);
    try {
      await playerRef.current.seek(position);
    } catch (error) {
      console.error('Error seeking:', error);
    } finally {
      setIsControlBusy(false);
    }
  }, [isPlayerHealthy]);

  const handleSetVolume = useCallback(async (value) => {
    if (!playerRef.current || !isPlayerHealthy) return;
    const volumeValue = isMuted ? 0 : value;
    setVolume(value);
    try {
      await playerRef.current.setVolume(volumeValue / 100);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [isMuted, isPlayerHealthy]);

  const toggleMute = useCallback(async () => {
    if (!playerRef.current || !isPlayerHealthy) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    try {
      await playerRef.current.setVolume(newMutedState ? 0 : volume / 100);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [isMuted, volume, isPlayerHealthy]);

  const setShuffle = useCallback(async () => {
    if (!token || !isPlayerHealthy) return;
    setIsControlBusy(true);
    const newShuffleState = !isShuffle;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIsShuffle(newShuffleState);
    } catch (error) {
      console.error('Error setting shuffle:', error);
    } finally {
      setIsControlBusy(false);
    }
  }, [token, isShuffle, isPlayerHealthy]);

  const formatDuration = useCallback((ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <SpotifyContext.Provider
      value={{
        token, refreshToken, expireTime, isReady,
        currentTrack, isPlaying, trackProgress, trackDuration,
        volume, isMuted, isShuffle, isControlBusy, isPlayerHealthy,
        lyrics, loadingLyrics,
        togglePlay, skipToNext, skipToPrevious, seek,
        setVolume: handleSetVolume, toggleMute, setShuffle,
        formatDuration
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};
