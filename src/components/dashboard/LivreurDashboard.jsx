import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import LivreurBarcodeScan from "./LivreurBarcodeScan";
import { missionsPickupService, deliveryMissionsService, driverService } from '../../services/api';

// Pickup mission status flow - maps French display names to database values
const statusMapping = {
  "En attente": "En attente",           // Initial status when mission is created
  "À enlever": "À enlever",             // When driver accepts the mission
  "Enlevé": "Enlevé",                   // When driver scans parcel codes
  "Au dépôt": "Au dépôt",               // When driver completes with security code
  "Mission terminée": "Au dépôt",       // Final status shows as "Au dépôt"
  "Refusé par livreur": "Refusé par livreur"
};

// Use the exact 13 status names - no mapping needed
const parcelStatusMapping = {
  "En attente": "En attente",
  "À enlever": "À enlever",
  "Enlevé": "Enlevé",
  "Au dépôt": "Au dépôt",
  "En cours": "En cours",
  "RTN dépot": "RTN dépot",
  "Livrés": "Livrés",
  "Livrés payés": "Livrés payés",
  "Retour définitif": "Retour définitif",
  "RTN client agence": "RTN client agence",
  "Retour Expéditeur": "Retour Expéditeur",
  "Retour En Cours d'expédition": "Retour En Cours d'expédition",
  "Retour reçu": "Retour reçu"
};

// No reverse mapping needed since we're using French statuses directly
const reverseStatusMapping = {
  "En attente": "En attente",
  "À enlever": "À enlever", 
  "Enlevé": "Enlevé",
  "Au dépôt": "Au dépôt",
  "Mission terminée": "Au dépôt", // Show as "Au dépôt" instead of "Mission terminée"
  "Refusé par livreur": "Refusé par livreur"
};

