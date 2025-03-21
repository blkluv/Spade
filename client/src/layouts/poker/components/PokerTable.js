import React from "react";
import "./PokerTable.css";
import ChipStack from ".//ChipStack";
import CustomPokerTable from "..//CustomPokerTable";

const PokerTable = ({ pot, children, isFullscreen }) => {
  // Format pot value with commas for thousands
  const formattedPot = typeof pot === 'number' ? pot.toLocaleString() : pot;

  return (
    <div className={`poker-table ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Custom table background */}
      <CustomPokerTable />

      {/* Pot display */}
      <div className="pot-container">
        <div className="pot-label">POT</div>
        <div className="pot-amount">${formattedPot}</div>

        {/* Visual chip representation of the pot */}
        {pot && pot !== 'Loading...' && (
          <ChipStack amount={Number(pot)} isPot={true} />
        )}
      </div>

      {/* Community cards zone indicator */}
      <div className="community-cards-zone"></div>

      {/* Player positions and game elements */}
      {children}
    </div>
  );
};

export default PokerTable;