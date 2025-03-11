import React, { useRef, useState } from "react";
import CamDiv from "./CamDiv";

function HomePage({ socket, darkMode }) {
  const webcamRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState("");
  const [cardsScanned, setCardsScanned] = useState(false);
  const [cardsConfirmed, setCardsConfirmed] = useState(false); // New state for confirmation
  const [cards, setCards] = useState([]);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendAction = async (action) => {
    // Existing function
    setIsLoading(true);
    setActionStatus(`Processing: ${action}...`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setActionStatus(`Action "${action}" completed.`);
      setTimeout(() => setActionStatus(""), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Button handlers (existing)
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
        setCardsConfirmed(false); // Reset confirmation when new cards are scanned
        setCards(response.predictions);
        setCardsRevealed(false);
        setActionStatus("Please verify your cards are correct.");
        setTimeout(() => setActionStatus(""), 3000);
      }
    } catch (error) {
      console.error("Capture error:", error);
      setActionStatus("Failed to scan cards. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // New function to confirm cards
  const handleConfirmCards = () => {
    setCardsConfirmed(true);
    setActionStatus("Cards confirmed! Click to reveal them.");
    setTimeout(() => setActionStatus(""), 2000);
  };

  // New function to retry scan
  const handleRetryScan = () => {
    setCardsScanned(false);
    setCardsConfirmed(false);
    setCards([]);
    setCameraEnabled(true);
    setActionStatus("Restarting card scan.");
    setTimeout(() => setActionStatus(""), 2000);
  };

  // Reveal cards function (modified)
  const revealCards = () => {
    if (cardsConfirmed && !cardsRevealed) {
      setCardsRevealed(true);
      setActionStatus("Cards revealed!");
      setTimeout(() => setActionStatus(""), 1500);
    }
  };

  // Reset scan completely
  const resetScan = () => {
    setCardsScanned(false);
    setCardsConfirmed(false);
    setCards([]);
    setCardsRevealed(false);
    setCameraEnabled(false);
  };

  const renderCards = () => {
    if (!cards.length) return null;

    return (
      <div
        className={`poker-cards ${cardsConfirmed ? "clickable" : ""}`}
        onClick={cardsConfirmed ? revealCards : undefined}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            className={`poker-card ${
              !cardsRevealed && cardsConfirmed ? "covered" : ""
            }`}
          >
            {!cardsRevealed && cardsConfirmed ? (
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

            {/* Confirmation controls */}
            {!cardsConfirmed ? (
              <div className="card-verification">
                <p className="verification-text">Are these cards correct?</p>
                <div className="verification-buttons">
                  <button
                    className="confirm-button"
                    onClick={handleConfirmCards}
                  >
                    Confirm Cards
                  </button>
                  <button className="retry-button" onClick={handleRetryScan}>
                    Retry Scan
                  </button>
                </div>
              </div>
            ) : (
              <button className="reset-button" onClick={resetScan}>
                Scan New Cards
              </button>
            )}
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
