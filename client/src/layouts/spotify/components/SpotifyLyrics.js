import React, { useEffect, useState, useRef } from 'react';
import './SpotifyLyrics.css'; // Make sure to use the enhanced CSS

const SpotifyLyrics = ({
  lyrics,
  isPlaying,
  trackProgress,
  trackDuration,
  currentTrack,
  loadingLyrics
}) => {
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [lineProgress, setLineProgress] = useState(0);
  const lyricsContainerRef = useRef(null);
  const lyricsRef = useRef(null);

  // Parse lyrics into lines and estimate if they're actual lyrics or metadata
  useEffect(() => {
    if (!lyrics) return;

    // Split lyrics into lines
    const lines = lyrics.split(/\n+/);

    // Process lines to identify patterns suggesting metadata vs lyrics
    const processedLines = lines.map((line) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (trimmedLine === '') return null;

      // Determine if line is likely metadata
      const isMetadata = isLikelyMetadata(trimmedLine);

      return {
        text: trimmedLine,
        isMetadata
      };
    }).filter(line => line !== null);

    // Assign timestamps
    const timedLines = assignTimestamps(processedLines, trackDuration);

    setParsedLyrics(timedLines);
  }, [lyrics, trackDuration]);

  // Identify possible metadata lines (patterns commonly found in non-lyric text)
  const isLikelyMetadata = (line) => {
    // Common patterns that suggest metadata rather than lyrics
    const metadataPatterns = [
      /^\[.*\]$/, // Content in square brackets like [Verse], [Chorus]
      /^[0-9]+:[0-9]+$/, // Just timestamps
      /^\(.+\)$/, // Content in parentheses only like (repeat)
      /^[A-Z\s]+:/, // ALL CAPS followed by colon like "VERSE:"
      /^[\w\s]+ x\d+$/ // Repetition indicators like "Chorus x4"
    ];

    return metadataPatterns.some(pattern => pattern.test(line)) ||
           (line.length < 12 && line.toUpperCase() === line); // Short ALL CAPS lines
  };

  // Assign estimated timestamps to lines
  const assignTimestamps = (lines, duration) => {
    if (!lines.length) return [];

    // Count lyrics (non-metadata) for more accurate timing
    const lyricsCount = lines.filter(line => !line.isMetadata).length;

    let currentTime = 0;
    // Keep some buffer at start and end (15% each)
    const actualDuration = duration * 0.7;
    const startBuffer = duration * 0.15;

    // Calculate average time per actual lyric line
    const timePerLyricLine = lyricsCount > 0 ? actualDuration / lyricsCount : actualDuration / lines.length;

    // Add timestamps
    return lines.map((line, index) => {
      // Metadata takes less time
      const lineTime = line.isMetadata ? timePerLyricLine * 0.3 : timePerLyricLine;

      const timestamp = startBuffer + currentTime;

      // For next line
      currentTime += lineTime;

      return {
        ...line,
        timestamp,
        duration: lineTime
      };
    });
  };

  // Track current line based on song progress
  useEffect(() => {
    if (!parsedLyrics.length || trackProgress === 0) return;

    // Find current line
    const newCurrentIndex = parsedLyrics.findLastIndex(
      line => line.timestamp <= trackProgress
    );

    if (newCurrentIndex !== currentLineIndex) {
      setCurrentLineIndex(newCurrentIndex);
      setLineProgress(0); // Reset progress for new line
    } else if (newCurrentIndex >= 0 && newCurrentIndex < parsedLyrics.length - 1) {
      // Calculate progress within current line (0-100%)
      const currentLine = parsedLyrics[newCurrentIndex];
      const nextLine = parsedLyrics[newCurrentIndex + 1];
      const lineStartTime = currentLine.timestamp;
      const lineEndTime = nextLine.timestamp;
      const lineLength = lineEndTime - lineStartTime;

      if (lineLength > 0) {
        const progress = ((trackProgress - lineStartTime) / lineLength) * 100;
        setLineProgress(Math.min(progress, 100));
      }
    }
  }, [trackProgress, parsedLyrics, currentLineIndex]);

  // Scroll to current line
  useEffect(() => {
    if (currentLineIndex === -1 || !lyricsContainerRef.current || !isPlaying) return;

    const lineElements = lyricsRef.current?.children;
    if (!lineElements || !lineElements[currentLineIndex]) return;

    const currentLineElement = lineElements[currentLineIndex];
    const containerElement = lyricsContainerRef.current;

    // Smooth scrolling to center the current line
    containerElement.scrollTo({
      top: currentLineElement.offsetTop -
           containerElement.clientHeight / 2 +
           currentLineElement.clientHeight / 2,
      behavior: 'smooth'
    });
  }, [currentLineIndex, isPlaying]);

  // Render lyrics with dynamic styling
  const renderLyrics = () => {
    return parsedLyrics.map((line, index) => {
      // Determine line class
      let lineClass = 'lyrics-line';

      if (line.isMetadata) {
        lineClass += ' metadata';
      }

      // Style based on relative position to current line
      if (index === currentLineIndex) {
        lineClass += ' current-line';
      } else if (index < currentLineIndex) {
        lineClass += ' passed';
      } else if (index === currentLineIndex + 1) {
        lineClass += ' upcoming-1';
      } else if (index === currentLineIndex + 2) {
        lineClass += ' upcoming-2';
      } else if (index === currentLineIndex + 3) {
        lineClass += ' upcoming-3';
      }

      return (
        <div
          key={index}
          className={lineClass}
        >
          {line.text}
          {index === currentLineIndex && (
            <div
              className="current-line-progress"
              style={{ width: `${lineProgress}%` }}
            />
          )}
        </div>
      );
    });
  };

  // Loading state
  if (loadingLyrics) {
    return (
      <div className="spotify-lyrics-container">
        <div className="lyrics-loading">
          <div className="lyrics-loading-spinner"></div>
          <div>Loading lyrics...</div>
        </div>
      </div>
    );
  }

  // No lyrics fallback
  if (!lyrics || lyrics.trim() === '') {
    return (
      <div className="spotify-lyrics-container">
        <div className="no-lyrics">
          <p>No lyrics available for this track</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-lyrics-container">
      <div className="lyrics-title">
        Lyrics
      </div>
      <div
        ref={lyricsContainerRef}
        className="lyrics-scroll-container"
      >
        <div ref={lyricsRef} className="lyrics-content">
          {renderLyrics()}
        </div>
      </div>
    </div>
  );
};

export default SpotifyLyrics;