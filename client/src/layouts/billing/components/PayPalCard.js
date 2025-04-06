import React, { useState } from "react";
import { Card, IconButton, Box } from "@mui/material";
import PropTypes from "prop-types";
import QRCodeImage from "assets/images/PayPal-QR-Code.png";
import { FaCcPaypal } from "react-icons/fa6";
import { FiShare } from "react-icons/fi";
import { BiRefresh } from "react-icons/bi";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

function ModernPayPalCard({ userName, amount }) {
  const [copied, setCopied] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  // Simulate "Copy to clipboard" function
  const handleCopyClick = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate QR code refresh
  const handleRefresh = () => {
    setShowRefresh(true);
    setTimeout(() => setShowRefresh(false), 1000);
  };

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, #0070ba 0%, #1546a0 35%, #003087 100%)",
        borderRadius: "24px",
        boxShadow: "0 20px 40px rgba(0, 53, 128, 0.18), 0 1px 3px rgba(0, 0, 0, 0.1)",
        padding: "30px",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 24px 48px rgba(0, 53, 128, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* Content container with proper z-index */}
      <VuiBox position="relative" zIndex="1">
        {/* Header with logo and info */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiBox display="flex" alignItems="center">
            <VuiBox
              sx={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                mr: 2,
              }}
            >
              <FaCcPaypal size={36} color="#003087" />
            </VuiBox>
            <VuiBox>
              <VuiTypography
                variant="button"
                color="white"
                fontWeight="regular"
                opacity={0.8}
                textTransform="uppercase"
                letterSpacing="1px"
                fontSize="0.75rem"
              >
                PayPal Balance
              </VuiTypography>
              <VuiTypography variant="h4" color="white" fontWeight="bold">
                ${amount}
              </VuiTypography>
            </VuiBox>
          </VuiBox>

          <IconButton
            onClick={handleRefresh}
            sx={{
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "8px",
              transition: "all 0.2s ease",
              animation: showRefresh ? "spin 0.5s ease" : "none",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" }
              }
            }}
          >
            <BiRefresh size={20} />
          </IconButton>
        </VuiBox>

        {/* QR Code Section */}
        <VuiBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "30px 20px",
            boxShadow: "0 15px 35px rgba(0, 53, 128, 0.15)",
          }}
        >
          <VuiTypography
            color="#003087"
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            mb={2}
          >
            {userName}
          </VuiTypography>

          <VuiBox
            position="relative"
            sx={{
              padding: "10px",
              borderRadius: "16px",
              backgroundColor: "white",
              boxShadow: "0 8px 16px rgba(0, 0, 0, 0.05)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              width: "fit-content",
              marginBottom: "20px",
            }}
          >
            {/* QR Code with animation */}
            <Box
              component="img"
              src={QRCodeImage}
              alt="PayPal QR Code"
              sx={{
                width: "180px",
                height: "180px",
                display: "block",
                transition: "all 0.3s ease",
                filter: showRefresh ? "blur(4px)" : "none",
                animation: showRefresh ? "pulse 1s ease" : "none",
                "@keyframes pulse": {
                  "0%": { opacity: 0.5 },
                  "50%": { opacity: 0.8 },
                  "100%": { opacity: 1 }
                }
              }}
            />

            {/* PayPal branded corner */}
            <Box
              sx={{
                position: "absolute",
                right: "-10px",
                top: "-10px",
                backgroundColor: "#0070ba",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FaCcPaypal size={16} color="white" />
            </Box>
          </VuiBox>

          <VuiTypography
            variant="button"
            color="text"
            fontWeight="medium"
            mb={3}
          >
            Scan to pay instantly
          </VuiTypography>

          {/* Action buttons */}
          <VuiBox display="flex" gap={2} width="100%" justifyContent="center">
            <VuiButton
              variant="outlined"
              color="dark"
              size="small"
              onClick={handleCopyClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                transition: "all 0.2s ease",
                borderColor: "rgba(0, 0, 0, 0.2)",
                "&:hover": {
                  borderColor: "rgba(0, 0, 0, 0.5)",
                }
              }}
            >
              <FiShare size={16} />
              {copied ? "Copied!" : "Share Link"}
            </VuiButton>

            <VuiButton
              variant="contained"
              color="info"
              size="small"
              sx={{
                background: "linear-gradient(90deg, #0070ba, #1546a0)",
                boxShadow: "0 6px 12px rgba(0, 53, 128, 0.2)",
              }}
            >
              View Details
            </VuiButton>
          </VuiBox>
        </VuiBox>

        {/* Expiration notice */}
        <VuiBox mt={2} textAlign="center">
          <VuiTypography
            variant="caption"
            color="white"
            fontWeight="regular"
            opacity={0.7}
          >
            QR code expires in 15 minutes
          </VuiTypography>
        </VuiBox>
      </VuiBox>
    </Card>
  );
}

ModernPayPalCard.defaultProps = {
  userName: "Sebastian Rogg",
  amount: "2,457.80",
};

ModernPayPalCard.propTypes = {
  userName: PropTypes.string,
  amount: PropTypes.string,
};

export default ModernPayPalCard;