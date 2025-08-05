import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const ChefAgenceMissionScan = ({ mission, onScan, onClose, onGenerateCode }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
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

  // Auto-detect already scanned parcels when component loads
  useEffect(() => {
    if (mission) {
      const alreadyScannedParcels = [];
      
      // Check direct mission parcels
      mission.parcels?.forEach(parcel => {
        if (parcel.status === 'Au dépôt') {
          alreadyScannedParcels.push({
            ...parcel,
            demand_id: null,
            demand_name: mission.shipper?.name || 'Mission Directe',
            scanned_at: new Date().toISOString(),
            status: 'Au dépôt'
          });
        }
      });
      
      // Check demand parcels
      mission.demands?.forEach(demand => {
        demand.parcels?.forEach(parcel => {
          if (parcel.status === 'Au dépôt') {
            alreadyScannedParcels.push({
              ...parcel,
              demand_id: demand.id,
              demand_name: demand.expediteur_name,
              scanned_at: new Date().toISOString(),
              status: 'Au dépôt'
            });
          }
        });
      });
      
      if (alreadyScannedParcels.length > 0 && scannedParcels.length === 0) {
        console.log('🔍 Auto-detected already scanned parcels:', alreadyScannedParcels);
        setScannedParcels(alreadyScannedParcels);
        saveScannedParcels(alreadyScannedParcels);
      }
    }
  }, [mission, scannedParcels.length]);

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

    // Find the parcel in the mission (search through direct parcels first, then demands)
    let parcel = null;
    let foundInDemand = null;
    
    // First, search in direct mission parcels
    const directParcel = mission.parcels?.find(p => 
      p.tracking_number === decodedText ||
      p.id.toString() === decodedText ||
      p.client_code === decodedText
    );
    
    if (directParcel) {
      parcel = directParcel;
      foundInDemand = null; // Direct parcel, not in a demand
    } else {
      // If not found in direct parcels, search through demands
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

  // Calculate total parcels from both direct mission parcels and demand parcels
  const directParcels = mission.parcels || [];
  const demandParcels = mission.demands?.reduce((total, demand) => {
    return total + (demand.parcels?.length || 0);
  }, 0) || 0;
  const totalParcels = directParcels.length + demandParcels;

  const progressPercentage = totalParcels > 0 ? (scannedParcels.length / totalParcels) * 100 : 0;

  // Group parcels by shipper for better display
  const parcelsByShipper = {};
  
  // Add direct mission parcels first
  if (directParcels.length > 0) {
    const shipperName = mission.shipper?.name || 'Mission Directe';
    parcelsByShipper[shipperName] = {
      demand_id: null,
      parcels: [],
      total: directParcels.length,
      scanned: 0
    };
    
    directParcels.forEach(parcel => {
      const isScanned = scannedParcels.some(sp => sp.tracking_number === parcel.tracking_number);
      parcelsByShipper[shipperName].parcels.push({
        ...parcel,
        isScanned
      });
      if (isScanned) {
        parcelsByShipper[shipperName].scanned++;
      }
    });
  }
  
  // Add demand parcels
  mission.demands?.forEach(demand => {
    const shipperName = demand.expediteur_name;
    if (!parcelsByShipper[shipperName]) {
      parcelsByShipper[shipperName] = {
        demand_id: demand.id,
        parcels: [],
        total: demand.parcels?.length || 0,
        scanned: 0
      };
    }
    
    demand.parcels?.forEach(parcel => {
      const isScanned = scannedParcels.some(sp => sp.tracking_number === parcel.tracking_number);
      parcelsByShipper[shipperName].parcels.push({
        ...parcel,
        isScanned
      });
      if (isScanned) {
        parcelsByShipper[shipperName].scanned++;
      }
    });
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mission Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              📦 Mission #{mission?.mission_number || mission?.id}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">🚚 Livreur:</span>
                <div className="text-blue-100">{mission?.driver?.name || 'N/A'}</div>
              </div>
              <div>
                <span className="font-semibold">📊 Statut:</span>
                <div className="text-blue-100">{mission?.status || 'N/A'}</div>
              </div>
              <div>
                <span className="font-semibold">📋 Demandes:</span>
                <div className="text-blue-100">{mission?.demands?.length || 0}</div>
              </div>
              <div>
                <span className="font-semibold">📦 Total Colis:</span>
                <div className="text-blue-100">{totalParcels}</div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          📊 Progression du Scan
        </h3>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-gray-700">
              {scannedParcels.length} / {totalParcels} colis scannés
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Progress Status */}
          <div className="mt-3 text-center">
            {progressPercentage === 100 ? (
              <span className="text-green-600 font-semibold text-lg">🎉 Mission prête à finaliser!</span>
            ) : progressPercentage > 50 ? (
              <span className="text-blue-600 font-semibold">🚀 Plus de la moitié terminée!</span>
            ) : (
              <span className="text-gray-600">⏳ Scan en cours...</span>
            )}
          </div>
        </div>
      </div>

      {/* Scanning Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          📱 Contrôles de Scan
        </h3>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={scanning ? stopScan : startScan}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              scanning 
                ? 'bg-red-600 hover:bg-red-700 shadow-lg' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {scanning ? '🛑 Arrêter le scan' : '📷 Scanner avec caméra'}
          </button>
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualAdd} className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Entrez le code-barres manuellement..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
          >
            Ajouter
          </button>
        </form>

        {/* Scan message */}
        {scanMessage && (
          <div className={`p-4 rounded-lg text-center font-medium text-lg ${
            scanMessage.includes('✅') 
              ? 'bg-green-100 text-green-800 border-2 border-green-300' 
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          }`}>
            {scanMessage}
          </div>
        )}

        {/* Scanner */}
        <div id="qr-reader" ref={scannerRef} className="mx-auto mt-4" style={{ 
          width: 300, 
          display: scanning ? 'block' : 'none' 
        }} />
      </div>

      {/* Parcels by Shipper */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          📦 Colis par Expéditeur
        </h3>
        
        <div className="space-y-6">
          {Object.entries(parcelsByShipper).map(([shipperName, shipperData]) => (
            <div key={shipperName} className="border-2 border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  🏢 {shipperName}
                </h4>
                <div className="text-sm text-gray-600">
                  {shipperData.scanned}/{shipperData.total} colis scannés
                </div>
              </div>
              
              <div className="space-y-2">
                {shipperData.parcels.map((parcel) => (
                  <div key={parcel.id} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                    parcel.isScanned 
                      ? 'bg-green-50 border-green-300 shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{parcel.tracking_number}</div>
                      <div className="text-sm text-gray-600">{parcel.destination}</div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      parcel.isScanned 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {parcel.isScanned ? '✅ Au dépôt' : '⏳ À scanner'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scanned Parcels List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          ✅ Colis Scannés ({scannedParcels.length})
        </h3>
        
        {scannedParcels.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-lg">Aucun colis scanné pour le moment</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {scannedParcels.map((parcel, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="flex-1">
                  <div className="font-semibold text-green-900 text-lg">{parcel.tracking_number}</div>
                  <div className="text-sm text-green-700">{parcel.destination}</div>
                  <div className="text-xs text-green-600">
                    Expéditeur: {parcel.demand_name}
                  </div>
                  <div className="text-xs text-green-600">
                    Scanné le {new Date(parcel.scanned_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(parcel.tracking_number)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Retirer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Code Button */}
      {scannedParcels.length === totalParcels && totalParcels > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              🎉 Mission Prête à Finaliser!
            </h3>
            <p className="text-purple-100 mb-6">
              Tous les colis ont été scannés. Cliquez sur le bouton ci-dessous pour générer le code de finalisation.
            </p>
            <button
              onClick={handleGenerateCode}
              className="bg-white text-purple-600 hover:bg-gray-100 py-4 px-8 rounded-lg font-bold text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔑 Générer le Code de Finalisation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefAgenceMissionScan; 