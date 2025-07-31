import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { apiService } from "../../services/api";

const GOUVERNORATS = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte", "Béja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia", "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Medenine", "Tataouine", "Gafsa", "Tozeur", "Kebili"
];
const SERVICES = [
  { value: "Livraison", label: "Livraison" },
  { value: "Echange", label: "Échange" },
  { value: "Livraison + Echange", label: "Livraison + Échange" },
];

const generateCode = () => {
  // Génère un code court : C-XXXXXX (6 chiffres)
  return 'C-' + Math.floor(100000 + Math.random() * 900000);
};

// Get real user data from localStorage and backend
const getCurrentUserData = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  console.log('🔍 Current user from localStorage:', currentUser);
  
  if (currentUser && currentUser.role === 'Expéditeur') {
    try {
      // Fetch real expediteur data from backend
      const shippersResponse = await apiService.getShippers();
      console.log('📋 All shippers from API:', shippersResponse);
      
      const expediteur = shippersResponse.find(s => s.email === currentUser.email);
      console.log('🔍 Found expediteur:', expediteur);
      
      if (expediteur) {
        // Determine if this is an individual or company expediteur
        const isIndividual = expediteur.identity_number && !expediteur.fiscal_number;
        
        // Use real expediteur data
        const userData = {
          // For individual expediteurs, use page_name; for company, use company_name
          societe: isIndividual 
            ? (expediteur.page_name || "EXPEDITEUR SARL")
            : (expediteur.company_name || expediteur.company || "EXPEDITEUR SARL"),
          // For individual expediteurs, use identity_number; for company, use fiscal_number
          matriculeFiscal: isIndividual 
            ? (expediteur.identity_number || "123456789")
            : (expediteur.fiscal_number || expediteur.tax_number || "123456789"),
          expediteurNom: expediteur.name || `${currentUser.firstName || 'User'} ${currentUser.lastName || 'Name'}`,
          expediteurTel: expediteur.phone || currentUser.phone || "+216 20 123 456",
          // For individual expediteurs, use governorate; for company, use company_governorate
          expediteurGouv: isIndividual 
            ? (expediteur.governorate || "Tunis")
            : (expediteur.company_governorate || expediteur.city || "Tunis"),
          // For individual expediteurs, use address; for company, use company_address
          expediteurAdresse: isIndividual 
            ? (expediteur.address || "12 Rue de la Liberté, Tunis")
            : (expediteur.company_address || "12 Rue de la Liberté, Tunis"),
          baseFraisLivraison: expediteur.delivery_fees || 8
        };
        console.log('✅ Using real expediteur data:', userData);
        console.log('🔍 Expediteur type:', isIndividual ? 'Individual' : 'Company');
        return userData;
      } else {
        console.warn('❌ No expediteur found for email:', currentUser.email);
        console.log('📋 Available emails:', shippersResponse.map(s => s.email));
      }
    } catch (error) {
      console.error('❌ Error fetching expediteur data:', error);
    }
  }
  
  // Fallback to current user data if available
  if (currentUser) {
    console.log('🔄 Using fallback data from currentUser');
    return {
      societe: currentUser.company || "EXPEDITEUR SARL",
      matriculeFiscal: currentUser.fiscalNumber || "123456789",
      expediteurNom: `${currentUser.firstName || currentUser.name || 'User'} ${currentUser.lastName || 'Name'}`,
      expediteurTel: currentUser.phone || "+216 20 123 456",
      expediteurGouv: currentUser.governorate || "Tunis",
      expediteurAdresse: currentUser.address || "12 Rue de la Liberté, Tunis",
      baseFraisLivraison: currentUser.baseDeliveryFee || 8
    };
  }
  
  // Final fallback to mock data
  console.log('🔄 Using mock data as final fallback');
  return {
    societe: "EXPEDITEUR SARL",
    matriculeFiscal: "123456789",
    expediteurNom: "Ahmed Ben Salah",
    expediteurTel: "+216 20 123 456",
    expediteurGouv: "Tunis",
    expediteurAdresse: "12 Rue de la Liberté, Tunis",
    baseFraisLivraison: 8
  };
};

