import React, { useRef, useState } from "react";
import CamDiv from "./CamDiv";

function HomePage({ socket, darkMode }) {
  // States for camera and scanning
  const webcamRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

  // States for card scanning process
  const [cardsScanned, setCardsScanned] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [cardsConfirmed, setCardsConfirmed] = useState(false);
  const [cards, setCards] = useState([]);

  // States for poker actions
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState("");

  // Function to send poker actions
  const sendAction = async (action) => {
    setIsLoading(true);
    setActionStatus(`Processing: ${action}...`);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setActionStatus(`Action "${action}" completed.`);

      // Clear status after 2 seconds
      setTimeout(() => setActionStatus(""), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Button handlers for poker actions
  const handleRaiseClick = () => {
    setShowRaiseInput((prev) => !prev);
  };

  const handleConfirmRaise = () => {
    if (raiseAmount) {
      sendAction(`raise ${raiseAmount}`);
      setShowRaiseInput(false);
      setRaiseAmount("");
    } else {
      setActionStatus("Please enter a valid raise amount.");
      setTimeout(() => setActionStatus(""), 2000);
    }
  };

  // Card scanning and verification functions
  const handleCapture = async (frame) => {
    if (!frame || !frame.videoWidth || !frame.videoHeight) {
      console.error("Invalid video frame");
      return;
    }

    setIsLoading(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = frame.videoWidth;
      canvas.height = frame.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Canvas is empty")),
          "image/jpeg",
          0.8
        );
      });

      const arrayBuffer = await blob.arrayBuffer();

      const response = await new Promise((resolve) => {
        socket.emit(
          "frame",
          {
            n: 2,
            image: arrayBuffer,
          },
          resolve
        );
      });

      if (response?.found) {
        setCardsScanned(true);
        setCardsRevealed(false);
        setCardsConfirmed(false);
        setCards(response.predictions);
        setActionStatus("Cards detected! Click to reveal.");
        setTimeout(() => setActionStatus(""), 3000);
      }
    } catch (error) {
      console.error("Capture error:", error);
      setActionStatus("Failed to scan cards. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const revealCards = () => {
    if (cardsScanned && !cardsRevealed) {
      setCardsRevealed(true);
      setActionStatus("Are these your correct cards?");
    }
  };

  const handleConfirmCards = () => {
    setCardsConfirmed(true);
    setActionStatus("Cards confirmed!");
    setTimeout(() => setActionStatus(""), 2000);
  };

  const handleRetryScan = () => {
    setCardsScanned(false);
    setCardsRevealed(false);
    setCardsConfirmed(false);
    setCards([]);
    setCameraEnabled(true);
    setActionStatus("Restarting card scan.");
    setTimeout(() => setActionStatus(""), 2000);
  };

  const resetScan = () => {
    setCardsScanned(false);
    setCardsRevealed(false);
    setCardsConfirmed(false);
    setCards([]);
    setCameraEnabled(false);
  };

  const renderCards = () => {
    if (!cards.length) return null;

    return (
      <div
        className={`poker-cards ${!cardsRevealed ? "clickable" : ""}`}
        onClick={!cardsRevealed ? revealCards : undefined}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            className={`poker-card ${!cardsRevealed ? "covered" : ""}`}
          >
            {!cardsRevealed ? (
              <div className="card-back">
                <span className="reveal-hint">Click to reveal</span>
              </div>
            ) : (
              card
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="main-content">
      <div className="card-scanner">
        {cardsScanned ? (
          <div className="scanned-result">
            <h2>Your Cards</h2>
            {renderCards()}

            {/* Verification controls - only show after revealing */}
            {cardsRevealed && !cardsConfirmed ? (
              <div className="card-verification">
                <p className="verification-text">Are these cards correct?</p>
                <div className="verification-buttons">
                  <button
                    className="confirm-button"
                    onClick={handleConfirmCards}
                  >
                    Yes, Correct
                  </button>
                  <button className="retry-button" onClick={handleRetryScan}>
                    No, Retry Scan
                  </button>
                </div>
              </div>
            ) : cardsConfirmed ? (
              <button className="reset-button" onClick={resetScan}>
                Scan New Cards
              </button>
            ) : null}
          </div>
        ) : (
          <div className="scanner-container">
            <div className="scanner-overlay">
              <div className={`scan-area ${cameraEnabled ? "active" : ""}`}>
                <CamDiv
                  cameraEnabled={cameraEnabled}
                  webcamRef={webcamRef}
                  onCapture={handleCapture}
                />
                {cameraEnabled && <div className="scanning-animation"></div>}
              </div>
              <button
                className={`scan-button ${cameraEnabled ? "active" : ""}`}
                onClick={() => setCameraEnabled(!cameraEnabled)}
                disabled={isLoading}
              >
                {cameraEnabled ? "Stop Scanning" : "Scan Cards"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="action-panel">
        <h2>Player Actions</h2>
        <div className="action-buttons">
          <button
            className="action-button raise"
            onClick={handleRaiseClick}
            disabled={isLoading}
          >
            <span className="button-icon">♦</span>
            <span>Raise</span>
          </button>
          <button
            className="action-button call"
            onClick={() => sendAction("call")}
            disabled={isLoading}
          >
            <span className="button-icon">♣</span>
            <span>Call</span>
          </button>
          <button
            className="action-button check"
            onClick={() => sendAction("check")}
            disabled={isLoading}
          >
            <span className="button-icon">♥</span>
            <span>Check</span>
          </button>
          <button
            className="action-button fold"
            onClick={() => sendAction("fold")}
            disabled={isLoading}
          >
            <span className="button-icon">♠</span>
            <span>Fold</span>
          </button>
        </div>

        {showRaiseInput && (
          <div className="raise-input-container">
            <input
              type="number"
              placeholder="Enter raise amount"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
            />
            <button onClick={handleConfirmRaise} disabled={isLoading}>
              Confirm
            </button>
          </div>
        )}

        {actionStatus && (
          <div className="action-status">
            {isLoading && <div className="loading-spinner"></div>}
            <p>{actionStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
