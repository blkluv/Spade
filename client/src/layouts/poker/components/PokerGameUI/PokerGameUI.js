import React, { useState, useEffect, useRef } from "react";
import Player from "../player/Player";
import PokerTable from "../table/PokerTable";
import { getPlayerPositions } from "../../utils/positionUtils";
import { loadCardImage } from "../../utils/cardUtils";
import LoadingSpinner from "../../utils/loadingSpinner/LoadingSpinner";
import "./PokerGameUI.css";

// Import for dashboard data
import { lineChartDataDashboard } from "../../../dashboard/data/lineChartData";

const serverAddress = "https://localhost:5000";

const PokerGameUI = ({ isFullscreen, isMobile }) => {
  const [players, setPlayers] = useState([]);
  const [playerPositions, setPlayerPositions] = useState([]);
  const [pot, setPot] = useState(null);
  const [communityCards, setCommunityCards] = useState([]);
  const [prevCommunityCards, setPrevCommunityCards] = useState([]);
  const [dealerIndex, setDealerIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [turningCards, setTurningCards] = useState([]);
  const containerRef = useRef(null);

  // Counter for chart data sync
  let syncCallCount = 0;

  // Function to sync players with lineChartDataDashboard and update balance
  const syncChartDataWithPlayers = (players) => {
    players.forEach((player) => {
      const playerData = lineChartDataDashboard.find(
        (data) => data.name === player.name
      );

      let serverPnlData = player.pnl || [];

      if (!playerData) {
        // Add player to chart data if they don't exist
        lineChartDataDashboard.push({
          name: player.name,
          data: serverPnlData,
        });
      } else {
        // Add new data points
        const existingTimestamps = new Set(playerData.data.map((d) => d[0]));
        serverPnlData.forEach(([timestamp, pnl]) => {
          if (!existingTimestamps.has(timestamp)) {
            playerData.data.push([timestamp, pnl]);
          }
        });
      }
    });
  };

  // Update player positions based on container size
  const updatePlayerPositions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();

      // Get positions based on current container dimensions
      const positions = getPlayerPositions(players.length, width, height);
      setPlayerPositions(positions);
    }
  };

  // Fetch player data
  const fetchPlayers = async () => {
    try {
      const res = await fetch(`${serverAddress}/players`);

      if (!res.ok) {
        throw new Error("Failed to fetch players data");
      }

      const data = await res.json();
      setPlayers(data);
      setConnectionError(false);

      // Sync with chart data periodically
      syncCallCount++;
      if (syncCallCount >= 10) {
        syncChartDataWithPlayers(data);
        syncCallCount = 0;
      }

      // Ensure loading state is cleared
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching players data:", error);
      setConnectionError(true);

      // Set some default data for development/preview
      if (isLoading) {
        // Only load demo data if we're still loading
        loadDemoData();
      }
    }
  };

  // Load demo data for development/preview purposes
  const loadDemoData = () => {
    // Example demo players
    const demoPlayers = [
      {
        name: "Player 1",
        probWin: 75,
        balance: 1245,
        bet: 50,
        folded: false,
        actionPending: true,
        cards: [
          { rank: "ace", suit: "hearts", faceUp: true },
          { rank: "king", suit: "hearts", faceUp: true },
        ],
      },
      {
        name: "Player 2",
        probWin: 15,
        balance: 580,
        bet: 50,
        folded: false,
        lastAction: "call",
        cards: [
          { rank: "2", suit: "clubs", faceUp: true },
          { rank: "7", suit: "diamonds", faceUp: true },
        ],
      },
      {
        name: "Player 3",
        probWin: 10,
        balance: -120,
        bet: 0,
        folded: true,
        cards: [
          { rank: "ace", suit: "hearts", faceUp: false },
          { rank: "king", suit: "hearts", faceUp: false },
        ],
      },
    ];

    // Demo community cards
    const demoCommunityCards = [
      { rank: "10", suit: "spades", faceUp: true },
      { rank: "9", suit: "clubs", faceUp: true },
      { rank: "8", suit: "hearts", faceUp: true },
    ];

    setPlayers(demoPlayers);
    setPot(350);
    setCommunityCards(demoCommunityCards);
    setDealerIndex(0);
    setIsLoading(false);
  };

  // Track community card changes to detect reveals
  useEffect(() => {
    // Check for newly revealed cards
    if (prevCommunityCards.length > 0) {
      const newTurningCards = [];

      communityCards.forEach((card, index) => {
        // Track newly revealed cards (cards that were previously face down or didn't exist)
        if (card.faceUp &&
            (index >= prevCommunityCards.length || !prevCommunityCards[index].faceUp)) {
          newTurningCards.push(index);
        }
      });

      if (newTurningCards.length > 0) {
        setTurningCards(newTurningCards);
      }
    }

    // Update the previous cards state
    setPrevCommunityCards([...communityCards]);
  }, [communityCards]);

  // Poll for game data
  const pollGameData = async () => {
    try {
      // Fetch pot
      const potRes = await fetch(`${serverAddress}/pot`);
      if (potRes.ok) {
        const potData = await potRes.json();
        setPot(potData.pot);
      }

      // Fetch community cards
      const cardsRes = await fetch(`${serverAddress}/community-cards`);
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCommunityCards(cardsData);
      }

      // Fetch dealer index
      const dealerRes = await fetch(`${serverAddress}/dealer`);
      if (dealerRes.ok) {
        const dealerData = await dealerRes.json();
        setDealerIndex(dealerData.dealerIndex);
      }

      setConnectionError(false);
    } catch (error) {
      console.error("Error polling game data:", error);
      setConnectionError(true);
    }
  };

  // Initialize game data
  useEffect(() => {
    fetchPlayers();
    pollGameData();

    const interval = setInterval(() => {
      fetchPlayers();
      pollGameData();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle window resize and fullscreen changes
  useEffect(() => {
    const handleResize = () => {
      updatePlayerPositions();
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial position calculation

    return () => window.removeEventListener("resize", handleResize);
  }, [players.length, isFullscreen]);

  // Update positions after players or container change
  useEffect(() => {
    updatePlayerPositions();
  }, [players, isFullscreen]);

  // Reset turning cards after animation completes
  useEffect(() => {
    if (turningCards.length > 0) {
      const timer = setTimeout(() => {
        setTurningCards([]);
      }, 600); // Animation duration

      return () => clearTimeout(timer);
    }
  }, [turningCards]);

  return (
    <div
      ref={containerRef}
      className={`poker-game-ui ${isFullscreen ? 'fullscreen' : ''} ${isMobile ? 'mobile' : ''}`}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <PokerTable
          pot={pot !== null ? pot : "Loading..."}
          isFullscreen={isFullscreen}
        >
          {/* Connection error notification */}
          {connectionError && (
            <div className="connection-error">
              <span>Connection to server failed. Using demo data.</span>
            </div>
          )}

          {/* Render player components */}
          {players.map((player, index) => {
            const position = playerPositions[index];
            const isDealer = index === dealerIndex;

            return (
              position && (
                <Player
                  key={index}
                  player={player}
                  position={position}
                  isDealer={isDealer}
                  isFullscreen={isFullscreen}
                />
              )
            );
          })}

          {/* Render community cards with turn animation */}
          <div className="community-cards">
            {communityCards.map((card, index) => (
              <div
                key={index}
                className="community-card-container"
                style={{
                  // Stagger the card appearance slightly
                  animationDelay: `${index * 0.15}s`
                }}
              >
                <img
                  src={loadCardImage(card.rank, card.suit, card.faceUp)}
                  alt={card.faceUp ? `${card.rank} of ${card.suit}` : "Card back"}
                  className={`community-card ${turningCards.includes(index) ? 'turning' : ''}`}
                />
              </div>
            ))}

            {/* Placeholder spaces for missing community cards */}
            {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="community-card-placeholder"
              ></div>
            ))}
          </div>
        </PokerTable>
      )}
    </div>
  );
};

export default PokerGameUI;