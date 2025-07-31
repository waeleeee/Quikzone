import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { apiService } from "../../services/api";

const Secteurs = () => {
  const [sectors, setSectors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    city: [],
    status: "Actif",
  });
  const [error, setError] = useState("");

  // Fetch sectors on mount
  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const data = await apiService.getSectors();
      setSectors(data);
    } catch (e) {
      setSectors([]);
    }
  };



  const columns = [
    { key: "id", header: "ID", render: v => v ? `SEC${String(v).padStart(3, '0')}` : "N/A" },
    { key: "name", header: "Nom du secteur" },
    { key: "city", header: "Ville", render: value => Array.isArray(value) ? value.join(", ") : value },
    {
      key: "status",
      header: "Statut",
      render: value => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === "Actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value}</span>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingSector(null);
    setFormData({ name: "", city: [], status: "Actif" });
    setError("");
    setIsModalOpen(true);
  };

  const handleEdit = (sector) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      city: Array.isArray(sector.city) ? sector.city : (sector.city ? sector.city.split(",") : []),
      status: sector.status || "Actif"
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (sector) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce secteur ?")) {
      try {
        await apiService.deleteSector(sector.id);
        fetchSectors();
      } catch (e) {
        setError("Erreur lors de la suppression du secteur.");
      }
    }
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const payload = {
        name: formData.name,
        city: Array.isArray(formData.city) ? formData.city.join(",") : formData.city,
        status: formData.status
      };
      if (editingSector) {
        await apiService.updateSector(editingSector.id, payload);
      } else {
        await apiService.createSector(payload);
      }
      setIsModalOpen(false);
      fetchSectors();
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur lors de la sauvegarde du secteur.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des secteurs</h1>
          <p className="text-gray-600 mt-1">Gérez les secteurs de livraison et leurs responsables</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un secteur
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={sectors}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSector ? "Modifier le secteur" : "Ajouter un secteur"}
        size="md"
      >
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium ">Nom du secteur</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium ">Gouvernorat(s)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba","Kairouan","Kasserine","Kebili","Kef","Mahdia","Manouba","Médenine","Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine","Tozeur","Tunis","Zaghouan"].map(gouv => (
                  <label key={gouv} className="flex items-center gap-2 text-sm font-normal text-gray-700 ">
                    <input
                      type="checkbox"
                      value={gouv}
                      checked={formData.city.includes(gouv)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          city: checked
                            ? [...prev.city, gouv]
                            : prev.city.filter(c => c !== gouv)
                        }));
                      }}
                    />
                    {gouv}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium ">Statut</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>
          </div>
          {error && <div className="text-red-600 text-center mt-4 font-semibold">{error}</div>}
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">{editingSector ? "Mettre à jour" : "Ajouter"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Secteurs; 
