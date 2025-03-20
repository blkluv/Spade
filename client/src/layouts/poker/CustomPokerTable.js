import React from "react";
import "./CustomPokerTable.css";

/**
 * A custom poker table background created entirely with CSS/SVG
 * No external images needed
 */
const CustomPokerTable = () => {
  return (
    <div className="custom-table-container">
      {/* Outer table edge */}
      <div className="table-edge">
        {/* Inner padding/cushion */}
        <div className="table-padding">
          {/* Table felt surface */}
          <div className="table-felt">
            {/* Center emblem/logo */}
            <div className="table-emblem">
              <svg
                className="emblem-svg"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Main center spade */}
                <path
                  d="M100,30 C90,50 70,65 70,90 C70,105 80,115 92,115 C98,115 104,112 108,105 C108,125 100,135 100,140 L130,140 C130,135 122,125 122,105 C126,112 132,115 138,115 C150,115 160,105 160,90 C160,65 140,50 130,30 Z"
                  fill="rgba(0,0,0,0.2)"
                />

                {/* Pattern of small spades all around */}
                <g className="small-spades" opacity="0.1">
                  {Array.from({ length: 30 }).map((_, index) => {
                    const angle = (index * Math.PI * 2) / 30;
                    const radius = 50 + Math.random() * 35;
                    const x = 100 + radius * Math.cos(angle);
                    const y = 100 + radius * Math.sin(angle);
                    const size = 4 + Math.random() * 6;
                    const rotation = Math.random() * 360;

                    return (
                      <path
                        key={index}
                        d="M0,0 C-1,2 -3,3 -3,6 C-3,8 -2,9 0,9 C1,9 1.5,8.5 2,7 C2,10 1,11 1,12 L5,12 C5,11 4,10 4,7 C4.5,8.5 5,9 6,9 C8,9 9,8 9,6 C9,3 7,2 6,0 Z"
                        fill="rgba(0,0,0,0.6)"
                        transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${size / 10})`}
                      />
                    );
                  })}
                </g>

                {/* Decorative circles */}
                <circle
                  cx="100"
                  cy="100"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                />

                <circle
                  cx="100"
                  cy="100"
                  r="65"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />

                {/* "SPADE" text emblem */}
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  fontSize="14"
                  fill="rgba(255,255,255,0.15)"
                >
                  SPADE
                </text>
              </svg>
            </div>

            {/* Felt texture overlay */}
            <div className="felt-texture"></div>

            {/* Light reflection effects */}
            <div className="light-reflection top-left"></div>
            <div className="light-reflection bottom-right"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPokerTable;