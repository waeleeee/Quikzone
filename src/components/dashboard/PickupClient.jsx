import React, { useState, useRef, useEffect } from "react";
import Modal from "./common/Modal";
import html2pdf from "html2pdf.js";
import { apiService, deliveryMissionsService, warehousesService } from '../../services/api';
import { Html5Qrcode } from "html5-qrcode";

// Delivery mission status flow
const deliveryStatusList = [
  "scheduled",      // Initial status when mission is created
  "in_progress",    // When driver starts the mission
  "completed",      // When all parcels are delivered
  "cancelled"       // If mission is cancelled
];

// Parcel statuses for delivery
const deliveryParcelStatuses = [
  "en_cours",       // Parcel assigned to driver
  "lives",          // Successfully delivered
  "rtn_depot"       // Returned to depot (failed delivery)
];

const statusBadge = (status) => {
  const colorMap = {
    // Mission statuses
    "scheduled": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "in_progress": "bg-blue-100 text-blue-800 border-blue-300", 
    "completed": "bg-green-100 text-green-800 border-green-300",
    "cancelled": "bg-red-100 text-red-800 border-red-300",
    
    // Parcel statuses
    "en_cours": "bg-purple-100 text-purple-800 border-purple-300",
    "lives": "bg-green-100 text-green-800 border-green-300",
    "rtn_depot": "bg-orange-100 text-orange-800 border-orange-300",
  };
  return <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>{status}</span>;
};

const PickupClient = () => {
  const [missions, setMissions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [availableParcels, setAvailableParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [viewMission, setViewMission] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [formData, setFormData] = useState({
    driverId: "",
    warehouseId: "",
    parcelIds: [],
    deliveryDate: "",
    notes: "",
  });
  const [scannedCode, setScannedCode] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [deliveryFormData, setDeliveryFormData] = useState({
    parcelId: "",
    securityCode: "",
  });
  const detailRef = useRef();

  // Add agency selection state
  const [selectedAgency, setSelectedAgency] = useState("");
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);

  // State for step-by-step wizard
  const [currentStep, setCurrentStep] = useState(1);

  // Agency options will be populated from warehouses data
  const [agencyOptions, setAgencyOptions] = useState([]);

  // Mapping between agencies and their corresponding governorates
  const agencyGovernorateMapping = {
    "Siège": ["Tunis", "Ariana", "Ben Arous", "Manouba"],
    "Tunis": ["Tunis", "Ariana", "Ben Arous", "Manouba"],
    "Sousse": ["Sousse", "Monastir", "Mahdia"],
    "Sfax": ["Sfax", "Gabès", "Médenine"],
    "Monastir": ["Monastir", "Mahdia", "Sousse"]
  };

  // Load data from API
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Fetching delivery missions data...');
        const [missionsData, driversData, warehousesData, parcelsData] = await Promise.all([
          deliveryMissionsService.getDeliveryMissions(),
          apiService.getDrivers(),
          warehousesService.getWarehouses(),
          deliveryMissionsService.getAvailableParcels(),
        ]);
        console.log('📡 Missions data:', missionsData);
        console.log('📡 Drivers data:', driversData);
        console.log('📡 Warehouses data:', warehousesData);
        console.log('📡 Available parcels data:', parcelsData);
        
        console.log('📦 MissionsData structure:', missionsData);
        console.log('🚗 DriversData structure:', driversData);
        console.log('🏢 WarehousesData structure:', warehousesData);
        console.log('📦 ParcelsData structure:', parcelsData);
        
        console.log('📦 Setting missions:', missionsData);
        console.log('🚗 Setting drivers:', driversData);
        console.log('🏢 Setting warehouses:', warehousesData);
        console.log('📦 Setting available parcels:', parcelsData);
        
        // Handle both direct arrays and nested data structures
        const processedMissions = Array.isArray(missionsData) ? missionsData : missionsData?.data || [];
        const processedDrivers = Array.isArray(driversData) ? driversData : driversData?.data || [];
        const processedWarehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.data || [];
        const processedParcels = Array.isArray(parcelsData) ? parcelsData : parcelsData?.data || [];
        
        console.log('📦 Processed missions:', processedMissions);
        console.log('🚗 Processed drivers:', processedDrivers);
        console.log('🏢 Processed warehouses:', processedWarehouses);
        console.log('📦 Processed parcels:', processedParcels);
        
        setMissions(processedMissions);
        setDrivers(processedDrivers);
        setWarehouses(processedWarehouses);
        setAvailableParcels(processedParcels);
        
        // Set agency options from warehouses data
        if (processedWarehouses && processedWarehouses.length > 0) {
          const warehouseNames = processedWarehouses.map(warehouse => warehouse.name);
          setAgencyOptions(warehouseNames);
          console.log('🏢 Agency options set from warehouses:', warehouseNames);
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [scanner]);

  // Filter drivers and warehouses based on selected agency
  useEffect(() => {
    if (selectedAgency) {
      // Filter drivers
      const filteredDrivers = drivers.filter(driver => driver.agency === selectedAgency);
      setFilteredDrivers(filteredDrivers);
      
      // Filter warehouses based on selected agency's governorates
      const allowedGovernorates = agencyGovernorateMapping[selectedAgency] || [];
      const filteredWarehouses = warehouses.filter(warehouse => 
        allowedGovernorates.includes(warehouse.governorate || warehouse.city)
      );
      setFilteredWarehouses(filteredWarehouses);
    } else {
      setFilteredDrivers([]);
      setFilteredWarehouses([]);
    }
  }, [selectedAgency, drivers, warehouses]);

  // Reset driver selection when agency changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, driverId: "" }));
  }, [selectedAgency]);

  // Helper functions
  const getDriverName = (id) => {
    const driver = drivers.find(d => d.id === id);
    if (driver) {
      // Handle both name format and first_name + last_name format
      if (driver.name) {
        return driver.name;
      } else if (driver.first_name && driver.last_name) {
        return `${driver.first_name} ${driver.last_name}`;
      }
    }
    return "";
  };
  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || "";
  const getParcelsByIds = (ids) => availableParcels.filter(p => ids.includes(p.id));

  // Modal handlers
  const handleAdd = () => {
    console.log('🔍 Opening modal with current data:');
    console.log('🚗 Drivers:', drivers);
    console.log('🚗 Drivers length:', drivers?.length);
    console.log('🏢 Warehouses:', warehouses);
    console.log('🏢 Warehouses length:', warehouses?.length);
    console.log('🏢 Warehouses data:', warehouses);
    console.log('📦 Available parcels:', availableParcels);
    console.log('📦 Available parcels length:', availableParcels?.length);
    
    setEditingMission(null);
    setFormData({
      driverId: "",
      warehouseId: "",
      parcelIds: [],
      deliveryDate: "",
      notes: "",
    });
    
    // Reset agency selection and filtered data
    setSelectedAgency("");
    setFilteredDrivers([]);
    setFilteredWarehouses([]);
    
    // Reset scan-related state
    setScannedCode("");
    setScanMessage("");
    
    setIsModalOpen(true);
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setFormData({
      driverId: mission.driver_id || "",
      warehouseId: mission.warehouse_id || "",
      parcelIds: mission.parcels?.map(p => p.id) || [],
      deliveryDate: mission.delivery_date || "",
      notes: mission.notes || "",
    });
    
    // Set agency based on the selected driver
    if (mission.driver_id) {
      const driver = drivers.find(d => d.id === mission.driver_id);
      if (driver && driver.agency) {
        setSelectedAgency(driver.agency);
        const filteredDrivers = drivers.filter(d => d.agency === driver.agency);
        setFilteredDrivers(filteredDrivers);
        
        // Also filter warehouses for this agency
        const allowedGovernorates = agencyGovernorateMapping[driver.agency] || [];
        const filteredWarehouses = warehouses.filter(warehouse => 
          allowedGovernorates.includes(warehouse.governorate || warehouse.city)
        );
        setFilteredWarehouses(filteredWarehouses);
      }
    }
    
    setIsModalOpen(true);
  };

  const handleView = (mission) => {
    setViewMission(mission);
    setIsModalOpen(true);
  };

  const handleDelivery = (mission) => {
    setSelectedMission(mission);
    setDeliveryFormData({
      parcelId: "",
      securityCode: "",
    });
    setIsDeliveryModalOpen(true);
  };

  const handleDelete = async (mission) => {
    if (window.confirm('Are you sure you want to delete this delivery mission?')) {
      try {
        await deliveryMissionsService.deleteDeliveryMission(mission.id);
        setMissions(missions.filter(m => m.id !== mission.id));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete mission');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingMission) {
        // Update existing mission
        const response = await deliveryMissionsService.updateDeliveryMission(editingMission.id, formData);
        setMissions(missions.map(m => m.id === editingMission.id ? response.data : m));
      } else {
        // Create new mission
        const response = await deliveryMissionsService.createDeliveryMission(formData);
        setMissions([response.data, ...missions]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save mission');
    }
  };

  const handleDeliverySubmit = async () => {
    try {
      const response = await deliveryMissionsService.processDelivery(selectedMission.id, deliveryFormData);
      alert(response.message);
      
      // Refresh missions data
      const missionsData = await deliveryMissionsService.getDeliveryMissions();
      setMissions(missionsData.data || []);
      
      setIsDeliveryModalOpen(false);
    } catch (error) {
      console.error('Delivery error:', error);
      alert(error.message || 'Failed to process delivery');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add agency change handler
  const handleAgencyChange = (e) => {
    const selectedAgencyValue = e.target.value;
    setSelectedAgency(selectedAgencyValue);
    
    // Filter drivers based on selected agency
    if (selectedAgencyValue) {
      const filteredDrivers = drivers.filter(driver => driver.agency === selectedAgencyValue);
      setFilteredDrivers(filteredDrivers);
      
      // Filter warehouses based on selected agency's governorates
      const allowedGovernorates = agencyGovernorateMapping[selectedAgencyValue] || [];
      const filteredWarehouses = warehouses.filter(warehouse => 
        allowedGovernorates.includes(warehouse.governorate || warehouse.city)
      );
      setFilteredWarehouses(filteredWarehouses);
      
      // Automatically set the first available warehouse for this agency
      if (filteredWarehouses.length > 0) {
        setFormData(prev => ({
          ...prev,
          warehouseId: filteredWarehouses[0].id
        }));
      }
    } else {
      setFilteredDrivers([]);
      setFilteredWarehouses([]);
    }
    
    // Reset driver selection when agency changes
    setFormData(prev => ({
      ...prev,
      driverId: ""
    }));
  };

  const handleDeliveryInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParcelSelection = (parcelId) => {
    setFormData(prev => ({
      ...prev,
      parcelIds: prev.parcelIds.includes(parcelId)
        ? prev.parcelIds.filter(id => id !== parcelId)
        : [...prev.parcelIds, parcelId]
    }));
  };

  const handleBarcodeScan = () => {
    console.log('🔍 handleBarcodeScan called with code:', scannedCode);
    console.log('📦 Available parcels:', availableParcels);
    
    if (!scannedCode.trim()) {
      console.log('❌ No code entered');
      setScanMessage("❌ Aucun code saisi");
      setTimeout(() => setScanMessage(""), 2000);
      return;
    }

    // Clean the scanned code (remove any extra characters)
    const cleanCode = scannedCode.trim().toLowerCase();
    console.log('🧹 Cleaned code:', cleanCode);

    // Find parcel by tracking number (try multiple matching strategies)
    let parcel = availableParcels.find(p => 
      p.tracking_number && p.tracking_number.toLowerCase() === cleanCode
    );

    // If not found by exact match, try partial match
    if (!parcel) {
      parcel = availableParcels.find(p => 
        p.tracking_number && p.tracking_number.toLowerCase().includes(cleanCode)
      );
    }

    // If still not found, try matching by ID
    if (!parcel) {
      const numericId = parseInt(cleanCode);
      if (!isNaN(numericId)) {
        parcel = availableParcels.find(p => p.id === numericId);
      }
    }

    console.log('🔍 Found parcel:', parcel);

    if (parcel) {
      if (formData.parcelIds.includes(parcel.id)) {
        console.log('❌ Parcel already scanned');
        setScanMessage(`❌ Colis ${parcel.tracking_number} déjà scanné!`);
        setTimeout(() => setScanMessage(""), 3000);
      } else {
        console.log('✅ Adding parcel to selection');
        setFormData(prev => ({
          ...prev,
          parcelIds: [...prev.parcelIds, parcel.id]
        }));
        setScanMessage(`✅ Colis ${parcel.tracking_number} scanné avec succès!`);
        setTimeout(() => setScanMessage(""), 3000);
      }
    } else {
      console.log('❌ Parcel not found');
      setScanMessage(`❌ Colis avec le code "${cleanCode}" non trouvé!`);
      setTimeout(() => setScanMessage(""), 3000);
    }
    
    setScannedCode("");
  };

  // Barcode scanner functionality
  const startBarcodeScanner = () => {
    setIsScanModalOpen(true);
    setIsScanning(true);
    
    // Initialize scanner after modal is open
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 200 },
          aspectRatio: 1.5,
          disableFlip: false,
        },
        (decodedText, decodedResult) => {
          console.log('📱 Barcode scanned:', decodedText);
          console.log('📱 Decoded result:', decodedResult);
          
          // Stop scanning immediately to prevent multiple scans
          html5QrCode.stop().then(() => {
            setScannedCode(decodedText);
            handleBarcodeScan();
            stopBarcodeScanner();
          }).catch((err) => {
            console.error('📱 Error stopping scanner:', err);
            setScannedCode(decodedText);
            handleBarcodeScan();
            stopBarcodeScanner();
          });
        },
        (error) => {
          // Only log errors that are not just "no QR code found"
          if (error && !error.toString().includes('No QR code found')) {
            console.log('📱 Scan error:', error);
          }
        }
      ).catch((err) => {
        console.error('📱 Scanner start error:', err);
        setIsScanning(false);
        alert('Erreur d\'accès à la caméra. Veuillez utiliser la saisie manuelle.');
      });
    }, 500); // Increased delay to ensure modal is fully rendered
  };

  const stopBarcodeScanner = () => {
    if (scanner) {
      scanner.stop().then(() => {
        setScanner(null);
        setIsScanning(false);
        setIsScanModalOpen(false);
      }).catch((err) => {
        console.error('📱 Scanner stop error:', err);
        setScanner(null);
        setIsScanning(false);
        setIsScanModalOpen(false);
      });
    } else {
      setIsScanning(false);
      setIsScanModalOpen(false);
    }
  };

  const handleExportPDF = () => {
    const element = detailRef.current;
    const opt = {
      margin: 1,
      filename: `mission-${viewMission.mission_number || 'unknown'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Filter missions based on search term
  const filteredMissions = (missions || []).filter(mission => {
    if (!mission) return false;
    
    return (mission.mission_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDriverName(mission.driver_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
           getWarehouseName(mission.warehouse_id).toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mission Livraison</h1>
            <p className="text-gray-600 mt-1">Gestion des missions de livraison du dépôt vers le client</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nouvelle Mission</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par numéro de mission, chauffeur ou entrepôt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Missions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chauffeur
                </th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrepôt
                </th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colis
                </th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMissions.map((mission) => (
                <tr key={mission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mission.mission_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getDriverName(mission.driver_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getWarehouseName(mission.warehouse_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(mission.delivery_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mission.assigned_parcels || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statusBadge(mission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(mission)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="Voir les détails"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(mission)}
                        className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(mission)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMission(null);
          setFormData({
            driverId: "",
            warehouseId: "",
            parcelIds: [],
            deliveryDate: "",
            notes: "",
          });
          setSelectedAgency("");
          setCurrentStep(1);
        }}
        title={editingMission ? "Modifier la mission" : "Nouvelle Mission de Livraison"}
        size="75%"
      >
        <div className="bg-white rounded-lg p-8 w-full max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {editingMission ? 'Modifier la Mission' : 'Nouvelle Mission de Livraison'}
          </h2>
          
          {viewMission ? (
            // View mode
            <div ref={detailRef} className="space-y-6">
              {/* Mission Header */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Détails de la Mission</h3>
                  <p className="text-sm text-gray-600">Informations complètes de la mission de livraison</p>
                </div>
                
                {/* Mission Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-700">Numéro de Mission</label>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{viewMission.mission_number || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-700">Statut</label>
                    </div>
                    <div className="mt-1">{statusBadge(viewMission.status)}</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-700">Chauffeur</label>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{getDriverName(viewMission.driver_id)}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-700">Entrepôt</label>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{getWarehouseName(viewMission.warehouse_id)}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-700">Date de Livraison</label>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{new Date(viewMission.delivery_date).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-700">Total Colis</label>
                    </div>
                    <p className="text-lg font-bold text-indigo-600">{viewMission.parcels?.length || viewMission.assigned_parcels || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Parcels List */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900">Liste des Colis</h4>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {viewMission.parcels?.length || 0} colis
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  {viewMission.parcels && viewMission.parcels.length > 0 ? (
                    <div className="space-y-3">
                      {viewMission.parcels.map((parcel, index) => (
                        <div key={parcel.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                                <span className="text-blue-600 font-semibold">#{index + 1}</span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {parcel.tracking_number || `Colis ${parcel.id}`}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    parcel.status === 'lives' ? 'bg-green-100 text-green-800' :
                                    parcel.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                                    parcel.status === 'rtn_depot' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {parcel.status === 'lives' ? 'Livré' :
                                     parcel.status === 'en_cours' ? 'En cours' :
                                     parcel.status === 'rtn_depot' ? 'Retour dépôt' :
                                     parcel.status || 'N/A'}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Destinataire:</span> {parcel.recipient_name || parcel.destination || 'N/A'}
                                </div>
                                {parcel.weight && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Poids:</span> {parcel.weight} kg
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {parcel.price && `Prix: ${parcel.price} DT`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-500 text-lg">Aucun colis assigné à cette mission</p>
                      <p className="text-gray-400 text-sm">Les colis apparaîtront ici une fois assignés</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notes Section */}
              {viewMission.notes && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900">Notes</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 leading-relaxed">{viewMission.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-6">
                <button
                  onClick={handleExportPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exporter PDF</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            // Edit/Create mode
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4" dir="ltr">
              {/* Compact Step-by-Step Wizard Design */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-lg p-6 border border-blue-200 shadow-lg max-w-5xl mx-auto">
                
                {/* Compact Header Section */}
                <div className="text-center  mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl  font-bold text-gray-900 mb-2">
                    {editingMission ? 'Modifier la Mission' : 'Nouvelle Mission de Livraison'}
                  </h3>
                  <p className="text-base text-gray-600">Suivez les étapes pour configurer votre mission</p>
                </div>

                {/* Compact Step Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-4">
                    {[
                      { step: 1, title: "Agence & Chauffeur", icon: "🏢", color: "blue" },
                      { step: 2, title: "Planification", icon: "📅", color: "purple" },
                      { step: 3, title: "Colis", icon: "📦", color: "orange" },
                      { step: 4, title: "Finalisation", icon: "✅", color: "gray" }
                    ].map((stepInfo, index) => (
                      <div key={stepInfo.step} className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                          currentStep >= stepInfo.step 
                            ? `bg-${stepInfo.color}-600 border-${stepInfo.color}-600 text-white` 
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          <span className="text-base">{stepInfo.icon}</span>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${
                            currentStep >= stepInfo.step ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            Étape {stepInfo.step}
                          </div>
                          <div className={`text-sm ${
                            currentStep >= stepInfo.step ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {stepInfo.title}
                          </div>
                        </div>
                        {index < 3 && (
                          <div className={`w-8 h-0.5 transition-all duration-300 ${
                            currentStep > stepInfo.step ? 'bg-blue-600' : 'bg-gray-300'
                          }`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compact Step Content */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm max-w-4xl mx-auto">
                  
                  {/* Step 1: Agency Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                          <span className="text-2xl">🏢</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Sélection du Dépôt</h4>
                        <p className="text-sm text-gray-600">Choisissez le dépôt qui gérera cette mission</p>
                      </div>
                      
                      <div className="flex justify-center max-w-3xl mx-auto">
                        <div className="w-full max-w-md">
                          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                            Depôt *
                          </label>
                          <select
                            name="agency"
                            value={selectedAgency}
                            onChange={handleAgencyChange}
                            className="block w-full px-4 py-3 border-2 border-gray-300 rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                            required
                          >
                            <option value="">-- Sélectionner un dépôt --</option>
                            {agencyOptions.map(agency => (
                              <option key={agency} value={agency} className="text-center">
                                {agency}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Step 2: Personnel Selection - Now displayed with Step 1 */}
                      <div className="space-y-4 mt-8">
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                            <span className="text-2xl">👥</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">Sélection du Personnel</h4>
                          <p className="text-sm text-gray-600">Sélectionnez le chauffeur pour cette mission</p>
                        </div>
                        
                        <div className="max-w-2xl mx-auto">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Chauffeur *
                            </label>
                            <select
                              name="driverId"
                              value={formData.driverId}
                              onChange={handleInputChange}
                              className={`block w-full px-4 py-3 border-2 rounded-md text-center text-base transition-all duration-200 ${
                                !selectedAgency 
                                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                                  : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                              }`}
                              required
                              disabled={!selectedAgency}
                            >
                              <option value="" className="text-center">
                                {selectedAgency ? "-- Sélectionner un chauffeur --" : "-- Sélectionnez d'abord un dépôt --"}
                              </option>
                              {filteredDrivers.map(driver => (
                                <option key={driver.id} value={driver.id} className="text-center">
                                  {driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim()} - {driver.car_number || 'N/A'}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-center">
                            <div className="bg-green-50 rounded-md p-3 border border-green-200">
                              <p className="text-sm text-green-700 text-center">
                                {filteredDrivers.length} chauffeur(s) disponible(s) pour le dépôt {selectedAgency}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Planning */}
                  {currentStep === 2 && (
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-2">
                          <span className="text-xl">📅</span>
                  </div>
                        <h4 className="text-base font-bold text-gray-900 mb-1">Planification</h4>
                        <p className="text-xs text-gray-600">Définissez la date de livraison</p>
                </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2 ">
                    Date de Livraison *
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                            className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400"
                    required
                  />
                        </div>
                        <div className="flex items-end">
                          <div className="bg-purple-50 rounded-md p-2 border border-purple-200">
                            <p className="text-xs text-purple-700 ">
                    Sélectionnez la date prévue pour la livraison
                  </p>
                </div>
              </div>
                      </div>
                    </div>
                  )}

              {/* Step 3: Parcel Scanning */}
                  {currentStep === 3 && (
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mb-2">
                          <span className="text-xl">📦</span>
                  </div>
                        <h4 className="text-base font-bold text-gray-900 mb-1">Scan des Colis</h4>
                        <p className="text-xs text-gray-600">Scannez les colis à inclure dans cette mission</p>
                </div>
                
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {/* Scanner Section */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-700 ">
                    Scanner les Colis
                  </label>
                          <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={scannedCode}
                        onChange={(e) => {
                          console.log('🔍 Input onChange:', e.target.value);
                          setScannedCode(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBarcodeScan();
                          }
                        }}
                        placeholder="Entrez ou scannez le code-barres du colis..."
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🔘 Scan button clicked');
                          startBarcodeScanner();
                        }}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center space-x-1 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                        </svg>
                        <span>Scanner</span>
                      </button>
                    </div>
                    
                    {/* Scan Message */}
                    {scanMessage && (
                              <div className={`p-2 rounded-md text-xs font-medium border ${
                        scanMessage.includes('✅') 
                          ? 'bg-green-50 text-green-800 border-green-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {scanMessage}
                      </div>
                    )}
                          </div>
                          
                          {/* Available Parcels Count */}
                          <div className="text-xs text-gray-600 ">
                            {availableParcels.length} colis disponibles au dépôt
                          </div>
                  </div>

                  {/* Selected Parcels */}
                        <div className="border-2 border-gray-200 rounded-md p-3 bg-gray-50">
                          <h5 className="text-xs font-medium text-gray-700 mb-2 ">
                      Colis Scannés ({formData.parcelIds.length})
                          </h5>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                      {formData.parcelIds.length === 0 ? (
                              <p className="text-gray-500 text-xs ">Aucun colis scanné</p>
                      ) : (
                        formData.parcelIds.map(parcelId => {
                          const parcel = availableParcels.find(p => p.id === parcelId);
                          return parcel ? (
                                  <div key={parcelId} className="flex justify-between items-center p-2 bg-white rounded-md border border-gray-200 shadow-sm">
                                    <span className="text-xs ">{parcel.tracking_number} - {parcel.recipient_name}</span>
                              <button
                                type="button"
                                onClick={() => handleParcelSelection(parcelId)}
                                      className="text-red-600 hover:text-red-800 text-xs bg-red-50 hover:bg-red-100 p-1 rounded transition-colors duration-200"
                              >
                                ✕
                              </button>
                            </div>
                          ) : null;
                        })
                      )}
                    </div>
                  </div>
                  </div>
                </div>
                  )}

                  {/* Step 4: Finalization */}
                  {currentStep === 4 && (
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mb-2">
                          <span className="text-xl">✅</span>
                  </div>
                        <h4 className="text-base font-bold text-gray-900 mb-1">Finalisation</h4>
                        <p className="text-xs text-gray-600">Ajoutez des notes et finalisez la mission</p>
                </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2 ">
                    Notes (Optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ajoutez des notes ou instructions spéciales..."
                            className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 hover:border-gray-400 resize-none"
                  />
                          <p className="text-xs text-gray-500 mt-1 ">
                    Informations supplémentaires pour la mission de livraison
                  </p>
                </div>

                        {/* Mission Summary */}
                        <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                          <h5 className="text-sm font-semibold text-blue-900 mb-3 ">Résumé de la Mission</h5>
                          <div className="space-y-2 ">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Agence:</span>
                              <span className="text-xs font-medium">{selectedAgency || 'Non sélectionnée'}</span>
              </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Chauffeur:</span>
                              <span className="text-xs font-medium">
                                {formData.driverId ? 
                                  filteredDrivers.find(d => d.id === formData.driverId)?.name || 
                                  `${filteredDrivers.find(d => d.id === formData.driverId)?.first_name || ''} ${filteredDrivers.find(d => d.id === formData.driverId)?.last_name || ''}`.trim()
                                  : 'Non sélectionné'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Entrepôt (auto):</span>
                              <span className="text-xs font-medium">
                                {formData.warehouseId ? 
                                  filteredWarehouses?.find(w => w.id === formData.warehouseId)?.name || 'Non sélectionné'
                                  : 'Non sélectionné'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Date de livraison:</span>
                              <span className="text-xs font-medium">{formData.deliveryDate || 'Non définie'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Colis scannés:</span>
                              <span className="text-xs font-medium">{formData.parcelIds.length} colis</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Compact Step Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className={`px-6 py-3 rounded-md text-base font-semibold transition-all duration-200 flex items-center space-x-2 ${
                      currentStep === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Précédent</span>
                  </button>

                  <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Annuler
                </button>
                    
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <span>Suivant</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                <button
                  type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-base font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                        <span>{editingMission ? 'Modifier la Mission' : 'Créer la Mission'}</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                </button>
                    )}
                  </div>
                </div>

              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Delivery Modal */}
      <Modal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Livraison de Colis</h2>
          
          <form onSubmit={(e) => { e.preventDefault(); handleDeliverySubmit(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Colis</label>
              <select
                name="parcelId"
                value={deliveryFormData.parcelId}
                onChange={handleDeliveryInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Sélectionner un colis</option>
                {selectedMission?.parcels?.map(parcel => (
                  <option key={parcel.id} value={parcel.id}>
                    {parcel.tracking_number} - {parcel.recipient_name} ({parcel.recipient_governorate || parcel.destination})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Code de Sécurité</label>
              <input
                type="text"
                name="securityCode"
                value={deliveryFormData.securityCode}
                onChange={handleDeliveryInputChange}
                placeholder="Entrez le code de sécurité"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Code client pour livraison réussie, code échec pour retour au dépôt
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Traiter la Livraison
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal isOpen={isScanModalOpen} onClose={stopBarcodeScanner} size="full">
        <div className="bg-white rounded-lg p-6 w-full" dir="ltr">
          <h2 className="text-xl font-bold mb-4 ">Scanner de Code-Barres</h2>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Pointez la caméra vers le code-barres du colis
              </p>
              
              <div id="qr-reader" className="mx-auto" style={{ width: 400, height: 300 }}></div>
              
              {isScanning && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Scan en cours...</p>
                  <p className="text-xs text-gray-400 mt-1">Pointez la caméra vers un code-barres</p>
                </div>
              )}

              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p><strong>Debug:</strong> Scanner actif: {isScanning ? 'Oui' : 'Non'}</p>
                  <p>Code saisi: {scannedCode || 'Aucun'}</p>
                  <p>Parcels disponibles: {availableParcels.length}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const testCode = availableParcels.length > 0 ? availableParcels[0].tracking_number : 'TEST123';
                      setScannedCode(testCode);
                      handleBarcodeScan();
                    }}
                    className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Test Scan (Premier colis)
                  </button>
                </div>
              )}
            </div>

            {/* Manual Input Option */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Ou saisissez manuellement le code :</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScan();
                      stopBarcodeScanner();
                    }
                  }}
                  placeholder="Code du colis..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleBarcodeScan();
                    stopBarcodeScanner();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold"
                >
                  Valider
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={stopBarcodeScanner}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PickupClient; 
