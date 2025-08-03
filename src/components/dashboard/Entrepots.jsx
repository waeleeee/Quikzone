import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import html2pdf from "html2pdf.js";
import ActionButtons from "./common/ActionButtons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FactureColis from "./FactureColis";
import BonLivraisonColis from "./BonLivraisonColis";
import { warehousesService } from "../../services/api";

// List of Tunisian governorates
const gouvernorats = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", 
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine", 
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", 
  "Tozeur", "Tunis", "Zaghouan"
];

// Statuses and their colors (matching the legend)
const COLIS_STATUSES = [
  { key: "En attente", label: "En attente", color: "#F59E42" },
  { key: "À enlever", label: "À enlever", color: "#F59E42" },
  { key: "Enlevé", label: "Enlevé", color: "#8B5CF6" },
  { key: "Au dépôt", label: "Au dépôt", color: "#3B82F6" },
  { key: "En cours", label: "En cours", color: "#A78BFA" },
  { key: "Rtn dépôt", label: "RTN dépôt", color: "#FB923C" },
  { key: "Livrés", label: "Livrés", color: "#22C55E" },
  { key: "Livrés payés", label: "Livrés payés", color: "#16A34A" },
  { key: "Retour définitif", label: "Retour définitif", color: "#EF4444" },
  { key: "Rtn Client Agence", label: "RTN client dépôt", color: "#EC4899" },
  { key: "Retour Expéditeur", label: "Retour Expéditeur", color: "#6B7280" },
  { key: "Retour en cours d'expédition", label: "Retour En Cours d'expédition", color: "#6366F1" },
  { key: "Retour reçu", label: "Retour reçu", color: "#06B6D4" },
];

