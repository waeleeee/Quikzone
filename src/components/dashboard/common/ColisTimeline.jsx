import React from "react";

const statusConfig = {
  "En attente": {
    emoji: "⏳",
    color: "yellow",
    icon: "clock",
    comment: "Colis enregistré dans le système."
  },
  "À enlever": {
    emoji: "📋",
    color: "blue",
    icon: "box",
    comment: "Colis prêt à être ramassé."
  },
  "Enlevé": {
    emoji: "🚚",
    color: "green",
    icon: "truck",
    comment: "Colis ramassé par le livreur."
  },
  "Au dépôt": {
    emoji: "📦",
    color: "purple",
    icon: "box",
    comment: "Colis reçu au dépôt."
  },
  "En cours": {
    emoji: "🚚",
    color: "purple",
    icon: "truck",
    comment: "Colis en cours de livraison."
  },
  "RTN dépôt": {
    emoji: "🔄",
    color: "orange",
    icon: "truck",
    comment: "Colis retourné au dépôt."
  },
  "Livrés": {
    emoji: "✅",
    color: "green",
    icon: "check",
    comment: "Colis livré au client."
  },
  "Livrés payés": {
    emoji: "💶",
    color: "emerald",
    icon: "euro",
    comment: "Paiement reçu."
  },
  "Retour définitif": {
    emoji: "❌",
    color: "red",
    icon: "check",
    comment: "Retour définitif."
  },
  "RTN client dépôt": {
    emoji: "🏢",
    color: "pink",
    icon: "box",
    comment: "Retour au dépôt client."
  },
  "Retour Expéditeur": {
    emoji: "📤",
    color: "gray",
    icon: "truck",
    comment: "Retour à l'expéditeur."
  },
  "Retour En Cours d'expédition": {
    emoji: "🔄",
    color: "indigo",
    icon: "truck",
    comment: "Retour en cours d'expédition."
  },
  "Retour reçu": {
    emoji: "📥",
    color: "cyan",
    icon: "box",
    comment: "Retour reçu."
  }
};

const colorMap = {
  yellow: "bg-yellow-400 text-yellow-700 border-yellow-400",
  blue: "bg-blue-400 text-blue-700 border-blue-400",
  purple: "bg-purple-400 text-purple-700 border-purple-400",
  orange: "bg-orange-400 text-orange-700 border-orange-400",
  green: "bg-green-400 text-green-700 border-green-400",
  emerald: "bg-emerald-400 text-emerald-700 border-emerald-400",
  red: "bg-red-400 text-red-700 border-red-400",
  pink: "bg-pink-400 text-pink-700 border-pink-400",
  gray: "bg-gray-400 text-gray-700 border-gray-400",
  indigo: "bg-indigo-400 text-indigo-700 border-indigo-400",
  cyan: "bg-cyan-400 text-cyan-700 border-cyan-400",
};

const icons = {
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/></svg>
  ),
  box: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 3v4M8 3v4"/></svg>
  ),
  truck: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
  ),
  euro: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
  ),
};

const handleExport = () => {
  window.print();
};

