import React, { useEffect, useState, useRef, useMemo } from 'react';
import './SpotifyLyrics.css';

const SpotifyLyrics = ({
  lyrics,
  isPlaying,
  trackProgress,
  trackDuration
}) => {
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const lyricsContainerRef = useRef(null);
  const lyricsRef = useRef(null);

  // Parse lyrics into timed lines
  useEffect(() => {
    if (!lyrics) return;

    // Split lyrics into lines, handling different newline formats
    const lines = lyrics.split(/\n+/).filter(line => line.trim());

    // Basic timestamp parsing (you might want to enhance this)
    const timedLines = lines.map((line, index) => ({
      text: line.trim(),
      timestamp: calculateTimestamp(index, lines.length, trackDuration)
    }));

    setParsedLyrics(timedLines);
  }, [lyrics, trackDuration]);

  // Calculate timestamp for each line
  const calculateTimestamp = (lineIndex, totalLines, duration) => {
    // Simple linear time distribution
    return (lineIndex / totalLines) * duration;
  };

  // Track current line based on song progress
  useEffect(() => {
    if (!parsedLyrics.length) return;

    const currentIndex = parsedLyrics.findLastIndex(
      line => line.timestamp <= trackProgress
    );

    setCurrentLineIndex(currentIndex);
  }, [trackProgress, parsedLyrics]);

  // Scroll to current line
  useEffect(() => {
    if (currentLineIndex === -1 || !lyricsContainerRef.current) return;

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
  }, [currentLineIndex]);

  // Render lyrics with dynamic styling
  const renderLyrics = () => {
    return parsedLyrics.map((line, index) => (
      <div
        key={index}
        className={`lyrics-line ${
          index === currentLineIndex ? 'current-line' : ''
        }`}
      >
        {line.text}
      </div>
    ));
  };

  // Fallback for no lyrics
  if (!lyrics || lyrics.trim() === '') {
    return (
      <div className="no-lyrics">
        <p>No lyrics available for this track</p>
      </div>
    );
  }

  return (
    <div className="spotify-lyrics-container">
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