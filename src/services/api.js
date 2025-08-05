import axios from 'axios';

// Mock user data for testing
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@quickzone.tn',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'QuickZone',
    role: 'Administration',
    permissions: {
      dashboard: true,
      personnel: {
        administration: true,
        commercial: true,
        finance: true,
        chef_agence: true,
        membre_agence: true,
        livreurs: true
      },
      expediteur: true,
      colis: true,
      pickup: true,
      secteurs: true,
      entrepots: true,
      paiment_expediteur: true,
      reclamation: true
    }
  },
  {
    id: 2,
    username: 'marie',
    email: 'marie@quickzone.tn',
    password: 'marie123',
    firstName: 'Marie',
    lastName: 'Dupont',
    role: 'Administration',
    permissions: {
      dashboard: true,
      personnel: {
        administration: true,
        commercial: true,
        finance: true,
        chef_agence: true,
        membre_agence: true,
        livreurs: true
      },
      expediteur: true,
      colis: true,
      pickup: true,
      secteurs: true,
      entrepots: true,
      paiment_expediteur: true,
      reclamation: true
    }
  },
  {
    id: 3,
    username: 'pierre',
    email: 'pierre@quickzone.tn',
    password: 'pierre123',
    firstName: 'Pierre',
    lastName: 'Dubois',
    role: 'Commercial',
    permissions: {
      dashboard: true,
      personnel: {
        commercial: true
      },
      expediteur: true,
      colis: true,
      pickup: true,
      secteurs: true,
      reclamation: true
    }
  },
  {
    id: 4,
    username: 'sophie',
    email: 'sophie@quickzone.tn',
    password: 'sophie123',
    firstName: 'Sophie',
    lastName: 'Martin',
    role: 'Commercial',
    permissions: {
      dashboard: true,
      personnel: {
        commercial: true
      },
      expediteur: true,
      colis: true,
      pickup: true,
      secteurs: true,
      reclamation: true
    }
  },
  {
    id: 5,
    username: 'claude',
    email: 'claude@quickzone.tn',
    password: 'claude123',
    firstName: 'Claude',
    lastName: 'Bernard',
    role: 'Finance',
    permissions: {
      dashboard: true,
      personnel: {
        finance: true
      },
      paiment_expediteur: true
    }
  },
  {
    id: 6,
    username: 'isabelle',
    email: 'isabelle@quickzone.tn',
    password: 'isabelle123',
    firstName: 'Isabelle',
    lastName: 'Leroy',
    role: 'Finance',
    permissions: {
      dashboard: true,
      personnel: {
        finance: true
      },
      paiment_expediteur: true
    }
  },
  {
    id: 7,
    username: 'francois',
    email: 'francois@quickzone.tn',
    password: 'francois123',
    firstName: 'François',
    lastName: 'Petit',
    role: 'Chef d\'agence',
    permissions: {
      dashboard: true,
      personnel: {
        chef_agence: true,
        membre_agence: true,
        livreurs: true
      },
      expediteur: true,
      colis: true,
      pickup: true,
      secteurs: true,
      entrepots: true,
      reclamation: true
    }
  },
  {
    id: 8,
    username: 'nathalie',
    email: 'nathalie@quickzone.tn',
    password: 'nathalie123',
    firstName: 'Nathalie',
    lastName: 'Moreau',
    role: 'Chef d\'agence',
    permissions: {
      dashboard: true,
      personnel: {
        chef_agence: true,
        membre_agence: true,
        livreurs: true
      },
      expediteur: true,
      colis: true,
      pickup: true,
      secteurs: true,
      entrepots: true,
      reclamation: true
    }
  },
  {
    id: 9,
    username: 'thomas',
    email: 'thomas@quickzone.tn',
    password: 'thomas123',
    firstName: 'Thomas',
    lastName: 'Leroy',
    role: 'Membre de l\'agence',
    permissions: {
      dashboard: true,
      colis: true,
      pickup: true,
      reclamation: true
    }
  },
  {
    id: 10,
    username: 'celine',
    email: 'celine@quickzone.tn',
    password: 'celine123',
    firstName: 'Céline',
    lastName: 'Rousseau',
    role: 'Membre de l\'agence',
    permissions: {
      dashboard: true,
      colis: true,
      pickup: true,
      reclamation: true
    }
  },
  {
    id: 11,
    username: 'marc',
    email: 'marc@quickzone.tn',
    password: 'marc123',
    firstName: 'Marc',
    lastName: 'Simon',
    role: 'Livreurs',
    permissions: {
      dashboard: true,
      pickup: true
    }
  },
  {
    id: 12,
    username: 'laurent',
    email: 'laurent@quickzone.tn',
    password: 'laurent123',
    firstName: 'Laurent',
    lastName: 'Girard',
    role: 'Livreurs',
    permissions: {
      dashboard: true,
      pickup: true
    }
  },
  {
    id: 13,
    username: 'expediteur1',
    email: 'expediteur1@quickzone.tn',
    password: 'expediteur123',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Expéditeur',
    permissions: {
      dashboard: true,
      colis: true,
      paiment_expediteur: true,
      reclamation: true
    }
  },
  {
    id: 14,
    username: 'expediteur2',
    email: 'expediteur2@quickzone.tn',
    password: 'expediteur123',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'Expéditeur',
    permissions: {
      dashboard: true,
      colis: true,
      paiment_expediteur: true,
      reclamation: true
    }
  }
];

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    console.log('📡 API Request interceptor - URL:', config.url);
    console.log('📡 API Request interceptor - Method:', config.method);
    
    const token = localStorage.getItem('authToken');
    console.log('📡 Auth token for request:', token ? 'Token exists' : 'No token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📡 Authorization header set');
    } else {
      console.log('⚠️ No auth token found for request');
    }
    
    console.log('📡 Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response interceptor - Success:', response.status, response.config.url);
    console.log('✅ Response data:', response.data);
    return response.data;
  },
  (error) => {
    console.log('❌ API Response interceptor - Error:', error.response?.status, error.config?.url);
    console.log('❌ Error details:', error.response?.data);
    console.log('❌ Error message:', error.message);
    console.log('❌ Full error object:', error);
    
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - Logging out user');
      console.log('🔐 Current auth token:', localStorage.getItem('authToken'));
      console.log('🔐 Current user:', localStorage.getItem('currentUser'));
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      console.log('🔐 After removal - auth token:', localStorage.getItem('authToken'));
      console.log('🔐 After removal - user:', localStorage.getItem('currentUser'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      console.log('Login attempt with:', { email: credentials.email });
      const response = await api.post('/auth/login', credentials);
      
      console.log('Login response:', response);
      
      if (response && response.success) {
        const { accessToken, user } = response.data;
        
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        
        return response;
      } else {
        throw new Error(response?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Provide more specific error messages
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error('Please provide valid email and password');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    // Redirect to login page
    window.location.href = '/';
    return { success: true };
  },

  // Parcels (Colis)
  getParcels: async (page = 1, limit = 100) => {
    try {
      console.log('🔍 Calling getParcels with page:', page, 'limit:', limit);
      const response = await api.get(`/parcels?page=${page}&limit=${limit}`);
      console.log('📦 Parcels API response:', response);
      console.log('📦 Response data:', response.data);
      
      // Handle different response formats
      if (response.data?.data?.parcels) {
        console.log('📦 Returning data.data.parcels:', response.data.data.parcels.length);
        return response.data.data.parcels;
      } else if (response.data?.parcels) {
        console.log('📦 Returning data.parcels:', response.data.parcels.length);
        return response.data.parcels;
      } else if (Array.isArray(response.data)) {
        console.log('📦 Returning data array:', response.data.length);
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('📦 Returning data.data array:', response.data.data.length);
        return response.data.data;
      } else {
        console.warn('❌ Unexpected parcels response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Get parcels error:', error);
      return [];
    }
  },

  // Get single parcel by ID
  getParcel: async (id) => {
    try {
      console.log('🔍 Calling getParcel with ID:', id);
      const response = await api.get(`/parcels/${id}`);
      console.log('📡 Raw API response:', response);
      console.log('📡 Response type:', typeof response);
      console.log('📡 Response keys:', Object.keys(response || {}));
      
      // The axios interceptor already extracts response.data, so we get { success: true, data: {...} }
      if (response && response.success === true && response.data) {
        console.log('✅ Success format - returning data');
        return response.data;
      } else if (response && response.data) {
        console.log('✅ Data format - returning data');
        return response.data;
      } else if (response) {
        console.log('✅ Direct response format - returning response');
        return response;
      } else {
        console.warn('❌ Unexpected response format:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ Get parcel error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      return null;
    }
  },

  // Get parcels for a specific expéditeur
  getExpediteurParcels: async (email, page = 1, limit = 1000) => {
    try {
      console.log('🔍 Calling getExpediteurParcels with email:', email);
      const response = await api.get(`/parcels/expediteur/${encodeURIComponent(email)}?page=${page}&limit=${limit}`);
      console.log('📦 Expediteur parcels API response:', response);
      console.log('📦 Response data:', response.data);
      
      // Handle different response formats
      if (response.data?.data?.parcels) {
        console.log('📦 Returning data.data.parcels:', response.data.data.parcels.length);
        return response.data.data.parcels;
      } else if (response.data?.parcels) {
        console.log('📦 Returning data.parcels:', response.data.parcels.length);
        return response.data.parcels;
      } else if (Array.isArray(response.data)) {
        console.log('📦 Returning data array:', response.data.length);
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('📦 Returning data.data array:', response.data.data.length);
        return response.data.data;
      } else {
        console.warn('❌ Unexpected expediteur parcels response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Get expediteur parcels error:', error);
      return [];
    }
  },

  // Get expediteur chart data
  getExpediteurChartData: async (email) => {
    try {
      const response = await api.get(`/parcels/expediteur/${encodeURIComponent(email)}/chart-data`);
      console.log('Expediteur chart data API response:', response.data);
      
      // Handle the response format: {success: true, data: {...}}
      if (response.data.success && response.data.data) {
        console.log('✅ Chart data extracted successfully:', response.data.data);
        return response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // Direct data format (fallback)
        console.log('⚠️ Using direct data format:', response.data);
        return response.data;
      } else {
        console.warn('Unexpected expediteur chart data response format:', response.data);
        return {
          deliveryHistory: [],
          geographicalData: []
        };
      }
    } catch (error) {
      console.error('Get expediteur chart data error:', error);
      return {
        deliveryHistory: [],
        geographicalData: []
      };
    }
  },

  // Get expediteur dashboard statistics
  getExpediteurStats: async (email) => {
    try {
      const response = await api.get(`/parcels/expediteur/${encodeURIComponent(email)}/stats`);
      console.log('Expediteur stats API response:', response.data);
      
      // Handle both response formats: {success: true, data: {...}} and direct data
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // Direct data format (backend is returning data directly)
        return response.data;
      } else {
        console.warn('Unexpected expediteur stats response format:', response.data);
        return {
          totalParcels: 0,
          totalRevenue: 0,
          balance: 0,
          currentMonth: 0,
          deliveredThisMonth: 0,
          paidDelivered: 0,
          complaintsCount: 0,
          monthlyChanges: { parcels: 0, delivered: 0 },
          statusStats: {}
        };
      }
    } catch (error) {
      console.error('Get expediteur stats error:', error);
      return {
        totalParcels: 0,
        totalRevenue: 0,
        balance: 0,
        currentMonth: 0,
        deliveredThisMonth: 0,
        paidDelivered: 0,
        complaintsCount: 0,
        monthlyChanges: { parcels: 0, delivered: 0 },
        statusStats: {}
      };
    }
  },

  // Get expediteur payments
  getExpediteurPayments: async (email, page = 1, limit = 1000) => {
    try {
      const response = await api.get(`/payments/expediteur/${encodeURIComponent(email)}?page=${page}&limit=${limit}`);
      console.log('Expediteur payments API response:', response);
      
      if (response.success && response.data) {
        if (response.data.payments) {
          // New format with pagination
          return response.data.payments;
        } else {
          // Old format - direct array
          return response.data;
        }
      } else {
        console.warn('Unexpected expediteur payments response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Get expediteur payments error:', error);
      return [];
    }
  },

  // Get all payments (for admin users)
  getAllPayments: async () => {
    try {
      const response = await api.get('/payments');
      console.log('All payments API response:', response);
      
      // Handle different response formats
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      } else {
        console.warn('Unexpected all payments response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Get all payments error:', error);
      return [];
    }
  },

  createParcel: async (parcelData) => {
    try {
      const response = await api.post('/parcels', parcelData);
      return response;
    } catch (error) {
      console.error('Create parcel error:', error);
      throw new Error('Failed to create parcel');
    }
  },

  updateParcel: async (id, updates) => {
    try {
      console.log('Updating parcel:', { id, updates });
      
      // If we're only updating status, use the status-only endpoint
      if (updates.status && Object.keys(updates).length === 1) {
        console.log('Using status-only endpoint');
        const response = await api.put(`/parcels/${id}/status`, { status: updates.status });
        console.log('Status update response:', response.data);
        return response.data;
      } else {
        // Use the full update endpoint for other updates
        console.log('Using full update endpoint');
        const response = await api.put(`/parcels/${id}`, updates);
        console.log('Update response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Update parcel error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error('Failed to update parcel');
    }
  },

  deleteParcel: async (id) => {
    try {
      console.log('Deleting parcel:', id);
      const response = await api.delete(`/parcels/${id}`);
      console.log('Delete response:', response.data);
      return response.data || response;
    } catch (error) {
      console.error('Delete parcel error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error('Failed to delete parcel');
    }
  },

  // Shippers (Expediteurs)
  getShippers: async () => {
    try {
      const response = await api.get('/shippers');
      console.log('Shippers response:', response);
      return response.data?.data?.shippers || response.data?.shippers || [];
    } catch (error) {
      console.error('Get shippers error:', error);
      return [];
    }
  },

  createShipper: async (shipperData) => {
    try {
      console.log('Creating shipper:', shipperData);
      
      // Check if shipperData is already a FormData object
      if (shipperData instanceof FormData) {
        console.log('shipperData is already FormData, using directly');
        console.log('=== API SERVICE DEBUG ===');
        console.log('FormData entries:', Array.from(shipperData.entries()));
        console.log('FormData keys:', Array.from(shipperData.keys()));
        console.log('FormData values:', Array.from(shipperData.values()));
        
        const response = await api.post('/shippers', shipperData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Create response:', response.data);
        return response.data;
      } else {
        // Create FormData for file upload (fallback for non-FormData input)
        const formData = new FormData();
        
        // Add text fields
        Object.keys(shipperData).forEach(key => {
          if (key !== 'id_document' && key !== 'company_documents') {
            formData.append(key, shipperData[key]);
          }
        });
        
        // Add files if they exist
        if (shipperData.id_document) {
          formData.append('id_document', shipperData.id_document);
        }
        if (shipperData.company_documents) {
          formData.append('company_documents', shipperData.company_documents);
        }
        
        console.log('=== API SERVICE DEBUG ===');
        console.log('FormData entries:', Array.from(formData.entries()));
        console.log('FormData keys:', Array.from(formData.keys()));
        console.log('FormData values:', Array.from(formData.values()));
        
        const response = await api.post('/shippers', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Create response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Create shipper error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Provide more specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        throw new Error('Invalid data provided. Please check all required fields.');
      } else if (error.response?.status === 409) {
        throw new Error('A shipper with this email already exists');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again.');
      } else {
        throw new Error('Failed to create shipper');
      }
    }
  },

  updateShipper: async (id, updates) => {
    try {
      console.log('Updating shipper:', { id, updates });
      
      // Check if updates is already a FormData object
      if (updates instanceof FormData) {
        console.log('updates is already FormData, using directly');
        console.log('FormData entries:', Array.from(updates.entries()));
        
        const response = await api.put(`/shippers/${id}`, updates, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Update response:', response.data);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        return response.data;
      } else {
        // Create FormData for file upload (fallback for non-FormData input)
        const formData = new FormData();
        
        // Add text fields
        Object.keys(updates).forEach(key => {
          if (key !== 'id_document' && key !== 'company_documents') {
            formData.append(key, updates[key]);
          }
        });
        
        // Add files if they exist
        if (updates.id_document) {
          formData.append('id_document', updates.id_document);
        }
        if (updates.company_documents) {
          formData.append('company_documents', updates.company_documents);
        }
        
        console.log('FormData entries:', Array.from(formData.entries()));
        
        const response = await api.put(`/shippers/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Update response:', response.data);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        return response.data;
      }
    } catch (error) {
      console.error('Update shipper error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Provide more specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error('Shipper not found');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid data provided');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again.');
      } else {
        throw new Error('Failed to update shipper');
      }
    }
  },

  deleteShipper: async (id) => {
    try {
      const response = await api.delete(`/shippers/${id}`);
      return response;
    } catch (error) {
      console.error('Delete shipper error:', error);
      throw new Error('Failed to delete shipper');
    }
  },

  deleteShipperWithDependencies: async (id) => {
    try {
      const response = await api.delete(`/shippers/${id}/with-dependencies`);
      return response.data || response;
    } catch (error) {
      console.error('Delete shipper with dependencies error:', error);
      throw new Error('Failed to delete shipper with dependencies');
    }
  },

  // Payment management functions
  getShipperPayments: async (shipperId) => {
    try {
      const response = await api.get(`/payments/shipper/${shipperId}`);
      return response.data;
    } catch (error) {
      console.error('Get shipper payments error:', error);
      throw new Error('Failed to fetch shipper payments');
    }
  },

  deletePayment: async (paymentId) => {
    try {
      const response = await api.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete payment error:', error);
      throw new Error('Failed to delete payment');
    }
  },

  createPayment: async (paymentData) => {
    try {
      console.log('Creating payment with data:', paymentData);
      const response = await api.post('/payments', paymentData);
      console.log('Create payment response:', response.data);
      console.log('Create payment response status:', response.status);
      console.log('Create payment response headers:', response.headers);
      
      // Check if response.data has success property (wrapped response)
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      } else {
        // Direct response - wrap it in success format
        return {
          success: true,
          message: 'Payment created successfully',
          data: response.data
        };
      }
    } catch (error) {
      console.error('Create payment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        throw new Error('Invalid payment data provided');
      } else if (error.response?.status === 404) {
        throw new Error('Shipper not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again.');
      } else {
        throw new Error('Failed to create payment');
      }
    }
  },

  deleteAllShipperPayments: async (shipperId) => {
    try {
      // First get all payments for this shipper
      const paymentsResponse = await api.get(`/payments/shipper/${shipperId}`);
      const payments = paymentsResponse.data.data || [];
      
      // Delete each payment
      const deletePromises = payments.map(payment => 
        api.delete(`/payments/${payment.id}`)
      );
      
      await Promise.all(deletePromises);
      
      return {
        success: true,
        message: `Successfully deleted ${payments.length} payments`,
        deletedCount: payments.length
      };
    } catch (error) {
      console.error('Delete all shipper payments error:', error);
      throw new Error('Failed to delete shipper payments');
    }
  },

  // Drivers (Livreurs)
  getDrivers: async () => {
    try {
      console.log('🔍 Fetching drivers from API...');
      const response = await api.get('/personnel/livreurs');
      console.log('📡 API Response:', response);
      console.log('📡 Response.data:', response.data);
      
      // Handle nested data structure
      const drivers = response.data?.data || response.data || [];
      console.log('🚗 Drivers array:', drivers);
      console.log('🚗 Drivers count:', drivers.length);
      
      return drivers;
    } catch (error) {
      console.error('Get drivers error:', error);
      console.error('Error response:', error.response);
      return [];
    }
  },

  createDriver: async (driverData) => {
    try {
      const response = await api.post('/personnel/livreurs', driverData);
      return response.data || response;
    } catch (error) {
      console.error('Create driver error:', error);
      throw error;
    }
  },

  updateDriver: async (id, driverData) => {
    try {
      const response = await api.put(`/personnel/livreurs/${id}`, driverData);
      return response.data || response;
    } catch (error) {
      console.error('Update driver error:', error);
      throw error;
    }
  },

  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/personnel/livreurs/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Delete driver error:', error);
      throw error;
    }
  },

  // File upload functions
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      // Use axios directly (not the configured instance) to avoid response interceptor
      const response = await axios.post('http://localhost:5000/api/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout for file uploads
      });
      
      console.log('Upload response:', response.data);
      
      // Check if the response has the expected structure
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Unexpected response structure:', response.data);
        throw new Error('Upload failed - unexpected response');
      }
    } catch (error) {
      console.error('Upload file error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // If it's a network error or server error, provide a more specific message
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Maximum size is 10MB.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Upload failed');
      }
    }
  },

  uploadMultipleFiles: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Use axios directly (not the configured instance) to avoid response interceptor
      const response = await axios.post('http://localhost:5000/api/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout for file uploads
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload files error:', error);
      throw new Error('Upload failed');
    }
  },



  // Commercials
  getCommercials: async () => {
    try {
      const response = await api.get('/personnel/commercials');
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Get commercials error:', error);
      return [];
    }
  },

  // Admin Dashboard
  getAdminDashboard: async () => {
    try {
      const response = await api.get('/dashboard/admin');
      return response;
    } catch (error) {
      console.error('Get admin dashboard error:', error);
      return null;
    }
  },

  // Admin Profile
  getAdminProfile: async () => {
    try {
      const response = await api.get('/admin/profile');
      return response.data;
    } catch (error) {
      console.error('Get admin profile error:', error);
      return null;
    }
  },

  updateAdminProfile: async (profileData) => {
    try {
      const response = await api.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update admin profile error:', error);
      throw new Error('Failed to update admin profile');
    }
  },

  // Administration Management
  getAdministrators: async () => {
    try {
      const response = await api.get('/personnel/administrators');
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Get administrators error:', error);
      return [];
    }
  },

  createAdministrator: async (adminData) => {
    try {
      const response = await api.post('/personnel/administrators', adminData);
      return response;
    } catch (error) {
      console.error('Create administrator error:', error);
      throw new Error('Failed to create administrator');
    }
  },

  updateAdministrator: async (id, adminData) => {
    try {
      const response = await api.put(`/personnel/administrators/${id}`, adminData);
      return response;
    } catch (error) {
      console.error('Update administrator error:', error);
      throw new Error('Failed to update administrator');
    }
  },

  deleteAdministrator: async (id) => {
    try {
      const response = await api.delete(`/personnel/administrators/${id}`);
      return response;
    } catch (error) {
      console.error('Delete administrator error:', error);
      throw new Error('Failed to delete administrator');
    }
  },

  // Commercial Management
  createCommercial: async (commercialData) => {
    try {
      const response = await api.post('/personnel/commercials', commercialData);
      return response;
    } catch (error) {
      console.error('Create commercial error:', error);
      throw new Error('Failed to create commercial');
    }
  },

  updateCommercial: async (id, commercialData) => {
    try {
      const response = await api.put(`/personnel/commercials/${id}`, commercialData);
      return response;
    } catch (error) {
      console.error('Update commercial error:', error);
      throw new Error('Failed to update commercial');
    }
  },

  deleteCommercial: async (id) => {
    try {
      const response = await api.delete(`/personnel/commercials/${id}`);
      return response;
    } catch (error) {
      console.error('Delete commercial error:', error);
      throw new Error('Failed to delete commercial');
    }
  },

  // Get shippers by commercial ID
  getShippersByCommercial: async (commercialId) => {
    try {
      const response = await api.get(`/personnel/commercials/${commercialId}/shippers`);
      return response.data || [];
    } catch (error) {
      console.error('Get shippers by commercial error:', error);
      return [];
    }
  },

  // Get payments for shippers of a specific commercial
  getCommercialPayments: async (commercialId, params = {}) => {
    try {
      const response = await api.get(`/personnel/commercials/${commercialId}/payments`, { params });
      return response.data || { payments: [], pagination: {} };
    } catch (error) {
      console.error('Get commercial payments error:', error);
      return { payments: [], pagination: {} };
    }
  },

  // Get parcels for shippers of a specific commercial
  getCommercialParcels: async (commercialId, params = {}) => {
    try {
      const response = await api.get(`/personnel/commercials/${commercialId}/parcels`, { params });
      return response.data || { parcels: [], pagination: {} };
    } catch (error) {
      console.error('Get commercial parcels error:', error);
      return { parcels: [], pagination: {} };
    }
  },

  // Get complaints for shippers of a specific commercial
  getCommercialComplaints: async (commercialId, page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });
      
      const response = await api.get(`/complaints/commercial/${commercialId}?${params}`);
      return response || { complaints: [], pagination: {} };
    } catch (error) {
      console.error('Get commercial complaints error:', error);
      return { complaints: [], pagination: {} };
    }
  },

  // Get commercial statistics
  getCommercialStats: async (commercialId) => {
    try {
      const response = await api.get(`/personnel/commercials/${commercialId}/stats`);
      return response.data || {};
    } catch (error) {
      console.error('Get commercial stats error:', error);
      return {};
    }
  },

  // Get commercial's own payments (commissions, salaries, bonuses)
  getCommercialOwnPayments: async (commercialId) => {
    try {
      const response = await api.get(`/personnel/commercials/${commercialId}/own-payments`);
      return response.data || { payments: [], pagination: {} };
    } catch (error) {
      console.error('Get commercial own payments error:', error);
      return { payments: [], pagination: {} };
    }
  },

  // Create commercial payment
  createCommercialPayment: async (commercialId, paymentData) => {
    try {
      const response = await api.post(`/personnel/commercials/${commercialId}/payments`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Create commercial payment error:', error);
      throw error;
    }
  },

  // Update commercial payment
  updateCommercialPayment: async (commercialId, paymentId, paymentData) => {
    try {
      const response = await api.put(`/personnel/commercials/${commercialId}/payments/${paymentId}`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Update commercial payment error:', error);
      throw error;
    }
  },

  // Delete commercial payment
  deleteCommercialPayment: async (commercialId, paymentId) => {
    try {
      const response = await api.delete(`/personnel/commercials/${commercialId}/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete commercial payment error:', error);
      throw error;
    }
  },

  // Get commercial payment statistics
  getCommercialPaymentStats: async (commercialId) => {
    try {
      const response = await api.get(`/personnel/commercials/${commercialId}/payment-stats`);
      return response.data || {};
    } catch (error) {
      console.error('Get commercial payment stats error:', error);
      return {};
    }
  },

  // Get all commercials for admin dropdown
  getCommercials: async () => {
    try {
      const response = await api.get('/personnel/commercials');
      return response.data || [];
    } catch (error) {
      console.error('Get commercials error:', error);
      return [];
    }
  },

  // Get shipper details with payments and parcels
  getShipperDetails: async (shipperId) => {
    try {
      const response = await api.get(`/shippers/${shipperId}/details`);
      return response.data;
    } catch (error) {
      console.error('Get shipper details error:', error);
      throw error;
    }
  },

  // Finance Management
  getComptables: async () => {
    try {
      console.log('🔍 Making API call to /personnel/accountants...');
      const response = await api.get('/personnel/accountants');
      console.log('🔍 Raw response from accountants API:', response);
      console.log('📊 Response data:', response.data);
      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('📋 Data array from response.data.data:', response.data.data);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('📋 Data array from response.data:', response.data);
        return response.data;
      } else {
        console.log('📋 No data found, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('❌ Get comptables error:', error);
      console.error('❌ Error details:', error.response?.data);
      return [];
    }
  },

  createComptable: async (comptableData) => {
    try {
      const response = await api.post('/personnel/accountants', comptableData);
      return response;
    } catch (error) {
      console.error('Create comptable error:', error);
      throw new Error('Failed to create comptable');
    }
  },

  updateComptable: async (id, comptableData) => {
    try {
      const response = await api.put(`/personnel/accountants/${id}`, comptableData);
      return response;
    } catch (error) {
      console.error('Update comptable error:', error);
      throw new Error('Failed to update comptable');
    }
  },

  deleteComptable: async (id) => {
    try {
      const response = await api.delete(`/personnel/accountants/${id}`);
      return response;
    } catch (error) {
      console.error('Delete comptable error:', error);
      throw new Error('Failed to delete comptable');
    }
  },

  // Agency Members Management
  getAgencyMembers: async () => {
    try {
      const response = await api.get('/personnel/agency-members');
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Get agency members error:', error);
      return [];
    }
  },

  createAgencyMember: async (memberData) => {
    try {
      const response = await api.post('/personnel/agency-members', memberData);
      return response;
    } catch (error) {
      console.error('Create agency member error:', error);
      throw new Error('Failed to create agency member');
    }
  },

  updateAgencyMember: async (id, memberData) => {
    try {
      const response = await api.put(`/personnel/agency-members/${id}`, memberData);
      return response;
    } catch (error) {
      console.error('Update agency member error:', error);
      throw new Error('Failed to update agency member');
    }
  },

  deleteAgencyMember: async (id) => {
    try {
      const response = await api.delete(`/personnel/agency-members/${id}`);
      return response;
    } catch (error) {
      console.error('Delete agency member error:', error);
      throw new Error('Failed to delete agency member');
    }
  },

  updateAgencyManager: async (id, data) => {
    try {
      const response = await api.put(`/personnel/agency-managers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update agency manager error:', error);
      throw error;
    }
  },

  // Sectors CRUD
  getSectors: async () => {
    try {
      const response = await api.get('/sectors');
      console.log('Frontend getSectors response:', response);
      return response.data || [];
    } catch (error) {
      console.error('Get sectors error:', error);
      return [];
    }
  },
  createSector: async (sectorData) => {
    try {
      const response = await api.post('/sectors', sectorData);
      return response.data;
    } catch (error) {
      console.error('Create sector error:', error);
      throw error;
    }
  },
  updateSector: async (id, sectorData) => {
    try {
      const response = await api.put(`/sectors/${id}`, sectorData);
      return response.data;
    } catch (error) {
      console.error('Update sector error:', error);
      throw error;
    }
  },
  deleteSector: async (id) => {
    try {
      const response = await api.delete(`/sectors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete sector error:', error);
      throw error;
    }
  },
  // Agency managers for dropdown
  getAgencyManagers: async () => {
    try {
      const response = await api.get('/personnel/agency-managers');
      console.log('Agency managers response:', response);
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Get agency managers error:', error);
      return [];
    }
  },

  // Create agency manager
  createAgencyManager: async (managerData) => {
    try {
      console.log('🔧 Frontend: Creating agency manager with data:', managerData);
      const response = await api.post('/personnel/agency-managers', managerData);
      console.log('🔧 Frontend: Raw response:', response);
      console.log('🔧 Frontend: Response data:', response.data);
      console.log('🔧 Frontend: Response data type:', typeof response.data);
      console.log('🔧 Frontend: Response data keys:', Object.keys(response.data || {}));
      return response.data;
    } catch (error) {
      console.error('Create agency manager error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Update agency manager
  updateAgencyManager: async (id, managerData) => {
    try {
      console.log('🔧 Frontend: Updating agency manager with data:', { id, managerData });
      const response = await api.put(`/personnel/agency-managers/${id}`, managerData);
      console.log('🔧 Frontend: Update response:', response);
      return response.data;
    } catch (error) {
      console.error('Update agency manager error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Delete agency manager
  deleteAgencyManager: async (id) => {
    try {
      const response = await api.delete(`/personnel/agency-managers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete agency manager error:', error);
      throw error;
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  },

  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        parcels: { total: 0, delivered: 0 },
        shippers: { total: 0 },
        drivers: { total: 0, active: 0 },
        revenue: { monthly: 0 }
      };
    }
  },

  // Agencies
  getAgencies: async () => {
    try {
      const response = await api.get('/agencies');
      console.log('Agencies response:', response);
      return response || [];
    } catch (error) {
      console.error('Get agencies error:', error);
      return [];
    }
  },

  // Complaints
  getComplaints: async (page = 1, limit = 10, filters = {}, user = null) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      // Get user info from localStorage if not provided
      let userInfo = user;
      if (!userInfo) {
        try {
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            userInfo = JSON.parse(currentUserStr);
            console.log('🔍 User from localStorage:', userInfo);
          } else {
            console.warn('No user found in localStorage');
          }
        } catch (e) {
          console.warn('Failed to get user from localStorage:', e);
        }
      }
      
      // Prepare headers with user info
      const headers = {};
      console.log('🔍 User parameter received:', user);
      console.log('🔍 User from store:', userInfo);
      console.log('🔍 User type:', typeof userInfo);
      console.log('🔍 User keys:', userInfo ? Object.keys(userInfo) : 'null');
      
      if (userInfo && userInfo.email && userInfo.role) {
        headers['user-email'] = userInfo.email;
        headers['user-role'] = userInfo.role;
        console.log('✅ Headers prepared:', headers);
      } else {
        console.warn('⚠️ No valid user found, headers will be empty');
        console.warn('⚠️ User object:', userInfo);
        console.warn('⚠️ User email:', userInfo?.email);
        console.warn('⚠️ User role:', userInfo?.role);
      }
      
      console.log('🔍 Calling complaints API with params:', params.toString());
      console.log('👤 User info in headers:', { email: userInfo?.email, role: userInfo?.role });
      
      const response = await api.get(`/complaints?${params}`, { headers });
      console.log('📡 Raw complaints response:', response);
      
      // The response interceptor returns response.data, so the structure is already flattened
      if (response && response.complaints) {
        console.log('✅ Complaints data found:', response);
        return response;
      } else {
        console.warn('⚠️ Unexpected complaints response format:', response);
        return { complaints: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    } catch (error) {
      console.error('❌ Get complaints error:', error);
      return { complaints: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    }
  },

  getExpediteurComplaints: async (email, page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await api.get(`/complaints/expediteur/${encodeURIComponent(email)}?${params}`);
      console.log('Expediteur complaints response:', response);
      
      if (response && response.complaints) {
        return response;
      } else {
        console.warn('Unexpected expediteur complaints response format:', response);
        return { complaints: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    } catch (error) {
      console.error('Get expediteur complaints error:', error);
      return { complaints: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    }
  },

  getComplaint: async (id) => {
    try {
      const response = await api.get(`/complaints/${id}`);
      console.log('Single complaint response:', response);
      
      if (response && response.id) {
        return response;
      } else {
        console.warn('Unexpected single complaint response format:', response);
        return null;
      }
    } catch (error) {
      console.error('Get complaint error:', error);
      return null;
    }
  },

  createComplaint: async (complaintData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(complaintData).forEach(key => {
        if (key !== 'attachments') {
          formData.append(key, complaintData[key]);
        }
      });
      
      // Add files
      if (complaintData.attachments && complaintData.attachments.length > 0) {
        complaintData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      
      console.log('Sending complaint data:', Object.fromEntries(formData));
      
      const response = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Create complaint response:', response);
      return response;
    } catch (error) {
      console.error('Create complaint error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create complaint');
      }
      throw new Error('Failed to create complaint');
    }
  },

  updateComplaint: async (id, updates) => {
    try {
      const response = await api.put(`/complaints/${id}`, updates);
      console.log('Update complaint response:', response);
      return response;
    } catch (error) {
      console.error('Update complaint error:', error);
      throw new Error('Failed to update complaint');
    }
  },

  deleteComplaint: async (id) => {
    try {
      const response = await api.delete(`/complaints/${id}`);
      console.log('Delete complaint response:', response);
      return response;
    } catch (error) {
      console.error('Delete complaint error:', error);
      throw new Error('Failed to delete complaint');
    }
  },

  // Demands API functions
  getDemands: async (params = '') => {
    try {
      console.log('🔍 Calling demands API with params:', params);
      const response = await api.get(`/demands?${params}`);
      console.log('📡 Demands API response:', response);
      console.log('📡 Demands API response type:', typeof response);
      return response;
    } catch (error) {
      console.error('❌ Demands API error:', error);
      console.error('❌ Demands API error response:', error.response);
      throw error;
    }
  },

  getDemand: async (id) => {
    try {
      console.log('🔍 getDemand called with id:', id);
      const response = await api.get(`/demands/${id}`);
      console.log('📡 getDemand response:', response);
      return response;
    } catch (error) {
      console.error('❌ getDemand error:', error);
      throw error;
    }
  },

  createDemand: async (demandData) => {
    try {
      console.log('🚀 createDemand called with data:', demandData);
      const response = await api.post('/demands', demandData);
      console.log('📡 createDemand response:', response);
      return response;
    } catch (error) {
      console.error('❌ createDemand error:', error);
      throw error;
    }
  },

  updateDemandStatus: async (id, status, reviewNotes) => {
    try {
      console.log('🔄 updateDemandStatus called with id:', id, 'status:', status);
      const response = await api.put(`/demands/${id}/status`, { status, review_notes: reviewNotes });
      console.log('📡 updateDemandStatus response:', response);
      return response;
    } catch (error) {
      console.error('❌ updateDemandStatus error:', error);
      throw error;
    }
  },

  deleteDemand: async (id) => {
    try {
      console.log('🗑️ deleteDemand called with id:', id);
      const response = await api.delete(`/demands/${id}`);
      console.log('📡 deleteDemand response:', response);
      return response;
    } catch (error) {
      console.error('❌ deleteDemand error:', error);
      throw error;
    }
  },

  getAvailableParcels: async (expediteurEmail) => {
    try {
      console.log('🔍 getAvailableParcels called for:', expediteurEmail);
      const response = await api.get(`/demands/available-parcels/${encodeURIComponent(expediteurEmail)}`);
      console.log('📡 getAvailableParcels response:', response);
      console.log('📡 getAvailableParcels response type:', typeof response);
      return response;
    } catch (error) {
      console.error('❌ getAvailableParcels error:', error);
      throw error;
    }
  },

  scanParcel: async (demandId, trackingNumber) => {
    try {
      console.log('📱 scanParcel called with demandId:', demandId, 'trackingNumber:', trackingNumber);
      const response = await api.put(`/demands/${demandId}/scan-parcel`, { tracking_number: trackingNumber });
      console.log('📡 scanParcel response:', response);
      return response;
    } catch (error) {
      console.error('❌ scanParcel error:', error);
      throw error;
    }
  },

  getAcceptedMissions: async (excludeInMissions = false) => {
    try {
      console.log('🔍 Calling accepted missions API...');
      console.log('🔍 Exclude in missions:', excludeInMissions);
      const params = new URLSearchParams({ status: 'Accepted' });
      if (excludeInMissions) {
        params.append('exclude_in_missions', 'true');
        console.log('🔍 Added exclude_in_missions parameter');
      }
      const response = await api.get(`/demands?${params.toString()}`);
      console.log('📡 Accepted missions API response:', response);
      console.log('📡 Response structure:', {
        hasDemands: !!response.demands,
        demandsLength: response.demands?.length,
        responseKeys: Object.keys(response || {})
      });
      return response.demands || response || [];
    } catch (error) {
      console.error('❌ getAcceptedMissions error:', error);
      throw error;
    }
  },

  getParcelsByDemand: async (demandId) => {
    try {
      console.log('🔍 Calling parcels by demand API for demand ID:', demandId);
      const response = await api.get(`/demands/${demandId}/parcels`);
      console.log('📡 Parcels by demand API response:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ getParcelsByDemand error:', error);
      throw error;
    }
  },

  // Chef d'agence scan parcel at entrepôt
  chefAgenceScanParcel: async (missionId, parcelId) => {
    try {
      console.log('🔍 Chef agence scanning parcel:', parcelId, 'for mission:', missionId);
      const response = await api.post(`/missions-pickup/${missionId}/chef-agence-scan`, { parcelId });
      console.log('📡 Chef agence scan response:', response);
      return response;
    } catch (error) {
      console.error('❌ chefAgenceScanParcel error:', error);
      throw error;
    }
  },

  // Chef d'agence generate completion code
  generateCompletionCode: async (missionId, scannedParcels) => {
    try {
      console.log('🔍 Generating completion code for mission:', missionId);
      console.log('🔍 Scanned parcels being sent:', scannedParcels);
      
      const response = await api.post(`/missions-pickup/${missionId}/generate-completion-code`, { scannedParcels });
      console.log('📡 Generate completion code response:', response);
      return response;
    } catch (error) {
      console.error('❌ generateCompletionCode error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }
};

// Export complaints functions
export const {
  getComplaints,
  getExpediteurComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = apiService;

// Export demands functions
export const demandsService = {
  getDemands: apiService.getDemands,
  getDemand: apiService.getDemand,
  createDemand: apiService.createDemand,
  updateDemandStatus: apiService.updateDemandStatus,
  deleteDemand: apiService.deleteDemand,
  getAvailableParcels: apiService.getAvailableParcels,
  scanParcel: apiService.scanParcel
};

// Warehouses API functions
export const warehousesService = {
  getWarehouses: async () => {
    try {
      console.log('🔍 Calling warehouses API...');
      const response = await api.get('/warehouses');
      console.log('📡 Warehouses API response:', response);
      console.log('📡 Response data type:', typeof response.data);
      console.log('📡 Response data keys:', Object.keys(response.data || {}));
      console.log('📡 Full response data:', response.data);
      // response.data contains the actual API response (with success and data properties)
      return response.data;
    } catch (error) {
      console.error('❌ Warehouses API error:', error);
      return { success: false, data: [] };
    }
  },

  getWarehouseDetails: async (id) => {
    try {
      console.log('🔍 Calling warehouse details API for ID:', id);
      const response = await api.get(`/warehouses/${id}`);
      console.log('📡 Warehouse details API response:', response);
      // response.data contains the actual API response (with success and data properties)
      return response.data;
    } catch (error) {
      console.error('❌ Warehouse details API error:', error);
      return { success: false, data: null };
    }
  },

  getAgencyWarehouseDetails: async (agency) => {
    try {
      console.log('🔍 Calling agency warehouse details API for agency:', agency);
      const response = await api.get(`/warehouses/agency/${encodeURIComponent(agency)}`);
      console.log('📡 Agency warehouse details API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Agency warehouse details API error:', error);
      return { success: false, data: null };
    }
  },

  getAvailableManagers: async () => {
    try {
      console.log('🔍 Calling available managers API...');
      const response = await api.get('/warehouses/available-managers');
      console.log('📡 Available managers API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Available managers API error:', error);
      return { success: false, data: [] };
    }
  },

  createWarehouse: async (warehouseData) => {
    try {
      console.log('🚀 createWarehouse called with data:', warehouseData);
      const response = await api.post('/warehouses', warehouseData);
      console.log('📡 createWarehouse response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ createWarehouse error:', error);
      throw error;
    }
  },

  updateWarehouse: async (id, warehouseData) => {
    try {
      console.log('🔄 updateWarehouse called with id:', id, 'data:', warehouseData);
      const response = await api.put(`/warehouses/${id}`, warehouseData);
      console.log('📡 updateWarehouse response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ updateWarehouse error:', error);
      throw error;
    }
  },

  deleteWarehouse: async (id) => {
    try {
      console.log('🗑️ deleteWarehouse called with id:', id);
      const response = await api.delete(`/warehouses/${id}`);
      console.log('📡 deleteWarehouse response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ deleteWarehouse error:', error);
      throw error;
    }
  }
}; 

// Pickup Missions API functions
export const pickupMissionsService = {
  getPickupMissions: async (params = '') => {
    try {
      console.log('🔍 Calling pickup missions API with params:', params);
      const response = await api.get(`/pickup-missions?${params}`);
      console.log('📡 Pickup Missions API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Pickup Missions API error:', error);
      throw error;
    }
  },

  getPickupMission: async (id) => {
    try {
      console.log('🔍 Calling pickup mission details API for ID:', id);
      const response = await api.get(`/pickup-missions/${id}`);
      console.log('📡 Pickup Mission Details API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Pickup Mission Details API error:', error);
      throw error;
    }
  },

  createPickupMission: async (missionData) => {
    try {
      console.log('🚀 createPickupMission called with data:', missionData);
      const response = await api.post('/pickup-missions', missionData);
      console.log('📡 createPickupMission response:', response);
      return response;
    } catch (error) {
      console.error('❌ createPickupMission error:', error);
      throw error;
    }
  },

  updatePickupMissionStatus: async (missionId, status, notes) => {
    try {
      console.log('🔄 updatePickupMissionStatus called for mission:', missionId, 'with status:', status);
      const response = await api.put(`/pickup-missions/${missionId}/status`, { status, notes });
      console.log('📡 updatePickupMissionStatus response:', response);
      return response;
    } catch (error) {
      console.error('❌ updatePickupMissionStatus error:', error);
      throw error;
    }
  },

  getAvailableLivreurs: async () => {
    try {
      console.log('🔍 Calling available livreurs API');
      const response = await api.get('/pickup-missions/available-livreurs');
      console.log('📡 Available Livreurs API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Available Livreurs API error:', error);
      throw error;
    }
  }
};

// Driver API functions
export const driverService = {
  getDriverStats: async () => {
    try {
      const response = await api.get('/drivers/stats');
      return response.data || response;
    } catch (error) {
      console.error('Get driver stats error:', error);
      throw error;
    }
  },

  getDriverMissions: async () => {
    try {
      const response = await api.get('/drivers/missions');
      return response.data || response;
    } catch (error) {
      console.error('Get driver missions error:', error);
      throw error;
    }
  },

  getDriverPickupMissions: async () => {
    try {
      console.log('🚀 getDriverPickupMissions called');
      console.log('📡 Making API call to /drivers/pickup-missions');
      
      const response = await api.get('/drivers/pickup-missions');
      console.log('✅ getDriverPickupMissions response:', response);
      
      return response.data || response;
    } catch (error) {
      console.error('❌ Get driver pickup missions error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      throw error;
    }
  },

  acceptPickupMission: async (missionId) => {
    try {
      const response = await api.post(`/drivers/pickup-missions/${missionId}/accept`);
      return response.data || response;
    } catch (error) {
      console.error('Accept pickup mission error:', error);
      throw error;
    }
  },

  refusePickupMission: async (missionId) => {
    try {
      const response = await api.post(`/drivers/pickup-missions/${missionId}/refuse`);
      return response.data || response;
    } catch (error) {
      console.error('Refuse pickup mission error:', error);
      throw error;
    }
  },

  completePickupScan: async (missionId, scannedParcels) => {
    try {
      const response = await api.post(`/drivers/pickup-missions/${missionId}/scan-complete`, {
        scannedParcels
      });
      return response.data || response;
    } catch (error) {
      console.error('Complete pickup scan error:', error);
      throw error;
    }
  },

  completePickupMission: async (missionId, missionCode) => {
    try {
      const response = await api.post(`/drivers/pickup-missions/${missionId}/complete`, {
        missionCode
      });
      return response.data || response;
    } catch (error) {
      console.error('Complete pickup mission error:', error);
      throw error;
    }
  }
};

// Missions de collecte (missions_pickup)
export const missionsPickupService = {
  getMissionsPickup: async (params = {}) => {
    try {
      console.log('🔍 Calling missions-pickup API with params:', params);
      const response = await api.get('/missions-pickup', { params });
      console.log('📡 Missions API response:', response);
      console.log('📡 Missions data:', response.data);
      
      // Return the full response data structure
      return response.data;
    } catch (error) {
      console.error('❌ Missions API error:', error);
      return { success: false, data: [] };
    }
  },
  createMissionPickup: async (data) => {
    try {
      console.log('🚀 createMissionPickup called with data:', data);
      console.log('🔍 Data type:', typeof data);
      console.log('🔍 Data keys:', Object.keys(data));
      console.log('🔍 livreur_id:', data.livreur_id, 'type:', typeof data.livreur_id);
      console.log('🔍 demand_ids:', data.demand_ids, 'type:', typeof data.demand_ids, 'length:', data.demand_ids?.length);
      
      const response = await api.post('/missions-pickup', data);
      console.log('📡 createMissionPickup response:', response);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ createMissionPickup error:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error statusText:', error.response?.statusText);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error headers:', error.response?.headers);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
  },
  updateMissionPickup: async (id, data) => {
    try {
      console.log('🔄 updateMissionPickup called with id:', id, 'data:', data);
      const response = await api.put(`/missions-pickup/${id}`, data);
      console.log('📡 updateMissionPickup response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ updateMissionPickup error:', error);
      throw error;
    }
  },
  deleteMissionPickup: async (id) => {
    const response = await api.delete(`/missions-pickup/${id}`);
    return response.data;
  },
  
  getMissionSecurityCode: async (id) => {
    try {
      console.log('🔐 getMissionSecurityCode called with id:', id);
      const response = await api.get(`/missions-pickup/${id}/security-code`);
      console.log('📡 Security code response:', response);
      console.log('📡 Response data:', response.data);
      console.log('📡 Response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ getMissionSecurityCode error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },
  
  getMissionPickup: async (id) => {
    try {
      console.log('🔍 getMissionPickup called with id:', id);
      const response = await api.get(`/missions-pickup/${id}`);
      console.log('📡 getMissionPickup response:', response);
      // The response is already the data due to the API interceptor
      return response;
    } catch (error) {
      console.error('❌ getMissionPickup error:', error);
      throw error;
    }
  },
  
  scanParcel: async (missionId, trackingNumber) => {
    try {
      console.log('📱 scanParcel called with missionId:', missionId, 'trackingNumber:', trackingNumber);
      const response = await api.put(`/missions-pickup/${missionId}/scan-parcel`, { tracking_number: trackingNumber });
      console.log('📡 scanParcel response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ scanParcel error:', error);
      throw error;
    }
  },
  

}; 

// Delivery missions service
export const deliveryMissionsService = {
  getDeliveryMissions: async (params = {}) => {
    try {
      console.log('🔍 Calling delivery-missions API with params:', params);
      const response = await api.get('/delivery-missions', { params });
      console.log('📡 Delivery missions API response:', response);
      console.log('📡 Delivery missions data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Delivery missions API error:', error);
      return { success: false, data: [] };
    }
  },

  getDeliveryMission: async (id) => {
    try {
      console.log('🔍 getDeliveryMission called with id:', id);
      const response = await api.get(`/delivery-missions/${id}`);
      console.log('📡 getDeliveryMission response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ getDeliveryMission error:', error);
      throw error;
    }
  },

  createDeliveryMission: async (data) => {
    try {
      console.log('🚀 createDeliveryMission called with data:', data);
      const response = await api.post('/delivery-missions', data);
      console.log('📡 createDeliveryMission response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ createDeliveryMission error:', error);
      throw error;
    }
  },

  updateDeliveryMission: async (id, data) => {
    try {
      console.log('🔄 updateDeliveryMission called with id:', id, 'data:', data);
      const response = await api.put(`/delivery-missions/${id}`, data);
      console.log('📡 updateDeliveryMission response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ updateDeliveryMission error:', error);
      throw error;
    }
  },

  deleteDeliveryMission: async (id) => {
    try {
      console.log('🗑️ deleteDeliveryMission called with id:', id);
      const response = await api.delete(`/delivery-missions/${id}`);
      console.log('📡 deleteDeliveryMission response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ deleteDeliveryMission error:', error);
      throw error;
    }
  },

  processDelivery: async (missionId, data) => {
    try {
      console.log('📦 processDelivery called with missionId:', missionId, 'data:', data);
      const response = await api.post(`/delivery-missions/${missionId}/deliver`, data);
      console.log('📡 processDelivery response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ processDelivery error:', error);
      throw error;
    }
  },

  getAvailableParcels: async () => {
    try {
      console.log('🔍 getAvailableParcels called');
      const response = await api.get('/delivery-missions/available-parcels');
      console.log('📡 getAvailableParcels response:', response);
      console.log('📡 getAvailableParcels data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getAvailableParcels error:', error);
      return { success: false, data: [] };
    }
  },
};