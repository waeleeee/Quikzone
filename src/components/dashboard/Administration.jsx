import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { apiService } from "../../services/api";

const Administration = () => {
  const [administrators, setAdministrators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdministrators = async () => {
      try {
        const data = await apiService.getAdministrators();
        console.log('Administrators data:', data); // Debug log
        setAdministrators(data || []);
      } catch (error) {
        console.error('Error fetching administrators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdministrators();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Administration"
  });

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "role", label: "Rôle" },
  ];

  const handleAdd = () => {
    setEditingAdmin(null);
    setFormData({
      id: "",
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "Administration"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData(admin);
    setIsModalOpen(true);
  };

  const handleDelete = async (admin) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet administrateur ?")) {
      try {
        const result = await apiService.deleteAdministrator(admin.id);
        if (result && result.success) {
          setAdministrators(administrators.filter((a) => a.id !== admin.id));
        }
          } catch (error) {
      console.error('Error deleting administrator:', error);
      const errorMessage = error.message || 'Error deleting administrator. Please try again.';
      alert(errorMessage);
    }
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Le nom est requis');
        return;
      }
      if (!formData.email.trim()) {
        alert('L\'email est requis');
        return;
      }
      if (!editingAdmin && !formData.password.trim()) {
        alert('Le mot de passe est requis pour créer un nouvel administrateur');
        return;
      }
      
      if (editingAdmin) {
        // Update existing administrator
        const result = await apiService.updateAdministrator(editingAdmin.id, formData);
        if (result && result.success) {
          setAdministrators(
            administrators.map((admin) =>
              admin.id === editingAdmin.id ? result.data : admin
            )
          );
          alert('Administrateur mis à jour avec succès!');
        }
      } else {
        // Create new administrator
        const result = await apiService.createAdministrator(formData);
        if (result && result.success) {
          setAdministrators([...administrators, result.data]);
          alert('Administrateur créé avec succès!');
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving administrator:', error);
      const errorMessage = error.message || 'Error saving administrator. Please try again.';
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

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Admin</h1>
          <p className="text-gray-600 mt-1">Gérez les utilisateurs ayant des droits d'administration</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter employé
        </button>
      </div>

      {/* Tableau des administrateurs */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <DataTable
          data={administrators}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {/* Modal d'ajout/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? "Modifier employé" : "Ajouter employé"}
        size="md"
      >
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                ID
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                disabled
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Nom
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Mot de passe {!editingAdmin && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingAdmin}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder={editingAdmin ? "Laisser vide pour ne pas changer" : "Entrez le mot de passe"}
              />
              {editingAdmin && (
                <p className="text-xs text-gray-500 mt-1">Laisser vide pour conserver le mot de passe actuel</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Rôle
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled
              >
                <option value="Administration">Administration</option>
              </select>
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
              {editingAdmin ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Administration; 
