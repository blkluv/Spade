import React, { useEffect, useState, useRef, memo } from 'react';
import './SpotifyLyrics.css';

// Use memo to prevent unnecessary re-renders
const SpotifyLyrics = memo(({
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
  const lastScrollTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Add buffers (3% of total duration for intro, 1% for outro)
  const INTRO_BUFFER = trackDuration * 0.03;
  const OUTRO_BUFFER = trackDuration * 0.01;
  const EFFECTIVE_DURATION = Math.max(1, trackDuration - (INTRO_BUFFER + OUTRO_BUFFER));

  // Parse lyrics when they change
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

  // Calculate current zone based on track progress
  useEffect(() => {
    if (!parsedLyrics.length || !trackDuration || trackDuration <= 0) return;

    // Use requestAnimationFrame for smoother updates
    const updateCurrentZone = () => {
      // Adjust progress for buffers
      const adjustedProgress = Math.max(0, trackProgress - INTRO_BUFFER);
      const progressPercentage = Math.min(1, Math.max(0, adjustedProgress / EFFECTIVE_DURATION));

      // Calculate weighted distribution based on line length and metadata
      const lineWeights = parsedLyrics.map(line => {
        if (line.isMetadata) return 0.3;
        const lengthWeight = Math.min(2, Math.max(0.5, line.text.length / 25));
        return lengthWeight;
      });

      const totalWeight = lineWeights.reduce((a, b) => a + b, 0);
      let accumulatedWeight = 0;
      let currentIndex = 0;

      // Find the line that corresponds to the current progress
      while (
        currentIndex < parsedLyrics.length - 1 &&
        accumulatedWeight / totalWeight < progressPercentage
      ) {
        accumulatedWeight += lineWeights[currentIndex];
        currentIndex++;
      }

      setCurrentZone(Math.max(0, Math.min(currentIndex, parsedLyrics.length - 1)));
    };

    // Use requestAnimationFrame for smoother updates
    if (isPlaying) {
      const frameLoop = () => {
        updateCurrentZone();
        animationFrameRef.current = requestAnimationFrame(frameLoop);
      };

      animationFrameRef.current = requestAnimationFrame(frameLoop);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // Still update once when paused
      updateCurrentZone();
    }
  }, [trackProgress, trackDuration, parsedLyrics, isPlaying]);

  // Scroll to current line with debounce
  useEffect(() => {
    if (!lyricsContainerRef.current || currentZone === -1) return;

    const container = lyricsContainerRef.current;
    const targetLine = container.querySelector(`[data-index="${currentZone}"]`);

    if (targetLine) {
      // Debounce scrolling to avoid too frequent updates
      const now = Date.now();
      if (now - lastScrollTimeRef.current > 100) { // Only scroll every 100ms at most
        lastScrollTimeRef.current = now;

        const containerHeight = container.clientHeight;
        const targetPos = targetLine.offsetTop - (containerHeight / 2);
        const scrollVelocity = Math.min(1, Math.max(0.2, Math.abs(currentZone - prevZone.current) / 5));

        container.scrollTo({
          top: targetPos,
          behavior: isPlaying ? 'smooth' : 'auto',
        });

        prevZone.current = currentZone;
      }
    }
  }, [currentZone, isPlaying]);

  // Clear animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
    if (index < currentZone) className += ' passed';
    if (index > currentZone) {
      if (index === currentZone + 1) className += ' upcoming-1';
      else if (index === currentZone + 2) className += ' upcoming-2';
      else if (index === currentZone + 3) className += ' upcoming-3';
    }
    if (parsedLyrics[index]?.isMetadata) className += ' metadata';

    return className;
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

  // No lyrics available
  if (!lyrics || lyrics.trim() === '') {
    return (
      <div className="spotify-lyrics-container">
        <div className="no-lyrics">
          <p>No lyrics available for this track</p>
        </div>
      </div>
    );
  }

  // Calculate progress for the current line
  const calculateLineProgress = () => {
    if (currentZone < 0 || currentZone >= parsedLyrics.length - 1) return 0;

    // Find the adjusted progress percentage within the current line
    const adjustedProgress = Math.max(0, trackProgress - INTRO_BUFFER);
    const progressPercentage = Math.min(1, Math.max(0, adjustedProgress / EFFECTIVE_DURATION));

    // Calculate the percentage range of the current line
    const lineWeights = parsedLyrics.map(line => {
      if (line.isMetadata) return 0.3;
      const lengthWeight = Math.min(2, Math.max(0.5, line.text.length / 25));
      return lengthWeight;
    });

    const totalWeight = lineWeights.reduce((a, b) => a + b, 0);

    // Calculate start and end percentages for the current line
    let startPercent = 0;
    for (let i = 0; i < currentZone; i++) {
      startPercent += lineWeights[i] / totalWeight;
    }

    const endPercent = startPercent + lineWeights[currentZone] / totalWeight;

    // Calculate how far we are through the current line (0-100%)
    const lineProgressPercent = Math.max(0, Math.min(100,
      ((progressPercentage - startPercent) / (endPercent - startPercent)) * 100
    ));

    return lineProgressPercent;
  };

  const lineProgressPercent = calculateLineProgress();

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
                <div
                  className="current-line-progress"
                  style={{ width: `${lineProgressPercent}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default SpotifyLyrics;