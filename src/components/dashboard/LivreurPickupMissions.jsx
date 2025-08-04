import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import LivreurBarcodeScan from "./LivreurBarcodeScan";
import { driverService } from '../../services/api';

const statusBadge = (status) => {
  const colorMap = {
    "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "À enlever": "bg-blue-100 text-blue-800 border-blue-300",
    "Enlevé": "bg-green-100 text-green-800 border-green-300",
    "Au dépôt": "bg-purple-100 text-purple-800 border-purple-300",
    "Refusé par livreur": "bg-red-100 text-red-800 border-red-300",
    "Mission terminée": "bg-gray-100 text-gray-800 border-gray-300"
  };
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
      {status}
    </span>
  );
};

const LivreurPickupMissions = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMission, setSelectedMission] = useState(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [missionCode, setMissionCode] = useState("");
  const [stats, setStats] = useState({
    totalMissions: 0,
    acceptedMissions: 0,
    refusedMissions: 0,
    completedMissions: 0
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    fetchPickupMissions();
  }, []);

  const fetchPickupMissions = async () => {
    try {
      setLoading(true);
      const response = await driverService.getDriverPickupMissions();
      setMissions(response.missions || []);
      
      // Calculate stats
      const total = response.missions?.length || 0;
      const accepted = response.missions?.filter(m => m.status === 'À enlever' || m.status === 'Enlevé' || m.status === 'Au dépôt').length || 0;
      const refused = response.missions?.filter(m => m.status === 'Refusé par livreur').length || 0;
      const completed = response.missions?.filter(m => m.status === 'Mission terminée').length || 0;
      
      setStats({
        totalMissions: total,
        acceptedMissions: accepted,
        refusedMissions: refused,
        completedMissions: completed
      });
    } catch (error) {
      console.error('Error fetching pickup missions:', error);
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
      await driverService.acceptPickupMission(missionId);
      fetchPickupMissions(); // Refresh data
      alert('Mission acceptée avec succès!');
    } catch (error) {
      alert('Erreur lors de l\'acceptation de la mission');
    }
  };

  const handleRefuseMission = async (missionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir refuser cette mission?')) {
      try {
        await driverService.refusePickupMission(missionId);
        fetchPickupMissions(); // Refresh data
        alert('Mission refusée');
      } catch (error) {
        alert('Erreur lors du refus de la mission');
      }
    }
  };

  const handleStartScanning = (mission) => {
    setSelectedMission(mission);
    setIsScanModalOpen(true);
  };

  const handleScanComplete = async (scannedParcels) => {
    try {
      await driverService.completePickupScan(selectedMission.id, scannedParcels);
      setIsScanModalOpen(false);
      fetchPickupMissions(); // Refresh data
      alert('Scan terminé avec succès!');
    } catch (error) {
      alert('Erreur lors de la finalisation du scan');
    }
  };

  const handleCompleteMission = async () => {
    if (!missionCode.trim()) {
      alert('Veuillez entrer le code de mission');
      return;
    }

    try {
      await driverService.completePickupMission(selectedMission.id, missionCode);
      setIsCompleteModalOpen(false);
      setMissionCode("");
      fetchPickupMissions(); // Refresh data
      alert('Mission terminée avec succès!');
    } catch (error) {
      alert('Code incorrect ou erreur lors de la finalisation');
    }
  };

  const filteredMissions = missions.filter(mission =>
    mission.id.toString().includes(searchTerm) ||
    mission.shipper_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Missions de Collecte
        </h1>
        <p className="text-gray-600 mt-1">
          Gérez vos missions de collecte de colis
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Missions</p>
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
              <p className="text-sm font-medium text-gray-600">Missions Acceptées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.acceptedMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions Refusées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.refusedMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missions Terminées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedMissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher des missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchPickupMissions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Missions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Mes Missions de Collecte</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez vos missions de collecte de colis
          </p>
        </div>
        
        <div className="p-6">
          {filteredMissions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n'avez pas encore de missions de collecte assignées.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMissions.map((mission) => (
                <div key={mission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        Mission #{mission.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Expéditeur: {mission.shipper_name} • {mission.parcels_count} colis
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        {statusBadge(mission.status)}
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
                            onClick={() => handleRefuseMission(mission.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      
                      {mission.status === 'À enlever' && (
                        <button
                          onClick={() => handleStartScanning(mission)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Scanner Colis
                        </button>
                      )}
                      
                      {mission.status === 'Enlevé' && (
                        <button
                          onClick={() => {
                            setSelectedMission(mission);
                            setIsCompleteModalOpen(true);
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Terminer Mission
                        </button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Expéditeur</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMission.shipper_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMission.shipper_address}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Colis à collecter</h3>
              <div className="space-y-3">
                {selectedMission.parcels?.map((parcel) => (
                  <div key={parcel.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Colis #{parcel.id}</h4>
                        <p className="text-sm text-gray-600">
                          Destinataire: {parcel.recipient_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Adresse: {parcel.destination}
                        </p>
                        <div className="mt-2">
                          {statusBadge(parcel.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedMission.status === 'En attente' && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleAcceptMission(selectedMission.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Accepter la Mission
                </button>
                <button
                  onClick={() => handleRefuseMission(selectedMission.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Refuser la Mission
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Scanner les Colis"
        size="xl"
      >
        {selectedMission && (
          <LivreurBarcodeScan
            mission={selectedMission}
            onScan={(parcelId, barcode) => {
              console.log('Scanned parcel:', parcelId, barcode);
            }}
            onClose={handleScanComplete}
          />
        )}
      </Modal>

      {/* Complete Mission Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setMissionCode("");
        }}
        title="Terminer la Mission"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Veuillez entrer le code de mission pour finaliser la collecte.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de Mission
            </label>
            <input
              type="text"
              value={missionCode}
              onChange={(e) => setMissionCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez le code de mission..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsCompleteModalOpen(false);
                setMissionCode("");
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCompleteMission}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Terminer la Mission
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LivreurPickupMissions; 