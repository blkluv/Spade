import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import "./App.css";

function App() {
  const webcamRef = useRef(null); // Reference to the webcam component
  const [cameraEnabled, setCameraEnabled] = useState(false); // State to toggle camera
  const [showRaiseInput, setShowRaiseInput] = useState(false); // Raise Input State
  const [raiseAmount, setRaiseAmount] = useState(""); // Raise Amount

  // API-Anfrage, um Spieleraktionen zu senden
  const sendAction = async (action) => {
    console.log(`Action sent: ${action}`);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
    console.log(`Action "${action}" processed.`);
  };

  // Button-Click-Handler
  const handleRaiseClick = () => {
    setShowRaiseInput((prev) => !prev);
  };

  const handleConfirmRaise = () => {
    if (raiseAmount) {
      sendAction(`raise ${raiseAmount}`);
      setShowRaiseInput(false); // Input verstecken
      setRaiseAmount(""); // Reset input field
    } else {
      alert("Please enter a valid raise amount.");
    }
  };

  const handleCheckClick = () => {
    sendAction("check");
  };

  const handleFoldClick = () => {
    sendAction("fold");
  };

  const handleCallClick = () => {
    sendAction("call");
  };

  // Input-Änderungen verarbeiten
  const handleInputChange = (event) => {
    setRaiseAmount(event.target.value);
  };

  return (
    <div className="app">
      <h1>♠️ SPADE ♠️</h1>
      <div className="camera-container">
        {cameraEnabled ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={300}
            height={300}
            videoConstraints={{
              width: 300,
              height: 300,
              facingMode: "user", // Use the front-facing camera
            }}
          />
        ) : (
          <div className="camera-placeholder">Camera is off</div>
        )}
      </div>

      {/* Raise Input */}
      {showRaiseInput && (
        <div className="raise-input">
          <input
            type="number"
            placeholder="Enter raise amount"
            value={raiseAmount}
            onChange={handleInputChange}
          />
          <button onClick={handleConfirmRaise}>OK</button>
        </div>
      )}

      {/* Buttons */}
      <div className="buttons">
        <button onClick={handleRaiseClick}>Raise</button>
        <button onClick={handleCallClick}>Call</button>
        <button onClick={handleCheckClick}>Check</button>
        <button onClick={handleFoldClick}>Fold</button>
      </div>

      {/* Toggle Camera Button */}
      <button
        className="toggle-camera"
        onClick={() => setCameraEnabled(!cameraEnabled)}
      >
        {cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
      </button>
    </div>
  );
}

export default App;