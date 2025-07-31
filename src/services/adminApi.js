// 🛡️ ADMIN API SERVICE - Frontend integration with backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 🔐 Get auth token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return user?.accessToken || null;
};

// 🛡️ Create headers with authentication
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 📊 Dashboard Statistics API
export const adminApi = {
  // 📈 Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // 👥 Users Management
  async getUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error fetching users:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error creating user:', error);
      throw error;
    }
  },

  async getUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error fetching user:', error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: createHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error deleting user:', error);
      throw error;
    }
  },

  // 🔐 Roles Management
  async getRoles() {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'GET',
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error fetching roles:', error);
      throw error;
    }
  },

  async createRole(roleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error creating role:', error);
      throw error;
    }
  },

  // 🏢 Clients Management
  async getClients() {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'GET',
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error fetching clients:', error);
      throw error;
    }
  },

  async createClient(clientData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error creating client:', error);
      throw error;
    }
  },

  // 📝 System Logs
  async getLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.action) queryParams.append('action', params.action);
      if (params.table) queryParams.append('table', params.table);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`${API_BASE_URL}/logs?${queryParams.toString()}`, {
        method: 'GET',
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🚨 Error fetching logs:', error);
      throw error;
    }
  },

  // 🔄 Refresh token
  async refreshToken() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: user.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update stored user data
      const updatedUser = {
        ...user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      return data;
    } catch (error) {
      console.error('🚨 Error refreshing token:', error);
      // Clear invalid user data
      localStorage.removeItem('currentUser');
      throw error;
    }
  }
};

// 🛡️ Request interceptor for automatic token refresh
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    
    // If token expired, try to refresh
    if (response.status === 401) {
      try {
        await adminApi.refreshToken();
        // Retry the original request with new token
        return await originalFetch(...args);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return response;
      }
    }
    
    return response;
  } catch (error) {
    console.error('🚨 Fetch error:', error);
    throw error;
  }
};

export default adminApi; 