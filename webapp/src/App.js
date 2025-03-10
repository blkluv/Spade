import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import CamDiv from "./CamDiv";
import "./App.css";
import { io } from "socket.io-client";

const socket = io('https://127.0.0.1:5000', {  // Fixed URL
  transports: ['websocket'],
  secure: true,
  rejectUnauthorized: false // Needed for self-signed certs in dev
});

function App() {
  const webcamRef = useRef(null); // Reference to the webcam component
  const [cameraEnabled, setCameraEnabled] = useState(false); // State to toggle camera
  const [showRaiseInput, setShowRaiseInput] = useState(false); // Raise Input State
  const [raiseAmount, setRaiseAmount] = useState(""); // Raise Amount
  const [cardsScanned, setCardsScanned] = useState(false);
  const [cards, setCards] = useState([])

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


  const handleCapture = async (frame) => {
    if (!frame || !frame.videoWidth || !frame.videoHeight) {
      console.error('Invalid video frame');
      return;
    }

    console.log("Valid video frame detected!")

    try {
      const canvas = document.createElement('canvas');
      canvas.width = frame.videoWidth;
      canvas.height = frame.videoHeight;
      const ctx = canvas.getContext('2d');

      // Draw the video frame onto the canvas
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

      // Convert canvas to Blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas is empty or invalid'));
            }
          },
          'image/jpeg',
          0.8 // JPEG quality (0.8 = 80%)
        );
      });

      // Convert Blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Send via Socket.IO
      const response = await new Promise((resolve) => {
        socket.emit('frame', {
          n: 2,
          image: arrayBuffer
        }, resolve);
        console.log("Waiting for response.")
      });

      if (response?.found) {
        setCardsScanned(true);
        setCards(response.predictions);
      }
    } catch (error) {
      console.error('Capture error:', error);
    }
  };


  return (
    <div className="app">
      <h1>♠️ SPADE ♠️</h1>
      <div>
        {cardsScanned ? (
            <div className="cards">Cards: {cards}</div>
        ) : (
            <CamDiv
                cameraEnabled={cameraEnabled}
                webcamRef={webcamRef}
                onCapture={handleCapture}
            />
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
        {cameraEnabled ? "Stop Scanning" : "Scan Cards"}
      </button>
    </div>
  );
}

export default App;