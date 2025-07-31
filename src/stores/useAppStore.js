import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for better type safety
const createAppStore = (set, get) => ({
  // User state
  user: null,
  isAuthenticated: false,
  
  // Data states
  parcels: [],
  shippers: [],
  drivers: [],
  warehouses: [],
  sectors: [],
  complaints: [],
  payments: [],
  missions: [],
  
  // UI states
  loading: false,
  error: null,
  selectedParcel: null,
  selectedShipper: null,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Parcels actions
  setParcels: (parcels) => set({ parcels }),
  addParcel: (parcel) => set((state) => ({ 
    parcels: [...state.parcels, { ...parcel, id: `COL${String(Math.max(...state.parcels.map(p => parseInt(p.id.slice(3)))) + 1).padStart(3, "0")}` }] 
  })),
  updateParcel: (id, updates) => set((state) => ({
    parcels: state.parcels.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deleteParcel: (id) => set((state) => ({
    parcels: state.parcels.filter(p => p.id !== id)
  })),
  
  // Shippers actions
  setShippers: (shippers) => set({ shippers }),
  addShipper: (shipper) => set((state) => ({ 
    shippers: [...state.shippers, { ...shipper, id: Math.max(...state.shippers.map(s => s.id)) + 1 }] 
  })),
  updateShipper: (id, updates) => set((state) => ({
    shippers: state.shippers.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  deleteShipper: (id) => set((state) => ({
    shippers: state.shippers.filter(s => s.id !== id)
  })),
  
  // Drivers actions
  setDrivers: (drivers) => set({ drivers }),
  addDriver: (driver) => set((state) => ({ 
    drivers: [...state.drivers, { ...driver, id: Math.max(...state.drivers.map(d => d.id)) + 1 }] 
  })),
  updateDriver: (id, updates) => set((state) => ({
    drivers: state.drivers.map(d => d.id === id ? { ...d, ...updates } : d)
  })),
  deleteDriver: (id) => set((state) => ({
    drivers: state.drivers.filter(d => d.id !== id)
  })),
  
  // UI actions
  setSelectedParcel: (parcel) => set({ selectedParcel: parcel }),
  setSelectedShipper: (shipper) => set({ selectedShipper: shipper }),
  
  // Computed values
  getParcelById: (id) => get().parcels.find(p => p.id === id),
  getShipperById: (id) => get().shippers.find(s => s.id === id),
  getDriverById: (id) => get().drivers.find(d => d.id === id),
});

export const useAppStore = create(
  persist(createAppStore, {
    name: 'quickzone-store',
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      parcels: state.parcels,
      shippers: state.shippers,
      drivers: state.drivers,
    }),
  })
); 