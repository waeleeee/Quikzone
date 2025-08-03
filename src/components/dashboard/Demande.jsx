import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { demandsService } from "../../services/api";
import toast from "react-hot-toast";

const Demande = () => {
  const location = useLocation();
  
  // Get current user
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });

  // State management
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableParcels, setAvailableParcels] = useState([]);
  const [selectedParcels, setSelectedParcels] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [demandDetails, setDemandDetails] = useState(null);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Scanning state
  const [scannedParcels, setScannedParcels] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [scanningDemand, setScanningDemand] = useState(null);
  const [missionCode, setMissionCode] = useState("");
  const [isMissionCompleted, setIsMissionCompleted] = useState(false);

  // Check if we should open create modal from dashboard navigation
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch demands data
  const fetchDemands = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      });

      // Add expediteur email filter for expéditeur users
      if (currentUser?.role === 'Expéditeur') {
        params.append('expediteur_email', currentUser.email);
      }

      const response = await demandsService.getDemands(params.toString());
      setDemands(response.demands || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching demands:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available parcels for expéditeur
  const fetchAvailableParcels = async () => {
    try {
      if (currentUser?.role === 'Expéditeur') {
        const parcels = await demandsService.getAvailableParcels(currentUser.email);
        setAvailableParcels(parcels || []);
      }
    } catch (error) {
      console.error('Error fetching available parcels:', error);
      toast.error('Erreur lors du chargement des colis disponibles');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDemands();
    if (currentUser?.role === 'Expéditeur') {
      fetchAvailableParcels();
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  // Handle create demand
  const handleCreateDemand = async () => {
    if (selectedParcels.length === 0) {
      toast.error('Veuillez sélectionner au moins un colis');
      return;
    }

    try {
      const demandData = {
        expediteur_email: currentUser.email,
        expediteur_name: `${currentUser.firstName} ${currentUser.lastName}`,
        parcel_ids: selectedParcels.map(p => p.id),
        notes: notes
      };

      console.log('🚀 createDemand called with data:', demandData);
      await demandsService.createDemand(demandData);
      
      toast.success('Demande créée avec succès');
      setIsCreateModalOpen(false);
      setSelectedParcels([]);
      setNotes("");
      fetchDemands();
      fetchAvailableParcels();
    } catch (error) {
      console.error('Error creating demand:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erreur lors de la création de la demande');
      }
    }
  };

  // Handle view demand details
  const handleViewDetails = async (demand) => {
    try {
      setSelectedDemand(demand);
      const details = await demandsService.getDemand(demand.id);
      setDemandDetails(details);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching demand details:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  // Handle start scanning
  const handleStartScanning = async (demand) => {
    try {
      // Fetch full demand details with parcels
      const fullDemandDetails = await demandsService.getDemand(demand.id);
      setScanningDemand(fullDemandDetails);
      setScannedParcels([]);
      setScanInput("");
      setMissionCode("");
      setIsMissionCompleted(false);
      setIsScanModalOpen(true);
    } catch (error) {
      console.error('Error fetching demand details for scanning:', error);
      toast.error('Erreur lors du chargement des détails de la demande');
    }
  };

  // Handle parcel scan
  const handleParcelScan = async (trackingNumber) => {
    if (!trackingNumber.trim()) return;

    console.log('🔍 Scanning parcel with tracking number:', trackingNumber.trim());
    console.log('🔍 Scanning demand:', scanningDemand);
    console.log('🔍 Available parcels in demand:', scanningDemand.parcels);

    try {
      // Find the parcel in the demand
      const parcel = scanningDemand.parcels?.find(p => 
        p.tracking_number === trackingNumber.trim()
      );

      console.log('🔍 Found parcel:', parcel);

      if (!parcel) {
        console.log('❌ Parcel not found. Available tracking numbers:', 
          scanningDemand.parcels?.map(p => p.tracking_number));
        toast.error('Colis non trouvé dans cette demande');
        return;
      }

      // Check if already scanned
      if (scannedParcels.some(sp => sp.tracking_number === trackingNumber.trim())) {
        toast.error('Ce colis a déjà été scanné');
        return;
      }

      // Call backend to update parcel status
      await demandsService.scanParcel(scanningDemand.id, trackingNumber.trim());

      // Add to scanned parcels
      const newScannedParcel = {
        ...parcel,
        scanned_at: new Date().toISOString(),
        status: 'Au dépôt'
      };

      setScannedParcels(prev => [...prev, newScannedParcel]);
      setScanInput("");
      
      toast.success(`Colis ${trackingNumber} scanné avec succès`);

      // Check if all parcels are scanned
      const allParcelsScanned = scanningDemand.parcels?.length === scannedParcels.length + 1;
      
      if (allParcelsScanned) {
        // Generate mission code
        const code = generateMissionCode();
        setMissionCode(code);
        toast.success('Tous les colis scannés! Code de mission généré.');
      }

    } catch (error) {
      console.error('Error scanning parcel:', error);
      toast.error('Erreur lors du scan du colis');
    }
  };

  // Generate mission code
  const generateMissionCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `M-${timestamp}-${random}`;
  };

  // Handle complete scanning
  const handleCompleteScanning = async () => {
    if (scannedParcels.length !== scanningDemand.parcels?.length) {
      toast.error('Tous les colis doivent être scannés pour compléter');
      return;
    }

    try {
      // Update demand status to completed
      await demandsService.updateDemandStatus(scanningDemand.id, 'Completed', 'Tous les colis reçus');
      
      setIsMissionCompleted(true);
      toast.success(`Mission complétée! Code: ${missionCode}`);
      fetchDemands();
    } catch (error) {
      console.error('Error completing scanning:', error);
      toast.error('Erreur lors de la finalisation');
    }
  };

  // Handle delete demand
  const handleDeleteDemand = async (demand) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    try {
      await demandsService.deleteDemand(demand.id);
      toast.success('Demande supprimée avec succès');
      fetchDemands();
      if (currentUser?.role === 'Expéditeur') {
        fetchAvailableParcels();
      }
    } catch (error) {
      console.error('Error deleting demand:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erreur lors de la suppression de la demande');
      }
    }
  };

  // Handle edit demand (for expediteurs)
  const handleEditDemand = async (demand) => {
    // For now, just show a message that editing is not implemented yet
    toast.info('La modification des demandes sera bientôt disponible');
    // TODO: Implement edit functionality
  };

  // Handle parcel selection
  const handleParcelSelection = (parcel, isSelected) => {
    if (isSelected) {
      setSelectedParcels(prev => [...prev, parcel]);
    } else {
      setSelectedParcels(prev => prev.filter(p => p.id !== parcel.id));
    }
  };

  // Handle status update (for admin/chef d'agence)
  const handleStatusUpdate = async (demandId, newStatus, reviewNotes) => {
    try {
      await demandsService.updateDemandStatus(demandId, newStatus, reviewNotes);
      toast.success('Statut de la demande mis à jour');
      fetchDemands();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Error updating demand status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      'Accepted': { color: 'bg-green-100 text-green-800', text: 'Acceptée' },
      'Not Accepted': { color: 'bg-red-100 text-red-800', text: 'Refusée' },
      'Completed': { color: 'bg-blue-100 text-blue-800', text: 'Terminée' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Filtered demands
  const filteredDemands = useMemo(() => {
    return demands.filter(demand => {
      const matchesSearch = !searchTerm || 
        demand.id.toString().includes(searchTerm) ||
        demand.expediteur_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [demands, searchTerm]);

  // Table columns
  const columns = [
    { key: 'id', label: 'ID Demande', sortable: true },
    { key: 'expediteur_name', label: 'Nom Expéditeur', sortable: true },
    { key: 'expediteur_agency', label: 'Agence/Dépôt', sortable: true },
    { key: 'parcel_count', label: 'Nbr Colis', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'created_at', label: 'Date Création', sortable: true },
    { key: 'reviewed_by', label: 'Révisé Par', sortable: true }
  ];

  // Custom action buttons
  const customActionButtons = (demand) => (
    <div className="flex space-x-2">
      {/* View Details Button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleViewDetails(demand); }}
        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
        title="Voir les détails"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      
      {/* Scan Button - Only for Admin, Chef d'agence, Membre d'agence */}
      {['Admin', 'Administration', 'Chef d\'agence', 'Membre de l\'agence'].includes(currentUser?.role) && 
       demand.status === 'Accepted' && (
        <button
          onClick={(e) => { e.stopPropagation(); handleStartScanning(demand); }}
          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
          title="Scanner les colis"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
          </svg>
        </button>
      )}

      {/* Delete Button - Only if not accepted */}
      {demand.status !== 'Accepted' && (
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteDemand(demand); }}
          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
          title="Supprimer la demande"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
      
      {/* Edit Button - Only show if pending and user is expediteur */}
      {demand.status === 'Pending' && currentUser?.role === 'Expéditeur' && demand.expediteur_email === currentUser?.email && (
        <button
          onClick={(e) => { e.stopPropagation(); handleEditDemand(demand); }}
          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
          title="Modifier la demande"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  );

  // Format data for table
  const formatData = (demand) => ({
    id: demand.id,
    expediteur_name: demand.expediteur_name,
    expediteur_agency: demand.expediteur_agency || 'N/A',
    parcel_count: demand.parcel_count || 0,
    status: getStatusBadge(demand.status),
    created_at: new Date(demand.created_at).toLocaleDateString('fr-FR'),
    reviewed_by: demand.reviewer_first_name && demand.reviewer_last_name 
      ? `${demand.reviewer_first_name} ${demand.reviewer_last_name}` 
      : demand.status === 'Pending' ? 'En attente' : 'N/A'
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Demandes</h1>
        <p className="text-gray-600">
          {currentUser?.role === 'Expéditeur' 
            ? 'Créez et gérez vos demandes de colis'
            : 'Consultez et gérez les demandes des expéditeurs'
          }
        </p>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par ID ou expéditeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="Pending">En attente</option>
            <option value="Accepted">Acceptée</option>
            <option value="Not Accepted">Refusée</option>
            <option value="Completed">Terminée</option>
          </select>
        </div>

        {/* Create button for expéditeurs */}
        {currentUser?.role === 'Expéditeur' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle Demande
          </button>
        )}
      </div>

      {/* Demands table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredDemands}
          columns={columns}
          formatData={formatData}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          customActionButtons={customActionButtons}
        />
      </div>

      {/* Create Demand Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Créer une nouvelle demande</h2>
          
          <div className="space-y-4">
            {/* Available parcels */}
            <div>
              <h3 className="text-lg font-medium mb-2">Colis disponibles</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {availableParcels.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">Aucun colis disponible</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableParcels.map((parcel) => (
                      <div key={parcel.id} className="p-4 hover:bg-gray-50">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedParcels.some(p => p.id === parcel.id)}
                            onChange={(e) => handleParcelSelection(parcel, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{parcel.tracking_number}</p>
                                <p className="text-sm text-gray-600">{parcel.destination}</p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {parcel.status}
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ajoutez des notes pour cette demande..."
              />
            </div>

            {/* Selected parcels summary */}
            {selectedParcels.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Colis sélectionnés ({selectedParcels.length})
                </h4>
                <div className="space-y-1">
                  {selectedParcels.map((parcel) => (
                    <div key={parcel.id} className="text-sm text-blue-800">
                      • {parcel.tracking_number} - {parcel.destination}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateDemand}
              disabled={selectedParcels.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Créer la demande
            </button>
          </div>
        </div>
      </Modal>

      {/* Demand Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} size="xl">
        {demandDetails && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Détails de la demande #{demandDetails.id}
            </h2>
            
            <div className="space-y-6">
              {/* Demand info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Informations générales</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Expéditeur:</span> {demandDetails.expediteur_name}</div>
                    <div><span className="font-medium">Agence:</span> {demandDetails.expediteur_agency || 'N/A'}</div>
                    <div><span className="font-medium">Statut:</span> {getStatusBadge(demandDetails.status)}</div>
                    <div><span className="font-medium">Créée le:</span> {new Date(demandDetails.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                </div>
                
                {demandDetails.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{demandDetails.notes}</p>
                  </div>
                )}
              </div>

              {/* Parcels list */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Colis dans cette demande ({demandDetails.parcels?.length || 0})
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Suivi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {demandDetails.parcels?.map((parcel) => (
                        <tr key={parcel.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {parcel.tracking_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {parcel.destination}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              parcel.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                              parcel.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {parcel.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status update (for admin/chef d'agence) */}
              {['Admin', 'Administration', 'Chef d\'agence', 'Administrateur'].includes(currentUser?.role) && 
               demandDetails.status === 'Pending' && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Mettre à jour le statut</h3>
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStatusUpdate(demandDetails.id, 'Accepted', 'Demande acceptée')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(demandDetails.id, 'Not Accepted', 'Demande refusée')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Scanning Modal */}
      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} size="xl">
        {scanningDemand && (
          <div className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${
              isMissionCompleted ? 'text-green-700' : ''
            }`}>
              {isMissionCompleted ? '✅ ' : ''}Scanner les colis - Demande #{scanningDemand.id}
              {isMissionCompleted && <span className="text-green-600 text-lg ml-2">(Terminée)</span>}
            </h2>
            
            <div className="space-y-6">
              {/* Scan input */}
              {!isMissionCompleted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scanner le numéro de suivi du colis
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleParcelScan(scanInput);
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Entrez le numéro de suivi..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleParcelScan(scanInput)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Scanner
                    </button>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progression</span>
                  <span className="text-sm text-gray-600">
                    {scannedParcels.length} / {scanningDemand.parcels?.length || 0} colis scannés
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${scanningDemand.parcels?.length ? (scannedParcels.length / scanningDemand.parcels.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Mission code */}
              {missionCode && (
                <div className={`p-6 rounded-lg border-2 ${
                  isMissionCompleted 
                    ? 'bg-green-50 border-green-400 shadow-lg' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <h4 className={`font-bold mb-3 ${
                    isMissionCompleted ? 'text-green-900 text-lg' : 'text-green-900'
                  }`}>
                    {isMissionCompleted ? '🎉 MISSION TERMINÉE!' : 'Code de mission généré!'}
                  </h4>
                  <div className={`font-mono text-center p-4 rounded-lg ${
                    isMissionCompleted 
                      ? 'text-3xl bg-green-100 text-green-800 border-2 border-green-300 shadow-inner' 
                      : 'text-2xl bg-green-100 text-green-800'
                  }`}>
                    {missionCode}
                  </div>
                  <p className={`text-center mt-3 ${
                    isMissionCompleted ? 'text-green-800 font-medium' : 'text-green-700'
                  }`}>
                    {isMissionCompleted 
                      ? '✅ Remettez ce code au livreur pour fermer la mission'
                      : 'Remettez ce code au livreur pour finaliser la mission'
                    }
                  </p>
                </div>
              )}

              {/* Scanned parcels list */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Colis scannés ({scannedParcels.length})
                </h3>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {scannedParcels.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">Aucun colis scanné</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {scannedParcels.map((parcel, index) => (
                        <div key={index} className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{parcel.tracking_number}</p>
                            <p className="text-sm text-gray-600">{parcel.destination}</p>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Scanné
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Debug info - remove this after testing */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Debug Info:</h4>
                  <p className="text-sm text-yellow-800">
                    Available tracking numbers: {scanningDemand.parcels?.map(p => p.tracking_number).join(', ') || 'None'}
                  </p>
                </div>
              )}

              {/* Expected parcels list */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Colis attendus ({scanningDemand.parcels?.length || 0})
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          N° Suivi
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Destination
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scanningDemand.parcels?.map((parcel) => {
                        const isScanned = scannedParcels.some(sp => sp.tracking_number === parcel.tracking_number);
                        return (
                          <tr key={parcel.id} className={isScanned ? 'bg-green-50' : ''}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {parcel.tracking_number}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {parcel.destination}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isScanned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isScanned ? '✓ Scanné' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end space-x-3 mt-6">
              {isMissionCompleted ? (
                <button
                  onClick={() => {
                    setIsScanModalOpen(false);
                    setIsMissionCompleted(false);
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  Fermer
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsScanModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCompleteScanning}
                    disabled={scannedParcels.length !== scanningDemand.parcels?.length}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Finaliser la mission
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Demande; 