// Function to search expéditeurs by code, name, or phone
const searchExpediteurs = async (searchTerm) => {
  try {
    const shippersResponse = await apiService.getShippers();
    
    if (!searchTerm.trim()) return [];
    
    // Search by code, name, or phone (case-insensitive)
    const matchingExpediteurs = shippersResponse.filter(s => 
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
    );
    
    return matchingExpediteurs.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('❌ Error searching expéditeurs:', error);
    return [];
  }
};

// Function to get expediteur data by code, name, or phone
const getExpediteurBySearch = async (searchTerm) => {
  try {
    const shippersResponse = await apiService.getShippers();
    
    // Search by code, name, or phone (case-insensitive)
    const expediteur = shippersResponse.find(s => 
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
    );
    
    if (expediteur) {
      // Determine if this is an individual or company expediteur
      const isIndividual = expediteur.identity_number && !expediteur.fiscal_number;
      
      return {
        societe: isIndividual 
          ? (expediteur.page_name || "EXPEDITEUR SARL")
          : (expediteur.company_name || expediteur.company || "EXPEDITEUR SARL"),
        matriculeFiscal: isIndividual 
          ? (expediteur.identity_number || "123456789")
          : (expediteur.fiscal_number || expediteur.tax_number || "123456789"),
        expediteurNom: expediteur.name || "Nom non spécifié",
        expediteurTel: expediteur.phone || "+216 20 123 456",
        expediteurGouv: isIndividual 
          ? (expediteur.governorate || "Tunis")
          : (expediteur.company_governorate || expediteur.city || "Tunis"),
        expediteurAdresse: isIndividual 
          ? (expediteur.address || "Adresse non spécifiée")
          : (expediteur.company_address || "Adresse non spécifiée"),
        baseFraisLivraison: expediteur.delivery_fees || 8
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching expediteur by search:', error);
    return null;
  }
};

function calcFraisLivraison(baseFrais, poids) {
  const p = parseFloat(poids);
  const base = parseFloat(baseFrais);
  if (!base) return "";
  
  // 0-10kg: prix fixe (8 DT)
  if (!p || p <= 10) return base.toFixed(2);
  
  // 11kg+: +0.9DT/kg pour chaque kg supplémentaire
  if (p > 10) {
    const extraKilos = p - 10;
    const surcharge = extraKilos * 0.9;
    return (base + surcharge).toFixed(2);
  }
  
  return base.toFixed(2);
}

const ColisCreate = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [coordinatesLoading, setCoordinatesLoading] = useState(false);
  const [expediteurCode, setExpediteurCode] = useState("");
  const [expediteurLoading, setExpediteurLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [colis, setColis] = useState({
    // Expéditeur
    dateCollecte: "",
    societe: "",
    matriculeFiscal: "",
    expediteurNom: "",
    expediteurTel: "",
    expediteurGouv: "",
    expediteurAdresse: "",
    // Client
    clientNom: "",
    clientTel: "",
    clientTel2: "",
    clientGouv: "",
    clientAdresse: "",
    // Colis
    articleNom: "",
    articlePrix: "",
    fraisLivraison: "8.00",
    service: "Livraison",
    poids: "",
    nbPiece: "",
    remarque: "",
    code: generateCode(),
  });

  // Function to get user coordinates
  const getUserCoordinates = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setCoordinatesLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ latitude, longitude });
        setCoordinatesLoading(false);
        console.log('📍 User coordinates:', { latitude, longitude });
      },
      (error) => {
        console.error('❌ Error getting coordinates:', error);
        setCoordinatesLoading(false);
        alert('Impossible d\'obtenir votre position. Vérifiez que vous avez autorisé la géolocalisation.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Function to handle expediteur search with debouncing
  const handleExpediteurSearch = async (searchTerm) => {
    setExpediteurCode(searchTerm);
    
    if (searchTerm.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Debounce the search to avoid too many API calls
    window.searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchExpediteurs(searchTerm);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Error searching expéditeurs:', error);
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms delay
  };

  // Function to select an expediteur from dropdown
  const selectExpediteur = async (expediteur) => {
    setExpediteurCode(expediteur.name || expediteur.code || expediteur.phone);
    setShowDropdown(false);
    setSearchResults([]);
    
    // Load expediteur data
    const expediteurData = await getExpediteurBySearch(expediteur.name || expediteur.code || expediteur.phone);
    
    if (expediteurData) {
      setColis(prev => ({
        ...prev,
        societe: expediteurData.societe,
        matriculeFiscal: expediteurData.matriculeFiscal,
        expediteurNom: expediteurData.expediteurNom,
        expediteurTel: expediteurData.expediteurTel,
        expediteurGouv: expediteurData.expediteurGouv,
        expediteurAdresse: expediteurData.expediteurAdresse,
        fraisLivraison: (parseFloat(expediteurData.baseFraisLivraison) || 8).toFixed(2),
      }));
      alert('✅ Informations de l\'expéditeur chargées avec succès!');
    } else {
      alert('❌ Erreur lors du chargement des informations de l\'expéditeur.');
    }
  };

  // Function to load expediteur data by search term (code, name, or phone)
  const loadExpediteurBySearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    setExpediteurLoading(true);
    try {
      const expediteurData = await getExpediteurBySearch(searchTerm);
      
      if (expediteurData) {
        setColis(prev => ({
          ...prev,
          societe: expediteurData.societe,
          matriculeFiscal: expediteurData.matriculeFiscal,
          expediteurNom: expediteurData.expediteurNom,
          expediteurTel: expediteurData.expediteurTel,
          expediteurGouv: expediteurData.expediteurGouv,
          expediteurAdresse: expediteurData.expediteurAdresse,
          fraisLivraison: (parseFloat(expediteurData.baseFraisLivraison) || 8).toFixed(2),
        }));
        setExpediteurCode(""); // Clear the search field after successful load
        alert('✅ Informations de l\'expéditeur chargées avec succès!');
      } else {
        alert('❌ Aucun expéditeur trouvé. Vérifiez le code, nom ou téléphone et réessayez.');
      }
    } catch (error) {
      console.error('Error loading expediteur:', error);
      alert('❌ Erreur lors du chargement des informations de l\'expéditeur.');
    } finally {
      setExpediteurLoading(false);
    }
  };

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const currentUserData = await getCurrentUserData();
        setUserData(currentUserData);
        setColis(prev => ({
          ...prev,
          societe: currentUserData.societe,
          matriculeFiscal: currentUserData.matriculeFiscal,
          expediteurNom: currentUserData.expediteurNom,
          expediteurTel: currentUserData.expediteurTel,
          expediteurGouv: currentUserData.expediteurGouv,
          expediteurAdresse: currentUserData.expediteurAdresse,
          fraisLivraison: (parseFloat(currentUserData.baseFraisLivraison) || 8).toFixed(2),
        }));
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', { name, value });
    setColis((prev) => {
      let next = { ...prev, [name]: value };
      // Auto-calc frais de livraison
      if (name === "poids" && userData) {
        next.fraisLivraison = calcFraisLivraison(parseFloat(userData.baseFraisLivraison) || 8, next.poids);
      }
      console.log('Updated colis state:', next);
      return next;
    });
  };

  const handleExpediteurCodeChange = (e) => {
    const value = e.target.value;
    handleExpediteurSearch(value);
  };

  const handleExpediteurCodeSubmit = (e) => {
    e.preventDefault();
    loadExpediteurBySearch(expediteurCode);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      // Get current user data
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!currentUser) {
        alert("Erreur: Utilisateur non connecté");
        return;
      }

      // First, get the shipper_id based on the user's email
      let shipperId = 1; // default fallback
      try {
        const shippersResponse = await apiService.getShippers();
        const shipper = shippersResponse.find(s => s.email === currentUser.email);
        if (shipper) {
          shipperId = shipper.id;
        } else {
          console.warn('No shipper found for email:', currentUser.email);
        }
      } catch (error) {
        console.error('Error fetching shippers:', error);
      }

      // Prepare parcel data for API
      const parcelData = {
        tracking_number: colis.code,
        shipper_id: shipperId,
        destination: `${colis.clientNom} - ${colis.clientAdresse}, ${colis.clientGouv}`,
        status: 'En attente',
        weight: parseFloat(colis.poids) || 0,
        price: parseFloat(colis.articlePrix) || 0,
        delivery_fees: parseFloat(colis.fraisLivraison) || 0,
        type: colis.service,
        estimated_delivery_date: colis.dateCollecte ? new Date(colis.dateCollecte).toISOString().split('T')[0] : null,
        // Add client information
        recipient_name: colis.clientNom,
        recipient_phone: colis.clientTel,
        recipient_phone2: colis.clientTel2,
        recipient_address: colis.clientAdresse,
        recipient_governorate: colis.clientGouv,
        // Add article and remark information
        article_name: colis.articleNom,
        remark: colis.remarque,
        nb_pieces: parseInt(colis.nbPiece) || 1
      };

      console.log('Creating parcel with data:', parcelData);
      console.log('nb_pieces being sent:', parcelData.nb_pieces);
      console.log('nbPiece from form:', colis.nbPiece);

      // Send to backend API using apiService
      const result = await apiService.createParcel(parcelData);
      
      if (result.success) {
        const clientCode = result.client_code || "N/A";
        alert(`Colis créé avec succès !\n\nCode Client: ${clientCode}\n\nPartagez ce code avec votre client pour la vérification lors de la livraison.`);
        
        // Close the modal if onClose is provided
        if (onClose) {
          onClose();
        }
        
        // Reset form with user data
        if (userData) {
          setColis({
            // Expéditeur
            dateCollecte: "",
            societe: userData.societe,
            matriculeFiscal: userData.matriculeFiscal,
            expediteurNom: userData.expediteurNom,
            expediteurTel: userData.expediteurTel,
            expediteurGouv: userData.expediteurGouv,
            expediteurAdresse: userData.expediteurAdresse,
            // Client
            clientNom: "",
            clientTel: "",
            clientTel2: "",
            clientGouv: "",
            clientAdresse: "",
            // Colis
            articleNom: "",
            articlePrix: "",
            fraisLivraison: (parseFloat(userData.baseFraisLivraison) || 8).toFixed(2),
            service: "Livraison",
            poids: "",
            nbPiece: "",
            remarque: "",
            code: generateCode(),
          });
          setExpediteurCode(""); // Reset expediteur code field
        } else {
          // If userData is not available, reload it
          const reloadUserData = async () => {
            try {
              const currentUserData = await getCurrentUserData();
              setUserData(currentUserData);
              setColis(prev => ({
                ...prev,
                dateCollecte: "",
                societe: currentUserData.societe,
                matriculeFiscal: currentUserData.matriculeFiscal,
                expediteurNom: currentUserData.expediteurNom,
                expediteurTel: currentUserData.expediteurTel,
                expediteurGouv: currentUserData.expediteurGouv,
                expediteurAdresse: currentUserData.expediteurAdresse,
                fraisLivraison: (parseFloat(currentUserData.baseFraisLivraison) || 8).toFixed(2),
                clientNom: "",
                clientTel: "",
                clientTel2: "",
                clientGouv: "",
                clientAdresse: "",
                articleNom: "",
                articlePrix: "",
                service: "Livraison",
                poids: "",
                nbPiece: "",
                remarque: "",
                code: generateCode(),
              }));
              setExpediteurCode(""); // Reset expediteur code field
            } catch (error) {
              console.error('Error reloading user data:', error);
            }
          };
          reloadUserData();
        }
      } else {
        alert(`Erreur: ${result.message || 'Échec de la création du colis'}`);
      }
    } catch (error) {
      console.error('Error creating parcel:', error);
      alert(`Erreur lors de la création du colis: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 p-12 rounded-3xl shadow-2xl border border-blue-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Chargement des données expéditeur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 p-12 rounded-3xl shadow-2xl border border-blue-100 space-y-10">
      <h2 className="text-4xl font-extrabold text-blue-900 mb-6 text-center tracking-tight drop-shadow">Créer un nouveau colis</h2>
      <form className="grid grid-cols-1 lg:grid-cols-3 gap-10" onSubmit={handleSave}>
        {/* EXPEDITEUR */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 space-y-6 flex flex-col items-center justify-between min-h-[600px]">
          <div className="w-full flex flex-col items-center">
            <h3 className="font-bold text-2xl mb-6 text-blue-700 tracking-wide text-center">EXPÉDITEUR</h3>
            <div className="space-y-4 w-full">
              <div className="relative">
                <label className="block text-base font-semibold text-gray-700 mb-1">
                  <span className="flex items-center">
                    <span className="mr-2">🔍</span>
                    Rechercher l'expéditeur
                  </span>
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      name="expediteurCode"
                      value={expediteurCode}
                      onChange={handleExpediteurCodeChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleExpediteurCodeSubmit(e);
                        }
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicking on items
                        setTimeout(() => setShowDropdown(false), 200);
                      }}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${searchLoading ? 'bg-blue-50' : ''}`}
                      placeholder={searchLoading ? "Recherche en cours..." : "Code, nom ou téléphone"}
                    />
                    {/* Dropdown for search results */}
                    {showDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          searchResults.map((expediteur, index) => (
                            <div
                              key={index}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => selectExpediteur(expediteur)}
                            >
                              <div className="font-medium text-gray-900">
                                {expediteur.name || expediteur.code || expediteur.phone}
                              </div>
                              <div className="text-sm text-gray-600">
                                {expediteur.code && <span className="mr-2">Code: {expediteur.code}</span>}
                                {expediteur.phone && <span>Tél: {expediteur.phone}</span>}
                              </div>
                            </div>
                          ))
                        ) : searchLoading ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Recherche en cours...
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            Aucun expéditeur trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleExpediteurCodeSubmit}
                    disabled={expediteurLoading || !expediteurCode.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    title="Rechercher et charger les informations de l'expéditeur"
                  >
                    {expediteurLoading ? '⏳' : '🔍'}
                  </button>
                </div>
                <small className="text-xs text-gray-500 mt-1 block">
                  💡 Tapez le code, nom ou téléphone de l'expéditeur pour voir les suggestions
                </small>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Date de collecte *</label>
                <input type="date" name="dateCollecte" value={colis.dateCollecte} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" required />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Nom de la société *</label>
                <input type="text" name="societe" value={colis.societe} readOnly disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-lg text-gray-500" required />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">M. fiscal</label>
                <input type="text" name="matriculeFiscal" value={colis.matriculeFiscal} readOnly disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-lg text-gray-500" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Expéditeur (nom et prénom) *</label>
                <input type="text" name="expediteurNom" value={colis.expediteurNom} readOnly disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-lg text-gray-500" required />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Téléphone *</label>
                <input type="tel" name="expediteurTel" value={colis.expediteurTel} readOnly disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-lg text-gray-500" required />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Gouvernorat *</label>
                <select name="expediteurGouv" value={colis.expediteurGouv} disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-lg text-gray-500" required>
                  <option value="">Sélectionner</option>
                  {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Adresse</label>
                <input type="text" name="expediteurAdresse" value={colis.expediteurAdresse} readOnly disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-lg text-gray-500" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Coordonnées GPS</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={getUserCoordinates}
                    disabled={coordinatesLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    {coordinatesLoading ? '📍 Récupération...' : '📍 Obtenir ma position'}
                  </button>
                  {userCoordinates && (
                    <span className="text-sm text-gray-600">
                      {userCoordinates.latitude.toFixed(6)}, {userCoordinates.longitude.toFixed(6)}
                    </span>
                  )}
                </div>
                <small className="text-xs text-gray-500">Cliquez pour obtenir vos coordonnées GPS actuelles</small>
              </div>
            </div>
          </div>
        </div>
        {/* CLIENT */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 space-y-6 flex flex-col items-center justify-between min-h-[600px]">
          <div className="w-full flex flex-col items-center">
            <h3 className="font-bold text-2xl mb-6 text-blue-700 tracking-wide text-center">CLIENT</h3>
            <div className="space-y-4 w-full">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Nom & Prénom *</label>
                <input type="text" name="clientNom" value={colis.clientNom} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" required />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Téléphone *</label>
                <input type="tel" name="clientTel" value={colis.clientTel} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" required pattern="[0-9]{8,}" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Téléphone 2</label>
                <input type="tel" name="clientTel2" value={colis.clientTel2} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Gouvernorat *</label>
                <select name="clientGouv" value={colis.clientGouv} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" required>
                  <option value="">Sélectionner</option>
                  {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1">Adresse</label>
                <input type="text" name="clientAdresse" value={colis.clientAdresse} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" />
              </div>
              {/* Barcode section moved here and centered */}
              <div className="flex flex-col items-center space-y-4 mt-8">
                <span className="text-base text-gray-700 font-semibold">Code-barres du colis :</span>
                <div className="bg-white rounded-xl shadow border border-blue-200 p-6 flex flex-col items-center">
                  <Barcode value={colis.code} width={2.5} height={90} fontSize={22} margin={0} />
                  <span className="mt-2 text-lg font-mono tracking-widest text-blue-700">{colis.code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* COLIS */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 space-y-6 flex flex-col items-center justify-between min-h-[600px]">
          <div className="w-full flex flex-col items-center">
            <h3 className="font-bold text-2xl mb-6 text-blue-700 tracking-wide text-center">COLIS</h3>
            <div className="space-y-4 w-full">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Nom de l’article</label>
                <input type="text" name="articleNom" value={colis.articleNom} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Prix de l’article TTC</label>
                <input type="number" name="articlePrix" value={colis.articlePrix} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Frais de livraison (TND) *</label>
                <input type="number" name="fraisLivraison" value={colis.fraisLivraison} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" min="0" step="0.01" required readOnly />
                <small className="text-xs text-gray-500">Le prix de base est défini par l'expéditeur. Surcharges automatiques selon le poids.</small>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Service</label>
                <select name="service" value={colis.service} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg">
                  {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Poids (kg)</label>
                <input type="number" name="poids" value={colis.poids} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" min="0.01" step="0.01" />
                <small className="text-xs text-gray-500 block">0-10kg: prix fixe (8 DT), 11kg+: +0,9DT/kg supplémentaire</small>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Nombre de pièce</label>
                <input type="number" name="nbPiece" value={colis.nbPiece} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" min="1" step="1" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Remarque</label>
                <textarea name="remarque" value={colis.remarque} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" rows={2} />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-1 ">Code du colis</label>
                <input type="text" name="code" value={colis.code} readOnly className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 text-lg" />
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 flex justify-end mt-10">
          <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-4 px-16 rounded-2xl font-extrabold text-2xl shadow-lg transition-all">Créer le colis</button>
        </div>
      </form>
    </div>
  );
};

export default ColisCreate; 
