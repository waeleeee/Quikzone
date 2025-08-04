import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const ChefAgenceMissionScan = ({ mission, onScan, onClose, onGenerateCode }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Get saved scanned parcels from localStorage
  const getSavedScannedParcels = () => {
    const saved = localStorage.getItem(`chef_agence_scanned_parcels_mission_${mission?.id}`);
    return saved ? JSON.parse(saved) : [];
  };

  const [scannedParcels, setScannedParcels] = useState(getSavedScannedParcels());

  // Save scanned parcels to localStorage
  const saveScannedParcels = (parcels) => {
    localStorage.setItem(`chef_agence_scanned_parcels_mission_${mission?.id}`, JSON.stringify(parcels));
  };

  useEffect(() => {
    if (scanning) {
      setError("");
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5QrcodeScanner("qr-reader", {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 2.5,
        });
      }
      html5QrCodeRef.current.render(handleScan, (err) => {});
    }
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.clear().catch(() => {});
      }
    };
  }, [scanning]);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const startScan = () => {
    setScanning(true);
  };

  const stopScan = () => {
    setScanning(false);
  };

  const handleScan = async (decodedText) => {
    console.log('🔍 Scanned code:', decodedText);
    
    // Check if already scanned
    if (scannedParcels.some(sp => sp.tracking_number === decodedText)) {
      setScanMessage("❌ Ce colis a déjà été scanné");
      setTimeout(() => setScanMessage(""), 3000);
      return;
    }

    // Find the parcel in the mission (search through all demands)
    let parcel = null;
    let foundInDemand = null;
    
    for (const demand of mission.demands || []) {
      const foundParcel = demand.parcels?.find(p => 
        p.tracking_number === decodedText ||
        p.id.toString() === decodedText ||
        p.client_code === decodedText
      );
      
      if (foundParcel) {
        parcel = foundParcel;
        foundInDemand = demand;
        break;
      }
    }

    if (!parcel) {
      setScanMessage("❌ Colis non trouvé dans cette mission");
      setTimeout(() => setScanMessage(""), 3000);
      return;
    }

    try {
      // Call backend to update parcel status
      await onScan(mission.id, parcel.id, decodedText);
      
      // Add to scanned parcels
      const newScannedParcel = {
        ...parcel,
        demand_id: foundInDemand?.id,
        demand_name: foundInDemand?.expediteur_name,
        scanned_at: new Date().toISOString(),
        status: 'Au dépôt'
      };

      const updatedScannedParcels = [...scannedParcels, newScannedParcel];
      setScannedParcels(updatedScannedParcels);
      saveScannedParcels(updatedScannedParcels);
      
      setScanMessage("✅ Colis scanné avec succès!");
      setTimeout(() => setScanMessage(""), 3000);
    } catch (error) {
      console.error('Error scanning parcel:', error);
      setScanMessage("❌ Erreur lors du scan");
      setTimeout(() => setScanMessage(""), 3000);
    }
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualCode && !scannedParcels.some(sp => sp.tracking_number === manualCode)) {
      handleScan(manualCode);
      setManualCode("");
    }
  };

  const handleRemove = (trackingNumber) => {
    const updatedScannedParcels = scannedParcels.filter(sp => sp.tracking_number !== trackingNumber);
    setScannedParcels(updatedScannedParcels);
    saveScannedParcels(updatedScannedParcels);
  };

  const handleGenerateCode = () => {
    localStorage.removeItem(`chef_agence_scanned_parcels_mission_${mission?.id}`); // Clear saved state
    if (onGenerateCode) {
      onGenerateCode(scannedParcels);
    }
  };

  // Calculate total parcels from all demands
  const totalParcels = mission.demands?.reduce((total, demand) => {
    return total + (demand.parcels?.length || 0);
  }, 0) || 0;

  const progressPercentage = totalParcels > 0 ? (scannedParcels.length / totalParcels) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📋 Mission #{mission?.mission_number || mission?.id}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Livreur:</span>
            <span className="ml-2 text-blue-700">{mission?.driver_name || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Statut:</span>
            <span className="ml-2 text-blue-700">{mission?.status || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Demandes:</span>
            <span className="ml-2 text-blue-700">{mission?.demands?.length || 0}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Total Colis:</span>
            <span className="ml-2 text-blue-700">{totalParcels}</span>
          </div>
        </div>
      </div>

      {/* Scanning Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📱 Contrôles de Scan</h4>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={scanning ? stopScan : startScan}
            className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
              scanning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {scanning ? '🛑 Arrêter le scan' : '📷 Scanner avec caméra'}
          </button>
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Entrez le code-barres manuellement..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Ajouter
          </button>
        </form>

        {/* Scan message */}
        {scanMessage && (
          <div className={`p-3 rounded-lg text-center font-medium ${
            scanMessage.includes('✅') 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {scanMessage}
          </div>
        )}

        {/* Scanner */}
        <div id="qr-reader" ref={scannerRef} className="mx-auto" style={{ 
          width: 300, 
          display: scanning ? 'block' : 'none' 
        }} />
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Progression du Scan</h4>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progression</span>
            <span className="text-sm text-gray-600">
              {scannedParcels.length} / {totalParcels} colis scannés
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            {progressPercentage.toFixed(1)}% terminé
          </div>
        </div>
      </div>

      {/* Scanned Parcels */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          📦 Colis Scannés ({scannedParcels.length})
        </h4>
        
        {scannedParcels.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun colis scanné pour le moment
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {scannedParcels.map((parcel, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex-1">
                  <div className="font-medium text-green-900">{parcel.tracking_number}</div>
                  <div className="text-sm text-green-700">{parcel.destination}</div>
                  <div className="text-xs text-green-600">
                    Demande #{parcel.demand_id} - {parcel.demand_name}
                  </div>
                  <div className="text-xs text-green-600">
                    Scanné le {new Date(parcel.scanned_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(parcel.tracking_number)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Retirer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mission Details - Demands and Parcels */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Détails de la Mission
        </h4>
        
        <div className="space-y-4">
          {mission?.demands?.map((demand, demandIndex) => (
            <div key={demand.id} className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">
                Demande #{demand.id} - {demand.expediteur_name}
              </h5>
              
              <div className="space-y-2">
                {demand.parcels?.map((parcel) => {
                  const isScanned = scannedParcels.some(sp => sp.tracking_number === parcel.tracking_number);
                  return (
                    <div key={parcel.id} className={`flex items-center justify-between p-2 rounded ${
                      isScanned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{parcel.tracking_number}</div>
                        <div className="text-sm text-gray-600">{parcel.destination}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isScanned 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isScanned ? '✓ Au dépôt' : '⚠️ À scanner'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Code Button */}
      {scannedParcels.length === totalParcels && totalParcels > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={handleGenerateCode}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-colors"
          >
            🔑 Générer le Code de Finalisation
          </button>
        </div>
      )}
    </div>
  );
};

export default ChefAgenceMissionScan; 