const ColisTimeline = ({ parcel, onClose }) => {
  const [trackingHistory, setTrackingHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  // Get current status configuration
  const currentStatus = parcel?.status || "En attente";
  const statusInfo = statusConfig[currentStatus] || statusConfig["En attente"];
  
  // Get current user for fallback city
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  // Debug: Log all parcel and user data
  console.log('🔍 DEBUG - Full parcel data:', parcel);
  console.log('🔍 DEBUG - Current user data:', currentUser);
  console.log('🔍 DEBUG - Agency fields check:');
  console.log('  - parcel?.shipper_agency:', parcel?.shipper_agency);
  console.log('  - parcel?.agency:', parcel?.agency);
  console.log('  - parcel?.shipper?.agency:', parcel?.shipper?.agency);
  console.log('  - currentUser?.governorate:', currentUser?.governorate);
  console.log('  - Final city value:', parcel?.shipper_agency || parcel?.agency || currentUser?.governorate || "Tunis");
  
  // Test: Log all shipper-related fields
  console.log('🔍 DEBUG - All shipper fields:');
  Object.keys(parcel || {}).forEach(key => {
    if (key.includes('shipper') || key.includes('agency')) {
      console.log(`  - ${key}:`, parcel[key]);
    }
  });
  
  // Fetch tracking history when component mounts
  React.useEffect(() => {
    const fetchTrackingHistory = async () => {
      if (!parcel?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/parcels/${parcel.id}/tracking-history`);
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Tracking history API response:', data.data.tracking_history);
          setTrackingHistory(data.data.tracking_history);
        } else {
          console.error('Failed to fetch tracking history:', data.message);
        }
      } catch (error) {
        console.error('Error fetching tracking history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackingHistory();
  }, [parcel?.id]);
  
  // Create timeline data from tracking history
  const timelineData = trackingHistory.map(record => {
    console.log('📅 Processing record:', record);
    const statusInfo = statusConfig[record.status] || statusConfig["En attente"];
    
    // Debug: Log agency values for each timeline item
    const agencyValue = parcel?.shipper_agency || parcel?.agency || parcel?.shipper_city || currentUser?.governorate || "Tunis";
    console.log('🔍 DEBUG - Timeline item agency check:');
    console.log('  - parcel?.shipper_agency:', parcel?.shipper_agency);
    console.log('  - parcel?.agency:', parcel?.agency);
    console.log('  - parcel?.shipper_city:', parcel?.shipper_city);
    console.log('  - currentUser?.governorate:', currentUser?.governorate);
    console.log('  - Final agency value:', agencyValue);
    
    const timelineItem = {
      date: new Date(record.timestamp).toLocaleString('fr-FR'),
      label: record.status,
      city: parcel?.shipper_agency || parcel?.agency || parcel?.shipper_city || currentUser?.governorate || "Tunis",
      status: record.status,
      icon: statusInfo.icon,
      emoji: statusInfo.emoji,
      color: statusInfo.color,
      comment: statusInfo.comment,
      updated_by: record.updated_by,
      mission_number: record.mission_number,
      notes: record.notes
    };
    console.log('📅 Created timeline item:', timelineItem);
    return timelineItem;
  });
  
  // If no tracking history from API, create timeline based on current status
  if (timelineData.length === 0 && !loading) {
    console.log('No tracking history found, creating timeline from current status:', currentStatus);
    
    // Always start with "En attente" (creation)
    timelineData.push({
      date: parcel?.created_at ? new Date(parcel.created_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
      label: "En attente",
      city: parcel?.shipper_agency || parcel?.agency || parcel?.shipper_city || currentUser?.governorate || "Tunis",
      status: "En attente",
      icon: statusConfig["En attente"].icon,
      emoji: statusConfig["En attente"].emoji,
      color: statusConfig["En attente"].color,
      comment: statusConfig["En attente"].comment
    });
    
    // Add "À enlever" if status is beyond "En attente"
    if (["À enlever", "Enlevé", "Au dépôt", "En cours", "RTN dépot", "Livrés", "Livrés payés", "Retour définitif", "RTN client dépôt", "Retour Expéditeur", "Retour En Cours d'expédition", "Retour reçu"].includes(currentStatus)) {
      timelineData.push({
        date: parcel?.updated_at ? new Date(parcel.updated_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
        label: "À enlever",
        city: parcel?.shipper_agency || parcel?.agency || parcel?.shipper_city || currentUser?.governorate || "Tunis",
        status: "À enlever",
        icon: statusConfig["À enlever"].icon,
        emoji: statusConfig["À enlever"].emoji,
        color: statusConfig["À enlever"].color,
        comment: statusConfig["À enlever"].comment
      });
    }
    
    // Add "Enlevé" if status is beyond "À enlever"
    if (["Enlevé", "Au dépôt", "En cours", "RTN dépot", "Livrés", "Livrés payés", "Retour définitif", "RTN client dépôt", "Retour Expéditeur", "Retour En Cours d'expédition", "Retour reçu"].includes(currentStatus)) {
      timelineData.push({
        date: parcel?.updated_at ? new Date(parcel.updated_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
        label: "Enlevé",
        city: parcel?.shipper_agency || parcel?.agency || parcel?.shipper_city || currentUser?.governorate || "Tunis",
        status: "Enlevé",
        icon: statusConfig["Enlevé"].icon,
        emoji: statusConfig["Enlevé"].emoji,
        color: statusConfig["Enlevé"].color,
        comment: statusConfig["Enlevé"].comment
      });
    }
    
    // Add current status if it's different from the ones already added
    if (!["En attente", "À enlever", "Enlevé"].includes(currentStatus)) {
      timelineData.push({
        date: parcel?.updated_at ? new Date(parcel.updated_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
        label: currentStatus,
        city: parcel?.shipper_agency || parcel?.agency || parcel?.shipper_city || currentUser?.governorate || "Tunis",
        status: currentStatus,
        icon: statusInfo.icon,
        emoji: statusInfo.emoji,
        color: statusInfo.color,
        comment: statusInfo.comment
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header du modal avec titre, bouton download et fermer (masqué à l'impression) */}
      <div className="flex justify-between items-center mb-2 print:hidden">
        <h2 className="text-xl font-bold">Détails du colis {parcel?.tracking_number || parcel?.id || "Colis"}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-white hover:bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-semibold shadow border border-blue-200 transition"
          >
            Télécharger la timeline
          </button>
          <button onClick={onClose} className="bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow border border-gray-200 transition">×</button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 transition ease-in-out duration-150 cursor-not-allowed">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement de l'historique...
          </div>
        </div>
      )}
      {/* Carte infos colis */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-wrap justify-between items-center gap-4">
        <div className="text-sm text-gray-700 min-w-[180px]">
          <div><b>Client:</b> {parcel?.shipper || parcel?.shipper_name || "-"}</div>
          <div><b>Montant:</b> {parcel?.price ? `${parcel.price} DT` : "-"}</div>
          <div><b>Téléphone:</b> {parcel?.shipper_phone || "N/A"}</div>
        </div>
        <div className="text-sm text-gray-700 text-right min-w-[180px]">
          <div><b>Adresse:</b> {parcel?.destination || "-"}</div>
          <div><b>Désignation:</b> {parcel?.type || "Colis"}</div>
          <div><b>Nombre des articles:</b> 1</div>
        </div>
      </div>
      {/* Timeline centrée premium */}
      <div className="flex justify-center">
        <div className="relative flex flex-col items-center w-full max-w-lg">
          {/* Ligne verticale premium */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-100 via-gray-200 to-green-100 z-0 rounded-full"></div>
          {timelineData.map((step, idx) => (
            <div key={idx} className="relative flex w-full min-h-[80px]">
              {/* Colonne gauche : date + icône + emoji */}
              <div className="flex flex-col items-end justify-center w-1/3 pr-4">
                <span className="text-xs text-gray-400 font-mono mb-1">{step.date}</span>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-4 border-white shadow-lg ${colorMap[step.color]} text-white text-base font-bold z-10`}>
                  <span className="mr-1">{step.emoji}</span>{icons[step.icon]}
                </div>
              </div>
              {/* Colonne droite : badge/statut/ville/commentaire */}
              <div className="flex-1 flex flex-col justify-center pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold bg-opacity-20 border ${colorMap[step.color]} border-opacity-30`}>{step.label}</span>
                  <span className="text-xs text-gray-500 font-semibold">{step.city}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">{step.comment}</div>
                {step.updated_by && (
                  <div className="text-xs text-gray-500">Par: {step.updated_by}</div>
                )}
                {step.mission_number && (
                  <div className="text-xs text-gray-500">Mission: {step.mission_number}</div>
                )}
                {step.notes && (
                  <div className="text-xs text-gray-500 italic">{step.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Message informatif */}
      <div className="mt-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            <strong>✅ Timeline complète:</strong> Voici l'historique complet des statuts de ce colis depuis sa création.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColisTimeline; 
