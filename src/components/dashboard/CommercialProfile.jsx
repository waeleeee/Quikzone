import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import { apiService } from "../../services/api";

const CommercialProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [commercialData, setCommercialData] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [expediteurs, setExpediteurs] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modal states
  const [showExpediteurModal, setShowExpediteurModal] = useState(false);
  const [selectedExpediteur, setSelectedExpediteur] = useState(null);
  const [expediteurDetails, setExpediteurDetails] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    if (user && user.role === 'Commercial') {
      fetchCommercialData(user);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCommercialData = async (user) => {
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
      
      // Fetch all data for this commercial
      await Promise.all([
        fetchStats(commercial.id),
        fetchExpediteurs(commercial.id),
        fetchParcels(commercial.id),
        fetchPayments(commercial.id),
        fetchComplaints(commercial.id)
      ]);
      
    } catch (error) {
      console.error('Error fetching commercial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (commercialId) => {
    try {
      const statsData = await apiService.getCommercialStats(commercialId);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchExpediteurs = async (commercialId) => {
    try {
      const expediteursData = await apiService.getShippersByCommercial(commercialId);
      setExpediteurs(expediteursData);
    } catch (error) {
      console.error('Error fetching expediteurs:', error);
    }
  };

  const fetchParcels = async (commercialId) => {
    try {
      const parcelsData = await apiService.getCommercialParcels(commercialId);
      setParcels(parcelsData.parcels || []);
    } catch (error) {
      console.error('Error fetching parcels:', error);
    }
  };

  const fetchPayments = async (commercialId) => {
    try {
      const paymentsData = await apiService.getCommercialPayments(commercialId);
      setPayments(paymentsData.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchComplaints = async (commercialId) => {
    try {
      const complaintsData = await apiService.getCommercialComplaints(commercialId);
      setComplaints(complaintsData.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const handleViewExpediteurDetails = async (expediteur) => {
    try {
      setSelectedExpediteur(expediteur);
      const details = await apiService.getShipperDetails(expediteur.id);
      setExpediteurDetails(details);
      setShowExpediteurModal(true);
    } catch (error) {
      console.error('Error fetching expediteur details:', error);
    }
  };

  const handleRefresh = async () => {
    if (commercialData) {
      await fetchCommercialData(currentUser);
    }
  };

  // Filter functions
  const filteredExpediteurs = expediteurs.filter(expediteur =>
    Object.values(expediteur).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredParcels = parcels.filter(parcel =>
    (parcel.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     parcel.shipper_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "" || parcel.status === statusFilter)
  );

  const filteredPayments = payments.filter(payment =>
    (payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     payment.shipper_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "" || payment.status === statusFilter)
  );

  const filteredComplaints = complaints.filter(complaint =>
    (complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     complaint.client_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "" || complaint.status === statusFilter)
  );

  // Column definitions
  const expediteurColumns = [
    { key: "code", header: "CODE" },
    { key: "name", header: "NOM" },
    { key: "email", header: "EMAIL" },
    { key: "phone", header: "TÉLÉPHONE" },
    { key: "company", header: "ENTREPRISE" },
    { key: "total_parcels", header: "TOTAL COLIS" },
    { key: "delivered_parcels", header: "COLIS LIVRÉ" },
    { key: "returned_parcels", header: "COLIS RETOURNÉ" },
    {
      key: "delivery_fees",
      header: "FRAIS DE LIVRAISON",
      render: (value) => (
        <span className="font-semibold text-green-600">€{parseFloat(value || 0).toFixed(2)}</span>
      )
    },
    {
      key: "return_fees",
      header: "FRAIS DE RETOUR",
      render: (value) => (
        <span className="font-semibold text-red-600">€{parseFloat(value || 0).toFixed(2)}</span>
      )
    },
    {
      key: "status",
      header: "STATUT",
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === "Actif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {value === "Actif" ? "Actif" : "Inactif"}
        </span>
      )
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (_, row) => (
        <button
          onClick={() => handleViewExpediteurDetails(row)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
          title="Voir les détails"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )
    }
  ];

  const parcelColumns = [
    { key: "tracking_number", header: "NUMÉRO DE SUIVI" },
    { key: "shipper_name", header: "EXPÉDITEUR" },
    { key: "destination", header: "DESTINATION" },
    {
      key: "status",
      header: "STATUT",
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === "delivered" ? "bg-green-100 text-green-800" :
          value === "in_transit" ? "bg-blue-100 text-blue-800" :
          "bg-yellow-100 text-yellow-800"
        }`}>
          {value === "delivered" ? "Livré" :
           value === "in_transit" ? "En cours" :
           value === "pending" ? "En attente" : value}
        </span>
      )
    },
    { key: "weight", header: "POIDS (KG)" },
    { key: "created_at", header: "DATE CRÉATION" }
  ];

  const paymentColumns = [
    { key: "reference", header: "RÉFÉRENCE" },
    { key: "shipper_name", header: "EXPÉDITEUR" },
    { key: "amount", header: "MONTANT" },
    { key: "payment_method", header: "MÉTHODE" },
    {
      key: "status",
      header: "STATUT",
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === "paid" ? "bg-green-100 text-green-800" :
          value === "pending" ? "bg-yellow-100 text-yellow-800" :
          "bg-red-100 text-red-800"
        }`}>
          {value === "paid" ? "Payé" :
           value === "pending" ? "En attente" : "Échoué"}
        </span>
      )
    },
    { key: "created_at", header: "DATE" }
  ];

  const complaintColumns = [
    { key: "id", header: "ID" },
    { key: "client_name", header: "CLIENT" },
    { key: "subject", header: "SUJET" },
    {
      key: "status",
      header: "STATUT",
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === "resolved" ? "bg-green-100 text-green-800" :
          value === "pending" ? "bg-yellow-100 text-yellow-800" :
          value === "in_progress" ? "bg-blue-100 text-blue-800" :
          "bg-red-100 text-red-800"
        }`}>
          {value === "resolved" ? "Résolu" :
           value === "pending" ? "En attente" :
           value === "in_progress" ? "En cours" : "Rejeté"}
        </span>
      )
    },
    { key: "created_at", header: "DATE" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'Commercial') {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-800">Accès non autorisé</h2>
        <p className="text-gray-600 mt-2">Vous devez être connecté en tant que commercial pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Commercial</h1>
            <p className="text-gray-600 mt-1">Gestion des clients, paiements et réclamations</p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* User Info */}
        <div className="mt-4 bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {currentUser.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{currentUser.name}</h3>
              <p className="text-gray-600">{currentUser.email}</p>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mt-1">
                Commercial
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_shippers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paiements Reçus</p>
              <p className="text-2xl font-bold text-gray-900">€{(stats.total_payments || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Réclamations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_complaints || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Colis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_parcels || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Tableau de Bord', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
              { id: 'expediteurs', label: 'Mes Expéditeurs', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'parcels', label: 'Mes Colis', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'payments', label: 'Mes Paiements', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
              { id: 'complaints', label: 'Mes Réclamations', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="delivered">Livré</option>
                <option value="paid">Payé</option>
                <option value="resolved">Résolu</option>
              </select>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Nouveau Client
                    </button>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                      Ajouter un expéditeur
                    </button>
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                      Gérer les paiements
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Résumé</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total clients:</span>
                      <span className="font-semibold">{stats.total_shippers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total colis:</span>
                      <span className="font-semibold">{stats.total_parcels || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Colis livrés:</span>
                      <span className="font-semibold">{stats.delivered_parcels || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paiements reçus:</span>
                      <span className="font-semibold">€{(stats.total_payments || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expediteurs' && (
            <DataTable
              data={filteredExpediteurs}
              columns={expediteurColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}

          {activeTab === 'parcels' && (
            <DataTable
              data={filteredParcels}
              columns={parcelColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}

          {activeTab === 'payments' && (
            <DataTable
              data={filteredPayments}
              columns={paymentColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}

          {activeTab === 'complaints' && (
            <DataTable
              data={filteredComplaints}
              columns={complaintColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}
        </div>
      </div>

      {/* Expediteur Details Modal */}
      {showExpediteurModal && selectedExpediteur && (
        <Modal
          isOpen={showExpediteurModal}
          onClose={() => setShowExpediteurModal(false)}
          title={`Détails de l'expéditeur - ${selectedExpediteur.name}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Informations</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Nom:</span>
                    <span>{selectedExpediteur.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{selectedExpediteur.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Téléphone:</span>
                    <span>{selectedExpediteur.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Entreprise:</span>
                    <span>{selectedExpediteur.company || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Statistiques</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total colis:</span>
                    <span>{selectedExpediteur.total_parcels || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Colis livrés:</span>
                    <span>{selectedExpediteur.delivered_parcels || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Colis retournés:</span>
                    <span>{selectedExpediteur.returned_parcels || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Frais de livraison:</span>
                    <span className="font-semibold text-green-600">€{parseFloat(selectedExpediteur.delivery_fees || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {expediteurDetails && expediteurDetails.parcels && (
              <div className="bg-white border rounded-lg">
                <h3 className="font-semibold p-4 border-b">Colis récents</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                        <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Poids</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expediteurDetails.parcels.slice(0, 5).map((parcel) => (
                        <tr key={parcel.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {parcel.tracking_number || parcel.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              parcel.status === "delivered" ? "bg-green-100 text-green-800" :
                              parcel.status === "in_transit" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {parcel.status === "delivered" ? "Livré" :
                               parcel.status === "in_transit" ? "En cours" :
                               parcel.status === "pending" ? "En attente" : parcel.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {parcel.destination}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {parseFloat(parcel.weight || 0).toFixed(2)} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CommercialProfile; 
