import React from "react";
import "./ChipStack.css";

/**
 * Simple chip stack visualization component
 * Used for pot and player bets
 */
const ChipStack = ({ amount, compact = false }) => {
  // Skip rendering if amount is invalid
  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // Determine number of chips to show based on amount
  // Limit chips for visual clarity
  const getChipCount = () => {
    if (amount <= 10) return 1;
    if (amount <= 50) return 2;
    if (amount <= 200) return 3;
    if (amount <= 500) return 4;
    return 5;
  };

  // Get chip color based on amount
  const getChipColor = () => {
    if (amount >= 500) return { bg: "#151F30", border: "#5C92FF" }; // Blue
    if (amount >= 100) return { bg: "#212121", border: "#888888" }; // Black
    if (amount >= 50) return { bg: "#1B5E20", border: "#66BB6A" };  // Green
    if (amount >= 25) return { bg: "#0D47A1", border: "#64B5F6" };  // Blue
    if (amount >= 10) return { bg: "#B71C1C", border: "#EF5350" };  // Red
    return { bg: "#E0E0E0", border: "#9E9E9E" };                    // White
  };

  const chipCount = getChipCount();
  const chipColor = getChipColor();

  return (
    <div className={`chip-stack-container ${compact ? 'compact' : ''}`}>
      <div className="chip-stack">
        {Array.from({ length: chipCount }).map((_, index) => (
          <div
            key={index}
            className="chip"
            style={{
              backgroundColor: chipColor.bg,
              borderColor: chipColor.border,
              transform: `translateY(${-index * (compact ? 3 : 5)}px)`,
              width: compact ? '30px' : '40px',
              height: compact ? '12px' : '15px'
            }}
          />
        ))}
      </div>
      <div className="chip-amount">${amount}</div>
    </div>
  );
};

export default ChipStack;