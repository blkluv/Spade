// Modified HomePage.js to pass table status updates to parent component

import React, { useRef, useState, useEffect } from "react";
import CamDiv from "./CamDiv";
import LobbySystem from "./LobbySystem";
import ApiService from "./ApiService";
import ConfirmationModal from "./ConfirmationModal";
import { FaTrash, FaSignOutAlt, FaShieldAlt } from "react-icons/fa";
import apiService from "./ApiService";

/**
 * HomePage component displays either the lobby or the poker table UI
 * @param {Object} props Component properties
 * @param {Object} props.socket Socket.io connection
 * @param {boolean} props.socketConnected Socket connection status
 * @param {boolean} props.darkMode Dark mode state
 * @param {Object} props.user Current user data
 * @param {Function} props.onTableStatusChange Callback when table status changes
 * @returns {JSX.Element} HomePage component
 */
function HomePage({ socket, socketConnected, darkMode, user, onTableStatusChange }) {
  // State for camera and scanning
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

  // State for current table
  const [currentTable, setCurrentTable] = useState(null);
  const [atTable, setAtTable] = useState(false);
  const [checkingTableStatus, setCheckingTableStatus] = useState(true);
  const [currChips, setCurrChips] = useState([0]);

  // Error state
  const [error, setError] = useState("");

  // Delete table confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Check if the user is at a table when the component mounts or user changes
  useEffect(() => {
    checkTableStatus();
    updateChips();
  }, [user]);

  // Update chips
  const updateChips = async () => {
    setCurrChips(await ApiService.getCurrChips())
  }

  // Function to check table status using the dedicated endpoint
  const checkTableStatus = async () => {
    if (!user) {
      setAtTable(false);
      setCurrentTable(null);
      setCheckingTableStatus(false);
      return;
    }

    setCheckingTableStatus(true);

    try {
      // Call the dedicated endpoint to get table status
      const tableStatus = await ApiService.getCurrentTable();

      if (tableStatus.isAtTable && tableStatus.tableId) {
        setAtTable(true);
        setCurrentTable(tableStatus.table || await ApiService.getTableById(tableStatus.tableId));
      } else {
        setAtTable(false);
        setCurrentTable(null);
      }

      // Notify parent component about table status change
      if (onTableStatusChange) {
        onTableStatusChange();
      }
    } catch (error) {
      console.error("Error checking table status:", error);
      setAtTable(false);
      setCurrentTable(null);
    } finally {
      setCheckingTableStatus(false);
    }
  };

  // Function to join a table
  const handleJoinTable = async (tableId, buyIn) => {
    if (!user) {
      setError("You must be logged in to join a table");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // If buy-in is provided, it's a new join
      if (buyIn) {
        await ApiService.joinTable(tableId, buyIn);
      }

      // Check table status again to update the UI
      await checkTableStatus();

      // Reset card scanning state
      setCardsScanned(false);
      setCardsRevealed(false);
      setCardsConfirmed(false);
      setCards([]);
    } catch (error) {
      setError("Failed to join table: " + (error.message || "Unknown error"));
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to leave a table
  const handleLeaveTable = async () => {
    if (!currentTable) return;

    setIsLoading(true);
    setError("");

    try {
      await ApiService.leaveTable(currentTable.id);

      // Check table status again to update the UI
      await checkTableStatus();

      // Reset card scanning state
      setCardsScanned(false);
      setCardsRevealed(false);
      setCardsConfirmed(false);
      setCards([]);
      setCameraEnabled(false);
    } catch (error) {
      setError("Failed to leave table: " + (error.message || "Unknown error"));
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a table (owner only)
  const handleDeleteTable = async () => {
    if (!currentTable) return;

    setIsLoading(true);
    setError("");
    setShowDeleteConfirmation(false);

    try {
      await ApiService.deleteTable(currentTable.id);

      // Show success message
      setActionStatus("Table successfully deleted");

      // Check table status to update UI (user will no longer be at a table)
      await checkTableStatus();

      // Reset card scanning state
      setCardsScanned(false);
      setCardsRevealed(false);
      setCardsConfirmed(false);
      setCards([]);
      setCameraEnabled(false);

      // Clear success message after delay
      setTimeout(() => setActionStatus(""), 3000);
    } catch (error) {
      setError("Failed to delete table: " + (error.message || "Unknown error"));
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send poker actions
  const sendAction = async (action) => {
    setIsLoading(true);
    setActionStatus(`Processing: ${action}...`);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
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
    // Toggle between revealed and hidden states when cards are clicked
    if (cardsScanned) {
      setCardsRevealed((prevState) => !prevState);

      if (!cardsRevealed) {
        setActionStatus("Cards revealed!");
      } else {
        setActionStatus("Cards hidden!");
      }
      setTimeout(() => setActionStatus(""), 1500);
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

    const hintText = !cardsRevealed ? "Click to reveal" : "Click to hide";

    // Function to parse card string and extract rank and suit
    const parseCard = (cardStr) => {
      // The last character is the suit, everything before is the rank
      const rank = cardStr.slice(0, -1);
      const suitLetter = cardStr.slice(-1).toUpperCase();

      // Map suit letters to symbols
      let suitSymbol;
      switch (suitLetter) {
        case "S":
          suitSymbol = "♠";
          break;
        case "H":
          suitSymbol = "♥";
          break;
        case "D":
          suitSymbol = "♦";
          break;
        case "C":
          suitSymbol = "♣";
          break;
        default:
          suitSymbol = suitLetter;
      }

      return { rank, suit: suitSymbol };
    };

    return (
        <div
            className={`poker-cards clickable`}
            onClick={revealCards}
            data-action-hint={hintText}
        >
          {cards.map((card, index) => {
            const { rank, suit } = parseCard(card);

            return (
                <div
                    key={index}
                    className={`poker-card ${!cardsRevealed ? "covered" : ""} ${
                        suit === "♥" || suit === "♦" ? "red-card" : "black-card"
                    }`}
                >
                  {!cardsRevealed ? (
                      <div className="card-back">
                        <span className="reveal-hint">Click to reveal</span>
                      </div>
                  ) : (
                      <div className="card-content">
                        <div className="card-rank">{rank}</div>
                        <div className="card-suit">{suit}</div>
                        <span className="hide-hint">Click to hide</span>
                      </div>
                  )}
                </div>
            );
          })}
        </div>
    );
  };

  // Show loading state while checking table status
  if (checkingTableStatus) {
    return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading table status...</p>
        </div>
    );
  }

  // Conditionally render either the lobby system or the poker table
  return (
      <div className={`main-content ${!atTable ? "lobby-layout" : ""}`}>
        {error && <div className="error-message global-error">{error}</div>}

        {!atTable ? (
            // Lobby System when not at a table
            <LobbySystem
                user={user}
                onJoinTable={handleJoinTable}
                currentTable={currentTable}
                darkMode={darkMode}
            />
        ) : (
            // Poker Table UI when at a table
            <>
              <div className="card-scanner">
                <div className="table-header">
                  <h2>Table: {currentTable?.name}</h2>
                  <div className="table-info">
                    {currentTable?.ownerId === user?.id && (
                        <>
                    <span className="owner-badge" title="You are the owner of this table">
                      <FaShieldAlt className="owner-icon" />
                    </span>
                          <button
                              className="delete-table-button"
                              onClick={() => setShowDeleteConfirmation(true)}
                              disabled={isLoading}
                              title="Delete Table"
                          >
                            <FaTrash />
                          </button>
                        </>
                    )}
                    <button
                        className="leave-table-button"
                        onClick={handleLeaveTable}
                        disabled={isLoading}
                        title="Leave Table"
                    >
                      <FaSignOutAlt />
                    </button>
                  </div>
                </div>

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
                            <p className="toggle-hint">
                              You can click the cards to hide them again
                            </p>
                          </div>
                      ) : cardsConfirmed ? (
                          <>
                            <p className="toggle-hint">Click cards to show or hide them</p>
                            <button className="reset-button" onClick={resetScan}>
                              Scan New Cards
                            </button>
                          </>
                      ) : null}
                    </div>
                ) : (
                    <div className="scanner-container">
                      {socketConnected ? (
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
                              </div>) :
                          <div className="connection-error">
                            Server connection failed. <br /> Please restart server or debug.
                          </div>}
                    </div>
                )}
              </div>

              <div className="action-panel">
                <h2>Player Actions</h2>
                <div className="player-info">
                  <div className="chips-display">
                    <span className="chips-label">Table Chips:</span>
                    <span className="chips-value">
                  {currChips}
                </span>
                  </div>
                </div>

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
                      onClick={() => {
                        setShowRaiseInput(false);
                        sendAction("call")}}
                      disabled={isLoading}
                  >
                    <span className="button-icon">♣</span>
                    <span>Call</span>
                  </button>
                  <button
                      className="action-button check"
                      onClick={() => {
                        setShowRaiseInput(false);
                        sendAction("check")}}
                      disabled={isLoading}
                  >
                    <span className="button-icon">♥</span>
                    <span>Check</span>
                  </button>
                  <button
                      className="action-button fold"
                      onClick={() => {
                        setShowRaiseInput(false);
                        sendAction("fold");}}
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

              {/* Confirmation Modal for Table Deletion */}
              <ConfirmationModal
                  show={showDeleteConfirmation}
                  title="Delete Table"
                  message="Are you sure you want to delete this table? This action cannot be undone, and all players will be removed from the table."
                  confirmText="Delete Table"
                  cancelText="Cancel"
                  confirmButtonClass="danger"
                  onConfirm={handleDeleteTable}
                  onCancel={() => setShowDeleteConfirmation(false)}
              />
            </>
        )}
      </div>
  );
}

export default HomePage;