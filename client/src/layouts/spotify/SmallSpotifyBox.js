import React from "react";
import { Card } from "@mui/material";
import SpotifyComponent from "./components/SpotifyComponent";
import { useSpotify } from "../../context/SpotifyContext";
import { useNavigate } from "react-router-dom";
import VuiButton from "../../components/VuiButton";
import { FullscreenOutlined } from "@mui/icons-material";

function SmallSpotifyBox() {
  const navigate = useNavigate();
  const { token } = useSpotify();

  const handleOpenFullPlayer = () => {
    navigate("/spotify");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "45vh",
        margin: 0,
        padding: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <Card
        sx={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: "scale(0.5)",
            transformOrigin: "center",
          }}
        >
          <SpotifyComponent useLyrics={false} />
        </div>

        {token && (
          <VuiButton
            onClick={handleOpenFullPlayer}
            variant="text"
            color="info"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "transparent",
              boxShadow: "none",
              minWidth: "auto",
            }}
          >
            <FullscreenOutlined style={{ transform: "scale(1.5)", color: "white" }} />
          </VuiButton>
        )}
      </Card>
    </div>
  );
}

export default SmallSpotifyBox;