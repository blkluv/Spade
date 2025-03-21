import React, { useState, useEffect } from "react";
import VuiButton from "../../../../components/VuiButton";
import "./GameButtons.css";

const serverAddress = "https://localhost:5000";

const GameButtons = ({ isFullscreen }) => {
  const [showRaiseControls, setShowRaiseControls] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [minRaise, setMinRaise] = useState(10);
  const [maxRaise, setMaxRaise] = useState(1000);
  const [currentActionEnabled, setCurrentActionEnabled] = useState({
    fold: true,
    check: true,
    call: true,
    raise: true
  });

  // Simulate fetching game state to enable/disable buttons
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        // In a real implementation, this would fetch from your server
        // For now, we'll simulate it
        const mockResponse = {
          canFold: true,
          canCheck: Math.random() > 0.3, // Sometimes disable check
          canCall: Math.random() > 0.3,   // Sometimes disable call
          canRaise: true,
          minRaise: 10 + Math.floor(Math.random() * 20),
          maxRaise: 500 + Math.floor(Math.random() * 500)
        };

        setCurrentActionEnabled({
          fold: mockResponse.canFold,
          check: mockResponse.canCheck,
          call: mockResponse.canCall,
          raise: mockResponse.canRaise
        });

        setMinRaise(mockResponse.minRaise);
        setMaxRaise(mockResponse.maxRaise);

        // Ensure raiseAmount is within bounds
        if (raiseAmount < mockResponse.minRaise) {
          setRaiseAmount(mockResponse.minRaise);
        } else if (raiseAmount > mockResponse.maxRaise) {
          setRaiseAmount(mockResponse.maxRaise);
        }
      } catch (error) {
        console.error('Error fetching game state:', error);
      }
    };

    fetchGameState();
    // In a real implementation, you might want to poll this
    const interval = setInterval(fetchGameState, 3000);

    return () => clearInterval(interval);
  }, []);

  // API request to send player action
  const sendAction = async (action) => {
    try {
      const response = await fetch(`${serverAddress}/player-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Provide visual feedback for the action
      provideActionFeedback(action);

    } catch (error) {
      console.error('Error sending action:', error);
    }
  };

  // Visual feedback for actions
  const provideActionFeedback = (action) => {
    // Add active class to the button for visual feedback
    const button = document.querySelector(`.game-button.${action}`);
    if (button) {
      button.classList.add('button-activated');
      setTimeout(() => {
        button.classList.remove('button-activated');
      }, 500);
    }
  };

  // Button click handlers
  const handleRaiseClick = () => {
    setShowRaiseControls(!showRaiseControls);
  };

  const handleConfirmRaise = () => {
    sendAction(`raise ${raiseAmount}`);
    setShowRaiseControls(false);
  };

  const handleQuickRaise = (multiplier) => {
    const amount = Math.min(Math.floor(minRaise * multiplier), maxRaise);
    setRaiseAmount(amount);

    // If already showing controls, submit the raise immediately
    if (showRaiseControls) {
      sendAction(`raise ${amount}`);
      setShowRaiseControls(false);
    } else {
      // Otherwise just show the controls with this amount pre-set
      setShowRaiseControls(true);
    }
  };

  const handleSliderChange = (event) => {
    setRaiseAmount(parseInt(event.target.value, 10));
  };

  return (
    <div className={`game-controls ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Raise controls */}
      {showRaiseControls && (
        <div className="raise-controls">
          <div className="slider-container">
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={Math.max(5, Math.floor(minRaise / 4))}
              value={raiseAmount}
              onChange={handleSliderChange}
              className="raise-slider"
            />

            <div className="raise-quick-buttons">
              <button
                onClick={() => setRaiseAmount(minRaise)}
                className="quick-button min"
              >
                Min
              </button>
              <button
                onClick={() => setRaiseAmount(Math.floor(maxRaise / 2))}
                className="quick-button half"
              >
                Half
              </button>
              <button
                onClick={() => setRaiseAmount(maxRaise)}
                className="quick-button max"
              >
                Max
              </button>
            </div>

            <div className="raise-amount-display">
              <span className="currency">$</span>
              <span className="amount">{raiseAmount}</span>
            </div>
          </div>

          <div className="raise-actions">
            <button onClick={() => setShowRaiseControls(false)} className="cancel-button">
              Cancel
            </button>
            <button onClick={handleConfirmRaise} className="confirm-button">
              Raise
            </button>
          </div>
        </div>
      )}

      {/* Main action buttons */}
      <div className="action-buttons">
        <div className="left-actions">
          <VuiButton
            variant="contained"
            color="error"
            onClick={() => sendAction('fold')}
            disabled={!currentActionEnabled.fold}
            className="game-button fold"
          >
            Fold
          </VuiButton>
          <VuiButton
            variant="contained"
            color="secondary"
            onClick={() => sendAction('check')}
            disabled={!currentActionEnabled.check}
            className="game-button check"
          >
            Check
          </VuiButton>
        </div>

        <div className="right-actions">
          <VuiButton
            variant="contained"
            color="success"
            onClick={() => sendAction('call')}
            disabled={!currentActionEnabled.call}
            className="game-button call"
          >
            Call
          </VuiButton>

          <div className="raise-button-group">
            <VuiButton
              variant="contained"
              color="info"
              onClick={handleRaiseClick}
              disabled={!currentActionEnabled.raise}
              className="game-button raise"
            >
              Raise
            </VuiButton>

            {/* Quick raise buttons */}
            <div className="quick-raise-controls">
              <button
                onClick={() => handleQuickRaise(2)}
                className="quick-raise-button"
                disabled={!currentActionEnabled.raise}
              >
                2x
              </button>
              <button
                onClick={() => handleQuickRaise(3)}
                className="quick-raise-button"
                disabled={!currentActionEnabled.raise}
              >
                3x
              </button>
              <button
                onClick={() => handleQuickRaise(4)}
                className="quick-raise-button"
                disabled={!currentActionEnabled.raise}
              >
                4x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameButtons;