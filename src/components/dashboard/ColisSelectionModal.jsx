import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import { apiService } from "../../services/api";

const ColisSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  expediteurId, 
  expediteurEmail,
  shippers = []
}) => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParcels, setSelectedParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [step, setStep] = useState('agency'); // 'agency', 'shipper', 'payment', 'parcels'
  const [shipperSearchTerm, setShipperSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Agency selection states
  const [selectedAgency, setSelectedAgency] = useState("");
  const [agencyFilteredShippers, setAgencyFilteredShippers] = useState([]);

  // Payment information states
  const [paymentDetails, setPaymentDetails] = useState({
    // Cash payment fields
    cash_date: "",
    // Check payment fields
    check_date: "",
    check_number: "",
    // Bank transfer payment fields
    transfer_date: "",
    transfer_reference: ""
  });

  // Agency options
  const agencyOptions = [
    "Siège",
    "Tunis", 
    "Sousse",
    "Sfax",
    "Monastir"
  ];

  // Agency to expediteur mapping
  const agencyExpediteurMapping = {
    "Siège": ["Hayder altayeb"],
    "Tunis": ["Toumi Marwen", "Ritej Chaieb"],
    "Sousse": ["Ayeb Hichem", "fedi", "asma gharbi"],
    "Sfax": ["Wael Riahi"],
    "Monastir": []
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('agency');
      setSelectedShipper(null);
      setSelectedParcels([]);
      setParcels([]);
      setShipperSearchTerm("");
      setPaymentMethod("");
      setSelectedAgency("");
      setAgencyFilteredShippers([]);
      setPaymentDetails({
        // Cash payment fields
        cash_date: "",
        // Check payment fields
        check_date: "",
        check_number: "",
        // Bank transfer payment fields
        transfer_date: "",
        transfer_reference: ""
      });
    }
  }, [isOpen]);

  // Agency change handler
  const handleAgencyChange = (e) => {
    const agency = e.target.value;
    setSelectedAgency(agency);
    
    if (agency) {
      // Filter shippers based on agency
      const agencyShippers = shippers.filter(shipper => {
        // Check if shipper belongs to the selected agency
        const shipperName = shipper.name || `${shipper.first_name || ''} ${shipper.last_name || ''}`.trim();
        return agencyExpediteurMapping[agency]?.includes(shipperName) || 
               shipper.agency === agency ||
               shipper.governorate === agency;
      });
      setAgencyFilteredShippers(agencyShippers);
    } else {
      setAgencyFilteredShippers([]);
    }
    
    // Reset shipper selection when agency changes
    setSelectedShipper(null);
  };

  // Fetch parcels for the expediteur
  useEffect(() => {
    if (isOpen && selectedShipper && step === 'parcels') {
      fetchParcels();
    }
  }, [isOpen, selectedShipper, step]);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      let parcelsData = [];
      
      if (selectedShipper) {
        console.log('🔍 Fetching parcels for shipper:', selectedShipper);
        
        // Try to get parcels by shipper ID from all parcels
        const allParcels = await apiService.getParcels();
        console.log('📦 All parcels received:', allParcels?.length || 0);
        
        if (allParcels && Array.isArray(allParcels)) {
          parcelsData = allParcels.filter(p => p.shipper_id == selectedShipper.id);
          console.log('📦 Filtered parcels for shipper:', parcelsData.length);
        }
        
        // If no parcels found, try to get parcels by shipper email
        if (parcelsData.length === 0 && selectedShipper.email) {
          console.log('🔍 Trying to get parcels by email:', selectedShipper.email);
          const expediteurParcels = await apiService.getExpediteurParcels(selectedShipper.email);
          console.log('📦 Expediteur parcels received:', expediteurParcels?.length || 0);
          
          if (expediteurParcels && Array.isArray(expediteurParcels)) {
            parcelsData = expediteurParcels;
          } else if (expediteurParcels && expediteurParcels.parcels) {
            parcelsData = expediteurParcels.parcels;
          }
        }
      }
      
      console.log('📦 Raw parcels data:', parcelsData);
      
      // Filter only delivered or returned parcels (only "livrés" and "retour")
      const filteredParcels = parcelsData.filter(p => {
        const status = p.status?.toLowerCase();
        return status === 'livrés' || 
               status === 'retour';
      });
      
      console.log('📦 Available statuses in data:', [...new Set(parcelsData.map(p => p.status))]);
      console.log('📦 Filtered parcels count:', filteredParcels.length);
      
      console.log('📦 Filtered parcels (Livré/Retour):', filteredParcels.length);
      setParcels(filteredParcels);
    } catch (error) {
      console.error('Error fetching parcels:', error);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleParcelToggle = (parcel) => {
    setSelectedParcels(prev => {
      const isSelected = prev.find(p => p.id === parcel.id);
      if (isSelected) {
        return prev.filter(p => p.id !== parcel.id);
      } else {
        return [...prev, parcel];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedParcels.length === filteredParcels.length) {
      setSelectedParcels([]);
    } else {
      setSelectedParcels(filteredParcels);
    }
  };

  const handleShipperSelect = (shipper) => {
    setSelectedShipper(shipper);
    setStep('payment');
  };

  const handleConfirm = () => {
    if (selectedParcels.length === 0) {
      alert('Veuillez sélectionner au moins un colis');
      return;
    }
    if (!paymentMethod) {
      alert('Veuillez sélectionner un type de paiement');
      return;
    }
    
    // Validate payment type specific fields
    if (paymentMethod === "Espèces" && !paymentDetails.cash_date) {
      alert('Veuillez entrer la date de paiement pour les espèces');
      return;
    }
    
    if (paymentMethod === "Paiement avec chèque" && (!paymentDetails.check_date || !paymentDetails.check_number)) {
      alert('Veuillez entrer la date et le numéro de chèque');
      return;
    }
    
    if (paymentMethod === "Virements bancaires" && (!paymentDetails.transfer_date || !paymentDetails.transfer_reference)) {
      alert('Veuillez entrer la date et la référence du virement');
      return;
    }
    
    onConfirm({
      shipper: selectedShipper,
      parcels: selectedParcels,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails,
      totalAmount: totalAmount,
      subtotal: subtotal,
      deduction: deduction
    });
    onClose();
  };

  const handleBack = () => {
    setStep('shipper');
    setSelectedShipper(null);
    setSelectedParcels([]);
    setParcels([]);
  };

  // Function to get identity type and number
  const getIdentityInfo = (shipper) => {
    if (shipper.fiscal_number) {
      return { type: "Patente", number: shipper.fiscal_number };
    } else if (shipper.identity_number) {
      return { type: "Carte d'identité", number: shipper.identity_number };
    }
    return null;
  };

  const identityInfo = selectedShipper ? getIdentityInfo(selectedShipper) : null;

  // Filter shippers based on search (from agency-filtered list)
  const filteredShippers = agencyFilteredShippers.filter(shipper => {
    const matchesSearch = !shipperSearchTerm || 
      shipper.name?.toLowerCase().includes(shipperSearchTerm.toLowerCase()) ||
      shipper.email?.toLowerCase().includes(shipperSearchTerm.toLowerCase()) ||
      shipper.phone?.toLowerCase().includes(shipperSearchTerm.toLowerCase()) ||
      shipper.agency?.toLowerCase().includes(shipperSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Filter parcels based on search and status
  const filteredParcels = parcels.filter(parcel => {
    const matchesSearch = !searchTerm || 
      parcel.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || parcel.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate total amount with potential deduction
  const subtotal = selectedParcels.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  
  // Apply 3% deduction only for individuals with carte d'identité
  const deduction = identityInfo && identityInfo.type === "Carte d'identité" ? subtotal * 0.03 : 0;
  const totalAmount = subtotal - deduction;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'shipper' ? "Sélectionner l'Expéditeur" : "Sélectionner les Colis - " + selectedShipper?.name}
      size="xl"
    >
      <div className="space-y-4">
        {/* Identity Information - Right Side of Page */}
        {step === 'parcels' && identityInfo && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-lg">
              <div className="text-sm font-medium text-blue-800">
                {identityInfo.type}: {identityInfo.number}
              </div>
              {identityInfo.type === "Carte d'identité" && (
                <div className="text-xs text-red-600 font-medium">
                  ⚠️ Retenu à la source 3% applicable
                </div>
              )}
              {identityInfo.type === "Patente" && (
                <div className="text-xs text-green-600 font-medium">
                  ✅ Pas de retenu à la source
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'agency' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step === 'shipper' || step === 'payment' || step === 'parcels' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'shipper' ? 'bg-blue-600 text-white' : step === 'payment' || step === 'parcels' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step === 'payment' || step === 'parcels' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'payment' ? 'bg-blue-600 text-white' : step === 'parcels' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <div className={`w-16 h-1 ${step === 'parcels' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'parcels' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              4
            </div>
          </div>
        </div>

        {step === 'agency' ? (
          /* Agency Selection Step */
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">Sélection de l'Agence</h3>
              <p className="text-sm text-gray-600">Choisissez l'agence de l'expéditeur</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {agencyOptions.map((agency) => (
                <div
                  key={agency}
                  onClick={() => {
                    setSelectedAgency(agency);
                    handleAgencyChange({ target: { value: agency } });
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedAgency === agency
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">🏢</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{agency}</div>
                      <div className="text-sm text-gray-600">
                        {agencyExpediteurMapping[agency]?.length || 0} expéditeur(s)
                      </div>
                    </div>
                  </div>
                  {selectedAgency === agency && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="text-xs text-blue-600">
                        ✅ Agence sélectionnée
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : step === 'shipper' ? (
          /* Shipper Selection Step */
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">Sélection de l'Expéditeur</h3>
              <p className="text-sm text-gray-600">Choisissez l'expéditeur pour créer la facture</p>
            </div>
            
            {/* Back button */}
            <button
              onClick={() => setStep('agency')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la sélection d'agence
            </button>
            
            {/* Search bar for shippers */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone ou agence..."
                value={shipperSearchTerm}
                onChange={(e) => setShipperSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredShippers.map((shipper) => (
                <div
                  key={shipper.id}
                  onClick={() => handleShipperSelect(shipper)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="font-medium">{shipper.name}</div>
                  <div className="text-sm text-gray-600">{shipper.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {shipper.phone || 'Téléphone non spécifié'}
                  </div>
                  {shipper.agency && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      🏢 {shipper.agency}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {filteredShippers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {!selectedAgency ? 'Veuillez d\'abord sélectionner un dépôt' : 
                 shipperSearchTerm ? 'Aucun expéditeur trouvé pour cette recherche' : 
                 'Aucun expéditeur disponible pour ce dépôt'}
              </div>
            )}
          </div>
        ) : step === 'payment' ? (
          /* Payment Type Selection Step */
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">Type de Paiement</h3>
              <p className="text-sm text-gray-600">Choisissez le type de paiement pour {selectedShipper?.name}</p>
            </div>
            
            {/* Back button */}
            <button
              onClick={() => setStep('shipper')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la sélection d'expéditeur
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  type: "Espèces", 
                  icon: "💵", 
                  description: "Paiement en espèces",
                  color: "green",
                  fieldKey: "cashDetails"
                },
                { 
                  type: "Paiement avec chèque", 
                  icon: "📄", 
                  description: "Paiement par chèque",
                  color: "blue",
                  fieldKey: "checkDetails"
                },
                { 
                  type: "Virements bancaires", 
                  icon: "🏦", 
                  description: "Paiement par virement bancaire",
                  color: "purple",
                  fieldKey: "bankTransferDetails"
                }
              ].map((paymentOption) => (
                <div
                  key={paymentOption.type}
                  onClick={() => setPaymentMethod(paymentOption.type)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    paymentMethod === paymentOption.type
                      ? `border-${paymentOption.color}-500 bg-${paymentOption.color}-50 shadow-md`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${paymentOption.color}-500 to-${paymentOption.color}-600 rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xl">{paymentOption.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{paymentOption.type}</div>
                      <div className="text-sm text-gray-600">{paymentOption.description}</div>
                    </div>
                  </div>
                  
                  {paymentMethod === paymentOption.type && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      <div className={`text-xs text-${paymentOption.color}-600 font-medium`}>
                        ✅ Type sélectionné
                      </div>
                      
                      {/* Payment Type Specific Fields */}
                      {paymentOption.type === "Espèces" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Date de paiement *
                          </label>
                          <input
                            type="date"
                            value={paymentDetails.cash_date}
                            onChange={(e) => setPaymentDetails(prev => ({
                              ...prev,
                              cash_date: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      
                      {paymentOption.type === "Paiement avec chèque" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Date du chèque *
                            </label>
                            <input
                              type="date"
                              value={paymentDetails.check_date}
                              onChange={(e) => setPaymentDetails(prev => ({
                                ...prev,
                                check_date: e.target.value
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              N° Chèque *
                            </label>
                            <input
                              type="text"
                              value={paymentDetails.check_number}
                              onChange={(e) => setPaymentDetails(prev => ({
                                ...prev,
                                check_number: e.target.value
                              }))}
                              placeholder="Ex : CHK-001-2024"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </>
                      )}
                      
                      {paymentOption.type === "Virements bancaires" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Date du virement *
                            </label>
                            <input
                              type="date"
                              value={paymentDetails.transfer_date}
                              onChange={(e) => setPaymentDetails(prev => ({
                                ...prev,
                                transfer_date: e.target.value
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Référence du virement *
                            </label>
                            <input
                              type="text"
                              value={paymentDetails.transfer_reference}
                              onChange={(e) => setPaymentDetails(prev => ({
                                ...prev,
                                transfer_reference: e.target.value
                              }))}
                              placeholder="Ex : VIR-001-2024"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Parcels Selection Step */
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la sélection d'expéditeur
            </button>

            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par numéro de suivi, destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="Livrés">Livrés</option>
                  <option value="Livrés payés">Livrés payés</option>
                  <option value="Retour">Retour</option>
                  <option value="Retour En Cours">Retour En Cours</option>
                </select>
              </div>
            </div>



            {/* Parcels List */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Chargement des colis...</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 ">
                        <input
                          type="checkbox"
                          checked={selectedParcels.length === filteredParcels.length && filteredParcels.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 ">N° Suivi</th>
                      <th className="px-3 py-2 ">Destination</th>
                      <th className="px-3 py-2 ">Client</th>
                      <th className="px-3 py-2 ">Statut</th>
                      <th className="px-3 py-2 ">Date</th>
                      <th className="px-3 py-2 text-right">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParcels.map((parcel) => {
                      const isSelected = selectedParcels.find(p => p.id === parcel.id);
                      return (
                        <tr 
                          key={parcel.id} 
                          className={`border-b hover:bg-gray-50 cursor-pointer ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleParcelToggle(parcel)}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={() => handleParcelToggle(parcel)}
                              className="rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {parcel.tracking_number}
                          </td>
                          <td className="px-3 py-2">
                            {parcel.destination || parcel.recipient_address}
                          </td>
                          <td className="px-3 py-2">
                            {parcel.recipient_name}
                          </td>
                          <td className="px-3 py-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                          parcel.status === 'Livré' || parcel.status === 'delivered' || 
                          parcel.status === 'Livrés' || parcel.status === 'Livrés payés'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {parcel.status}
                        </span>
                          </td>
                          <td className="px-3 py-2">
                            {parcel.created_at ? new Date(parcel.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {parseFloat(parcel.price || 0).toFixed(3)} TND
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredParcels.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun colis trouvé
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          
          <div className="flex space-x-2">
            {step === 'agency' && (
              <button
                onClick={() => setStep('shipper')}
                disabled={!selectedAgency}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Suivant</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {step === 'shipper' && (
              <button
                onClick={() => setStep('payment')}
                disabled={!selectedShipper}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Suivant</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {step === 'payment' && (
              <button
                onClick={() => setStep('parcels')}
                disabled={
                  !paymentMethod || 
                  (paymentMethod === "Espèces" && !paymentDetails.cash_date) ||
                  (paymentMethod === "Paiement avec chèque" && (!paymentDetails.check_date || !paymentDetails.check_number)) ||
                  (paymentMethod === "Virements bancaires" && (!paymentDetails.transfer_date || !paymentDetails.transfer_reference))
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Suivant</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {step === 'parcels' && (
              <button
                onClick={handleConfirm}
                disabled={selectedParcels.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Créer la Facture ({selectedParcels.length})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ColisSelectionModal; 
