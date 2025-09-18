import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { apiService, warehousesService } from "../../services/api";

// List of Tunisian governorates
const gouvernorats = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", 
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine", 
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", 
  "Tozeur", "Tunis", "Zaghouan"
];

// Agency options
const agencyOptions = [
  "Siège",
  "Tunis", 
  "Sousse",
  "Sfax",
  "Monastir"
];

const Livreurs = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    governorate: "Tunis",
    cin_number: "",
    driving_license: "",
    car_number: "",
    car_type: "",
    insurance_number: "",
    agency: "Siège",
    photo_url: "",
    personal_documents_url: "",
    car_documents_url: "",
    password: "",
    photo_url_file: null,
    personal_documents_url_file: null,
    car_documents_url_file: null,
    photo_url_preview: "",
    personal_documents_url_preview: "",
    car_documents_url_preview: "",
    photo_url_loading: false,
    personal_documents_url_loading: false,
    car_documents_url_loading: false
  });

  // Fetch real-time current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('🔍 Fetching real-time current user data...');
        const realUserData = await apiService.getCurrentUser();
        console.log('🔍 Real-time user data:', realUserData);
        setCurrentUser(realUserData);
      } catch (error) {
        console.error('❌ Error fetching real-time user data:', error);
        // Keep the localStorage data as fallback
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch drivers from backend
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        console.log('🔄 Starting to fetch drivers...');
        setLoading(true);
        
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        setCurrentUser(user);
        console.log('🔍 Current user:', user);
        console.log('🔍 User role:', user?.role);
        console.log('🔍 User email:', user?.email);
        
        const data = await apiService.getDrivers();
        console.log('📊 Raw drivers data:', data);
        console.log('📊 Drivers data type:', typeof data);
        console.log('📊 Drivers data length:', Array.isArray(data) ? data.length : 'Not an array');
        
        // Filter drivers based on user role and agency
        let filteredData = data || [];
        
        if (user && user.role === 'Chef d\'agence') {
          console.log('🔍 User is Chef d\'agence, applying filtering...');
          // For Chef d'agence, let the backend handle filtering automatically
          console.log('🔍 Backend will filter drivers automatically based on user role and agency');
          filteredData = data; // Backend should already filter this
          console.log('🔍 Backend-filtered drivers count:', filteredData.length);
          console.log('🔍 Backend-filtered drivers:', filteredData);
        } else {
          console.log('🔍 User is not Chef d\'agence, showing all drivers');
        }
        
        console.log('🔍 Final filtered data count:', filteredData.length);
        setDrivers(filteredData);
        console.log('✅ Drivers state updated');
      } catch (error) {
        console.error('❌ Error fetching drivers:', error);
        setDrivers([]);
      } finally {
        setLoading(false);
        console.log('🏁 Loading finished');
      }
    };

    fetchDrivers();
  }, []);

  // Fetch warehouses (Entrepôts) from backend
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setWarehousesLoading(true);
        console.log('🔍 Frontend: Fetching warehouses...');
        const response = await warehousesService.getWarehouses();
        console.log('🔍 Frontend: Warehouses response:', response);
        console.log('🔍 Frontend: Response type:', typeof response);
        console.log('🔍 Frontend: Response keys:', Object.keys(response || {}));
        
        // Handle different response structures
        let warehousesData = [];
        if (response && response.success && response.data) {
          warehousesData = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          warehousesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          warehousesData = response.data;
        }
        
        console.log('🔍 Frontend: Processed warehouses data:', warehousesData);
        console.log('🔍 Frontend: Warehouses count:', warehousesData.length);
        
        if (warehousesData.length > 0) {
          console.log('🔍 Frontend: First warehouse:', warehousesData[0]);
        }
        
        setWarehouses(warehousesData);
        
        // If no warehouses found, show a message
        if (warehousesData.length === 0) {
          console.log('⚠️ Frontend: No warehouses found in database');
        }
      } catch (error) {
        console.error('❌ Frontend: Error fetching warehouses:', error);
        setWarehouses([]);
      } finally {
        setWarehousesLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const columns = [
    { 
      key: "photo_url", 
      header: "Photo",
      render: (value, row) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {value && (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:') || value.trim() !== '') ? (
            <img 
              src={value.startsWith('http') ? value : `http://localhost:5000${value}`} 
              alt={`Photo de ${row.name}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Error loading table image:', e.target.src);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span className={`text-gray-400 text-lg ${value && (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:') || value.trim() !== '') ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
            👤
          </span>
        </div>
      )
    },
    { key: "name", header: "Nom" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Téléphone" },
    { key: "governorate", header: "Gouvernorat" },
    { key: "car_number", header: "Numéro de voiture" },
    { key: "car_type", header: "Type de voiture" },
    { key: "agency", header: "Depôt" },
    { 
      key: "documents", 
      header: "Documents",
      render: (value, row) => (
        <div className="flex space-x-1">
          {row.personal_documents_url && (
            <button
              onClick={() => {
                if (row.personal_documents_url.startsWith('blob:')) {
                  // For blob URLs, try to open in new tab
                  try {
                    window.open(row.personal_documents_url, '_blank');
                  } catch (error) {
                    console.error('Error opening document:', error);
                    alert('Document non disponible. Veuillez réessayer.');
                  }
                } else if (row.personal_documents_url.startsWith('http')) {
                  // For server URLs, open in new tab
                  window.open(row.personal_documents_url, '_blank');
                } else if (row.personal_documents_url && row.personal_documents_url.trim() !== '') {
                  // For server URLs without http, construct the full URL
                  const fullUrl = `http://localhost:5000${row.personal_documents_url}`;
                  window.open(fullUrl, '_blank');
                } else {
                  alert('Document non disponible.');
                }
              }}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Voir documents personnels"
            >
              📄
            </button>
          )}
          {row.car_documents_url && (
            <button
              onClick={() => {
                if (row.car_documents_url.startsWith('blob:')) {
                  // For blob URLs, try to open in new tab
                  try {
                    window.open(row.car_documents_url, '_blank');
                  } catch (error) {
                    console.error('Error opening document:', error);
                    alert('Document non disponible. Veuillez réessayer.');
                  }
                } else if (row.car_documents_url.startsWith('http')) {
                  // For server URLs, open in new tab
                  window.open(row.car_documents_url, '_blank');
                } else if (row.car_documents_url && row.car_documents_url.trim() !== '') {
                  // For server URLs without http, construct the full URL
                  const fullUrl = `http://localhost:5000${row.car_documents_url}`;
                  window.open(fullUrl, '_blank');
                } else {
                  alert('Document non disponible.');
                }
              }}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              title="Voir documents voiture"
            >
              🚗
            </button>
          )}
        </div>
      )
    },
  ];

  const handleAdd = async () => {
    // Determine the agency for the new driver based on current user
    let defaultAgency = 'Siège';
    let defaultGovernorate = 'Tunis';
    
    if (currentUser && currentUser.role === 'Chef d\'agence') {
      // For Chef d'agence, get their real-time agency data
      try {
        console.log('🔍 Fetching real-time user data for Chef d\'agence...');
        const realUserData = await apiService.getCurrentUser();
        console.log('🔍 Real-time user data:', realUserData);
        
        if (realUserData && realUserData.agency) {
          defaultAgency = realUserData.agency;
          defaultGovernorate = realUserData.governorate || 'Tunis';
          console.log('🔍 Setting agency for new driver:', defaultAgency);
          console.log('🔍 Setting governorate for new driver:', defaultGovernorate);
        } else {
          console.log('⚠️ No agency found in real-time user data, using fallback');
        }
      } catch (error) {
        console.error('❌ Error fetching real-time user data:', error);
        // Keep the fallback values
      }
    }
    
    setEditingDriver(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      governorate: defaultGovernorate,
      cin_number: "",
      driving_license: "",
      car_number: "",
      car_type: "",
      insurance_number: "",
      agency: defaultAgency,
      photo_url: "",
      personal_documents_url: "",
      car_documents_url: "",
      password: "",
      photo_url_file: null,
      personal_documents_url_file: null,
      car_documents_url_file: null,
      photo_url_preview: "",
      personal_documents_url_preview: "",
      car_documents_url_preview: "",
      photo_url_loading: false,
      personal_documents_url_loading: false,
      car_documents_url_loading: false
    });
    setIsModalOpen(true);
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    // Ensure all fields have default values to avoid controlled/uncontrolled input issues
    setFormData({
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      address: driver.address || "",
      governorate: driver.governorate || "Tunis",
      cin_number: driver.cin_number || "",
      driving_license: driver.driving_license || "",
      car_number: driver.car_number || "",
      car_type: driver.car_type || "",
      insurance_number: driver.insurance_number || "",
      agency: driver.agency || "Siège",
      photo_url: driver.photo_url || "",
      personal_documents_url: driver.personal_documents_url || "",
      car_documents_url: driver.car_documents_url || "",
      password: '', // Don't populate password field for security
      photo_url_file: null,
      personal_documents_url_file: null,
      car_documents_url_file: null,
      photo_url_preview: driver.photo_url || "",
      personal_documents_url_preview: driver.personal_documents_url || "",
      car_documents_url_preview: driver.car_documents_url || "",
      photo_url_loading: false,
      personal_documents_url_loading: false,
      car_documents_url_loading: false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (driver) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce livreur ?")) {
      try {
        await apiService.deleteDriver(driver.id);
      setDrivers(drivers.filter((d) => d.id !== driver.id));
        alert('Livreur supprimé avec succès!');
      } catch (error) {
        console.error('Error deleting driver:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du livreur';
        alert(errorMessage);
      }
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      
      // Create a copy of formData with only the data we want to send to API
      const apiData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        governorate: formData.governorate,
        cin_number: formData.cin_number,
        driving_license: formData.driving_license,
        car_number: formData.car_number,
        car_type: formData.car_type,
        insurance_number: formData.insurance_number,
        agency: formData.agency,
        photo_url: formData.photo_url,
        personal_documents_url: formData.personal_documents_url,
        car_documents_url: formData.car_documents_url,
        password: formData.password
      };
      
      console.log('Submitting with server URLs for files');
      
      if (editingDriver) {
        console.log('Updating driver with ID:', editingDriver.id);
        const updatedDriver = await apiService.updateDriver(editingDriver.id, apiData);
        console.log('Update response:', updatedDriver);
        setDrivers(drivers.map((driver) =>
          driver.id === editingDriver.id ? updatedDriver : driver
        ));
        const message = formData.password && formData.password.trim() 
          ? 'Livreur mis à jour avec succès! Le mot de passe a été modifié.'
          : 'Livreur mis à jour avec succès!';
        alert(message);
      } else {
        console.log('Creating new driver');
        const newDriver = await apiService.createDriver(apiData);
        console.log('Create response:', newDriver);
        setDrivers([...drivers, newDriver]);
        alert(`Livreur créé avec succès!\n\nInformations de connexion:\nEmail: ${formData.email}\nMot de passe: ${formData.password}\n\nLe livreur peut maintenant se connecter avec ces identifiants.`);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving driver:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde du livreur';
      alert(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      try {
        console.log('Starting file upload for:', fieldName, file.name);
        
        // Show loading state
        setFormData((prev) => ({
          ...prev,
          [`${fieldName}_loading`]: true
        }));

        // Upload file to server
        const uploadResult = await apiService.uploadFile(file);
        console.log('Upload result:', uploadResult);
        
        if (uploadResult && uploadResult.success) {
          // Create blob URL for preview
          const blobUrl = URL.createObjectURL(file);
          
          console.log('Setting form data with URL:', uploadResult.data.url);
          
          setFormData((prev) => ({
            ...prev,
            [fieldName]: uploadResult.data.url, // Store server URL
            [`${fieldName}_preview`]: blobUrl, // Store blob URL for preview
            [`${fieldName}_file`]: file, // Store file object
            [`${fieldName}_loading`]: false
          }));
        } else {
          console.error('Upload failed - no success flag:', uploadResult);
          throw new Error(uploadResult?.message || 'Upload failed');
        }
      } catch (error) {
        console.error('File upload error:', error);
        console.error('Error details:', error.response?.data);
        alert('Erreur lors du téléchargement du fichier: ' + error.message);
        setFormData((prev) => ({
          ...prev,
          [`${fieldName}_loading`]: false
        }));
      }
    }
  };

  const handleViewDocument = (documentUrl, documentName, fileObject = null) => {
    if (documentUrl) {
      if (documentUrl.startsWith('blob:') && fileObject) {
        // For blob URLs with file object, create a proper download
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = fileObject.name || documentName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (documentUrl.startsWith('blob:')) {
        // For blob URLs without file object, try to open in new tab
        try {
          window.open(documentUrl, '_blank');
        } catch (error) {
          console.error('Error opening blob URL:', error);
          alert('Impossible d\'ouvrir le document. Veuillez réessayer.');
        }
      } else if (documentUrl.startsWith('http')) {
        // For server URLs, download it
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For other URLs, try to open in new tab
        window.open(documentUrl, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentUser && currentUser.role === 'Chef d\'agence'
                ? 'Livreurs de mon Dépôt'
                : 'Gestion des livreurs'
              }
            </h1>
            <p className="text-gray-600 mt-1">
              {currentUser && currentUser.role === 'Chef d\'agence'
                ? 'Liste des livreurs de votre dépôt'
                : 'Liste des livreurs et leurs informations'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des livreurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
              <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentUser && currentUser.role === 'Chef d\'agence'
                ? 'Livreurs de mon Dépôt'
                : 'Gestion des livreurs'
              }
            </h1>
            <p className="text-gray-600 mt-1">
              {currentUser && currentUser.role === 'Chef d\'agence'
                ? 'Liste des livreurs de votre dépôt'
                : 'Liste des livreurs et leurs informations'
              }
            </p>
          </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un livreur
        </button>
      </div>

      {/* Tableau des livreurs */}
      <DataTable
        data={drivers}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Modal d'ajout/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? "Modifier le livreur" : "Ajouter un livreur"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 📦 Informations du livreur */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📦</span>
              Coordonnées livreur
            </h3>
            
            {/* Photo upload at top center */}
            <div className="flex justify-center mb-6">
              <div className="text-center">
                <div className="w-32 h-32 border-2 border-dashed border-blue-300 rounded-full mx-auto mb-2 flex items-center justify-center bg-white">
                  {formData.photo_url_loading ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (formData.photo_url_preview || formData.photo_url) ? (
                    <img 
                      src={formData.photo_url_preview || (formData.photo_url.startsWith('http') ? formData.photo_url : `http://localhost:5000${formData.photo_url}`)} 
                      alt="Photo du livreur" 
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        console.error('Error loading image:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`text-blue-400 text-4xl ${(formData.photo_url_preview || formData.photo_url) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                    📷
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'photo_url')}
                  className="hidden"
                  id="photo-upload"
                />
                <label 
                  htmlFor="photo-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {formData.photo_url ? 'Changer la photo' : 'Ajouter une photo'}
                </label>
                {formData.photo_url && !formData.photo_url.startsWith('http') && !formData.photo_url.startsWith('blob:') && (
                  <p className="text-sm text-gray-500 mt-1">Fichier sélectionné: {formData.photo_url}</p>
                )}
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">Nom</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">Gouvernorat</label>
              <select
                  name="governorate"
                  value={formData.governorate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
              >
                {gouvernorats.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 ">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Numéro CIN</label>
                <input
                  type="text"
                  name="cin_number"
                  value={formData.cin_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
              />
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Numéro permis</label>
              <input
                type="text"
                  name="driving_license"
                  value={formData.driving_license}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">
                  Mot de passe {!editingDriver && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required={!editingDriver}
                  placeholder={editingDriver ? "Laisser vide pour ne pas modifier" : "Mot de passe requis"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
                {editingDriver && (
                  <p className="text-xs text-gray-500 mt-1">
                    Laisser vide pour conserver le mot de passe actuel
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🚗 Informations de la voiture */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">🚗</span>
              Coordonnées voiture
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Numéro de voiture</label>
                <input
                  type="text"
                  name="car_number"
                  value={formData.car_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Type de voiture</label>
                <input
                  type="text"
                  name="car_type"
                  value={formData.car_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Renault Kangoo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Numéro d'assurance</label>
                <input
                  type="text"
                  name="insurance_number"
                  value={formData.insurance_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Depôt</label>
                {currentUser && currentUser.role === 'Chef d\'agence' ? (
                  <input
                    type="text"
                    name="agency"
                    value={formData.agency}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                ) : (
                  <select
                    name="agency"
                    value={formData.agency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Sélectionnez un dépôt</option>
                    {warehousesLoading ? (
                      <option value="" disabled>Chargement des dépôts...</option>
                    ) : warehouses && warehouses.length > 0 ? (
                      warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.name}>{warehouse.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>Aucun dépôt disponible</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Document uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">
                  Documents personnels
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'personal_documents_url')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                {formData.personal_documents_url_loading ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-blue-600">⏳ Téléchargement en cours...</p>
                  </div>
                ) : (formData.personal_documents_url_preview || formData.personal_documents_url) ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-green-600">✓ Document sélectionné</p>
                    <button
                      type="button"
                      onClick={() => {
                        const url = formData.personal_documents_url_preview || formData.personal_documents_url;
                        if (url.startsWith('blob:') || url.startsWith('http')) {
                          window.open(url, '_blank');
                        } else if (url && url.trim() !== '') {
                          // For server URLs, construct the full URL
                          const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
                          window.open(fullUrl, '_blank');
                        } else {
                          alert('Document non disponible pour la prévisualisation.');
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Voir
                    </button>
                  </div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">
                  Documents de la voiture
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'car_documents_url')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                {formData.car_documents_url_loading ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-blue-600">⏳ Téléchargement en cours...</p>
                  </div>
                ) : (formData.car_documents_url_preview || formData.car_documents_url) ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-green-600">✓ Document sélectionné</p>
                    <button
                      type="button"
                      onClick={() => {
                        const url = formData.car_documents_url_preview || formData.car_documents_url;
                        if (url.startsWith('blob:') || url.startsWith('http')) {
                          window.open(url, '_blank');
                        } else if (url && url.trim() !== '') {
                          // For server URLs, construct the full URL
                          const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
                          window.open(fullUrl, '_blank');
                        } else {
                          alert('Document non disponible pour la prévisualisation.');
                        }
                      }}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Voir
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Form buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {editingDriver ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Livreurs; 
