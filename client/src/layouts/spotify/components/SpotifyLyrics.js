import React, { useEffect, useState, useRef } from 'react';
import './SpotifyLyrics.css';

const SpotifyLyrics = ({
  lyrics,
  isPlaying,
  trackProgress,
  trackDuration,
  currentTrack,
  loadingLyrics
}) => {
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [currentZone, setCurrentZone] = useState(-1);
  const lyricsContainerRef = useRef(null);
  const prevZone = useRef(-1);
  const ZONE_RADIUS = 3; // Show 3 lines before and after the current line

  // Add buffers (5% of total duration)
  const INTRO_BUFFER = trackDuration * 0.04;
  const OUTRO_BUFFER = trackDuration * 0.02;
  const EFFECTIVE_DURATION = Math.max(1, trackDuration - (INTRO_BUFFER + OUTRO_BUFFER));

  useEffect(() => {
    if (!lyrics) return;

    const lines = lyrics.split(/\n+/)
      .filter(line => line.trim() !== '')
      .map((line, index, arr) => {
        const text = line.trim();
        const isGroupStart = /^\[(Verse|Chorus|Bridge|Pre-Chorus|Outro)/i.test(text);
        const isGroupEnd = index < arr.length - 1 &&
          /^\[(Verse|Chorus|Bridge|Pre-Chorus|Outro)/i.test(arr[index + 1].trim());

        return {
          text,
          isGroupStart,
          isGroupEnd,
          isMetadata: /^\[.*\]$|^[A-Z\s]+:$/.test(text)
        };
      });

    setParsedLyrics(lines);
  }, [lyrics]);

  useEffect(() => {
    if (!parsedLyrics.length || !trackDuration) return;

    // Adjust progress for buffers
    const adjustedProgress = Math.max(0, trackProgress - INTRO_BUFFER);
    const progressPercentage = Math.min(1, Math.max(0, adjustedProgress / EFFECTIVE_DURATION));

    // Calculate weighted distribution
    const lineWeights = parsedLyrics.map(line => {
      if (line.isMetadata) return 0.3;
      const lengthWeight = Math.min(2, Math.max(0.5, line.text.length / 25));
      return lengthWeight;
    });

    const totalWeight = lineWeights.reduce((a, b) => a + b, 0);
    let accumulatedWeight = 0;
    let currentIndex = 0;

    while (
      currentIndex < parsedLyrics.length - 1 &&
      accumulatedWeight / totalWeight < progressPercentage
    ) {
      accumulatedWeight += lineWeights[currentIndex];
      currentIndex++;
    }

    setCurrentZone(Math.max(0, Math.min(currentIndex, parsedLyrics.length - 1)));
  }, [trackProgress, trackDuration, parsedLyrics]);

  useEffect(() => {
    if (!lyricsContainerRef.current || currentZone === -1) return;

    const container = lyricsContainerRef.current;
    const targetLine = container.querySelector(`[data-index="${currentZone}"]`);

    if (targetLine) {
      const containerHeight = container.clientHeight;
      const targetPos = targetLine.offsetTop - (containerHeight / 2);
      const scrollVelocity = Math.min(1, Math.max(0.2, Math.abs(currentZone - prevZone.current) / 5));

      container.scrollTo({
        top: targetPos,
        behavior: 'auto',
        smooth: 'easeInOutCubic',
        duration: 500 * scrollVelocity
      });

      prevZone.current = currentZone;
    }
  }, [currentZone]);

  const getLineClass = (index) => {
    const distance = Math.abs(index - currentZone);
    let className = 'lyrics-line';

    if (index === currentZone) {
      className += ' current-line';
    } else if (distance <= ZONE_RADIUS) {
      className += ` context-${distance}`;
      // Add secondary highlight for immediate neighbors
      if (distance === 1) className += ' secondary-highlight';
      // Highlight the 2nd and 3rd top and bottom lines with a more subtle class
      else if (distance === 2) className += ' secondary-highlight-faded';
    }

    if (parsedLyrics[index]?.isGroupStart) className += ' group-start';
    if (parsedLyrics[index]?.isGroupEnd) className += ' group-end';

    return className;
  };

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
      <div className="lyrics-title">Lyrics</div>
      <div ref={lyricsContainerRef} className="lyrics-scroll-container">
        <div className="lyrics-content">
          {parsedLyrics.map((line, index) => (
            <div
              key={index}
              className={getLineClass(index)}
              data-index={index}
              data-current={index === currentZone}
            >
              {line.text}
              {index === currentZone && (
                <div className="current-line-progress" />
              )}
              {(Math.abs(index - currentZone) <= 2) && (
                <div className="possible-position-marker" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotifyLyrics;
