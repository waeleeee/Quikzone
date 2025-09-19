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

const MembreAgenceManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);

  // Fetch members from backend
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        setCurrentUser(user);
        console.log('🔍 Current user:', user);
        console.log('🔍 User role:', user?.role);
        console.log('🔍 User email:', user?.email);
        
        console.log('Fetching agency members...');
        const data = await apiService.getAgencyMembers();
        console.log('🔍 Raw agency members data:', data);
        console.log('🔍 Data type:', typeof data);
        console.log('🔍 Data length:', Array.isArray(data) ? data.length : 'Not an array');
        
        // Filter members based on user role and agency
        let filteredData = data || [];
        
        if (user && user.role === 'Chef d\'agence') {
          console.log('🔍 User is Chef d\'agence, applying filtering...');
          // For Chef d'agence, only show members from their agency
          // We need to get the user's agency from the agency_managers table
          try {
            console.log('🔍 Fetching agency managers for filtering...');
            const agencyManagerResponse = await apiService.getAgencyManagers();
            console.log('🔍 All agency managers response:', agencyManagerResponse);
            console.log('🔍 Agency managers type:', typeof agencyManagerResponse);
            console.log('🔍 Agency managers length:', Array.isArray(agencyManagerResponse) ? agencyManagerResponse.length : 'Not an array');
            
            const agencyManager = agencyManagerResponse.find(am => am.email === user.email);
            console.log('🔍 Looking for agency manager with email:', user.email);
            console.log('🔍 Found agency manager:', agencyManager);
            
            if (agencyManager) {
              console.log('🔍 Agency manager found:', agencyManager);
              console.log('🔍 Agency manager agency:', agencyManager.agency);
              console.log('🔍 Agency manager agency type:', typeof agencyManager.agency);
              
              // Show all members first for debugging
              console.log('🔍 All members before filtering:', data);
              console.log('🔍 Sample member structure:', data[0]);
              
              filteredData = data.filter(member => {
                console.log(`🔍 Checking member ${member.name}: member.agency="${member.agency}" (type: ${typeof member.agency}) vs agencyManager.agency="${agencyManager.agency}" (type: ${typeof agencyManager.agency})`);
                const matches = member.agency === agencyManager.agency;
                console.log(`🔍 Match result: ${matches}`);
                return matches;
              });
              console.log('🔍 Filtered members count:', filteredData.length);
              console.log('🔍 Filtered members:', filteredData);
            } else {
              console.log('⚠️ Agency manager not found for user:', user.email);
              console.log('⚠️ Available agency managers:', agencyManagerResponse.map(am => ({ email: am.email, agency: am.agency })));
            }
          } catch (error) {
            console.error('❌ Error fetching agency manager data:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
          }
        } else {
          console.log('🔍 User is not Chef d\'agence, showing all members');
        }
        
        console.log('🔍 Final filtered data count:', filteredData.length);
        setMembers(filteredData);
      } catch (error) {
        console.error('❌ Error fetching agency members:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
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

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    governorate: "Tunis",
    agency: "Tunis",
    role: "Agent d'accueil",
    status: "Actif",
    password: ""
  });

  const columns = [
    { 
      key: "id", 
      label: "ID",
      render: value => value ? `MEM${String(value).padStart(3, '0')}` : 'N/A'
    },
    { key: "name", label: "Nom et prénom" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "governorate", label: "Gouvernorat" },
    { key: "agency", label: "Depôt" },
    { key: "role", label: "Rôle" },
    { 
      key: "status", 
      label: "Statut",
      render: value => (
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
          value === 'Actif' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: "created_at", 
      label: "Date de création",
      render: value => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A'
    }
  ];

  const handleAdd = async () => {
    // Determine the agency for the new member based on current user
    let defaultAgency = 'Siège';
    let defaultGovernorate = 'Tunis';
    
    if (currentUser && currentUser.role === 'Chef d\'agence') {
      // For Chef d'agence, get their agency from the agency_managers table
      try {
        const agencyManagerResponse = await apiService.getAgencyManagers();
        const agencyManager = agencyManagerResponse.find(am => am.email === currentUser.email);
        
        if (agencyManager) {
          defaultAgency = agencyManager.agency;
          defaultGovernorate = agencyManager.governorate;
          console.log('🔍 Setting agency for new member:', defaultAgency);
        }
      } catch (error) {
        console.error('Error fetching agency manager data:', error);
      }
    }
    
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      governorate: defaultGovernorate,
      agency: defaultAgency,
      role: "Agent d'accueil",
      status: "Actif",
      password: ""
    });
    setIsModalOpen(true);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      ...member,
      password: '' // Don't populate password field for security
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (member) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce membre d'agence ?")) {
      try {
        const result = await apiService.deleteAgencyMember(member.id);
        if (result && result.success) {
          setMembers(members.filter((m) => m.id !== member.id));
          alert('Membre d\'agence supprimé avec succès!');
        } else {
          throw new Error(result?.message || 'Failed to delete member');
        }
      } catch (error) {
        console.error('Error deleting agency member:', error);
        const errorMessage = error.message || 'Error deleting agency member. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingMember) {
        // Update existing member
        const result = await apiService.updateAgencyMember(editingMember.id, formData);
        if (result && result.success) {
          setMembers(members.map(m => m.id === editingMember.id ? result.data : m));
          const message = formData.password && formData.password.trim() 
            ? 'Membre d\'agence mis à jour avec succès! Le mot de passe a été modifié.'
            : 'Membre d\'agence mis à jour avec succès!';
          alert(message);
        } else {
          throw new Error(result?.message || 'Failed to update member');
        }
      } else {
        // Create new member
        const result = await apiService.createAgencyMember(formData);
        if (result && result.success) {
          setMembers([...members, result.data]);
          alert(`Membre d'agence créé avec succès!\n\nInformations de connexion:\nEmail: ${formData.email}\nMot de passe: ${formData.password}\n\nLe membre d'agence peut maintenant se connecter avec ces identifiants.`);
        } else {
          throw new Error(result?.message || 'Failed to create member');
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving agency member:', error);
      const errorMessage = error.message || 'Error saving agency member. Please try again.';
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

  // Calculate statistics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === "Actif").length;
  const inactiveMembers = members.filter(m => m.status === "Inactif").length;
  const agencies = [...new Set(members.map(m => m.agency))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Membres de mon Agence'
              : 'Gestion des Membres d\'Agence'
            }
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Gestion du personnel de votre dépôt'
                              : 'Gestion complète du personnel des dépôts'
            }
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un membre
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Membres</p>
              <p className="text-xl font-bold text-blue-600">{totalMembers}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Membres Actifs</p>
              <p className="text-xl font-bold text-green-600">{activeMembers}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Membres Inactifs</p>
              <p className="text-xl font-bold text-red-600">{inactiveMembers}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Agences</p>
              <p className="text-xl font-bold text-purple-600">{agencies}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <DataTable
          data={members}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? "Modifier le membre d'agence" : "Ajouter un membre d'agence"}
        size="md"
      >
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium ">Nom et prénom</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium ">Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium ">Téléphone</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium ">Gouvernorat</label>
              <select 
                name="governorate" 
                value={formData.governorate} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {gouvernorats.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium ">Depôt</label>
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
            <div>
              <label className="block text-sm font-medium ">Rôle</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un rôle</option>
                <option value="Magasinier">Magasinier</option>
                <option value="Agent Débriefing Livreurs">Agent Débriefing Livreurs</option>
                <option value="Magasinier de Nuit">Magasinier de Nuit</option>
                <option value="Chargé des Opérations Logistiques">Chargé des Opérations Logistiques</option>
                <option value="Sinior OPS Membre">Sinior OPS Membre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium ">Statut</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="En congé">En congé</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium ">
                Mot de passe {!editingMember && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                required={!editingMember}
                placeholder={editingMember ? "Laisser vide pour ne pas modifier" : "Mot de passe requis"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
              />
              {editingMember && (
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour conserver le mot de passe actuel
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
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
              {editingMember ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MembreAgenceManagement; 