const Entrepots = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    gouvernorat: "Tunis",
    manager: "",
    assignedAgency: "",
    status: "Actif",
  });
  const [chefAgences, setChefAgences] = useState([]);
  const [colisModal, setColisModal] = useState({ open: false, status: null, colis: [] });
  const [factureColis, setFactureColis] = useState(null);
  const [bonLivraisonColis, setBonLivraisonColis] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcelDetailsModal, setParcelDetailsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userAgency, setUserAgency] = useState(null);
  const [agencyParcels, setAgencyParcels] = useState([]);
  const [agencyParcelStats, setAgencyParcelStats] = useState({});
  const [agencyUsers, setAgencyUsers] = useState([]);
  const [showingAllWarehouses, setShowingAllWarehouses] = useState(false);

  // Helper functions for calculating real statistics
  const calculateAverageDeliveryTime = (parcels) => {
    if (!parcels || parcels.length === 0) return '0h';
    
    const deliveredParcels = parcels.filter(parcel => 
      parcel.status === 'Livrés' || parcel.status === 'Livrés payés'
    );
    
    if (deliveredParcels.length === 0) return '0h';
    
    let totalHours = 0;
    let validDeliveries = 0;
    
    deliveredParcels.forEach(parcel => {
      if (parcel.created_at && parcel.delivery_date) {
        const created = new Date(parcel.created_at);
        const delivered = new Date(parcel.delivery_date);
        const hoursDiff = (delivered - created) / (1000 * 60 * 60);
        if (hoursDiff > 0 && hoursDiff < 720) { // Between 0 and 30 days
          totalHours += hoursDiff;
          validDeliveries++;
        }
      }
    });
    
    if (validDeliveries === 0) return '0h';
    const avgHours = Math.round(totalHours / validDeliveries);
    return `${avgHours}h`;
  };

  const calculateMonthlyGrowth = (parcels) => {
    if (!parcels || parcels.length === 0) return '0%';
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthParcels = parcels.filter(parcel => {
      const parcelDate = new Date(parcel.created_at);
      return parcelDate.getMonth() === currentMonth && parcelDate.getFullYear() === currentYear;
    });
    
    const lastMonthParcels = parcels.filter(parcel => {
      const parcelDate = new Date(parcel.created_at);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return parcelDate.getMonth() === lastMonth && parcelDate.getFullYear() === lastYear;
    });
    
    if (lastMonthParcels.length === 0) return currentMonthParcels.length > 0 ? '+100%' : '0%';
    
    const growth = ((currentMonthParcels.length - lastMonthParcels.length) / lastMonthParcels.length) * 100;
    return `${growth >= 0 ? '+' : ''}${Math.round(growth)}%`;
  };

  const calculateCustomerSatisfaction = (parcels) => {
    if (!parcels || parcels.length === 0) return '0/5';
    
    const deliveredParcels = parcels.filter(parcel => 
      parcel.status === 'Livrés' || parcel.status === 'Livrés payés'
    );
    
    if (deliveredParcels.length === 0) return '0/5';
    
    // Simulate satisfaction based on delivery success rate and timing
    const totalDelivered = deliveredParcels.length;
    const onTimeDeliveries = deliveredParcels.filter(parcel => {
      if (parcel.created_at && parcel.delivery_date) {
        const created = new Date(parcel.created_at);
        const delivered = new Date(parcel.delivery_date);
        const hoursDiff = (delivered - created) / (1000 * 60 * 60);
        return hoursDiff <= 48; // On time if delivered within 48 hours
      }
      return true;
    }).length;
    
    const satisfactionRate = onTimeDeliveries / totalDelivered;
    const rating = Math.round(satisfactionRate * 5 * 10) / 10; // Scale to 5 stars
    return `${rating}/5`;
  };


  // Get current user from localStorage on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    console.log('🔍 Current user:', user);
    console.log('🔍 User role:', user?.role);
    console.log('🔍 User email:', user?.email);
  }, []);

  // Fetch warehouses data when currentUser is available
  useEffect(() => {
    if (currentUser) {
      fetchWarehouses();
      fetchChefAgences();
    }
  }, [currentUser]);

  // Fetch warehouse agency parcels and users when selectedWarehouse changes
  useEffect(() => {
    if (selectedWarehouse && currentUser && currentUser.role === 'Chef d\'agence') {
      fetchWarehouseAgencyParcels(selectedWarehouse);
      fetchAgencyUsers(selectedWarehouse);
    }
  }, [selectedWarehouse, currentUser]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching warehouses data...');
      
      const response = await warehousesService.getWarehouses();
      console.log('📦 Raw warehouses data received:', response);
      
      // Handle both expected format (response.success && response.data) and direct array format
      let warehousesData = [];
      if (response && response.success && response.data) {
        warehousesData = response.data;
      } else if (Array.isArray(response)) {
        warehousesData = response;
      } else {
        console.warn('⚠️ Unexpected warehouses response format:', response);
        setWarehouses([]);
        return;
      }
      
      // Filter warehouses by agency for Chef d'agence users
      let filteredWarehousesData = warehousesData;
      if (currentUser && currentUser.role === 'Chef d\'agence') {
        console.log('🔍 User is Chef d\'agence, applying agency filtering...');
        
        try {
          // Get user's agency from agency_managers table
          const { apiService } = await import('../../services/api');
          const agencyManagerResponse = await apiService.getAgencyManagers();
          const agencyManager = agencyManagerResponse.find(am => am.email === currentUser.email);
          
          if (agencyManager) {
            setUserAgency(agencyManager.agency);
            console.log('🔍 User agency:', agencyManager.agency);
            console.log('🔍 User governorate:', agencyManager.governorate);
            console.log('🔍 All warehouses before filtering:', warehousesData.map(w => ({ name: w.name, governorate: w.governorate })));
            
            // Filter warehouses by governorate (assuming governorate corresponds to agency)
            // This is a simplified approach - you might need to adjust based on your data structure
            filteredWarehousesData = warehousesData.filter(warehouse => {
              const warehouseGovernorate = warehouse.governorate;
              const matchesAgency = warehouseGovernorate === agencyManager.governorate;
              
              console.log(`🔍 Checking warehouse ${warehouse.name}: governorate="${warehouseGovernorate}" vs user governorate="${agencyManager.governorate}", matches=${matchesAgency}`);
              
              return matchesAgency;
            });
            
            console.log('🔍 Filtered warehouses count:', filteredWarehousesData.length);
            console.log('🔍 Filtered warehouses:', filteredWarehousesData.map(w => ({ name: w.name, governorate: w.governorate })));
            
            // If no warehouses found for the specific governorate, show only Tunis Central warehouse
            if (filteredWarehousesData.length === 0) {
              console.log('⚠️ No warehouses found for governorate:', agencyManager.governorate);
              console.log('⚠️ Showing only Tunis Central warehouse as fallback');
              filteredWarehousesData = warehousesData.filter(warehouse => warehouse.name === 'Entrepôt Tunis Central');
            }
          } else {
            console.log('⚠️ Agency manager not found for user:', currentUser.email);
          }
        } catch (error) {
          console.error('❌ Error fetching agency manager data:', error);
        }
      } else {
        console.log('🔍 User is not Chef d\'agence, showing all warehouses');
      }
      
      // Transform the data to match the expected format
      const transformedWarehouses = filteredWarehousesData.map(warehouse => ({
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.governorate,
          gouvernorat: warehouse.governorate,
          manager: warehouse.manager_name || 'Non assigné',
          currentStock: warehouse.current_stock && warehouse.capacity ? `${Math.round((warehouse.current_stock / warehouse.capacity) * 100)}%` : '0%',
          status: warehouse.status || 'Actif',
          address: warehouse.address || 'Non renseignée',
          phone: warehouse.manager_phone || 'Non renseigné',
          email: warehouse.manager_email || 'Non renseigné',
          createdAt: new Date(warehouse.created_at).toLocaleDateString('fr-FR'),
          capacity: warehouse.capacity || 100,
          current_stock: warehouse.current_stock || 0,
          manager_id: warehouse.manager_id,
          // Default statistics (will be updated when warehouse details are fetched)
          statistics: {
            totalPackages: 0,
            deliveredToday: 0,
            pendingPackages: 0,
            averageDeliveryTime: '0h',
            monthlyGrowth: '0%',
            customerSatisfaction: '0/5'
          },
          users: [],
          parcelsByStatus: []
        }));
        
        setWarehouses(transformedWarehouses);
        console.log('✅ Warehouses data transformed and set:', transformedWarehouses);
        
        // For Chef d'agence users, automatically show the first warehouse details
        if (currentUser && currentUser.role === 'Chef d\'agence' && transformedWarehouses.length > 0) {
          console.log('🔍 Auto-selecting first warehouse for Chef d\'agence');
          const firstWarehouse = transformedWarehouses[0];
          setSelectedWarehouse(firstWarehouse);
          // Fetch detailed information for the selected warehouse
          await fetchWarehouseDetails(firstWarehouse.id);
          // Fetch warehouse agency parcels
          await fetchWarehouseAgencyParcels(firstWarehouse);
          // Fetch warehouse agency users
          await fetchAgencyUsers(firstWarehouse);
        }
    } catch (error) {
      console.error('❌ Error fetching warehouses:', error);
      setError('Failed to fetch warehouses data');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChefAgences = async () => {
    try {
      console.log('🔍 Fetching available Chef d\'agence users...');
      const { apiService } = await import('../../services/api');
      const agencyManagersResponse = await apiService.getAgencyManagers();
      
      // Filter only agency managers without an agency assigned
      const availableChefAgences = agencyManagersResponse.filter(manager => 
        !manager.agency || manager.agency.trim() === ''
      );
      
      const chefAgencesList = availableChefAgences.map(manager => ({
        id: manager.id,
        name: manager.name,
        email: manager.email
      }));
      
      setChefAgences(chefAgencesList);
      console.log('✅ Available Chef d\'agence users loaded:', chefAgencesList);
      console.log('📊 Total available:', chefAgencesList.length);
    } catch (error) {
      console.error('❌ Error fetching available Chef d\'agence users:', error);
    }
  };

  const fetchWarehouseAgencyParcels = async (warehouse) => {
    if (!warehouse || !warehouse.gouvernorat) {
      return;
    }

    try {
      console.log('🔍 Fetching parcels for warehouse agency:', warehouse.gouvernorat);
      
      // Get all shippers in the warehouse's governorate/agency
      const { apiService } = await import('../../services/api');
      const shippersData = await apiService.getShippers();
      const warehouseAgencyShippers = shippersData.filter(shipper => shipper.agency === warehouse.gouvernorat);
      const warehouseAgencyShipperIds = warehouseAgencyShippers.map(shipper => shipper.id);
      
      console.log('🔍 Warehouse agency shippers:', warehouseAgencyShippers.map(s => ({ id: s.id, name: s.name, agency: s.agency })));
      console.log('🔍 Warehouse agency shipper IDs:', warehouseAgencyShipperIds);

      // Get all parcels
      const parcelsData = await apiService.getParcels();
      
      // Filter parcels by warehouse agency shippers
      const warehouseAgencyParcels = parcelsData.filter(parcel => 
        warehouseAgencyShipperIds.includes(parcel.shipper_id) ||
        warehouseAgencyShippers.some(shipper => 
          shipper.name === parcel.shipper_name || 
          shipper.code === parcel.shipper_code
        )
      );
      
      console.log('🔍 Warehouse agency parcels found:', warehouseAgencyParcels.length);
      
      // Calculate status distribution
      const statusStats = {};
      const allStatuses = [
        'En attente', 'À enlever', 'Enlevé', 'Au dépôt', 'En cours', 
        'RTN dépôt', 'Livrés', 'Livrés payés', 'Retour définitif', 
        'RTN client agence', 'Retour Expéditeur', 'Retour En Cours d\'expédition', 'Retour reçu'
      ];
      
      // Initialize all statuses with 0
      allStatuses.forEach(status => {
        statusStats[status] = 0;
      });
      
      // Count parcels by status
      warehouseAgencyParcels.forEach(parcel => {
        const status = parcel.status || 'En attente';
        statusStats[status] = (statusStats[status] || 0) + 1;
      });
      
      console.log('🔍 Warehouse agency parcel status stats:', statusStats);
      
      setAgencyParcels(warehouseAgencyParcels);
      setAgencyParcelStats(statusStats);
      
    } catch (error) {
      console.error('❌ Error fetching warehouse agency parcels:', error);
    }
  };

  const fetchAgencyUsers = async (warehouse) => {
    if (!warehouse || !warehouse.gouvernorat) {
      return;
    }

    try {
      console.log('🔍 Fetching users for warehouse agency:', warehouse.gouvernorat);
      
      const { apiService } = await import('../../services/api');
      const allUsers = [];
      
      // Fetch agency managers
      try {
        const agencyManagersResponse = await apiService.getAgencyManagers();
        const agencyManagers = agencyManagersResponse.filter(am => am.governorate === warehouse.gouvernorat);
        agencyManagers.forEach(am => {
          allUsers.push({
            id: am.id,
            name: am.name,
            role: 'Chef d\'agence',
            email: am.email,
            phone: am.phone,
            status: 'Actif',
            entry_date: am.created_at,
            packages_processed: 0,
            performance_percentage: 0
          });
        });
        console.log('🔍 Agency managers found:', agencyManagers.length);
      } catch (error) {
        console.error('❌ Error fetching agency managers:', error);
      }

      // Fetch agency members
      try {
        const agencyMembersResponse = await apiService.getAgencyMembers();
        const agencyMembers = agencyMembersResponse.filter(member => member.agency === warehouse.gouvernorat);
        agencyMembers.forEach(member => {
          allUsers.push({
            id: member.id,
            name: member.name,
            role: member.role || 'Membre d\'agence',
            email: member.email,
            phone: member.phone,
            status: member.status || 'Actif',
            entry_date: member.created_at,
            packages_processed: 0,
            performance_percentage: 0
          });
        });
        console.log('🔍 Agency members found:', agencyMembers.length);
      } catch (error) {
        console.error('❌ Error fetching agency members:', error);
      }

      // Fetch drivers
      try {
        const driversResponse = await apiService.getDrivers();
        const drivers = driversResponse.filter(driver => driver.agency === warehouse.gouvernorat);
        drivers.forEach(driver => {
          allUsers.push({
            id: driver.id,
            name: driver.name,
            role: 'Livreurs',
            email: driver.email,
            phone: driver.phone,
            status: 'Actif',
            entry_date: driver.created_at,
            packages_processed: 0,
            performance_percentage: 0
          });
        });
        console.log('🔍 Drivers found:', drivers.length);
      } catch (error) {
        console.error('❌ Error fetching drivers:', error);
      }

      // Fetch commercial users
      try {
        const commercialsResponse = await apiService.getCommercials();
        const commercials = commercialsResponse.filter(commercial => commercial.agency === warehouse.gouvernorat);
        commercials.forEach(commercial => {
          allUsers.push({
            id: commercial.id,
            name: commercial.name,
            role: 'Commercial',
            email: commercial.email,
            phone: commercial.phone,
            status: 'Actif',
            entry_date: commercial.created_at,
            packages_processed: 0,
            performance_percentage: 0
          });
        });
        console.log('🔍 Commercials found:', commercials.length);
      } catch (error) {
        console.error('❌ Error fetching commercials:', error);
      }

      // Fetch expéditeurs (shippers)
      try {
        const shippersResponse = await apiService.getShippers();
        const shippers = shippersResponse.filter(shipper => shipper.agency === warehouse.gouvernorat);
        shippers.forEach(shipper => {
          allUsers.push({
            id: shipper.id,
            name: shipper.name,
            role: 'Expéditeur',
            email: shipper.email,
            phone: shipper.phone,
            status: shipper.status || 'Actif',
            entry_date: shipper.created_at,
            packages_processed: 0,
            performance_percentage: 0
          });
        });
        console.log('🔍 Expéditeurs found:', shippers.length);
      } catch (error) {
        console.error('❌ Error fetching expéditeurs:', error);
      }

      console.log('🔍 Total agency users found:', allUsers.length);
      setAgencyUsers(allUsers);
      
    } catch (error) {
      console.error('❌ Error fetching agency users:', error);
    }
  };

  const fetchWarehouseDetails = async (warehouseId) => {
    try {
      console.log('🔍 Fetching warehouse details for ID:', warehouseId);
      const response = await warehousesService.getWarehouseDetails(warehouseId);
      console.log('📦 Warehouse details received:', response);
      
      // Handle both response formats: {success: true, data: {...}} and direct data object
      let details;
      if (response && response.success && response.data) {
        details = response.data;
      } else if (response && response.id) {
        // Direct data object format
        details = response;
      } else {
        console.warn('⚠️ Unexpected warehouse details response format:', response);
        return;
      }
      
        console.log('📊 Details data:', details);
        console.log('📊 Statistics:', details.statistics);
        console.log('📊 Parcels by status:', details.parcelsByStatus);
        
        // Update the warehouse with detailed information
        setWarehouses(prevWarehouses => 
          prevWarehouses.map(warehouse => 
            warehouse.id === warehouseId 
              ? {
                  ...warehouse,
                currentStock: details.current_stock && details.capacity ? `${Math.round((details.current_stock / details.capacity) * 100)}%` : '0%',
                current_stock: details.current_stock || 0,
                capacity: details.capacity || 100,
                  statistics: details.statistics || warehouse.statistics,
                  users: details.users || warehouse.users,
                  parcelsByStatus: details.parcelsByStatus || warehouse.parcelsByStatus
                }
              : warehouse
          )
        );
        
      // Update selected warehouse with the detailed information
      setSelectedWarehouse(prev => {
        if (prev && prev.id === warehouseId) {
          return {
            ...prev,
            currentStock: details.current_stock && details.capacity ? `${Math.round((details.current_stock / details.capacity) * 100)}%` : '0%',
            current_stock: details.current_stock || 0,
            capacity: details.capacity || 100,
            statistics: details.statistics || prev.statistics,
            users: details.users || prev.users,
            parcelsByStatus: details.parcelsByStatus || prev.parcelsByStatus
          };
        }
        return prev;
      });
    } catch (error) {
      console.error('❌ Error fetching warehouse details:', error);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Nom de l'entrepôt" },
    { key: "gouvernorat", header: "Gouvernorat" },
    { key: "address", header: "Adresse" },
    { key: "manager", header: "Responsable" },
    {
      key: "actions",
      header: "Actions",
      render: (_, warehouse) => (
        <ActionButtons
          onView={() => handleViewDetails(warehouse)}
          onEdit={() => handleEdit(warehouse)}
          onDelete={() => handleDelete(warehouse)}
        />
      ),
    },
  ];

  const handleAdd = async () => {
    // Determine the governorate for the new warehouse based on current user
    let defaultGovernorate = 'Tunis';
    
    if (currentUser && currentUser.role === 'Chef d\'agence') {
      // For Chef d'agence, get their governorate from the agency_managers table
      try {
        const { apiService } = await import('../../services/api');
        const agencyManagerResponse = await apiService.getAgencyManagers();
        const agencyManager = agencyManagerResponse.find(am => am.email === currentUser.email);
        
        if (agencyManager) {
          defaultGovernorate = agencyManager.governorate;
          console.log('🔍 Setting governorate for new warehouse:', defaultGovernorate);
        }
      } catch (error) {
        console.error('Error fetching agency manager data:', error);
      }
    }
    
    setEditingWarehouse(null);
    setFormData({
      name: "",
      gouvernorat: defaultGovernorate,
      address: "",
      manager: "",
      assignedAgency: "",
      status: "Actif",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      gouvernorat: warehouse.gouvernorat,
      address: warehouse.address || "",
      manager: warehouse.manager_id || warehouse.manager,
      assignedAgency: "",
      status: warehouse.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (warehouse) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet entrepôt ?")) {
      try {
        await warehousesService.deleteWarehouse(warehouse.id);
      setWarehouses(warehouses.filter((w) => w.id !== warehouse.id));
      if (selectedWarehouse?.id === warehouse.id) {
        setSelectedWarehouse(null);
      }
      } catch (error) {
        console.error('❌ Error deleting warehouse:', error);
        alert('Erreur lors de la suppression de l\'entrepôt');
      }
    }
  };

  const handleViewDetails = async (warehouse) => {
    setSelectedWarehouse(warehouse);
    // Always fetch detailed information when viewing a warehouse
    console.log('🔍 Fetching details for warehouse:', warehouse.id);
    await fetchWarehouseDetails(warehouse.id);
  };

  const handleSubmit = async () => {
    try {
      const warehouseData = {
        name: formData.name,
        governorate: formData.gouvernorat,
        address: formData.address || '',
        manager_id: formData.manager || null,
        capacity: 100,
        status: formData.status
      };

      // If a manager is selected and an agency is assigned, update the manager's agency
      if (formData.manager && formData.assignedAgency) {
        try {
          console.log('🔧 Updating agency manager with new agency:', {
            managerId: formData.manager,
            newAgency: formData.assignedAgency
          });
          
          const { apiService } = await import('../../services/api');
          await apiService.updateAgencyManager(formData.manager, {
            agency: formData.assignedAgency
          });
          
          console.log('✅ Agency manager updated successfully');
        } catch (error) {
          console.error('❌ Error updating agency manager:', error);
          alert('Erreur lors de la mise à jour de l\'agence du chef d\'agence');
          return;
        }
      }

      if (editingWarehouse) {
        await warehousesService.updateWarehouse(editingWarehouse.id, warehouseData);
        // Refresh the warehouses list
        await fetchWarehouses();
      } else {
        await warehousesService.createWarehouse(warehouseData);
        // Refresh the warehouses list
        await fetchWarehouses();
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('❌ Error saving warehouse:', error);
      alert('Erreur lors de la sauvegarde de l\'entrepôt');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // Auto-fill agency field with warehouse name when warehouse name changes
      if (name === 'name' && value.trim()) {
        newData.assignedAgency = value.trim();
      }
      
      return newData;
    });
  };

  const handleStatusCardClick = async (status, count) => {
    if (count === 0) return; // Don't open modal if no parcels
    
    try {
      let parcels = [];
      
      if (currentUser && currentUser.role === 'Chef d\'agence') {
        // For Chef d'agence, filter warehouse agency parcels by status
        console.log('🔍 Filtering warehouse agency parcels for status:', status);
        parcels = agencyParcels.filter(parcel => parcel.status === status);
      } else {
        // For other users, fetch warehouse-specific parcels
        console.log('🔍 Fetching parcels for status:', status, 'in warehouse:', selectedWarehouse.id);
        
        // Fetch parcels for this specific status and warehouse
        const response = await fetch(`http://localhost:5000/api/parcels?warehouse_id=${selectedWarehouse.id}&status=${encodeURIComponent(status)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          parcels = data.data;
        }
      }
      
      if (parcels.length > 0) {
        const transformedParcels = parcels.map(parcel => ({
          id: parcel.id,
          code: parcel.tracking_number || parcel.id,
          expediteur: parcel.shipper_name || 'N/A',
          destination: parcel.destination || 'N/A',
          status: parcel.status,
          poids: parcel.weight ? `${parseFloat(parcel.weight).toFixed(2)} kg` : 'N/A',
          date_creation: parcel.created_at ? new Date(parcel.created_at).toLocaleDateString('fr-FR') : 'N/A',
          prix: parcel.price ? `${parseFloat(parcel.price).toFixed(2)} DT` : 'N/A',
          phone: parcel.sender_phone || parcel.shipper_phone || 'N/A',
          adresse: parcel.destination || 'N/A',
          designation: parcel.type || 'Livraison',
          nombre_articles: 1,
          // Additional fields for Bon de Livraison and Facture
          shipper_name: parcel.shipper_name || 'N/A',
          shipper_address: parcel.shipper_address || 'N/A',
          shipper_phone: parcel.shipper_phone || 'N/A',
          shipper_email: parcel.shipper_email || 'N/A',
          shipper_tax_number: parcel.shipper_tax_number || 'N/A',
          recipient_name: parcel.recipient_name || parcel.destination || 'N/A',
          recipient_address: parcel.recipient_address || parcel.destination || 'N/A',
          recipient_phone: parcel.recipient_phone || 'N/A',
          created_at: parcel.created_at,
          tracking_number: parcel.tracking_number || parcel.id,
          type: parcel.type || 'Livraison'
        }));
        
        console.log('📦 Found parcels:', transformedParcels.length, 'for status:', status);
        
        setColisModal({
          open: true,
          status: status,
          colis: transformedParcels
        });
      } else {
        console.warn('No parcels found for status:', status);
        setColisModal({
          open: true,
          status: status,
          colis: []
        });
      }
      
      
    } catch (error) {
      console.error('❌ Error fetching parcels for status:', error);
      setColisModal({
        open: true,
        status: status,
        colis: []
      });
    }
  };

  const exportToExcel = () => {
    if (!selectedWarehouse) return;
    
    // Use real parcel data if available, otherwise show empty data
    const data = selectedWarehouse.parcelsByStatus?.map(item => ({
      Statut: item.status,
      Nombre: item.count
    })) || [];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Colis");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `entrepot_${selectedWarehouse.name.replace(/\s+/g, '_')}_colis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportParcelsToExcel = () => {
    if (!colisModal.colis || colisModal.colis.length === 0) return;
    
    const data = colisModal.colis.map(parcel => ({
      'N° Colis': parcel.code,
      'Expéditeur': parcel.expediteur,
      'Destination': parcel.destination,
      'Statut': parcel.status,
      'Poids': parcel.poids,
      'Date de création': parcel.date_creation,
      'Date de livraison estimée': parcel.date_livraison,
      'Prix': parcel.prix
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Colis");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `colis_${colisModal.status}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleParcelClick = (parcel) => {
    // Show parcel details modal
    setSelectedParcel(parcel);
    setParcelDetailsModal(true);
  };

  const renderUserTable = (users) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
            <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
            <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
            <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'entrée</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users && users.length > 0 ? users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.status === "Actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.entry_date ? new Date(user.entry_date).toLocaleDateString('fr-FR') : 'N/A'}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                Aucun utilisateur trouvé pour cet entrepôt
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderStatistics = (stats) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-blue-600">{stats.totalPackages}</div>
        <div className="text-sm text-gray-600">Total colis</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-green-600">{stats.deliveredToday}</div>
        <div className="text-sm text-gray-600">Livrés aujourd'hui</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-yellow-600">{stats.pendingPackages}</div>
        <div className="text-sm text-gray-600">En attente</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-purple-600">{stats.averageDeliveryTime}</div>
        <div className="text-sm text-gray-600">Temps moyen</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-indigo-600">{stats.monthlyGrowth}</div>
        <div className="text-sm text-gray-600">Croissance mensuelle</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-pink-600">{stats.customerSatisfaction}</div>
        <div className="text-sm text-gray-600">Satisfaction client</div>
      </div>
    </div>
  );

  const renderCharts = (warehouse) => (
    <div className="grid grid-cols-1 gap-6 mb-6">
      {/* Graphique de répartition des utilisateurs par rôle */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des utilisateurs par rôle</h3>
        <div className="space-y-4">
          {currentUser && currentUser.role === 'Chef d\'agence' && agencyUsers.length > 0 ? (
            (() => {
              const roleStats = {};
              agencyUsers.forEach(user => {
                roleStats[user.role] = (roleStats[user.role] || 0) + 1;
              });
              
              return Object.entries(roleStats).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{role}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(count / agencyUsers.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ));
            })()
          ) : warehouse.users && warehouse.users.length > 0 ? (
            (() => {
              const roleStats = {};
              warehouse.users.forEach(user => {
                roleStats[user.role] = (roleStats[user.role] || 0) + 1;
              });
              
              return Object.entries(roleStats).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{role}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(count / warehouse.users.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ));
            })()
          ) : (
            <div className="text-center text-gray-500 py-4">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Chargement des entrepôts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Entrepôts de mon Agence'
              : 'Gestion des entrepôts'
            }
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Gérez les informations de vos entrepôts et leurs utilisateurs'
              : 'Gérez les informations de vos entrepôts et leurs utilisateurs'
            }
          </p>
          {currentUser && currentUser.role === 'Chef d\'agence' && warehouses.length > 0 && userAgency && (
            <p className="text-orange-600 mt-1 text-sm">
              💡 Affichage de tous les entrepôts (aucun entrepôt trouvé pour votre gouvernorat: {userAgency})
            </p>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un entrepôt
        </button>
      </div>

      {/* Tableau des entrepôts */}
      <DataTable
        data={warehouses}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showActions={false}
      />

      {/* Détails de l'entrepôt sélectionné */}
      {selectedWarehouse && (
        <div id="warehouse-details" className="bg-white rounded-lg shadow border p-6">
          {/* Entrepôt info */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedWarehouse.name}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Localisation:</strong> {selectedWarehouse.location}</p>
                <p><strong>Adresse:</strong> {selectedWarehouse.address || "Non renseignée"}</p>
                <p><strong>Responsable:</strong> {selectedWarehouse.manager}</p>
                <p><strong>Téléphone:</strong> {selectedWarehouse.phone || "Non renseigné"}</p>
                <p><strong>Email:</strong> {selectedWarehouse.email || "Non renseigné"}</p>
                <p><strong>Date de création:</strong> {selectedWarehouse.createdAt}</p>
                <p><strong>Statut:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    selectedWarehouse.status === "Actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedWarehouse.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Exporter en Excel
              </button>
              <button
                onClick={() => setSelectedWarehouse(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques de l'entrepôt</h3>
            {renderStatistics(currentUser && currentUser.role === 'Chef d\'agence' ? {
              totalPackages: agencyParcels.length,
              deliveredToday: (agencyParcelStats['Livrés'] || 0) + (agencyParcelStats['Livrés payés'] || 0),
              pendingPackages: agencyParcelStats['En attente'] || 0,
              averageDeliveryTime: calculateAverageDeliveryTime(agencyParcels),
              monthlyGrowth: calculateMonthlyGrowth(agencyParcels),
              customerSatisfaction: calculateCustomerSatisfaction(agencyParcels)
            } : selectedWarehouse.statistics)}
          </div>

          {/* Status cards grid */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentUser && currentUser.role === 'Chef d\'agence' 
                ? `Répartition des colis par statut - Agence ${selectedWarehouse?.gouvernorat || userAgency}`
                : 'Répartition des colis par statut'
              }
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {/* Total Card */}
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total</p>
                    <p className="text-xl font-bold text-blue-600">
                      {currentUser && currentUser.role === 'Chef d\'agence' 
                        ? agencyParcels.length 
                        : (selectedWarehouse.statistics?.totalPackages || 0)
                      }
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status Cards */}
            {COLIS_STATUSES.map((status) => {
              let count = 0;
              
              if (currentUser && currentUser.role === 'Chef d\'agence') {
                // Use agency-wide stats for Chef d'agence
                count = agencyParcelStats[status.key] || 0;
              } else {
                // Use warehouse-specific stats for other users
                const statusData = selectedWarehouse.parcelsByStatus?.find(s => s.status === status.key);
                count = statusData ? statusData.count : 0;
              }
              
              return (
                <div
                  key={status.key}
                    className={`bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => count > 0 && handleStatusCardClick(status.key, count)}
                >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">{status.label}</p>
                        <p className="text-xl font-bold" style={{ color: status.color }}>{count}</p>
                      </div>
                      <div className="p-2 rounded-full" style={{ backgroundColor: `${status.color}20` }}>
                        <svg className="w-5 h-5" style={{ color: status.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Charts */}
          {renderCharts(selectedWarehouse)}

          {/* Utilisateurs de l'entrepôt */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentUser && currentUser.role === 'Chef d\'agence' 
                ? `Tous les utilisateurs de l'agence ${selectedWarehouse?.gouvernorat || userAgency} (${agencyUsers.length})`
                : `Utilisateurs de l'entrepôt (${selectedWarehouse.users?.length || 0})`
              }
            </h3>
            {renderUserTable(currentUser && currentUser.role === 'Chef d\'agence' ? agencyUsers : selectedWarehouse.users)}
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier un entrepôt */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? "Modifier l'entrepôt" : "Ajouter un entrepôt"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entrepôt
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez le nom de l'entrepôt"
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gouvernorat
            </label>
            {currentUser && currentUser.role === 'Chef d\'agence' ? (
              <input
                type="text"
                name="gouvernorat"
                value={formData.gouvernorat}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            ) : (
              <select
                name="gouvernorat"
                value={formData.gouvernorat}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {gouvernorats.map((gouvernorat) => (
                  <option key={gouvernorat} value={gouvernorat}>
                    {gouvernorat}
                  </option>
                  ))}
                </select>
            )}
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez l'adresse de l'entrepôt"
            />
            </div>
                      <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable
            </label>
            <select
              name="manager"
              value={formData.manager}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un responsable</option>
              {chefAgences.length > 0 ? (
                chefAgences.map((chef) => (
                  <option key={chef.id} value={chef.id}>
                    {chef.name} ({chef.email})
                  </option>
                ))
              ) : (
                <option value="" disabled>Aucun chef d'agence disponible (tous ont une agence assignée)</option>
              )}
            </select>
            {chefAgences.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Créez d'abord un chef d'agence sans agence assignée
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agence à assigner au responsable
            </label>
            <input
              type="text"
              name="assignedAgency"
              value={formData.assignedAgency || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez le nom de l'agence à assigner"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Cette agence sera automatiquement le nom de l'entrepôt et sera assignée au chef d'agence sélectionné
            </p>
          </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingWarehouse ? "Modifier" : "Ajouter"}
            </button>
          </div>
          </div>
      </Modal>

      {/* Modal pour les colis par statut */}
      <Modal
        isOpen={colisModal.open}
        onClose={() => setColisModal({ open: false, status: null, colis: [] })}
        title={`Colis - ${colisModal.status}`}
        size="xl"
      >
        <div className="space-y-4">
          {colisModal.colis.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                  {colisModal.colis.length} colis trouvés
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={exportParcelsToExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    Exporter en Excel
                  </button>
                  <button
                    onClick={() => setColisModal({ open: false, status: null, colis: [] })}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Fermer
                  </button>
                </div>
              </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">N° Colis</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Expéditeur</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Poids</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {colisModal.colis.map((colis) => (
                      <tr key={colis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{colis.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colis.expediteur}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colis.destination}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colis.poids}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colis.date_creation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colis.prix}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBonLivraisonColis([colis]);
                              }}
                              title="Bon de livraison"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>

                          </div>
                        </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucun colis trouvé pour ce statut
            </div>
          )}
        </div>
      </Modal>

      {/* Modals pour facture et bon de livraison */}
        {factureColis && (
          <Modal
            isOpen={!!factureColis}
          onClose={() => setFactureColis(null)}
            title="Facture"
            size="xl"
          >
            <FactureColis
              colis={{
                code: factureColis[0]?.code || factureColis[0]?.tracking_number,
                nom: factureColis[0]?.expediteur,
                adresse: factureColis[0]?.destination,
                poids: factureColis[0]?.poids?.replace(' kg', '') || '0'
              }}
              client={{
                nom: factureColis[0]?.expediteur,
                tel: factureColis[0]?.phone
              }}
              expediteur={{
                nom: factureColis[0]?.shipper_name || factureColis[0]?.expediteur,
                tel: factureColis[0]?.shipper_phone,
                adresse: factureColis[0]?.shipper_address,
                nif: factureColis[0]?.shipper_tax_number
              }}
              prix={{
                ttc: factureColis[0]?.prix || '0.00 DT',
                ht: factureColis[0]?.prix || '0.00 DT',
                tva: '0.00 DT',
                totalLivraison: factureColis[0]?.prix || '0.00 DT'
              }}
        />
          </Modal>
      )}

        {bonLivraisonColis && (
          <Modal
            isOpen={!!bonLivraisonColis}
          onClose={() => setBonLivraisonColis(null)}
            title="Bon de Livraison"
            size="xl"
          >
            <BonLivraisonColis
              parcelId={bonLivraisonColis[0]?.id}
            />
          </Modal>
        )}

        {/* Modal pour les détails du colis */}
        {parcelDetailsModal && selectedParcel && (
          <Modal
            isOpen={parcelDetailsModal}
            onClose={() => {
              setParcelDetailsModal(false);
              setSelectedParcel(null);
            }}
            title={`Détails du colis ${selectedParcel.code}`}
            size="xl"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client:</label>
                  <p className="text-sm text-gray-900">{selectedParcel.expediteur}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant:</label>
                  <p className="text-sm text-gray-900">{selectedParcel.prix}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone:</label>
                  <p className="text-sm text-gray-900">{selectedParcel.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse:</label>
                  <p className="text-sm text-gray-900">{selectedParcel.adresse}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Désignation:</label>
                  <p className="text-sm text-gray-900">{selectedParcel.designation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre des articles:</label>
                  <p className="text-sm text-gray-900">{selectedParcel.nombre_articles}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{selectedParcel.date_creation}</span>
                  <span className="text-2xl">⏳</span>
                  <span className="text-sm font-medium">{selectedParcel.status}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Colis enregistré dans le système.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Note: Ce colis est actuellement au statut "{selectedParcel.status}". L'historique détaillé des statuts sera disponible une fois que le système de suivi sera complètement opérationnel.
                </p>
              </div>
            </div>
          </Modal>
        )}
    </div>
  );
};

export default Entrepots; 
