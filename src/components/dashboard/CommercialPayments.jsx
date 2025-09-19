import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { apiService } from "../../services/api";

const CommercialPayments = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [commercialData, setCommercialData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  
  // Admin-specific states
  const [isAdmin, setIsAdmin] = useState(false);
  const [allCommercials, setAllCommercials] = useState([]);
  const [selectedCommercialId, setSelectedCommercialId] = useState("");
  
  const [formData, setFormData] = useState({
    type: "Commission",
    description: "",
    amount: "",
    payment_method: "Virement bancaire",
    reference: "",
    status: "pending"
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    if (user) {
      const isAdminUser = user.role === 'Administration' || user.role === 'Admin';
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        fetchAllCommercials();
      } else if (user.role === 'Commercial') {
        fetchCommercialPayments(user);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAllCommercials = async () => {
    try {
      setLoading(true);
      const commercials = await apiService.getCommercials();
      setAllCommercials(commercials || []);
      
      if (commercials && commercials.length > 0) {
        setSelectedCommercialId(commercials[0].id);
        await fetchCommercialPaymentsForAdmin(commercials[0].id);
      }
    } catch (error) {
      console.error('Error fetching commercials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommercialPaymentsForAdmin = async (commercialId) => {
    try {
      const [paymentsData, statsData] = await Promise.all([
        apiService.getCommercialOwnPayments(commercialId),
        apiService.getCommercialPaymentStats(commercialId)
      ]);
      
      setPayments(paymentsData.payments || []);
      setPaymentStats(statsData);
    } catch (error) {
      console.error('Error fetching commercial payments for admin:', error);
    }
  };

  const fetchCommercialPayments = async (user) => {
    try {
      setLoading(true);
      
      // Get commercial data by email
      const commercials = await apiService.getCommercials();
      const commercial = commercials.find(c => c.email === user.email);
      
      if (!commercial) {
        console.error('Commercial not found for user:', user.email);
        setLoading(false);
        return;
      }
      
      setCommercialData(commercial);
      
      // Fetch commercial's own payments and stats
      const [paymentsData, statsData] = await Promise.all([
        apiService.getCommercialOwnPayments(commercial.id),
        apiService.getCommercialPaymentStats(commercial.id)
      ]);
      
      setPayments(paymentsData.payments || []);
      setPaymentStats(statsData);
      
    } catch (error) {
      console.error('Error fetching commercial payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommercialChange = async (commercialId) => {
    setSelectedCommercialId(commercialId);
    await fetchCommercialPaymentsForAdmin(commercialId);
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setFormData({
      type: "Commission",
      description: "",
      amount: "",
      payment_method: "Virement bancaire",
      reference: "",
      status: "pending"
    });
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      type: payment.type,
      description: payment.description,
      amount: payment.amount,
      payment_method: payment.payment_method,
      reference: payment.reference,
      status: payment.status
    });
    setIsModalOpen(true);
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        const commercialId = isAdmin ? selectedCommercialId : commercialData.id;
        await apiService.deleteCommercialPayment(commercialId, payment.id);
        
        if (isAdmin) {
          await fetchCommercialPaymentsForAdmin(commercialId);
        } else {
          await fetchCommercialPayments(currentUser);
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Erreur lors de la suppression du paiement');
      }
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      const commercialId = isAdmin ? selectedCommercialId : commercialData.id;
      
      if (editingPayment) {
        await apiService.updateCommercialPayment(commercialId, editingPayment.id, formData);
      } else {
        await apiService.createCommercialPayment(commercialId, formData);
      }
      
      if (isAdmin) {
        await fetchCommercialPaymentsForAdmin(commercialId);
      } else {
        await fetchCommercialPayments(currentUser);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Erreur lors de la sauvegarde du paiement');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const columns = [
    { key: "reference", label: "RÉFÉRENCE" },
    { key: "type", label: "TYPE" },
    { key: "description", label: "DESCRIPTION" },
    { 
      key: "amount", 
      label: "MONTANT",
      render: (value) => (
        <span className="font-semibold text-green-600">DT{parseFloat(value || 0).toFixed(2)}</span>
      )
    },
    { key: "payment_method", label: "MÉTHODE" },
    {
      key: "status",
      label: "STATUT",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "paid"
              ? "bg-green-100 text-green-800"
              : value === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value === "paid" ? "Payé" : value === "pending" ? "En attente" : "Échoué"}
        </span>
      ),
    },
    { 
      key: "created_at", 
      label: "DATE",
      render: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A'
    },
    // Only show actions column for admin users
    ...(isAdmin ? [{
      key: "actions",
      label: "ACTIONS",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditPayment(row)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
            title="Modifier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeletePayment(row)}
            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    }] : []),
  ];

  // Filter payments based on search term and filters
  const filteredPayments = payments.filter(payment =>
    (payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     payment.type?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "" || payment.status === statusFilter) &&
    (typeFilter === "" || payment.type === typeFilter)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'Commercial' && !isAdmin)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-800">Accès non autorisé</h2>
        <p className="text-gray-600 mt-2">Vous devez être connecté en tant que commercial ou administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  const pageTitle = isAdmin ? "Gestion des Paiements Commerciaux" : "Mes Paiements";
  const pageDescription = isAdmin ? "Gestion des commissions, salaires et bonus des commerciaux" : "Consultez vos commissions, salaires et bonus";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">{pageDescription}</p>
        </div>
        {/* Only show add button for admin users */}
        {isAdmin && (
          <button
            onClick={handleAddPayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Ajouter un paiement
          </button>
        )}
      </div>

      {/* Commercial Selector for Admin */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un Commercial</label>
          <select
            value={selectedCommercialId}
            onChange={(e) => handleCommercialChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allCommercials.map(commercial => (
              <option key={commercial.id} value={commercial.id}>
                {commercial.name} ({commercial.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reçu</p>
              <p className="text-2xl font-bold text-green-600">{(paymentStats.total_paid || 0).toLocaleString('fr-FR')} DT</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{(paymentStats.total_pending || 0).toLocaleString('fr-FR')} DT</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commissions</p>
              <p className="text-2xl font-bold text-blue-600">{(paymentStats.commission_total || 0).toLocaleString('fr-FR')} DT</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salaires</p>
              <p className="text-2xl font-bold text-purple-600">{(paymentStats.salary_total || 0).toLocaleString('fr-FR')} DT</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="failed">Échoué</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="Commission">Commission</option>
            <option value="Salaire">Salaire</option>
            <option value="Bonus">Bonus</option>
          </select>
          
          {isAdmin && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setTypeFilter("");
              }}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          data={filteredPayments}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPayment ? "Modifier le Paiement" : "Ajouter un Paiement"}
          size="md"
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Commercial Selector for Admin in Modal */}
            {isAdmin && !editingPayment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commercial</label>
                <select
                  value={selectedCommercialId}
                  onChange={(e) => setSelectedCommercialId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {allCommercials.map(commercial => (
                    <option key={commercial.id} value={commercial.id}>
                      {commercial.name} ({commercial.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Commission">Commission</option>
                  <option value="Salaire">Salaire</option>
                  <option value="Bonus">Bonus</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DT)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de paiement</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Carte bancaire">Carte bancaire</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Référence automatique si laissé vide"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                {editingPayment ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CommercialPayments; 
