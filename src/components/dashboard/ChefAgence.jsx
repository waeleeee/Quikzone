import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { apiService } from "../../services/api";

// List of Tunisian governorates
const gouvernorats = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", 
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine", 
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", 
  "Tozeur", "Tunis", "Zaghouan"
];



const ChefAgence = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editChef, setEditChef] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    role: '', 
    agency: '',
    governorate: 'Tunis'
  });
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberModalMode, setMemberModalMode] = useState('add'); // 'add' or 'edit'
  const [searchMember, setSearchMember] = useState("");
  const [memberError, setMemberError] = useState("");


  // Fetch agency managers from backend
  useEffect(() => {
    const fetchChefs = async () => {
      try {
        setLoading(true);
        console.log('🔍 Frontend: Fetching agency managers...');
        console.log('🔍 Frontend: API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
        const data = await apiService.getAgencyManagers();
        console.log('🔍 Frontend: Agency managers data received:', data);
        console.log('🔍 Frontend: Data type:', typeof data);
        console.log('🔍 Frontend: Data length:', Array.isArray(data) ? data.length : 'Not an array');
        setChefs(data || []);
      } catch (error) {
        console.error('❌ Frontend: Error fetching agency managers:', error);
        console.error('❌ Frontend: Error details:', error.response?.data || error.message);
        setChefs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChefs();
  }, []);



  // Fetch agency members when viewing members
  useEffect(() => {
    if (selectedChef && showMembersModal) {
      const fetchMembers = async () => {
        try {
          setMembersLoading(true);
          console.log('🔍 Frontend: Fetching agency members for chef:', selectedChef);
          const data = await apiService.getAgencyMembers();
          console.log('🔍 Frontend: All agency members data:', data);
          console.log('🔍 Frontend: Selected chef agency:', selectedChef.agency);
          
          // Filter members by the selected agency
          const filteredMembers = data.filter(member => {
            console.log(`🔍 Frontend: Checking member ${member.name} - member.agency: "${member.agency}" vs selectedChef.agency: "${selectedChef.agency}"`);
            return member.agency === selectedChef.agency;
          });
          
          console.log('🔍 Frontend: Filtered members:', filteredMembers);
          setMembers(filteredMembers);
        } catch (error) {
          console.error('Error fetching agency members:', error);
          setMembers([]);
        } finally {
          setMembersLoading(false);
        }
      };
      fetchMembers();
    }
  }, [selectedChef, showMembersModal]);



  const handleAddChef = () => {
    setEditChef({
      id: '',
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      governorate: 'Tunis',
    });
    setShowEditModal(true);
  };

  const handleEditChef = (chef) => {
    setEditChef({ 
      ...chef,
      password: '' // Don't populate password field for security
    });
    setShowEditModal(true);
  };

  const handleSaveChef = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!editChef.name.trim()) {
        alert('Le nom est requis');
        return;
      }
      if (!editChef.email.trim()) {
        alert('L\'email est requis');
        return;
      }
      if (!editChef.id && !editChef.password.trim()) {
        alert('Le mot de passe est requis pour créer un nouveau chef d\'agence');
        return;
      }
      
      if (editChef.id && chefs.some(c => c.id === editChef.id)) {
        // Update existing agency manager
        console.log('🔧 Updating agency manager with data:', {
          id: editChef.id,
          formData: editChef,
          hasPassword: !!editChef.password,
          passwordLength: editChef.password?.length
        });
        
        // Clean the data - remove empty agency field
        const cleanData = { ...editChef };
        if (!cleanData.agency || cleanData.agency.trim() === '') {
          delete cleanData.agency;
        }
        
        const result = await apiService.updateAgencyManager(editChef.id, cleanData);
        console.log('📊 Update result:', result);
        
        if (result && result.success) {
          setChefs(chefs.map(c => c.id === editChef.id ? result.data : c));
          const message = editChef.password && editChef.password.trim() 
            ? 'Chef d\'agence mis à jour avec succès! Le mot de passe a été modifié.'
            : 'Chef d\'agence mis à jour avec succès!';
          alert(message);
        }
      } else {
        // Create new agency manager
        // Clean the data - remove empty agency field
        const cleanData = { ...editChef };
        if (!cleanData.agency || cleanData.agency.trim() === '') {
          delete cleanData.agency;
        }
        
        const result = await apiService.createAgencyManager(cleanData);
        console.log('📊 Create result:', result);
        
        // Handle both response formats
        if (result && (result.success || result.id)) {
          const newChef = result.data || result;
          setChefs([...chefs, newChef]);
          alert(`Chef d'agence créé avec succès!\n\nInformations de connexion:\nEmail: ${editChef.email}\nMot de passe: ${editChef.password}\n\nLe chef d'agence peut maintenant se connecter avec ces identifiants.`);
        } else {
          throw new Error(result?.message || 'Failed to create agency manager');
        }
      }
      setShowEditModal(false);
      setEditChef(null);
    } catch (error) {
      console.error('Error saving agency manager:', error);
      const errorMessage = error.message || 'Error saving agency manager. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteChef = async (chef) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chef d\'agence ?')) {
      try {
        await apiService.deleteAgencyManager(chef.id);
        setChefs(chefs.filter(c => c.id !== chef.id));
        alert('Chef d\'agence supprimé avec succès!');
      } catch (error) {
        console.error('Error deleting agency manager:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du chef d\'agence';
        alert(errorMessage);
      }
    }
  };

  const handleViewEmployees = (chef) => {
    setSelectedChef(chef);
    setShowMembersModal(true);
  };

  const handleAddMember = () => {
    setMemberForm({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      role: '', 
      agency: selectedChef.agency || 'Siège',
      governorate: 'Tunis'
    });
    setMemberModalMode('add');
    setShowMemberModal(true);
  };

  const handleEditMember = (member) => {
    setMemberForm(member);
    setMemberModalMode('edit');
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    try {
      if (memberModalMode === 'edit') {
        // Update existing member
        const updatedMember = await apiService.updateAgencyMember(memberForm.id, memberForm);
        setMembers(members.map(m => m.id === memberForm.id ? updatedMember : m));
        setShowMemberModal(false);
        setMemberForm({ name: '', email: '', phone: '', address: '', role: '', agency: 'Siège', governorate: 'Tunis' });
        alert('Membre d\'agence mis à jour avec succès!');
      } else {
        // Create new member
        const newMember = await apiService.createAgencyMember(memberForm);
        setMembers([...members, newMember]);
        setShowMemberModal(false);
        setMemberForm({ name: '', email: '', phone: '', address: '', role: '', agency: 'Siège', governorate: 'Tunis' });
        alert('Membre d\'agence créé avec succès!');
      }
    } catch (error) {
      console.error('Error saving agency member:', error);
      let msg = 'Erreur lors de la sauvegarde du membre d\'agence';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = error.message;
      }
      setMemberError(msg);
    }
  };

  const handleDeleteMember = async (member) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre d\'agence ?')) {
      try {
        await apiService.deleteAgencyMember(member.id);
        setMembers(members.filter(m => m.id !== member.id));
        alert('Membre d\'agence supprimé avec succès!');
      } catch (error) {
        console.error('Error deleting agency member:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du membre d\'agence';
        alert(errorMessage);
      }
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nom et prénom" },
    { key: "email", label: "Email" },
    { 
      key: "phone", 
      label: "Téléphone",
      render: (value) => value || "N/A"
    },
    { 
      key: "governorate", 
      label: "Gouvernorat",
      render: (value) => value || "N/A"
    },
    { 
      key: "address", 
      label: "Adresse",
      render: (value) => value || "N/A"
    },
    { 
      key: "agency", 
      label: "Depôt",
      render: (value) => value || "N/A"
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewEmployees(row)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
            title="Voir les employés de chaque agence"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => handleEditChef(row)}
            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
            title="Modifier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeleteChef(row)}
            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
            title="Supprimer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const filteredChefs = chefs.filter(c =>
    Object.values(c).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des chefs d'agence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des chefs d'agence</h1>
        <button
          onClick={handleAddChef}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Ajouter chefs d'agence
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          data={filteredChefs}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showActions={false}
        />
      </div>

      {/* Modal for Add/Edit Chef d'agence */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="md">
          <form onSubmit={handleSaveChef} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editChef.id && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">ID</label>
                  <input type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full bg-gray-100" value={editChef.id || ''} readOnly disabled />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Nom</label>
                <input type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500" value={editChef.name || ''} onChange={e => setEditChef({ ...editChef, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Email</label>
                <input type="email" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500" value={editChef.email || ''} onChange={e => setEditChef({ ...editChef, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">
                  Mot de passe {!editChef.id && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={editChef.password || ''}
                  onChange={e => setEditChef({ ...editChef, password: e.target.value })}
                  required={!editChef.id}
                  placeholder={editChef.id ? "Laisser vide pour ne pas changer" : "Entrez le mot de passe"}
                />
                {editChef.id && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">Laisser vide pour conserver le mot de passe actuel</p>
                    {editChef.has_password ? (
                      <p className="text-xs text-green-600">✅ Mot de passe configuré (peut se connecter)</p>
                    ) : (
                      <p className="text-xs text-orange-600">⚠️ Aucun mot de passe configuré (ne peut pas se connecter)</p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Le nouveau mot de passe sera immédiatement actif pour la connexion
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Téléphone</label>
                <input type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500" value={editChef.phone || ''} onChange={e => setEditChef({ ...editChef, phone: e.target.value })} placeholder="+216 XX XXX XXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Gouvernorat</label>
                <select 
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  value={editChef.governorate || 'Tunis'} 
                  onChange={e => setEditChef({ ...editChef, governorate: e.target.value })} 
                  required
                >
                  {gouvernorats.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Adresse</label>
                <input type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500" value={editChef.address || ''} onChange={e => setEditChef({ ...editChef, address: e.target.value })} placeholder="Adresse complète" />
              </div>

            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal for Members of Agency */}
      {showMembersModal && selectedChef && (
        <Modal isOpen={showMembersModal} onClose={() => { setShowMembersModal(false); setSelectedChef(null); }} size="75">
          <div className="space-y-8 h-full overflow-y-auto">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between text-center md:">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Membres de l'agence {selectedChef.agency}</h1>
                  <p className="text-gray-600">Liste et gestion des membres de l'agence</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-semibold">
                    {members.length} membre(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Search and Add Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2 px-2">
              <input
                type="text"
                placeholder="Rechercher par nom, email ou rôle..."
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                className="w-full md:w-1/2 px-6 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-gray-800 text-lg"
              />
              <button
                onClick={handleAddMember}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md text-lg transition-colors"
              >
                Ajouter un membre
              </button>
            </div>

            {/* Card-style Table Container */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des membres...</p>
                </div>
              ) : (
                <DataTable
                  data={members.filter(m => 
                    m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                    m.email.toLowerCase().includes(searchMember.toLowerCase()) ||
                    (m.role && m.role.toLowerCase().includes(searchMember.toLowerCase()))
                  )}
                  columns={[
                    { key: "id", header: "ID" },
                    { key: "name", header: "Nom et prénom" },
                    { key: "email", header: "Email" },
                    { 
                      key: "phone", 
                      header: "Téléphone",
                      render: (value) => value || "N/A"
                    },
                    { 
                      key: "governorate", 
                      header: "Gouvernorat",
                      render: (value) => value || "N/A"
                    },
                    { 
                      key: "address", 
                      header: "Adresse",
                      render: (value) => value || "N/A"
                    },
                    { 
                      key: "agency", 
                      header: "Depôt",
                      render: (value) => value || "N/A"
                    },
                    { 
                      key: "role", 
                      header: "Rôle",
                      render: (value) => value || "N/A"
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      render: (_, member) => (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )
                    }
                  ]}
                  showActions={false}
                />
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal for Add/Edit Member */}
      {showMemberModal && (
        <Modal isOpen={showMemberModal} onClose={() => { setShowMemberModal(false); setMemberError(""); }} size="md">
          <form onSubmit={handleSaveMember} className="space-y-6 bg-white rounded-2xl shadow-2xl p-8 border-t-8 border-blue-600 max-w-lg mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-700 mb-2">{memberModalMode === 'edit' ? 'Modifier le membre d\'agence' : 'Ajouter membres d\'agence'}</h2>
              <p className="text-gray-500">Veuillez remplir les informations du membre d'agence.</p>
            </div>
            {memberError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300 text-center font-semibold">
                {memberError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Nom et prénom</label>
                <input type="text" className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition" value={memberForm.name || ''} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Email</label>
                <input type="email" className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition" value={memberForm.email || ''} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Téléphone</label>
                <input type="text" className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition" value={memberForm.phone || ''} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Gouvernorat</label>
                <select className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition" value={memberForm.governorate || 'Tunis'} onChange={e => setMemberForm({ ...memberForm, governorate: e.target.value })} required>
                  {gouvernorats.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Adresse</label>
                <input type="text" className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition" value={memberForm.address || ''} onChange={e => setMemberForm({ ...memberForm, address: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Depôt</label>
                <select className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition" value={memberForm.agency || ''} onChange={e => setMemberForm({ ...memberForm, agency: e.target.value })} required>
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
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1 ">Rôle</label>
                <select
                  className="border-2 border-blue-200 rounded-lg px-4 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition"
                  value={memberForm.role || ''}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un rôle</option>
                  <option value="Magasinier">Magasinier</option>
                  <option value="Agent Débriefing Livreurs">Agent Débriefing Livreurs</option>
                  <option value="Magasinier de Nuit">Magasinier de Nuit</option>
                  <option value="Chargé des Opérations Logistiques">Chargé des Opérations Logistiques</option>
                  <option value="Sinior OPS Membre">Sinior OPS Membre</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button type="button" className="px-6 py-2 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg bg-white hover:bg-blue-50 transition" onClick={() => setShowMemberModal(false)}>Annuler</button>
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-lg shadow hover:scale-105 transition-transform">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ChefAgence; 
