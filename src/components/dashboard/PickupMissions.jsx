import React, { useState, useEffect, useMemo } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { pickupMissionsService } from "../../services/api";
import toast from "react-hot-toast";

const PickupMissions = () => {
  // Get current user
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });

  // State management
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableLivreurs, setAvailableLivreurs] = useState([]);
  const [acceptedDemands, setAcceptedDemands] = useState([]);
  const [selectedLivreur, setSelectedLivreur] = useState(null);
  const [selectedDemands, setSelectedDemands] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionDetails, setMissionDetails] = useState(null);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Fetch missions data
  const fetchMissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        agency: agencyFilter
      });

      console.log('🔍 Fetching missions with params:', params.toString());
      const response = await pickupMissionsService.getPickupMissions(params.toString());
      console.log('📡 Missions response:', response);
      console.log('📡 Missions array:', response.missions);
      console.log('📡 Pagination:', response.pagination);
      
      setMissions(response.missions || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available livreurs
  const fetchAvailableLivreurs = async () => {
    try {
      const livreurs = await pickupMissionsService.getAvailableLivreurs();
      setAvailableLivreurs(livreurs || []);
    } catch (error) {
      console.error('Error fetching available livreurs:', error);
      toast.error('Erreur lors du chargement des livreurs');
    }
  };

  // Fetch accepted demands
  const fetchAcceptedDemands = async () => {
    try {
      const demands = await pickupMissionsService.getAcceptedDemands();
      setAcceptedDemands(demands || []);
    } catch (error) {
      console.error('Error fetching accepted demands:', error);
      toast.error('Erreur lors du chargement des demandes acceptées');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMissions();
    fetchAvailableLivreurs();
    fetchAcceptedDemands();
  }, [pagination.page, pagination.limit, statusFilter, agencyFilter]);

  // Handle create mission
  const handleCreateMission = async () => {
    if (!selectedLivreur || selectedDemands.length === 0) {
      toast.error('Veuillez sélectionner un livreur et au moins une demande');
      return;
    }

    try {
      const missionData = {
        livreur_id: selectedLivreur.id,
        demand_ids: selectedDemands.map(d => d.id),
        notes: notes
      };

      await pickupMissionsService.createPickupMission(missionData);
      
      toast.success('Mission créée avec succès');
      setIsCreateModalOpen(false);
      setSelectedLivreur(null);
      setSelectedDemands([]);
      setNotes("");
      fetchMissions();
      fetchAcceptedDemands();
    } catch (error) {
      console.error('Error creating mission:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erreur lors de la création de la mission');
      }
    }
  };

  // Handle view mission details
  const handleViewDetails = async (mission) => {
    try {
      setSelectedMission(mission);
      const details = await pickupMissionsService.getPickupMission(mission.id);
      setMissionDetails(details);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching mission details:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (missionId, newStatus, reviewNotes) => {
    try {
      await pickupMissionsService.updatePickupMissionStatus(missionId, newStatus, reviewNotes);
      toast.success('Statut de la mission mis à jour');
      fetchMissions();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle livreur selection
  const handleLivreurSelection = (livreur) => {
    setSelectedLivreur(livreur);
  };

  // Handle demand selection
  const handleDemandSelection = (demand, isSelected) => {
    if (isSelected) {
      setSelectedDemands(prev => [...prev, demand]);
    } else {
      setSelectedDemands(prev => prev.filter(d => d.id !== demand.id));
    }
  };

     // Get status badge
   const getStatusBadge = (status) => {
     const statusConfig = {
       'En attente': { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
       'Acceptée': { color: 'bg-green-100 text-green-800', text: 'Acceptée' },
       'Refusée': { color: 'bg-red-100 text-red-800', text: 'Refusée' },
       'En cours': { color: 'bg-blue-100 text-blue-800', text: 'En cours' },
       'Terminée': { color: 'bg-green-100 text-green-800', text: 'Terminée' },
       'Annulée': { color: 'bg-gray-100 text-gray-800', text: 'Annulée' }
     };

     const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
     
     return (
       <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
         {config.text}
       </span>
     );
   };

  // Filtered missions
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchesSearch = !searchTerm || 
        mission.mission_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.livreur_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [missions, searchTerm]);

  // Table columns
  const columns = [
    { key: 'mission_code', label: 'Code Mission', sortable: true },
    { key: 'livreur_name', label: 'Livreur', sortable: true },
    { key: 'driver_agency', label: 'Agence Livreur', sortable: true },
    { key: 'shipper_name', label: 'Expéditeur', sortable: true },
    { key: 'shipper_agency', label: 'Agence Expéditeur', sortable: true },
    { key: 'parcel_count', label: 'Nbr Colis', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'created_at', label: 'Date Création', sortable: true },
    { key: 'created_by_name', label: 'Créé Par', sortable: true }
  ];

  // Custom action buttons
  const customActionButtons = (mission) => (
    <div className="flex space-x-2">
      {/* View Details Button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleViewDetails(mission); }}
        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
        title="Voir les détails"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
  );

  // Format data for table
  const formatData = (mission) => ({
    mission_code: mission.mission_number || mission.mission_code,
    livreur_name: mission.driver_name || mission.livreur_name,
    driver_agency: mission.driver_agency || mission.livreur_agency || 'Non assigné',
    shipper_name: mission.shipper_name || 'Non assigné',
    shipper_agency: mission.shipper_agency || 'Non assigné',
    parcel_count: mission.parcel_count || mission.total_parcels || 0,
    status: getStatusBadge(mission.status),
    created_at: new Date(mission.created_at).toLocaleDateString('fr-FR'),
    created_by_name: mission.created_by_name
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Missions de Collecte</h1>
        <p className="text-gray-600">
          Gérez les missions de collecte de colis
        </p>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par code mission ou livreur..."
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
             <option value="En attente">En attente</option>
             <option value="Acceptée">Acceptée</option>
             <option value="Refusée">Refusée</option>
             <option value="En cours">En cours</option>
             <option value="Terminée">Terminée</option>
             <option value="Annulée">Annulée</option>
          </select>

          {/* Agency filter (for Admin) */}
          {currentUser?.role === 'Admin' && (
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les agences</option>
              <option value="Entrepôt Tunis">Entrepôt Tunis</option>
              <option value="Entrepôt Sousse">Entrepôt Sousse</option>
              <option value="Entrepôt Sfax">Entrepôt Sfax</option>
            </select>
          )}
        </div>

        {/* Create button */}
        {['Admin', 'Administration', 'Chef d\'agence', 'Membre d\'agence'].includes(currentUser?.role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle Mission
          </button>
        )}
      </div>

      {/* Filter information */}
      {currentUser?.role === 'Chef d\'agence' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Affichage filtré: Missions de votre agence ({missions.length} missions visibles)
              </span>
            </div>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              Chef d'agence
            </span>
          </div>
                     <p className="text-xs text-blue-600 mt-1">
             Seules les missions où l'expéditeur appartient à votre agence sont affichées.
           </p>
        </div>
      )}

      {/* Missions table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredMissions}
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

      {/* Create Mission Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Créer une nouvelle mission de collecte</h2>
          
          <div className="space-y-6">
            {/* Livreur selection */}
            <div>
              <h3 className="text-lg font-medium mb-2">Sélectionner un livreur</h3>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {availableLivreurs.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">Aucun livreur disponible</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableLivreurs.map((livreur) => (
                      <div key={livreur.id} className="p-4 hover:bg-gray-50">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="livreur"
                            checked={selectedLivreur?.id === livreur.id}
                            onChange={() => handleLivreurSelection(livreur)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{livreur.name}</p>
                                <p className="text-sm text-gray-600">{livreur.email}</p>
                                <p className="text-sm text-gray-600">{livreur.phone}</p>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {livreur.agency}
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

            {/* Demands selection */}
            <div>
              <h3 className="text-lg font-medium mb-2">Sélectionner les demandes</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {acceptedDemands.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">Aucune demande acceptée disponible</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {acceptedDemands.map((demand) => (
                      <div key={demand.id} className="p-4 hover:bg-gray-50">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDemands.some(d => d.id === demand.id)}
                            onChange={(e) => handleDemandSelection(demand, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Demande #{demand.id}</p>
                                <p className="text-sm text-gray-600">{demand.expediteur_name}</p>
                                <p className="text-sm text-gray-600">{demand.expediteur_agency}</p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {demand.parcel_count} colis
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
                placeholder="Ajoutez des notes pour cette mission..."
              />
            </div>

            {/* Selected items summary */}
            {(selectedLivreur || selectedDemands.length > 0) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Résumé de la sélection</h4>
                {selectedLivreur && (
                  <div className="text-sm text-blue-800 mb-2">
                    <strong>Livreur:</strong> {selectedLivreur.name} ({selectedLivreur.agency})
                  </div>
                )}
                {selectedDemands.length > 0 && (
                  <div className="text-sm text-blue-800">
                    <strong>Demandes sélectionnées:</strong> {selectedDemands.length}
                    <div className="mt-1 space-y-1">
                      {selectedDemands.map((demand) => (
                        <div key={demand.id} className="ml-4">
                          • Demande #{demand.id} - {demand.expediteur_name} ({demand.parcel_count} colis)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              onClick={handleCreateMission}
              disabled={!selectedLivreur || selectedDemands.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Créer la mission
            </button>
          </div>
        </div>
      </Modal>

      {/* Mission Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} size="xl">
        {missionDetails && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Détails de la mission {missionDetails.mission_code}
            </h2>
            
            <div className="space-y-6">
              {/* Mission info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Informations générales</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Code Mission:</span> {missionDetails.mission_code}</div>
                    <div><span className="font-medium">Livreur:</span> {missionDetails.livreur_name}</div>
                    <div><span className="font-medium">Agence:</span> {missionDetails.livreur_agency}</div>
                    <div><span className="font-medium">Statut:</span> {getStatusBadge(missionDetails.status)}</div>
                    <div><span className="font-medium">Créée le:</span> {new Date(missionDetails.created_at).toLocaleString('fr-FR')}</div>
                    <div><span className="font-medium">Créée par:</span> {missionDetails.created_by_name}</div>
                  </div>
                </div>
                
                {missionDetails.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{missionDetails.notes}</p>
                  </div>
                )}
              </div>

              {/* Demands list */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Demandes dans cette mission ({missionDetails.demands?.length || 0})
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID Demande
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expéditeur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agence
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nbr Colis
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {missionDetails.demands?.map((demand) => (
                        <tr key={demand.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            #{demand.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {demand.expediteur_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {demand.expediteur_agency}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {demand.parcel_count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Parcels list */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Colis dans cette mission ({missionDetails.parcels?.length || 0})
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
                          Expéditeur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {missionDetails.parcels?.map((parcel) => (
                        <tr key={parcel.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {parcel.tracking_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {parcel.destination}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {parcel.shipper_name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              parcel.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              parcel.status === 'Picked Up' ? 'bg-blue-100 text-blue-800' :
                              parcel.status === 'Delivered' ? 'bg-green-100 text-green-800' :
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

              {/* Status update */}
              {['Admin', 'Administration', 'Chef d\'agence', 'Membre d\'agence'].includes(currentUser?.role) && 
                               missionDetails.status === 'En attente' && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Mettre à jour le statut</h3>
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                                             <button
                         onClick={() => handleStatusUpdate(missionDetails.id, 'Acceptée', 'Mission acceptée')}
                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                       >
                         Accepter
                       </button>
                       <button
                         onClick={() => handleStatusUpdate(missionDetails.id, 'Refusée', 'Mission refusée')}
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
    </div>
  );
};

export default PickupMissions; 