// ApiService.js
const API_BASE_URL = "http://localhost:8080/api";

/**
 * Service for handling all API calls to the backend
 */
class ApiService {
  // Store the JWT token
  static token = localStorage.getItem("token") || null;

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  static setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  /**
   * Clear authentication token
   */
  static clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers object with Authorization
   */
  static getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API call
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} API response
   */
  static async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const fetchOptions = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, fetchOptions);

      // If token expired or invalid, clear it
      if (response.status === 401) {
        this.clearToken();
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An error occurred");
      }

      return data;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  }

  /**
   * Process avatar data from different possible formats to a usable URL
   * @param {*} avatarData - Avatar data from the server (byte array, base64, etc)
   * @returns {string|null} URL for the avatar image or null if no valid data
   */
  static processAvatarData(data) {
    // Handle null case
    if (!data) return null;

    // Case 1: If it's already a data URL, return as is
    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        return data;
      }

      // Case 2: If it's a base64 string without the data: prefix
      try {
        // Test if it's valid base64
        atob(data);
        return `data:image/jpeg;base64,${data}`;
      } catch (e) {
        // Not valid base64, continue with other checks
      }
    }

    // Case 3: Check if the data has avatarBase64 property (new backend format)
    if (data.avatarBase64) {
      return `data:image/jpeg;base64,${data.avatarBase64}`;
    }

    // Case 4: Legacy array format (byte array)
    if (Array.isArray(data)) {
      const binary = data.map(byte => String.fromCharCode(byte)).join('');
      return `data:image/jpeg;base64,${btoa(binary)}`;
    }

    console.warn('Unprocessable avatar data:', data);
    return null;
  }

  // ============ User API ============

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration response
   */
  static async register(userData) {
    return this.apiCall("/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  /**
   * Login a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise} Login response with token
   */
  static async login(credentials) {
    const data = await this.apiCall("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Get current user profile
   * @returns {Promise} User profile data
   */
  static async getCurrentUser() {
    try {
      const userData = await this.apiCall("/users/me");

      // If user is associated with a player, we might need additional data
      // to determine if they're at a table
      if (!userData.currentTableId && !userData.player) {
        try {
          // Check if there's player info available through another endpoint
          // This might be needed depending on your API structure
          const playerResponse = await this.apiCall("/players/me");
          if (playerResponse && playerResponse.currentTableId) {
            userData.currentTableId = playerResponse.currentTableId;
          }
        } catch (playerError) {
          // If this endpoint doesn't exist, just continue with user data
          console.log("No separate player endpoint available");
        }
      }

      return userData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update current user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user profile
   */
  static async updateUser(userData) {
    return this.apiCall("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  /**
   * Update user password
   * @param {Object} passwordData - Password update data
   * @returns {Promise} Update response
   */
  static async updatePassword(passwordData) {
    return this.apiCall("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  /**
   * Upload user avatar
   * @param {FormData} formData - Form data containing avatar file
   * @returns {Promise} Updated user profile
   */
  static async uploadAvatar(formData) {
    const url = `${API_BASE_URL}/users/me/avatar`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          // Note: Do NOT set Content-Type here for multipart/form-data
          // Browser will set it automatically with boundary parameter
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload avatar");
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error("Avatar upload error:", error);
      throw error;
    }
  }

  // ============ Player API ============

  /**
   * Check if the current user is at a table
   * @returns {Promise} Table status information
   */
  static async getCurrentTable() {
    return this.apiCall("/players/current-table");
  }

  /**
   * Get all tables
   * @returns {Promise} List of all tables
   */
  static async getAllTables() {
    return this.apiCall("/tables");
  }

  /**
   * Get public tables
   * @returns {Promise} List of public tables
   */
  static async getPublicTables() {
    return this.apiCall("/tables/public");
  }

  /**
   * Get table by ID
   * @param {number} tableId - Table ID
   * @returns {Promise} Table details
   */
  static async getTableById(tableId) {
    return this.apiCall(`/tables/${tableId}`);
  }

  /**
   * Create a new table
   * @param {Object} tableData - Table creation data
   * @returns {Promise} Created table
   */
  static async createTable(tableData) {
    return this.apiCall("/tables", {
      method: "POST",
      body: JSON.stringify(tableData),
    });
  }

  /**
   * Join a table
   * @param {number} tableId - Table ID
   * @param {number} buyIn - Buy-in amount
   * @returns {Promise} Updated table
   */
  static async joinTable(tableId, buyIn) {
    return this.apiCall(`/tables/${tableId}/join?buyIn=${buyIn}`, {
      method: "POST",
    });
  }

  /**
   * Leave a table
   * @param {number} tableId - Table ID
   * @returns {Promise} Updated table
   */
  static async leaveTable(tableId) {
    return this.apiCall(`/tables/${tableId}/leave`, {
      method: "POST",
    });
  }
}

export default ApiService;