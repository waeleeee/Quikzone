import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import { missionsPickupService, apiService } from '../../services/api';

// Status mapping from French to database English values
const statusMapping = {
  "En attente": "scheduled",
  "À enlever": "scheduled", 
  "Enlevé": "in_progress",
  "Au dépôt": "completed",
  "Mission terminée": "completed",
  "Refusé par livreur": "cancelled"
};

// Reverse mapping for display
const reverseStatusMapping = {
  "scheduled": "En attente",
  "in_progress": "Enlevé", 
  "completed": "Au dépôt",
  "cancelled": "Refusé par livreur"
};

const statusBadge = (status) => {
  // Convert database status to French for display
  const displayStatus = reverseStatusMapping[status] || status;
  
  const colorMap = {
    "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "À enlever": "bg-blue-100 text-blue-800 border-blue-300",
    "Enlevé": "bg-green-100 text-green-800 border-green-300",
    "Au dépôt": "bg-purple-100 text-purple-800 border-purple-300",
    "En cours": "bg-purple-100 text-purple-800 border-purple-300",
    "Livrés": "bg-green-100 text-green-800 border-green-300",
    "Livrés payés": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "Retour définitif": "bg-red-100 text-red-800 border-red-300",
    "Accepté par livreur": "bg-green-50 text-green-700 border-green-300",
    "Refusé par livreur": "bg-red-50 text-red-700 border-red-300",
    "En cours de ramassage": "bg-orange-100 text-orange-800 border-orange-300",
    "Ramassage terminé": "bg-blue-100 text-blue-800 border-blue-300",
    "Mission terminée": "bg-green-100 text-green-800 border-green-300",
  };
  return <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${colorMap[displayStatus] || "bg-gray-100 text-gray-800 border-gray-300"}`}>{displayStatus}</span>;
};

const PickupDepot = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Enlevé");
  const [scannedParcels, setScannedParcels] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState("");

  // Fetch missions that are ready for depot scanning (status: "Enlevé")
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching missions for depot scanning...');
        
        const response = await missionsPickupService.getMissionsPickup();
        console.log('📦 All missions response:', response);
        
        // Handle both response formats
        let allMissions = [];
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            allMissions = response;
          } else if (response.success && Array.isArray(response.data)) {
            allMissions = response.data;
          }
        }
        
        // Filter missions that are ready for depot scanning
        const depotMissions = allMissions.filter(mission => 
          mission.status === "Enlevé" || mission.status === "in_progress"
        );
        
        console.log('🏢 Depot missions:', depotMissions);
        setMissions(depotMissions);
      } catch (error) {
        console.error('❌ Error fetching depot missions:', error);
        setMissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);

  // Handle barcode scanning
  const handleScan = async (barcode) => {
    try {
      console.log('📱 Scanning barcode:', barcode);
      setScanMessage("Scanning...");
      
      // Find the parcel with this barcode
      const parcel = selectedMission?.parcels?.find(p => 
        p.tracking_number === barcode || p.id.toString() === barcode
      );
      
      if (!parcel) {
        setScanMessage("❌ Colis non trouvé dans cette mission");
        return;
      }
      
      if (scannedParcels.includes(parcel.id)) {
        setScanMessage("⚠️ Ce colis a déjà été scanné");
        return;
      }
      
      // Add to scanned parcels
      setScannedParcels(prev => [...prev, parcel.id]);
      setScanMessage(`✅ ${parcel.recipient_name || parcel.destination || 'Colis'} scanné avec succès`);
      
      // Clear input after short delay
      setTimeout(() => {
        setScanInput("");
        setScanMessage("");
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error scanning parcel:', error);
      setScanMessage("❌ Erreur lors du scan");
    }
  };

  // Handle scan input submission
  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleScan(scanInput.trim());
    }
  };

  // Complete depot scanning for a mission
  const handleCompleteDepotScanning = async (missionId) => {
    try {
      console.log('🏢 Completing depot scanning for mission:', missionId);
      
      // Update mission status to "Au dépôt" (mapped to "completed" in database)
      const dbStatus = statusMapping["Au dépôt"];
      const updateData = { status: dbStatus };
      
      const response = await missionsPickupService.updateMissionPickup(missionId, updateData);
      console.log('✅ Mission updated:', response);
      
      // Update local state with French status for display
      setMissions(prevMissions =>
        prevMissions.map(mission =>
          mission.id === missionId
            ? { ...mission, status: "Au dépôt" }
            : mission
        )
      );
      
      // Close modal
      setSelectedMission(null);
      setScannedParcels([]);
      
      alert('Mission mise à jour: Au dépôt');
      
    } catch (error) {
      console.error('❌ Error completing depot scanning:', error);
      alert('Erreur lors de la mise à jour de la mission');
    }
  };

  // Filter missions based on status and search
  const filteredMissions = missions.filter(mission => {
    // Convert database status to French for filtering
    const displayStatus = reverseStatusMapping[mission.status] || mission.status;
    
    const statusMatch = filterStatus === "all" || displayStatus === filterStatus;
    const searchMatch = !searchTerm || 
      mission.mission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.shipper?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement des missions...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scanning Dépôt</h1>
          <p className="text-gray-600">Scannez les colis arrivés au dépôt</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par numéro de mission, expéditeur, livreur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="Enlevé">Enlevé</option>
        </select>
      </div>

      {/* Missions Table */}
      {missions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== "all" 
                ? "Aucune mission ne correspond à vos critères de recherche."
                : "Aucune mission prête pour le scanning au dépôt."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">N° Mission</th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Livreur</th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Expéditeur</th>
                <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Colis</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMissions.map((mission) => (
                <tr key={mission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mission.mission_number || mission.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statusBadge(mission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mission.driver?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mission.shipper?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mission.parcels?.length || 0} colis
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedMission(mission)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold"
                    >
                      Scanner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Scanning Modal */}
      <Modal
        isOpen={!!selectedMission}
        onClose={() => {
          setSelectedMission(null);
          setScannedParcels([]);
          setScanInput("");
          setScanMessage("");
        }}
        title={selectedMission ? `Scanning Mission #${selectedMission.mission_number || selectedMission.id}` : ""}
        size="lg"
      >
        {selectedMission && (
          <div className="space-y-6">
            {/* Mission Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Livreur:</span> {selectedMission.driver?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Expéditeur:</span> {selectedMission.shipper?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Statut:</span> {statusBadge(selectedMission.status)}
                </div>
                <div>
                  <span className="font-semibold">Colis:</span> {selectedMission.parcels?.length || 0}
                </div>
              </div>
            </div>

            {/* Scanning Interface */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scanner le code-barres du colis
                </label>
                <form onSubmit={handleScanSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Entrez ou scannez le code-barres..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold"
                  >
                    Scanner
                  </button>
                </form>
                {scanMessage && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    scanMessage.includes('✅') ? 'bg-green-100 text-green-800' :
                    scanMessage.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scanMessage}
                  </div>
                )}
              </div>

              {/* Scanned Parcels Progress */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-blue-800">Progression du scan</span>
                  <span className="text-sm text-blue-600">
                    {scannedParcels.length} / {selectedMission.parcels?.length || 0}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${selectedMission.parcels?.length ? (scannedParcels.length / selectedMission.parcels.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Parcels List */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Colis de la mission</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedMission.parcels?.map((parcel) => (
                    <div 
                      key={parcel.id} 
                      className={`p-3 rounded-lg border ${
                        scannedParcels.includes(parcel.id) 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">
                              {parcel.recipient_name || parcel.destination || 'Colis sans nom'}
                            </span>
                            {scannedParcels.includes(parcel.id) && (
                              <span className="text-green-600">✅</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Code: {parcel.tracking_number || parcel.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-gray-500 text-sm">Aucun colis associé à cette mission</div>
                  )}
                </div>
              </div>

              {/* Complete Button */}
              {scannedParcels.length === (selectedMission.parcels?.length || 0) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCompleteDepotScanning(selectedMission.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-lg"
                  >
                    ✅ Terminer le scanning - Mission au dépôt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PickupDepot; 
