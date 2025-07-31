import React, { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

const MissionColisScan = ({ onValidate, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [colisList, setColisList] = useState([]);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      setError("");
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }
      html5QrCodeRef.current
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
            aspectRatio: 2.5,
          },
          (decodedText) => {
            if (!colisList.includes(decodedText)) {
              setColisList((prev) => [...prev, decodedText]);
            }
          },
          (err) => {}
        )
        .catch((err) => {
          setError("Impossible d'accéder à la caméra : " + err);
          setScanning(false);
        });
    }
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
      }
    };
    // eslint-disable-next-line
  }, [scanning]);

  useEffect(() => {
    // Nettoyage à l'unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
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

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualCode && !colisList.includes(manualCode)) {
      setColisList((prev) => [...prev, manualCode]);
      setManualCode("");
    }
  };

  const handleRemove = (code) => {
    setColisList((prev) => prev.filter((c) => c !== code));
  };

  const handleValidate = () => {
    if (onValidate) onValidate(colisList);
    setColisList([]);
    if (onClose) onClose();
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ajouter des colis à la mission</h2>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={scanning ? stopScan : startScan}
          className={`px-4 py-2 rounded-md font-semibold text-white ${scanning ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {scanning ? "Arrêter le scan" : "Scanner un colis"}
        </button>
        <form onSubmit={handleManualAdd} className="flex space-x-2">
          <input
            type="text"
            placeholder="Code colis manuel"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md font-semibold"
          >
            Ajouter
          </button>
        </form>
      </div>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      <div className="mb-4">
        <div id="qr-reader" ref={scannerRef} className="mx-auto" style={{ width: 300, display: scanning ? 'block' : 'none' }} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Colis ajoutés ({colisList.length})</h3>
        {colisList.length === 0 ? (
          <div className="text-gray-500">Aucun colis ajouté pour l'instant.</div>
        ) : (
          <ul className="space-y-2">
            {colisList.map((code, idx) => (
              <li key={code} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <span className="font-mono text-blue-700">{code}</span>
                <button
                  onClick={() => handleRemove(code)}
                  className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={handleValidate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-lg mt-4"
        disabled={colisList.length === 0}
      >
        Valider la mission
      </button>
    </div>
  );
};

export default MissionColisScan; 
