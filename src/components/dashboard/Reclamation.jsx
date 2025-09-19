import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { createComplaint, getComplaints, updateComplaint, deleteComplaint } from "../../services/api";
import { useAppStore } from "../../stores/useAppStore";
import { apiService } from "../../services/api";

const Reclamation = () => {
  const { user } = useAppStore();
  const [currentUser, setCurrentUser] = useState(null);
  const [commercialData, setCommercialData] = useState(null);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReclamation, setEditingReclamation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_email: "",
    client_name: "",
    subject: "",
    description: "",
    status: "En attente",
  });
  const [attachments, setAttachments] = useState([]);

  const statusOptions = [
    "En attente",
    "En cours de traitement",
    "Traitée",
    "Rejetée",
  ];

  const problemTypes = [
    "Retard de livraison",
    "Colis endommagé",
    "Mauvais article reçu",
    "Erreur d'adresse",
    "Problème de facturation",
    "Service client insatisfaisant",
    "Autre",
  ];

  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(userFromStorage);
    
    if (userFromStorage && (userFromStorage.role === 'Commercial' || userFromStorage.role === 'commercial')) {
      fetchCommercialComplaints(userFromStorage);
    } else {
      fetchComplaints();
    }
  }, [user]);

  // Fetch complaints for commercial's shippers
  const fetchCommercialComplaints = async (user) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get commercial data by email
      const commercials = await apiService.getCommercials();
      const commercial = commercials.find(c => c.email === user.email);
      
      if (!commercial) {
        console.error('Commercial not found for user:', user.email);
        setError('Commercial non trouvé');
        setLoading(false);
        return;
      }
      
      setCommercialData(commercial);
      
      // Fetch complaints for this commercial's shippers
      const complaintsData = await apiService.getCommercialComplaints(commercial.id, 1, 10, {});
      setReclamations(complaintsData.complaints || []);
      
    } catch (err) {
      console.error('❌ Error fetching commercial complaints:', err);
      setError('Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaints data (original function for non-commercial users)
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching complaints...');
      console.log('👤 Current user object:', user);
      console.log('👤 User email:', user?.email);
      console.log('👤 User role:', user?.role);
      console.log('👤 User type:', typeof user);
      console.log('👤 User keys:', user ? Object.keys(user) : 'null');
      
      // Get current user from localStorage as fallback
      let currentUser = user;
      if (!currentUser) {
        try {
          const userFromStorage = JSON.parse(localStorage.getItem('currentUser') || 'null');
          currentUser = userFromStorage;
          console.log('👤 User from localStorage:', currentUser);
        } catch (e) {
          console.warn('Failed to get user from localStorage:', e);
        }
      }
      
      const response = await getComplaints(1, 10, {}, currentUser);
      console.log('📦 Complaints response in component:', response);
      
      // The API returns { complaints: [...], pagination: {...} }
      const complaints = response.complaints || [];
      console.log('📋 Complaints received from API:', complaints.length);
      
      console.log('✅ Setting complaints state:', complaints);
      setReclamations(complaints);
    } catch (err) {
      console.error('❌ Error fetching complaints:', err);
      setError('Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "client_name", label: "Client" },
    { key: "client_email", label: "Email" },
    { key: "subject", label: "Type de problème" },
    { key: "created_at", label: "Date", render: (value) => new Date(value).toLocaleDateString('fr-FR') },
    {
      key: "attachments",
      label: "Pièces jointes",
      render: (value) => {
        if (!value || value.length === 0) {
          return <span className="text-gray-400">Aucune</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((attachment, index) => (
              <a
                key={index}
                href={`http://localhost:5000/uploads/complaints/${attachment}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                <i className="fas fa-paperclip mr-1"></i>
                {attachment}
              </a>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (value) => {
        const statusColors = {
          "En attente": "bg-yellow-100 text-yellow-800",
          "En cours de traitement": "bg-blue-100 text-blue-800",
          "Traitée": "bg-green-100 text-green-800",
          "Rejetée": "bg-red-100 text-red-800",
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
            {value}
          </span>
        );
      },
    },
  ];

  const handleAdd = () => {
    setEditingReclamation(null);
    setFormData({
      client_email: user?.email || "",
      client_name: user?.nom_utilisateur || "",
      subject: "",
      description: "",
      status: "En attente",
    });
    setAttachments([]);
    setIsModalOpen(true);
  };

  const handleEdit = (reclamation) => {
    setEditingReclamation(reclamation);
    setFormData({
      client_email: reclamation.client_email || "",
      client_name: reclamation.client_name || "",
      subject: reclamation.subject || "",
      description: reclamation.description || "",
      status: reclamation.status || "En attente",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (reclamation) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réclamation ?")) {
      try {
        await deleteComplaint(reclamation.id);
        await fetchComplaints(); // Refresh the list
      } catch (err) {
        console.error('Error deleting complaint:', err);
        alert('Erreur lors de la suppression de la réclamation');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add files
      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });
      
      if (editingReclamation) {
        await updateComplaint(editingReclamation.id, formDataToSend);
      } else {
        await createComplaint(formDataToSend);
      }
      
      await fetchComplaints(); // Refresh the list
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving complaint:', err);
      alert('Erreur lors de la sauvegarde de la réclamation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des réclamations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchComplaints}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des réclamations</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'expediteur' 
              ? 'Vos réclamations et leur suivi' 
              : (user?.role === 'Commercial' || user?.role === 'commercial')
              ? 'Réclamations des expéditeurs assignés à votre commercial'
              : 'Liste des réclamations clients et leur suivi'
            }
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'expediteur') && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Ajouter une réclamation
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-clock text-yellow-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {reclamations.filter(r => r.status === 'En attente').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-cog text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">En traitement</p>
              <p className="text-2xl font-bold text-gray-900">
                {reclamations.filter(r => r.status === 'En cours de traitement').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-check text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Traitées</p>
              <p className="text-2xl font-bold text-gray-900">
                {reclamations.filter(r => r.status === 'Traitée').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="fas fa-times text-red-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-gray-900">
                {reclamations.filter(r => r.status === 'Rejetée').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des réclamations */}
      <DataTable
        data={reclamations}
        columns={columns}
        onEdit={(user?.role === 'admin' || user?.role === 'expediteur') ? handleEdit : undefined}
        onDelete={user?.role === 'admin' ? handleDelete : undefined}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showActions={user?.role !== 'Commercial'}
      />

      {/* Modal d'ajout/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReclamation ? "Modifier la réclamation" : "Ajouter une réclamation"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-1">Type de problème</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner le type de problème</option>
                {problemTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium  mb-1">Nom complet</label>
              <input 
                type="text" 
                name="client_name" 
                value={formData.client_name} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium  mb-1">Email</label>
              <input 
                type="email" 
                name="client_email" 
                value={formData.client_email} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="votre.email@exemple.com"
              />
            </div>
            {(user?.role === 'admin' || user?.role === 'Commercial') && (
              <div>
                <label className="block text-sm font-medium  mb-1">Statut</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium  mb-1">Description du problème</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Décrivez votre problème en détail..."
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium  mb-1">Pièces jointes (optionnel)</label>
            <input 
              type="file" 
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setAttachments(Array.from(e.target.files))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Formats acceptés: Images (JPG, PNG), PDF, Documents (DOC, DOCX). Max 5 fichiers.
            </p>
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Fichiers sélectionnés:</p>
                <ul className="text-sm text-gray-600">
                  {attachments.map((file, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={submitting}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {editingReclamation ? "Mise à jour..." : "Ajout..."}
                </span>
              ) : (
                editingReclamation ? "Mettre à jour" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reclamation; 
