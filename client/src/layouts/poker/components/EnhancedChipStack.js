import React from "react";
import "./EnhancedChipStack.css";

// Define chip denominations and their visual properties
const CHIP_TYPES = [
  { value: 500, color: "#151F30", textColor: "#FFFFFF", border: "#5C92FF", label: "500" },
  { value: 100, color: "#212121", textColor: "#FFFFFF", border: "#888888", label: "100" },
  { value: 50, color: "#006400", textColor: "#FFFFFF", border: "#00FF00", label: "50" },
  { value: 25, color: "#0D47A1", textColor: "#FFFFFF", border: "#64B5F6", label: "25" },
  { value: 10, color: "#880000", textColor: "#FFFFFF", border: "#FF5252", label: "10" },
  { value: 5, color: "#FFFFFF", textColor: "#212121", border: "#9E9E9E", label: "5" },
  { value: 1, color: "#E0E0E0", textColor: "#212121", border: "#9E9E9E", label: "1" }
];

const EnhancedChipStack = ({ amount, maxVisibleChips = 5, compact = false }) => {
  // Skip rendering if amount is invalid
  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // Calculate chip breakdown
  const getChipBreakdown = (amount) => {
    let remaining = amount;
    const result = [];

    for (const chipType of CHIP_TYPES) {
      if (remaining <= 0) break;

      const count = Math.floor(remaining / chipType.value);
      if (count > 0) {
        result.push({
          ...chipType,
          count: count
        });
        remaining -= count * chipType.value;
      }
    }

    return result;
  };

  const chips = getChipBreakdown(amount);

  // Apply visual limits
  const applyVisualLimits = (chips, maxVisible) => {
    let totalChips = 0;
    const visibleChips = [];

    // First add at least one of each denomination if possible
    for (const chip of chips) {
      if (totalChips >= maxVisible) break;

      visibleChips.push({
        ...chip,
        count: 1
      });
      totalChips += 1;
    }

    // Then add more chips of highest denominations until limit
    let i = 0;
    while (totalChips < maxVisible && i < visibleChips.length) {
      const availableInOriginal = chips[i].count - visibleChips[i].count;

      if (availableInOriginal > 0) {
        const addCount = Math.min(availableInOriginal, maxVisible - totalChips);
        visibleChips[i].count += addCount;
        totalChips += addCount;
      }

      i++;
    }

    return visibleChips;
  };

  const visibleChips = applyVisualLimits(chips, maxVisibleChips);

  // Special case for compact mode (used in player bet visualization)
  if (compact) {
    return (
      <div className="enhanced-chip-stack compact">
        {visibleChips.map((chipType, typeIndex) => (
          <React.Fragment key={chipType.value}>
            {Array.from({ length: Math.min(chipType.count, 3) }).map((_, chipIndex) => (
              <div
                key={chipIndex}
                className="stack-chip"
                style={{
                  backgroundColor: chipType.color,
                  borderColor: chipType.border,
                  transform: `translateY(${-chipIndex * 4}px)`,
                  zIndex: 100 - (typeIndex * 10) - chipIndex,
                }}
              >
                <span style={{ color: chipType.textColor }}>{chipType.label}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Standard chip stack display
  return (
    <div className="enhanced-chip-stack">
      {visibleChips.map((chipType, typeIndex) => (
        <div key={chipType.value} className="chip-stack">
          {Array.from({ length: chipType.count }).map((_, chipIndex) => (
            <div
              key={chipIndex}
              className="chip"
              style={{
                backgroundColor: chipType.color,
                borderColor: chipType.border,
                transform: `translateY(${-chipIndex * 5}px)`,
                zIndex: 100 - chipIndex,
              }}
            >
              <div className="chip-inner">
                <span style={{ color: chipType.textColor }}>{chipType.label}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="total-amount">${amount}</div>
    </div>
  );
};

export default EnhancedChipStack;