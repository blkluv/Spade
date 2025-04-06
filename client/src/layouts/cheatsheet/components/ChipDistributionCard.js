// client/src/layouts/cheatsheet/components/ChipDistributionCard.js
import React, { useState } from "react";
import {
  Card,
  Grid,
  TextField,
  CircularProgress,
  Box,
  IconButton,
  Slider,
  Tooltip
} from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import {
  FaCoins,
  FaCalculator
} from "react-icons/fa";
import ChipDistributionService from "./ChipDistributionService";

// Chip colors based on denominations
const CHIP_COLORS = {
  '1': { bg: '#FFD700', border: '#FFA500', color: '#000000' },       // Creative gold/yellow combo
  '5': { bg: '#1832b6', border: '#0095ff', color: '#FFFFFF' },       // Blue
  '10': { bg: '#F44336', border: '#D32F2F', color: '#FFFFFF' },      // Red
  '25': { bg: '#FFFFFF', border: '#2b2525', color: '#333333' },      // White
  '100': { bg: '#4CAF50', border: '#2E7D32', color: '#FFFFFF' },     // Green
  '500': { bg: '#6A1B9A', border: '#4A148C', color: '#FFEB3B' }       // Creative purple with yellow text
};


function ChipDistributionCard() {
  // State for inventory inputs
  const [chipInventory, setChipInventory] = useState({
    chip1: 0,
    chip5: 50,
    chip10: 100,
    chip25: 100,
    chip100: 50,
    chip500: 0,
    targetValue: 1000 // Target value field
  });

  // State for distribution results
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setChipInventory({
      ...chipInventory,
      [name]: parseInt(value) || 0
    });
  };

  // Calculate optimal distribution
  const calculateDistribution = async () => {
    // Client-side validation
    if (Object.keys(chipInventory).filter(k => k !== 'targetValue').every(k => chipInventory[k] === 0)) {
      setError("Please enter at least some chips in your inventory");
      return;
    }

    if (chipInventory.targetValue <= 0) {
      setError("Target value must be greater than zero");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setDistribution(null); // Clear any previous distribution

    try {
      const result = await ChipDistributionService.calculateOptimalDistribution(chipInventory);

      // Check if the result indicates failure
      if (!result.success) {
        setError(result.error || "Failed to calculate optimal distribution");
        return;
      }

      // Only set distribution and success message if the result was successful
      setDistribution(result);
      setSuccess("Distribution calculated successfully!");
    } catch (error) {
      setError("Failed to calculate distribution. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Chip component for visual display
  const ChipComponent = ({ denomination, count }) => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        position: 'relative'
      }}
    >
      <Box
        sx={{
          width: '55px',
          height: '55px',
          borderRadius: '50%',
          backgroundColor: CHIP_COLORS[denomination].bg,
          border: `4px dashed ${CHIP_COLORS[denomination].border}`,
          color: CHIP_COLORS[denomination].color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 2,
          mb: 1
        }}
      >
        ${denomination}
      </Box>
      <VuiTypography
        variant="h6"
        fontWeight="bold"
        color="white"
      >
        {count}
      </VuiTypography>
      <VuiTypography
        variant="caption"
        color="text"
      >
        chips
      </VuiTypography>
    </Box>
  );

  return (
    <Card
      sx={{
        background: "linear-gradient(135deg, #0c1e30 0%, #112940 50%, #0a192c 100%)",
        backgroundSize: "cover",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Content */}
      <VuiBox p={3}>
        {/* Header */}
        <VuiBox display="flex" alignItems="center" mb={3}>
          <Box
            sx={{
              background: "linear-gradient(135deg, #1A73E8, #49a3f1)",
              borderRadius: "12px",
              padding: "12px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mr: 2,
              boxShadow: "0 10px 20px rgba(26, 115, 232, 0.3)",
            }}
          >
            <FaCoins size={24} color="white" />
          </Box>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Poker Chip Calculator
            </VuiTypography>
            <VuiTypography variant="body2" color="text" fontWeight="medium">
              Optimize your chip distribution
            </VuiTypography>
          </VuiBox>
        </VuiBox>

        {/* Input Form */}
        <VuiBox
          mb={3}
          p={3}
          borderRadius="16px"
          sx={{
            backgroundColor: "rgba(16, 33, 55, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <VuiTypography variant="subtitle1" color="white" fontWeight="medium" mb={2}>
                Enter your chip inventory:
              </VuiTypography>
            </Grid>

            {/* Target Value Field */}
            <Grid item xs={12}>
              <VuiBox display="flex" alignItems="center" mb={3}>
                <VuiTypography variant="button" color="white" fontWeight="medium" mr={2}>
                  Target Value Per Player ($):
                </VuiTypography>
                <TextField
                  type="number"
                  name="targetValue"
                  value={chipInventory.targetValue}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    sx: {
                      width: '120px',
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "white",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      },
                    }
                  }}
                  inputProps={{
                    min: 1,
                    style: { textAlign: 'center' }
                  }}
                />
              </VuiBox>
            </Grid>

            {/* Chip inputs */}
            {[
              { key: "chip1", label: "$1 Chips", value: 1 },
              { key: "chip5", label: "$5 Chips", value: 5 },
              { key: "chip10", label: "$10 Chips", value: 10 },
              { key: "chip25", label: "$25 Chips", value: 25 },
              { key: "chip100", label: "$100 Chips", value: 100 },
              { key: "chip500", label: "$500 Chips", value: 500 }
            ].map((chip) => (
              <Grid item xs={12} md={6} key={chip.key}>
                <VuiBox display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: CHIP_COLORS[chip.value].bg,
                      border: `2px dashed ${CHIP_COLORS[chip.value].border}`,
                      color: CHIP_COLORS[chip.value].color,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      mr: 1
                    }}
                  >
                    ${chip.value}
                  </Box>
                  <VuiTypography variant="button" color="white" fontWeight="medium">
                    {chip.label}
                  </VuiTypography>
                  <Box sx={{ ml: 'auto' }}>
                    <TextField
                      type="number"
                      name={chip.key}
                      value={chipInventory[chip.key]}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        sx: {
                          width: '80px',
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          color: "white",
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                          },
                        }
                      }}
                      inputProps={{
                        min: 0,
                        style: { textAlign: 'center' }
                      }}
                    />
                  </Box>
                </VuiBox>
              </Grid>
            ))}

            <Grid item xs={12}>
              <VuiButton
                color="info"
                variant="contained"
                fullWidth
                onClick={calculateDistribution}
                disabled={loading}
                sx={{
                  background: "linear-gradient(90deg, #1A73E8, #49a3f1)",
                  borderRadius: "12px",
                  mt: 2,
                }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaCalculator />}
              >
                {loading ? "Calculating..." : "Calculate Optimal Distribution"}
              </VuiButton>
            </Grid>
          </Grid>
        </VuiBox>

        {/* Status Messages */}
        {error && (
          <VuiBox
            p={2}
            mb={3}
            borderRadius="12px"
            sx={{
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              border: "1px solid rgba(244, 67, 54, 0.3)",
            }}
          >
            <VuiTypography variant="subtitle2" color="error" fontWeight="medium">
              {error}
            </VuiTypography>
          </VuiBox>
        )}

        {success && (
          <VuiBox
            p={2}
            mb={3}
            borderRadius="12px"
            sx={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
            }}
          >
            <VuiTypography variant="subtitle2" color="success" fontWeight="medium">
              {success}
            </VuiTypography>
          </VuiBox>
        )}

        {/* Results */}
        {distribution && (
          <VuiBox
            p={3}
            mb={3}
            borderRadius="16px"
            sx={{
              background: "linear-gradient(135deg, rgba(41, 98, 255, 0.1), rgba(0, 210, 255, 0.1))",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <VuiTypography variant="h5" color="white" fontWeight="bold" mb={3}>
              Optimal Distribution
            </VuiTypography>

            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <VuiBox
                  p={2}
                  borderRadius="12px"
                  textAlign="center"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(26, 115, 232, 0.3)",
                  }}
                >
                  <VuiTypography variant="subtitle2" color="text" fontWeight="regular" mb={1}>
                    Players
                  </VuiTypography>
                  <VuiTypography variant="h3" color="white" fontWeight="bold">
                    {distribution.maxPlayers}
                  </VuiTypography>
                </VuiBox>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <VuiBox
                  p={2}
                  borderRadius="12px"
                  textAlign="center"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(26, 115, 232, 0.3)",
                  }}
                >
                  <VuiTypography variant="subtitle2" color="text" fontWeight="regular" mb={1}>
                    Value Per Player
                  </VuiTypography>
                  <VuiTypography variant="h3" color="white" fontWeight="bold">
                    ${distribution.valuePerPlayer}
                  </VuiTypography>
                </VuiBox>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <VuiBox
                  p={2}
                  borderRadius="12px"
                  textAlign="center"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(26, 115, 232, 0.3)",
                  }}
                >
                  <VuiTypography variant="subtitle2" color="text" fontWeight="regular" mb={1}>
                    Chips Per Player
                  </VuiTypography>
                  <VuiTypography variant="h3" color="white" fontWeight="bold">
                    {distribution.chipsPerPlayer}
                  </VuiTypography>
                </VuiBox>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <VuiBox
                  p={2}
                  borderRadius="12px"
                  textAlign="center"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(26, 115, 232, 0.3)",
                  }}
                >
                  <VuiTypography variant="subtitle2" color="text" fontWeight="regular" mb={1}>
                    Efficiency
                  </VuiTypography>
                  <VuiTypography variant="h3" color="white" fontWeight="bold">
                    {distribution.efficiency}%
                  </VuiTypography>
                </VuiBox>
              </Grid>
            </Grid>

            {/* Chips per player visualization */}
            <VuiTypography variant="subtitle1" color="white" fontWeight="medium" mb={2}>
              Each player receives:
            </VuiTypography>

            <VuiBox
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                p: 3,
                borderRadius: '12px',
                backgroundColor: "rgba(16, 33, 55, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {[1, 5, 10, 25, 100, 500].map(denom => (
                <ChipComponent
                  key={denom}
                  denomination={denom}
                  count={distribution.playerDistribution[`chip${denom}`] || 0}
                />
              ))}
            </VuiBox>
          </VuiBox>
        )}
      </VuiBox>
    </Card>
  );
}

export default ChipDistributionCard;