const statusBadge = (status) => {
  // Use status directly since we're now using French statuses
  const displayStatus = reverseStatusMapping[status] || status;
  
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
    "RTN client agence": "bg-pink-100 text-pink-800 border-pink-300",
    "Retour Expéditeur": "bg-gray-100 text-gray-800 border-gray-300",
    "Retour En Cours d'expédition": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "Retour reçu": "bg-cyan-100 text-cyan-800 border-cyan-300",
    
    // Mission statuses
    "Refusé par livreur": "bg-red-50 text-red-700 border-red-300",
    "Mission terminée": "bg-purple-100 text-purple-800 border-purple-300",
  };
  return <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${colorMap[displayStatus] || "bg-gray-100 text-gray-800 border-gray-300"}`}>{displayStatus}</span>;
};

const LivreurDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalMissions: 0,
    completedMissions: 0,
    activeMissions: 0,
    totalColis: 0,
    deliveredColis: 0,
    totalEarnings: 0
  });
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isColisModalOpen, setIsColisModalOpen] = useState(false);
  const [selectedColis, setSelectedColis] = useState(null);
  const [deliveryCode, setDeliveryCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch driver statistics
      const statsResponse = await driverService.getDriverStats();
      setStats(statsResponse.data || statsResponse);

      // Fetch driver missions
      const missionsResponse = await driverService.getDriverMissions();
      setMissions(missionsResponse.missions || missionsResponse);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMissionClick = (mission) => {
    setSelectedMission(mission);
    setIsMissionModalOpen(true);
  };

  const handleAcceptMission = async (missionId) => {
    try {
      await apiService.acceptMission(missionId);
      fetchDashboardData(); // Refresh data
      alert('Mission acceptée avec succès!');
    } catch (error) {
      alert('Erreur lors de l\'acceptation de la mission');
    }
  };

  const handleCancelMission = async (missionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette mission?')) {
      try {
        await apiService.cancelMission(missionId);
        fetchDashboardData(); // Refresh data
        alert('Mission annulée avec succès!');
      } catch (error) {
        alert('Erreur lors de l\'annulation de la mission');
      }
    }
  };

  const handleColisAction = (colis, action) => {
    setSelectedColis(colis);
    
    if (action === 'deliver') {
      setShowCodeInput(true);
      setIsColisModalOpen(true);
    } else if (action === 'retour') {
      if (window.confirm('Marquer ce colis comme retour? Le client n\'était pas disponible.')) {
        handleColisRetour(colis.id);
      }
    } else if (action === 'refuse') {
      if (window.confirm('Le client refuse ce colis? Il sera marqué comme refusé.')) {
        handleColisRefuse(colis.id);
      }
    }
  };

  const handleColisDeliver = async () => {
    if (!deliveryCode.trim()) {
      alert('Veuillez entrer le code de livraison');
      return;
    }

    try {
      await apiService.deliverColis(selectedColis.id, deliveryCode);
      setDeliveryCode("");
      setShowCodeInput(false);
      setIsColisModalOpen(false);
      fetchDashboardData(); // Refresh data
      alert('Colis livré avec succès!');
    } catch (error) {
      alert('Code incorrect ou erreur lors de la livraison');
    }
  };

  const handleColisRetour = async (colisId) => {
    try {
      await apiService.retourColis(colisId);
      fetchDashboardData(); // Refresh data
      alert('Colis marqué comme retour');
    } catch (error) {
      alert('Erreur lors du marquage du retour');
    }
  };

  const handleColisRefuse = async (colisId) => {
    try {
      await apiService.refuseColis(colisId);
      fetchDashboardData(); // Refresh data
      alert('Colis marqué comme refusé');
    } catch (error) {
      alert('Erreur lors du marquage du refus');
    }
  };

  const handleCloseMission = async (missionId) => {
    if (window.confirm('Fermer cette mission? Cette action ne peut pas être annulée.')) {
      try {
        await apiService.closeMission(missionId);
        fetchDashboardData(); // Refresh data
        setIsMissionModalOpen(false);
        alert('Mission fermée avec succès!');
      } catch (error) {
        alert('Erreur lors de la fermeture de la mission');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de Bord - Livreur
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenue, {currentUser?.name || 'Livreur'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions Totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions Terminées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Colis Livrés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveredColis}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gains Totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings.toFixed(2)} DT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Missions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Mes Missions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez vos missions de livraison
          </p>
        </div>
        
        <div className="p-6">
          {missions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n'avez pas encore de missions assignées.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {missions.map((mission) => (
                <div key={mission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        Mission #{mission.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mission.colis_count} colis • {mission.total_distance} km
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mission.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                          mission.status === 'Terminée' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {mission.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(mission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMissionClick(mission)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Voir Détails
                      </button>
                      
                      {mission.status === 'En attente' && (
                        <>
                          <button
                            onClick={() => handleAcceptMission(mission.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleCancelMission(mission.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mission Details Modal */}
      <Modal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        title={`Mission #${selectedMission?.id} - Détails`}
        size="xl"
      >
        {selectedMission && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMission.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de création</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedMission.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Colis de la mission</h3>
              <div className="space-y-3">
                {selectedMission.colis?.map((colis) => (
                  <div key={colis.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Colis #{colis.id}</h4>
                        <p className="text-sm text-gray-600">
                          Client: {colis.client_name} • {colis.client_phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          Adresse: {colis.delivery_address}
                        </p>
                        <div className="mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            colis.status === 'Livré' ? 'bg-green-100 text-green-800' :
                            colis.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                            colis.status === 'Retour' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {colis.status}
                          </span>
                          {colis.retour_count > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              Retours: {colis.retour_count}/3
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {colis.status === 'En cours' && (
                          <>
                            <button
                              onClick={() => handleColisAction(colis, 'deliver')}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              Livrer
                            </button>
                            <button
                              onClick={() => handleColisAction(colis, 'retour')}
                              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                            >
                              Retour
                            </button>
                            <button
                              onClick={() => handleColisAction(colis, 'refuse')}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              Refusé
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedMission.status === 'En cours' && selectedMission.colis?.every(c => c.status === 'Livré' || c.status === 'Retour' || c.status === 'Refusé') && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleCloseMission(selectedMission.id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Fermer la Mission
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delivery Code Modal */}
      <Modal
        isOpen={isColisModalOpen}
        onClose={() => {
          setIsColisModalOpen(false);
          setShowCodeInput(false);
          setDeliveryCode("");
        }}
        title="Livrer le Colis"
        size="md"
      >
        {showCodeInput ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Veuillez demander le code de livraison au client et l'entrer ci-dessous.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de Livraison
              </label>
              <input
                type="text"
                value={deliveryCode}
                onChange={(e) => setDeliveryCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le code..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsColisModalOpen(false);
                  setShowCodeInput(false);
                  setDeliveryCode("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleColisDeliver}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirmer Livraison
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Que souhaitez-vous faire avec ce colis?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowCodeInput(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Livrer le Colis
              </button>
              <button
                onClick={() => handleColisAction(selectedColis, 'retour')}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Client Non Disponible (Retour)
              </button>
              <button
                onClick={() => handleColisAction(selectedColis, 'refuse')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Client Refuse le Colis
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LivreurDashboard;
