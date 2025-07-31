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

const agenceOptions = [
  { value: "Siège", label: "Siège" },
  { value: "Tunis", label: "Tunis" },
  { value: "Sousse", label: "Sousse" },
  { value: "Sfax", label: "Sfax" },
  { value: "Monastir", label: "Monastir" },
  { value: "Gabès", label: "Gabès" },
  { value: "Gafsa", label: "Gafsa" },
];

const roleOptions = [
  { value: "Magasinier", label: "Magasinier" },
  { value: "Agent Débriefing Livreurs", label: "Agent Débriefing Livreurs" },
  { value: "Magasinier de Nuit", label: "Magasinier de Nuit" },
  { value: "Chargé des Opérations Logistiques", label: "Chargé des Opérations Logistiques" },
  { value: "Sinior OPS Membre", label: "Sinior OPS Membre" },
];

const statusOptions = [
  { value: "Actif", label: "Actif" },
  { value: "Inactif", label: "Inactif" },
];

const MembreAgence = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user
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
        console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
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
        // For Administration role, show all members (no filtering)
        
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

  const handleAddMember = async () => {
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
    
    setEditMember({
      id: null,
      name: '',
      email: '',
      phone: '',
      governorate: defaultGovernorate,
      agency: defaultAgency,
      role: 'Agent d\'accueil',
      status: 'Actif',
    });
    setShowEditModal(true);
  };

  const handleEditMember = (member) => {
    setEditMember({ ...member });
    setShowEditModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    try {
      if (editMember.id && members.some(m => m.id === editMember.id)) {
        // Update existing member
        const result = await apiService.updateAgencyMember(editMember.id, editMember);
        if (result && result.success) {
          setMembers(members.map(m => m.id === editMember.id ? result.data : m));
          alert('Membre d\'agence mis à jour avec succès!');
        } else {
          throw new Error(result?.message || 'Failed to update member');
        }
      } else {
        // Create new member
        const result = await apiService.createAgencyMember(editMember);
        if (result && result.success) {
          setMembers([...members, result.data]);
          alert('Membre d\'agence créé avec succès!');
        } else {
          throw new Error(result?.message || 'Failed to create member');
        }
      }
      setShowEditModal(false);
      setEditMember(null);
    } catch (error) {
      console.error('Error saving agency member:', error);
      const errorMessage = error.message || 'Error saving agency member. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteMember = async (member) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le membre "${member.name}" ?`)) {
      try {
        const result = await apiService.deleteAgencyMember(member.id);
        if (result && result.success) {
          setMembers(members.filter(m => m.id !== member.id));
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

  // Calculate statistics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Actif').length;
  const inactiveMembers = members.filter(m => m.status === 'Inactif').length;
  const uniqueAgencies = [...new Set(members.map(m => m.agency))].length;

  const columns = [
    { 
      key: "id", 
      header: "ID",
      render: value => value ? `MEM${String(value).padStart(3, '0')}` : 'N/A'
    },
    { key: "name", header: "Nom et prénom" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Téléphone" },
    { key: "governorate", header: "Gouvernorat" },
    { key: "agency", header: "Depôt" },
    { key: "role", header: "Rôle" },
    { 
      key: "status", 
      header: "Statut",
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
      header: "Date de création",
      render: value => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A'
    },

  ];

  const filteredMembers = members.filter(m =>
    Object.values(m).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
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
          onClick={handleAddMember}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Ajouter un membre
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Membres</p>
              <p className="text-2xl font-semibold text-gray-900">{totalMembers}</p>
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
              <p className="text-sm font-medium text-gray-600">Membres Actifs</p>
              <p className="text-2xl font-semibold text-gray-900">{activeMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Membres Inactifs</p>
              <p className="text-2xl font-semibold text-gray-900">{inactiveMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agences</p>
              <p className="text-2xl font-semibold text-gray-900">{uniqueAgencies}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="animate-pulse p-8">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <DataTable
            data={filteredMembers}
            columns={columns}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showActions={true}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        )}
      </div>

      {/* Modal for Add/Edit Member */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="md">
          <form onSubmit={handleSaveMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium ">ID</label>
                <input 
                  type="text" 
                  className="border rounded px-2 py-1 w-full bg-gray-100" 
                  value={editMember.id ? `MEM${String(editMember.id).padStart(3, '0')}` : 'Auto-généré'} 
                  readOnly 
                  disabled 
                />
              </div>
              <div>
                <label className="block text-sm font-medium ">Nom et prénom</label>
                <input 
                  type="text" 
                  className="border rounded px-2 py-1 w-full" 
                  value={editMember.name || ''} 
                  onChange={e => setEditMember({ ...editMember, name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium ">Email</label>
                <input 
                  type="email" 
                  className="border rounded px-2 py-1 w-full" 
                  value={editMember.email || ''} 
                  onChange={e => setEditMember({ ...editMember, email: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium ">Téléphone</label>
                <input 
                  type="tel" 
                  className="border rounded px-2 py-1 w-full" 
                  value={editMember.phone || ''} 
                  onChange={e => setEditMember({ ...editMember, phone: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium ">Gouvernorat</label>
                <select 
                  className="border rounded px-2 py-1 w-full" 
                  value={editMember.governorate || 'Tunis'} 
                  onChange={e => setEditMember({ ...editMember, governorate: e.target.value })}
                  required
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
                    className="border rounded px-2 py-1 w-full bg-gray-100" 
                    value={editMember.agency || ''} 
                    readOnly 
                    disabled
                  />
                ) : (
                  <select 
                    className="border rounded px-2 py-1 w-full" 
                    value={editMember.agency || ''} 
                    onChange={e => setEditMember({ ...editMember, agency: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium ">Rôle</label>
                <select 
                  className="border rounded px-2 py-1 w-full" 
                  value={editMember.role || 'Agent d\'accueil'} 
                  onChange={e => setEditMember({ ...editMember, role: e.target.value })}
                  required
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium ">Statut</label>
                <select 
                  className="border rounded px-2 py-1 w-full" 
                  value={editMember.status || 'Actif'} 
                  onChange={e => setEditMember({ ...editMember, status: e.target.value })}
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editMember.id ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MembreAgence; 
