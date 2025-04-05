// client/src/services/AnalyticsApiService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:8080/api';

/**
 * Service for Analytics-related API calls
 */
class AnalyticsApiService {

  /**
   * Get heatmap data for analytics
   * @returns {Promise<Object>} The response with heatmap data
   */
  static async getHeatmapData() {
    try {
      const response = await axios.get(`${API_BASE_URL}/heatmap`);
      return response.data;
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      throw error;
    }
  }
}

export default AnalyticsApiService;