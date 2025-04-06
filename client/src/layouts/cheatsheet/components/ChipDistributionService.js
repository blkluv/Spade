// src/services/ChipDistributionService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:8080/api';

/**
 * Service for Poker Chip Distribution related API calls
 */
class ChipDistributionService {
  /**
   * Calculate optimal chip distribution for maximum players
   * @param {Object} chipInventory - The current inventory of chips (counts of each denomination)
   * @returns {Promise<Object>} The response with optimal distribution data
   */
  static async calculateOptimalDistribution(chipInventory) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chips/optimize`, chipInventory);
      return response.data;
    } catch (error) {
      console.error('Error calculating chip distribution:', error);
      throw error;
    }
  }

  /**
   * Get preset chip distributions based on player count
   * @param {number} playerCount - The number of players
   * @returns {Promise<Object>} Predefined chip distributions for the specified player count
   */
  static async getPresetDistribution(playerCount) {
    try {
      const response = await axios.get(`${API_BASE_URL}/chips/presets`, {
        params: { players: playerCount }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching preset distributions:', error);
      throw error;
    }
  }

  /**
   * Save a custom chip distribution as a preset
   * @param {Object} distribution - The distribution to save
   * @returns {Promise<Object>} Response confirming the save
   */
  static async saveCustomDistribution(distribution) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chips/save-preset`, distribution);
      return response.data;
    } catch (error) {
      console.error('Error saving custom distribution:', error);
      throw error;
    }
  }
}

export default ChipDistributionService;