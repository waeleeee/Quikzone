import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import toast from 'react-hot-toast';

// Custom hook for parcels
export const useParcels = () => {
  const { setParcels, setLoading, setError } = useAppStore();
  
  return useQuery({
    queryKey: ['parcels'],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await apiService.getParcels();
        setParcels(data);
        return data;
      } catch (error) {
        setError(error.message);
        toast.error('Erreur lors du chargement des colis');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateParcel = () => {
  const queryClient = useQueryClient();
  const { addParcel } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.createParcel,
    onSuccess: (newParcel) => {
      addParcel(newParcel);
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      toast.success('Colis créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du colis');
      console.error('Create parcel error:', error);
    },
  });
};

export const useUpdateParcel = () => {
  const queryClient = useQueryClient();
  const { updateParcel } = useAppStore();
  
  return useMutation({
    mutationFn: ({ id, updates }) => apiService.updateParcel(id, updates),
    onSuccess: (updatedParcel) => {
      updateParcel(updatedParcel.id, updatedParcel);
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      toast.success('Colis mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du colis');
      console.error('Update parcel error:', error);
    },
  });
};

export const useDeleteParcel = () => {
  const queryClient = useQueryClient();
  const { deleteParcel } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.deleteParcel,
    onSuccess: (_, parcelId) => {
      deleteParcel(parcelId);
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      toast.success('Colis supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du colis');
      console.error('Delete parcel error:', error);
    },
  });
};

// Custom hook for shippers
export const useShippers = () => {
  const { setShippers, setLoading, setError } = useAppStore();
  
  return useQuery({
    queryKey: ['shippers'],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await apiService.getShippers();
        setShippers(data);
        return data;
      } catch (error) {
        setError(error.message);
        toast.error('Erreur lors du chargement des expéditeurs');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateShipper = () => {
  const queryClient = useQueryClient();
  const { addShipper } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.createShipper,
    onSuccess: (newShipper) => {
      addShipper(newShipper);
      queryClient.invalidateQueries({ queryKey: ['shippers'] });
      toast.success('Expéditeur créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'expéditeur');
      console.error('Create shipper error:', error);
    },
  });
};

export const useUpdateShipper = () => {
  const queryClient = useQueryClient();
  const { updateShipper } = useAppStore();
  
  return useMutation({
    mutationFn: ({ id, updates }) => apiService.updateShipper(id, updates),
    onSuccess: (updatedShipper) => {
      updateShipper(updatedShipper.id, updatedShipper);
      queryClient.invalidateQueries({ queryKey: ['shippers'] });
      toast.success('Expéditeur mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour de l\'expéditeur');
      console.error('Update shipper error:', error);
    },
  });
};

export const useDeleteShipper = () => {
  const queryClient = useQueryClient();
  const { deleteShipper } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.deleteShipper,
    onSuccess: (_, shipperId) => {
      deleteShipper(shipperId);
      queryClient.invalidateQueries({ queryKey: ['shippers'] });
      toast.success('Expéditeur supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de l\'expéditeur');
      console.error('Delete shipper error:', error);
    },
  });
};

// Custom hook for drivers
export const useDrivers = () => {
  const { setDrivers, setLoading, setError } = useAppStore();
  
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await apiService.getDrivers();
        setDrivers(data);
        return data;
      } catch (error) {
        setError(error.message);
        toast.error('Erreur lors du chargement des livreurs');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  const { addDriver } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.createDriver,
    onSuccess: (newDriver) => {
      addDriver(newDriver);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Livreur créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du livreur');
      console.error('Create driver error:', error);
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  const { updateDriver } = useAppStore();
  
  return useMutation({
    mutationFn: ({ id, updates }) => apiService.updateDriver(id, updates),
    onSuccess: (updatedDriver) => {
      updateDriver(updatedDriver.id, updatedDriver);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Livreur mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du livreur');
      console.error('Update driver error:', error);
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  const { deleteDriver } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.deleteDriver,
    onSuccess: (_, driverId) => {
      deleteDriver(driverId);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Livreur supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du livreur');
      console.error('Delete driver error:', error);
    },
  });
};

// Authentication hooks
export const useLogin = () => {
  const { setUser } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.login,
    onSuccess: ({ user, token }) => {
      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      toast.success('Connexion réussie');
    },
    onError: (error) => {
      toast.error('Erreur de connexion: ' + error.message);
    },
  });
};

export const useLogout = () => {
  const { logout } = useAppStore();
  
  return useMutation({
    mutationFn: apiService.logout,
    onSuccess: () => {
      logout();
      toast.success('Déconnexion réussie');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still logout even if API call fails
      logout();
    },
  });
}; 