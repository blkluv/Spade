import React, { useRef } from "react";
import "./SpotifyPlayer.css";
import {
  BsPauseFill,
  BsPlayFill,
  BsSkipBackwardFill,
  BsSkipForwardFill,
} from "react-icons/bs";
import { PiShuffleBold } from "react-icons/pi";
import { ImVolumeHigh, ImVolumeLow, ImVolumeMedium, ImVolumeMute2 } from "react-icons/im";
import SpotifyLyrics from './SpotifyLyrics';

// Import our Spotify context hook
import { useSpotify } from "../../../context/SpotifyContext";

const SpotifyPlayer = ({ useLyrics = true }) => {
  // Use the context instead of props and local state
  const {
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
    setVolume,
    toggleMute,
    setShuffle,

    // Helper functions
    formatDuration,
  } = useSpotify();

  const progressBarRef = useRef(null);

  // Handle progress bar click for seeking
  const handleProgressClick = (e) => {
    if (!progressBarRef.current || !trackDuration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPositionX = e.clientX - rect.left;
    const progressBarWidth = rect.width;

    // Calculate position as a percentage (0-1)
    const positionRatio = Math.max(0, Math.min(1, clickPositionX / progressBarWidth));

    // Convert to milliseconds
    const seekPositionMs = Math.floor(positionRatio * trackDuration);

    // Seek to the position
    seek(seekPositionMs);
  };

  // Helper function to get appropriate volume icon based on volume level
  const getVolumeIcon = (volume, isMuted) => {
    if (isMuted || volume === 0) return <ImVolumeMute2 size="25px" />;
    if (volume <= 33) return <ImVolumeLow size="25px" />;
    if (volume <= 66) return <ImVolumeMedium size="25px" />;
    return <ImVolumeHigh size="25px" />;
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = (trackProgress / trackDuration) * 100 || 0;

  return (
    <div className="spotify-player-container">
      {/* Left side: Song playback */}
      <div className="playback-container">
        <div className="track-info">
          {currentTrack ? (
            <img
              src={currentTrack.album.images[0].url}
              alt={currentTrack.name}
              className="track-image"
            />
          ) : (
            <img
              src="https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cdd7cb0d442bee004f48dee14"
              alt="Placeholder"
              className="track-image"
            />
          )}
          <div className="track-details">
            {currentTrack ? (
              <div>
                <p className="track-name">
                  <strong>{currentTrack.name}</strong>
                </p>
                <p className="track-artist">
                  {currentTrack.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
            ) : (
              <div></div>
            )}
            <p className="track-duration">
              {formatDuration(trackProgress)} / {formatDuration(trackDuration)}
            </p>
            <div
              className="progress-bar-container"
              ref={progressBarRef}
              onClick={handleProgressClick}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="progress-bar"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="button-container">
              <button className="play-pause-button" onClick={skipToPrevious}>
                <BsSkipBackwardFill size="25px" color="inherit" />
              </button>
              <button className="play-pause-button" onClick={togglePlay}>
                {isPlaying ? (
                  <BsPauseFill size="25px" color="inherit" />
                ) : (
                  <BsPlayFill size="25px" color="inherit" />
                )}
              </button>
              <button className="play-pause-button" onClick={skipToNext}>
                <BsSkipForwardFill size="25px" color="inherit" />
              </button>
              <button
                className={`play-pause-button ${isShuffle ? "is-shuffle-active" : ""}`}
                onClick={setShuffle}
              >
                <PiShuffleBold size="25px" color="inherit" />
              </button>
            </div>
            {/* Volume Controls */}
            <div className="volume-container">
              <button className="volume-button" onClick={toggleMute}>
                {getVolumeIcon(volume, isMuted)}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="volume-slider"
                style={{ '--fill-level': `${isMuted ? 0 : volume}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Lyrics (conditional) */}
      {useLyrics && (
        <div className="lyrics-container">
          <SpotifyLyrics
            lyrics={lyrics}
            isPlaying={isPlaying}
            trackProgress={trackProgress}
            trackDuration={trackDuration}
            currentTrack={currentTrack}
            loadingLyrics={loadingLyrics}
          />
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayer;