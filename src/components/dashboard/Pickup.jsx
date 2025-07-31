import React, { useState, useRef, useEffect } from "react";
import MissionPickupTable from "./common/MissionPickupTable";
import Modal from "./common/Modal";
import html2pdf from "html2pdf.js";
import MissionColisScan from "./MissionColisScan";
import { missionsPickupService } from '../../services/api';
import { apiService } from '../../services/api';

// Pickup mission status flow - only the 4 statuses needed for pickup
const pickupStatusList = [
  "En attente",      // Initial status when pickup is created
  "À enlever",       // When driver accepts the mission  
  "Enlevé",          // When driver scans parcel codes
  "Au dépôt"         // When driver completes with security code
];

// All parcel statuses for reference
const allParcelStatuses = [
  "En attente", "À enlever", "Enlevé", "Au dépôt", "En cours", "RTN dépot", 
  "Livrés", "Livrés payés", "Retour définitif", "RTN client dépôt", 
  "Retour Expéditeur", "Retour En Cours d'expédition", "Retour reçu"
];

const currentUser = {
  name: "François Petit",
  email: "francois.petit@quickzone.tn",
  role: "Chef d'agence"
};

// Governorate options for filtering
const governorateOptions = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte", "Béja", "Jendouba", 
  "Le Kef", "Siliana", "Kairouan", "Kasserine", "Sidi Bouzid", "Sousse", "Monastir", "Mahdia", 
  "Sfax", "Gafsa", "Tozeur", "Kebili", "Gabès", "Médenine", "Tataouine"
];

const statusBadge = (status) => {
  const colorMap = {
    // Pickup flow statuses
    "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "À enlever": "bg-blue-100 text-blue-800 border-blue-300", 
    "Enlevé": "bg-green-100 text-green-800 border-green-300",
    "Au dépôt": "bg-purple-100 text-purple-800 border-purple-300",
    
    // Other parcel statuses
    "En cours": "bg-purple-100 text-purple-800 border-purple-300",
    "RTN dépot": "bg-orange-100 text-orange-800 border-orange-300",
    "Livrés": "bg-green-100 text-green-800 border-green-300",
    "Livrés payés": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "Retour définitif": "bg-red-100 text-red-800 border-red-300",
    "RTN client dépôt": "bg-pink-100 text-pink-800 border-pink-300",
    "Retour Expéditeur": "bg-gray-100 text-gray-800 border-gray-300",
    "Retour En Cours d'expédition": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "Retour reçu": "bg-cyan-100 text-cyan-800 border-cyan-300",
    
    // Mission statuses (for backward compatibility)
    "scheduled": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Accepté par livreur": "bg-blue-100 text-blue-800 border-blue-300",
    "En cours de ramassage": "bg-green-100 text-green-800 border-green-300",
    "Refusé par livreur": "bg-red-50 text-red-700 border-red-300",
    "Mission terminée": "bg-purple-100 text-purple-800 border-purple-300",
  };
  return <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>{status}</span>;
};

const Pickup = () => {
  const [missions, setMissions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [colis, setColis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [viewMission, setViewMission] = useState(null);
  const [formData, setFormData] = useState({
    driverId: "",
    shipperId: "",
    colisIds: [],
    status: "En attente", // Always start with "En attente"
    scheduledTime: "",
    pdfFile: null,
  });
  const detailRef = useRef();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedColis, setScannedColis] = useState([]);
  const [securityCodes, setSecurityCodes] = useState({});

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedShippers, setSelectedShippers] = useState([]);
  const [selectedColis, setSelectedColis] = useState([]);
  const [governorateFilter, setGovernorateFilter] = useState("");
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [filteredShippers, setFilteredShippers] = useState([]);
  const [availableColis, setAvailableColis] = useState([]);

  // Load data from API
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching missions pickup data...');
        const [missionsData, driversData, shippersData, colisData] = await Promise.all([
          missionsPickupService.getMissionsPickup(),
          apiService.getDrivers(), // This gets drivers from the drivers table
          apiService.getShippers(),
          apiService.getParcels(),
        ]);
        console.log('Missions data:', missionsData);
        console.log('Drivers data:', driversData);
        console.log('Shippers data:', shippersData);
        console.log('Colis data:', colisData);
        
        // Handle missions data properly - it should be in missionsData.data
        const missions = missionsData?.data || missionsData || [];
        console.log('Processed missions:', missions);
        
        setMissions(missions);
        setDrivers(driversData);
        setShippers(shippersData);
        setColis(colisData);
        
        // Initialize filtered drivers
        setFilteredDrivers(driversData);
        
        // Fetch security codes for all missions
        console.log('Fetching security codes for all missions...');
        const codes = {};
        for (const mission of missions) {
          try {
            console.log(`Fetching security code for mission ${mission.id}...`);
            const codeResponse = await missionsPickupService.getMissionSecurityCode(mission.id);
                          console.log(`Response for mission ${mission.id}:`, codeResponse);
            
            // Check different response formats
            if (codeResponse.success && codeResponse.data && codeResponse.data.securityCode) {
              codes[mission.id] = codeResponse.data.securityCode;
              console.log(`Security code for mission ${mission.id}: ${codeResponse.data.securityCode}`);
            } else if (codeResponse.securityCode) {
              // Direct response format
              codes[mission.id] = codeResponse.securityCode;
                              console.log(`Security code for mission ${mission.id}: ${codeResponse.securityCode}`);
            } else {
              console.log(`No security code data for mission ${mission.id}:`, codeResponse);
            }
          } catch (error) {
            console.error(`Error fetching security code for mission ${mission.id}:`, error);
            console.error(`Error details:`, {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
          }
        }
        setSecurityCodes(codes);
        console.log('Final security codes loaded:', codes);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Helpers
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || "";
  const getShipperName = (id) => shippers.find(s => s.id === id)?.name || "";
  const getColisByIds = (ids) => colis.filter(c => ids.includes(c.id));

  // Wizard helper functions
  const handleDriverSelection = (driver) => {
    setSelectedDriver(driver);
    setFormData(prev => ({ ...prev, driverId: driver.id }));
    
    // Filter shippers by driver's governorate
    const driverGovernorate = driver.governorate || driver.city || "";
    const filtered = shippers.filter(shipper => 
      (shipper.governorate || shipper.city || "").toLowerCase() === driverGovernorate.toLowerCase()
    );
    setFilteredShippers(filtered);
    setSelectedShippers([]);
    setSelectedColis([]);
  };

  const handleShipperSelection = (shipper) => {
    setSelectedShippers(prev => {
      const isSelected = prev.find(s => s.id === shipper.id);
      if (isSelected) {
        return prev.filter(s => s.id !== shipper.id);
      } else {
        return [...prev, shipper];
      }
    });
  };

  const handleColisSelection = (coli) => {
    setSelectedColis(prev => {
      const isSelected = prev.find(c => c.id === coli.id);
      if (isSelected) {
        return prev.filter(c => c.id !== coli.id);
      } else {
        return [...prev, coli];
      }
    });
  };

  const filterDriversByGovernorate = (governorate) => {
    setGovernorateFilter(governorate);
    if (governorate) {
      const filtered = drivers.filter(driver => 
        (driver.governorate || driver.city || "").toLowerCase().includes(governorate.toLowerCase())
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(drivers);
    }
  };

  const getAvailableColisForShippers = () => {
    const shipperIds = selectedShippers.map(s => s.id);
    return colis.filter(coli => 
      shipperIds.includes(coli.shipper_id) && 
      (coli.status === 'pending' || coli.status === 'En attente')
    );
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedDriver(null);
    setSelectedShippers([]);
    setSelectedColis([]);
    setGovernorateFilter("");
    setFilteredDrivers(drivers);
    setFilteredShippers([]);
    setAvailableColis([]);
    setFormData({
      driverId: "",
      shipperId: "",
      colisIds: [],
      status: "En attente",
      scheduledTime: "",
      pdfFile: null,
    });
  };

  // Actions
  const handleAdd = () => {
    setEditingMission(null);
    resetWizard();
    setIsModalOpen(true);
  };
  const handleEdit = (mission) => {
    setEditingMission(mission);
    setFormData({
      driverId: mission.driver?.id,
      shipperId: mission.shipper?.id,
      colisIds: mission.parcels?.map(c => c.id) || [],
      status: mission.status,
      scheduledTime: mission.scheduled_time,
      pdfFile: mission.pdfFile || null,
    });
    setIsModalOpen(true);
  };
  const handleDelete = async (mission) => {
    if (window.confirm("Supprimer cette mission ?")) {
      try {
        await missionsPickupService.deleteMissionPickup(mission.id);
        setMissions(missions.filter(m => m.id !== mission.id));
      } catch (err) {
        alert("Erreur lors de la suppression de la mission.");
      }
    }
  };
  const handleSubmit = async () => {
    try {
      console.log('handleSubmit called with selected data:', {
        driver: selectedDriver,
        shippers: selectedShippers,
        colis: selectedColis
      });
      
      if (!selectedDriver || selectedShippers.length === 0 || selectedColis.length === 0) {
        alert("Veuillez sélectionner un livreur, au moins un expéditeur et des colis.");
        return;
      }
      
      // Create missions for each selected shipper
      for (const shipper of selectedShippers) {
        const shipperColis = selectedColis.filter(coli => coli.shipper_id === shipper.id);
        
        if (shipperColis.length === 0) continue;
        
        const data = {
          driver_id: selectedDriver.id,
          shipper_id: shipper.id,
          colis_ids: shipperColis.map(p => p.id),
          scheduled_time: new Date().toISOString().slice(0, 16),
          status: 'En attente',
        };
        
        console.log(`Creating mission for shipper ${shipper.name}:`, data);
        
        const response = await missionsPickupService.createMissionPickup(data);
        console.log('Mission created:', response);
        const createdMission = response.data;
        setMissions(prev => [createdMission, ...prev]);
      }
      
      console.log('Closing modal...');
      setIsModalOpen(false);
      resetWizard();
              console.log('Mission assignment completed successfully!');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      alert("Erreur lors de l'enregistrement de la mission: " + err.message);
    }
  };
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "shipperId") {
      setFormData((prev) => ({
        ...prev,
        shipperId: value,
        // Optionnel : auto-sélection du livreur par défaut si tu veux
      }));
    } else if (name === "colisIds") {
      const id = value;
      setFormData((prev) => ({
        ...prev,
        colisIds: checked ? [...prev.colisIds, id] : prev.colisIds.filter(cid => cid !== id),
      }));
    } else if (name === "pdfFile") {
      setFormData((prev) => ({ ...prev, pdfFile: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleScanValidate = (codes) => {
    setFormData((prev) => ({
      ...prev,
      colisIds: Array.from(new Set([...prev.colisIds, ...codes]))
    }));
    setIsScanModalOpen(false);
  };

  // Export PDF du détail de la mission
  const handleExportPDF = () => {
    if (detailRef.current) {
      html2pdf().set({
        margin: 0.5,
        filename: `Mission_${viewMission.id}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
      }).from(detailRef.current).save();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement des missions...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des missions de collecte</h1>
          <p className="text-gray-600 mt-1">Assignez des missions de ramassage aux livreurs, reliez colis et expéditeurs</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Nouvelle mission
        </button>
      </div>

      {/* Tableau des missions */}
      <MissionPickupTable
        missions={missions}
        onView={setViewMission}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        securityCodes={securityCodes}
      />

      {/* Modal création/édition mission - Step by Step Wizard */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetWizard();
        }}
        title={editingMission ? "Modifier la mission" : "Nouvelle mission de collecte"}
        size="75%"
      >
        <div className="bg-white rounded-lg p-8 w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {editingMission ? 'Modifier la Mission' : 'Nouvelle Mission de Collecte'}
          </h2>
          
          {editingMission ? (
            // Edit mode - keep original form for editing
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              console.log('Form submitted, calling handleSubmit...');
              console.log('Form data:', formData);
              
              if (!formData.driverId || !formData.shipperId) {
                console.log('Missing required fields');
                alert('Veuillez sélectionner un livreur et un client');
                return;
              }
              
              console.log('Form validation passed, calling handleSubmit...');
              await handleSubmit(); 
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Nom du livreur</label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Nom du client</label>
                <select
                  name="shipperId"
                  value={formData.shipperId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner</option>
                  {shippers.map(shipper => (
                    <option key={shipper.id} value={shipper.id}>{shipper.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
                >
                  Assigner
                </button>
              </div>
            </form>
          ) : (
            // Create mode - Step by Step Wizard
            <div className="space-y-6">
              {/* Step Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-center space-x-4">
                  {[
                    { step: 1, title: "Livreur", color: "blue" },
                    { step: 2, title: "Expéditeurs", color: "green" },
                    { step: 3, title: "Colis", color: "purple" },
                    { step: 4, title: "Création", color: "orange" }
                  ].map((stepInfo, index) => (
                    <div key={stepInfo.step} className="flex items-center">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        currentStep >= stepInfo.step 
                          ? `bg-${stepInfo.color}-600 border-${stepInfo.color}-600 text-white` 
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        <span className="text-lg">{stepInfo.step}</span>
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

              {/* Step Content */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                
                {/* Step 1: Driver Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <span className="text-3xl font-bold text-blue-600">1</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sélection du Livreur</h3>
                      <p className="text-gray-600">Choisissez le livreur qui effectuera la collecte</p>
                    </div>

                    {/* Governorate Filter */}
                    <div className="max-w-md mx-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrer par gouvernorat
                      </label>
                      <select
                        value={governorateFilter}
                        onChange={(e) => filterDriversByGovernorate(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Tous les gouvernorats</option>
                        {governorateOptions.map(governorate => (
                          <option key={governorate} value={governorate}>{governorate}</option>
                        ))}
                      </select>
                    </div>

                    {/* Drivers List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDrivers.map(driver => (
                        <div
                          key={driver.id}
                          onClick={() => handleDriverSelection(driver)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedDriver?.id === driver.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-lg">
                                  {driver.name?.charAt(0) || 'L'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                              <p className="text-sm text-gray-600">
                                {driver.governorate || driver.city || 'Gouvernorat non spécifié'}
                              </p>
                              {driver.car_number && (
                                <p className="text-xs text-gray-500">Véhicule: {driver.car_number}</p>
                              )}
                            </div>
                            {selectedDriver?.id === driver.id && (
                              <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredDrivers.length === 0 && (
                      <div className="text-center py-8">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-gray-500 text-lg">Aucun livreur trouvé</p>
                        <p className="text-gray-400 text-sm">
                          {governorateFilter ? `Aucun livreur dans ${governorateFilter}` : 'Aucun livreur disponible'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Shippers Selection */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <span className="text-3xl font-bold text-green-600">2</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sélection des Expéditeurs</h3>
                      <p className="text-gray-600">
                        Sélectionnez un ou plusieurs expéditeurs dans {selectedDriver?.governorate || selectedDriver?.city || 'le gouvernorat du livreur'}
                      </p>
                    </div>

                    {selectedDriver && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-blue-800 font-medium">
                            Livreur sélectionné: {selectedDriver.name} ({selectedDriver.governorate || selectedDriver.city})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Shippers List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredShippers.map(shipper => (
                        <div
                          key={shipper.id}
                          onClick={() => handleShipperSelection(shipper)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedShippers.find(s => s.id === shipper.id)
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-semibold text-lg">
                                  {shipper.name?.charAt(0) || 'E'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{shipper.name}</h4>
                              <p className="text-sm text-gray-600">
                                {shipper.governorate || shipper.city || 'Gouvernorat non spécifié'}
                              </p>
                              {shipper.address && (
                                <p className="text-xs text-gray-500 truncate">{shipper.address}</p>
                              )}
                            </div>
                            {selectedShippers.find(s => s.id === shipper.id) && (
                              <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredShippers.length === 0 && (
                      <div className="text-center py-8">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 text-lg">Aucun expéditeur trouvé</p>
                        <p className="text-gray-400 text-sm">
                          Aucun expéditeur dans {selectedDriver?.governorate || selectedDriver?.city || 'ce gouvernorat'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Colis Selection */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                        <span className="text-3xl font-bold text-purple-600">3</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sélection des Colis</h3>
                      <p className="text-gray-600">
                        Sélectionnez les colis à collecter pour les expéditeurs choisis
                      </p>
                    </div>

                    {selectedShippers.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-800 font-medium">
                            {selectedShippers.length} expéditeur(s) sélectionné(s)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Available Colis */}
                    {(() => {
                      const availableColis = getAvailableColisForShippers();
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-900">Colis disponibles</h4>
                            <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                              {availableColis.length} colis
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableColis.map(coli => (
                              <div
                                key={coli.id}
                                onClick={() => handleColisSelection(coli)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  selectedColis.find(c => c.id === coli.id)
                                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                      <span className="text-purple-600 font-semibold text-lg">
                                        #{coli.id}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                      {coli.tracking_number || `Colis ${coli.id}`}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Expéditeur: {shippers.find(s => s.id === coli.shipper_id)?.name || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Destinataire: {coli.recipient_name || coli.destination || 'N/A'}
                                    </p>
                                    {coli.weight && (
                                      <p className="text-xs text-gray-500">Poids: {coli.weight} kg</p>
                                    )}
                                  </div>
                                  {selectedColis.find(c => c.id === coli.id) && (
                                    <div className="flex-shrink-0">
                                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {availableColis.length === 0 && (
                            <div className="text-center py-8">
                              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <p className="text-gray-500 text-lg">Aucun colis disponible</p>
                              <p className="text-gray-400 text-sm">
                                Aucun colis en attente pour les expéditeurs sélectionnés
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Step 4: Mission Creation */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <span className="text-3xl font-bold text-orange-600">4</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Création de la Mission</h3>
                      <p className="text-gray-600">Vérifiez les détails et créez la mission</p>
                    </div>

                    {/* Mission Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Résumé de la Mission</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Livreur</h5>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {selectedDriver?.name?.charAt(0) || 'L'}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{selectedDriver?.name}</p>
                                <p className="text-sm text-gray-600">
                                  {selectedDriver?.governorate || selectedDriver?.city}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Expéditeurs ({selectedShippers.length})</h5>
                          <div className="space-y-2">
                            {selectedShippers.map(shipper => (
                              <div key={shipper.id} className="bg-green-50 rounded-lg p-3">
                                <p className="font-semibold text-gray-900">{shipper.name}</p>
                                <p className="text-sm text-gray-600">
                                  {shipper.governorate || shipper.city}
                                </p>
                                {shipper.address && (
                                  <p className="text-xs text-gray-500">{shipper.address}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h5 className="font-medium text-gray-700 mb-2">Colis à collecter ({selectedColis.length})</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedColis.map(coli => (
                            <div key={coli.id} className="bg-purple-50 rounded-lg p-3">
                              <p className="font-semibold text-gray-900">
                                {coli.tracking_number || `Colis ${coli.id}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {shippers.find(s => s.id === coli.shipper_id)?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {coli.recipient_name || coli.destination}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step Navigation */}
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
                    onClick={() => {
                      setIsModalOpen(false);
                      resetWizard();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Annuler
                  </button>
                  
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        // Validation for each step
                        if (currentStep === 1 && !selectedDriver) {
                          alert('Veuillez sélectionner un livreur');
                          return;
                        }
                        if (currentStep === 2 && selectedShippers.length === 0) {
                          alert('Veuillez sélectionner au moins un expéditeur');
                          return;
                        }
                        if (currentStep === 3 && selectedColis.length === 0) {
                          alert('Veuillez sélectionner au moins un colis');
                          return;
                        }
                        setCurrentStep(currentStep + 1);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      <span>Suivant</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-base font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      <span>Créer la Mission</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal vue détaillée mission */}
      <Modal
        isOpen={!!viewMission}
        onClose={() => setViewMission(null)}
        title={viewMission ? `Détail de la mission #${viewMission.id}` : ""}
        size="lg"
        extraHeader={viewMission && (
          <button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform ml-2"
          >
            Exporter en PDF
          </button>
        )}
      >
        {viewMission && (
          <div ref={detailRef} className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-blue-100 animate-fade-in">
            <div className="flex flex-wrap justify-between gap-6 mb-6">
              <div className="flex-1 min-w-[180px]">
                            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold">Livreur</span>
              <span className="font-semibold text-lg">{viewMission.driver?.name || "Non assigné"}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-bold">Expéditeur</span>
              <span className="font-semibold text-lg">{viewMission.shipper?.name || "Non assigné"}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-xs font-bold">N° Mission</span>
              <span className="font-semibold text-lg">{viewMission.mission_number}</span>
            </div>
              </div>
              <div className="flex-1 min-w-[180px] text-right">
                <div className="mb-2">
                  <span className="font-semibold text-gray-700">Date prévue :</span>
                  <div className="text-base">{viewMission.scheduled_time}</div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-gray-700">Statut :</span>
                  <div>{statusBadge(viewMission.status)}</div>
                </div>
                {viewMission.pdfFile && (
                  <div className="mt-2">
                    <a
                      href={URL.createObjectURL(viewMission.pdfFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      Voir le PDF joint
                    </a>
                  </div>
                )}
              </div>
            </div>
            {/* Security Code Section */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      Code de Sécurité
                    </div>
                    <div className="text-sm text-gray-600">
                      Ce code est requis pour que le livreur puisse terminer la mission
                    </div>
                  </div>
                  <div className="text-right">
                    <code className="bg-white px-3 py-2 rounded border text-lg font-mono text-gray-800">
                      {securityCodes[viewMission.id] || 'Non généré'}
                    </code>
                    {securityCodes[viewMission.id] && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(securityCodes[viewMission.id]);
                          alert('Code copié dans le presse-papiers!');
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                        title="Copier le code"
                      >
                        Copier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="font-semibold text-gray-700 mb-2 text-lg flex items-center gap-2">
                <span className="inline-block bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-xs font-bold">Colis associés</span>
                <span className="text-xs text-gray-400">({viewMission.parcels?.length || 0})</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {viewMission.parcels?.map((c) => (
                  <li key={c.id} className="bg-gray-50 rounded-lg p-3 shadow flex flex-col gap-1 border border-gray-100">
                    <span className="font-medium text-blue-700">{c.id}</span>
                    <span className="text-xs text-gray-600">Destinataire : <span className="font-semibold">{c.destination}</span></span>
                    <span className="text-xs">{statusBadge(c.status)}</span>
                  </li>
                )) || <li className="text-gray-500 text-center col-span-2">Aucun colis associé</li>}
              </ul>
            </div>
            <div className="text-xs text-gray-400 mt-6">Mission créée le {viewMission.created_at}</div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Ajouter des colis à la mission"
        size="md"
      >
        <MissionColisScan onValidate={handleScanValidate} onClose={() => setIsScanModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Pickup; 
