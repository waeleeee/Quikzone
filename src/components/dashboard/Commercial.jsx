import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import html2pdf from "html2pdf.js";
import ActionButtons from "./common/ActionButtons";
import { apiService } from "../../services/api";

// Subcomponent for a single commercial's dashboard
const CommercialDashboard = ({ commercial, onViewExpediteur }) => {
  const navigate = useNavigate();
  const [expediteursData, setExpediteursData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch shippers for this commercial
  useEffect(() => {
    const fetchShippers = async () => {
      try {
        setLoading(true);
        console.log('Fetching shippers for commercial ID:', commercial.id);
        const data = await apiService.getShippersByCommercial(commercial.id);
        console.log('Shippers for commercial:', data);
        setExpediteursData(data || []);
      } catch (error) {
        console.error('Error fetching shippers for commercial:', error);
      } finally {
        setLoading(false);
      }
    };

    if (commercial && commercial.id) {
      fetchShippers();
    }
  }, [commercial]);

  // Add refresh function that can be called from parent
  const refreshShippers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getShippersByCommercial(commercial.id);
      console.log('Refreshed shippers for commercial:', data);
      setExpediteursData(data || []);
      
      // Show success notification for manual refresh
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Liste des expéditeurs actualisée avec succès';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Error refreshing shippers for commercial:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Erreur lors de l\'actualisation';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Listen for custom events to refresh data
  useEffect(() => {
    const handleShipperUpdate = (event) => {
      console.log('Shipper update event received:', event.detail);
      refreshShippers();
      // Show a brief notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Liste des expéditeurs actualisée automatiquement';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    };

    window.addEventListener('shipper-updated', handleShipperUpdate);
    return () => {
      window.removeEventListener('shipper-updated', handleShipperUpdate);
    };
  }, [commercial.id]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpediteur, setSelectedExpediteur] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    minRevenue: "",
    maxRevenue: "",
    successRate: ""
  });
  const detailRef = useRef();
  const [shipperDetails, setShipperDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filter expediteurs based on search and advanced filters
  const filteredExpediteurs = expediteursData.filter(expediteur => {
    const matchesSearch = searchTerm === "" ||
      Object.values(expediteur).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = advancedFilters.status === "" || expediteur.status === advancedFilters.status;
    const matchesMinRevenue = advancedFilters.minRevenue === "" || expediteur.delivery_fees >= parseFloat(advancedFilters.minRevenue);
    const matchesMaxRevenue = advancedFilters.maxRevenue === "" || expediteur.delivery_fees <= parseFloat(advancedFilters.maxRevenue);

    const successRate = expediteur.total_parcels > 0 ? (expediteur.delivered_parcels / expediteur.total_parcels) * 100 : 0;
    const matchesSuccessRate = advancedFilters.successRate === "" || successRate >= parseFloat(advancedFilters.successRate);

    return matchesSearch && matchesStatus && matchesMinRevenue && matchesMaxRevenue && matchesSuccessRate;
  });

  const columns = [
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
          {value}
        </span>
      )
    },
  ];



  const handleViewDetails = async (expediteur) => {
    try {
      setLoadingDetails(true);
      setSelectedExpediteur(expediteur);
      
      // Fetch detailed data for this shipper
      const details = await apiService.getShipperDetails(expediteur.id);
      setShipperDetails(details);
    } catch (error) {
      console.error('Error fetching shipper details:', error);
      // Fallback to basic expediteur data
      setShipperDetails({
        shipper: expediteur,
        payments: [],
        parcels: [],
        statistics: {
          totalParcels: expediteur.total_parcels || 0,
          deliveredParcels: expediteur.delivered_parcels || 0,
          successRate: "0.0",
          totalRevenue: "0.00"
        }
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCalculatePerformance = (expediteur) => {
    const successfulParcels = expediteur.colis.filter(c => c.status === "Livés");
    const totalAmount = successfulParcels.reduce((sum, c) => sum + c.amount, 0);
    const performanceScore = ((expediteur.successfulShipments / expediteur.totalShipments) * 100).toFixed(1);
    
    alert(`Performance pour ${expediteur.name}:\nTotal colis réussis: ${successfulParcels.length}\nChiffre d'affaires: €${totalAmount.toFixed(2)}\nScore de performance: ${performanceScore}%`);
  };

  const handleAdvancedFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExportPDF = async () => {
    if (detailRef.current && selectedExpediteur) {
      setIsExporting(true);
      try {
        await html2pdf().set({
          margin: [0.3, 0.3, 0.3, 0.3],
          filename: `Commercial_${commercial.name}_Expediteur_${selectedExpediteur.name}.pdf`,
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true
          },
          jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        }).from(detailRef.current).save();
      } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Commercial Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des expéditeurs</h1>
          <p className="text-gray-600 mt-1">Gestion des expéditeurs et analyse des performances</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Commercial ID: {commercial.id}
            </span>
            <button
              onClick={refreshShippers}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualiser la liste des expéditeurs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* 1. Jean Dupont Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg border border-blue-200 flex flex-col items-center justify-center h-full min-h-[240px]">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-center w-full">
              <div className="text-lg font-bold text-gray-800 mb-1">{commercial.name}</div>
              <div className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 rounded px-2 py-1 mb-2">Commercial ID: {commercial.id}</div>
              <div className="flex items-center justify-center text-sm text-gray-600 mb-1">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {commercial.email}
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {commercial.phone}
              </div>
            </div>
          </div>

          {/* 2. Expéditeurs Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl shadow-lg border border-purple-200 flex flex-col items-center justify-center h-full min-h-[240px]">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-center w-full">
              <div className="text-lg font-bold text-gray-800 mb-1">Expéditeurs</div>
              <div className="flex flex-col items-center justify-center text-3xl font-bold text-green-600 mb-2">
                {commercial.clients_count || 0}
              </div>
              <div className="text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full inline-block">Nombre d’expéditeurs</div>
            </div>
          </div>

          {/* 3. Total de colis Card */}
          <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl shadow-lg border border-orange-200 flex flex-col items-center justify-center h-full min-h-[240px]">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="text-center w-full">
              <div className="text-lg font-bold text-gray-800 mb-1">TOTAL EXPÉDITIONS</div>
              <div className="text-3xl font-bold text-orange-600 mb-2">{commercial.shipments_received || 0}</div>
              <div className="text-sm text-gray-600 bg-orange-50 px-3 py-1 rounded-full inline-block">Expéditions au total</div>
            </div>
          </div>

          {/* 4. Total de colis livrés Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-green-200 flex flex-col items-center justify-center h-full min-h-[240px]">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center w-full">
              <div className="text-lg font-bold text-gray-800 mb-1">Expédition livrée</div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {loading ? "..." : `${expediteursData.length > 0 ? "Calculé" : "N/A"}`}
              </div>
              <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full inline-block">Livrées avec succès</div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A2 2 0 0013 14.586V19a1 1 0 01-1.447.894l-2-1A1 1 0 019 18v-3.414a2 2 0 00-.586-1.414L2 6.707A1 1 0 012 6V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Filtres avancés</h3>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${showAdvancedFilters ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {showAdvancedFilters ? "Masquer" : "Afficher"}
          </button>
        </div>
        {showAdvancedFilters && (
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-2 ">Statut</label>
              <select
                name="status"
                value={advancedFilters.status}
                onChange={handleAdvancedFilterChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-2 ">Date de début</label>
              <input
                type="date"
                name="dateFrom"
                value={advancedFilters.dateFrom}
                onChange={handleAdvancedFilterChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-2 ">Date de fin</label>
              <input
                type="date"
                name="dateTo"
                value={advancedFilters.dateTo}
                onChange={handleAdvancedFilterChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Expéditeurs Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-semibold">Mes Expéditeurs ({filteredExpediteurs.length})</h2>
          <p className="text-gray-600">Gérez vos expéditeurs et suivez leurs performances</p>
        </div>

        {loading ? (
          <div className="animate-pulse p-8">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <DataTable
            data={filteredExpediteurs}
            columns={columns}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRowClick={(expediteur) => handleViewDetails(expediteur)}
            showActions={true}
          />
        )}
      </div>

      {/* Expéditeur Details Modal */}
      {selectedExpediteur && (
        <Modal
          isOpen={!!selectedExpediteur}
          onClose={() => setSelectedExpediteur(null)}
          size="xl"
        >
          <div ref={detailRef} className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Détails de l'expéditeur</h2>
                <p className="text-gray-600">
                  {shipperDetails?.shipper?.name || selectedExpediteur.name} - {shipperDetails?.shipper?.company_name || selectedExpediteur.company}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedExpediteur(null)}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isExporting ? "Export en cours..." : "Exporter en PDF"}
                </button>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Résumé des Performances</h3>
              {loadingDetails ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">€{shipperDetails?.statistics?.totalRevenue || "0.00"}</div>
                    <div className="text-sm text-gray-600">Chiffre d'affaires total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{shipperDetails?.statistics?.deliveredParcels || 0}</div>
                    <div className="text-sm text-gray-600">Colis réussis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{shipperDetails?.statistics?.successRate || "0.0"}%</div>
                    <div className="text-sm text-gray-600">Taux de réussite</div>
                  </div>
                </div>
              )}
            </div>

            {/* Expéditeur Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl border">
                <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Nom:</span>
                    <span>{shipperDetails?.shipper?.name || selectedExpediteur.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{shipperDetails?.shipper?.email || selectedExpediteur.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Téléphone:</span>
                    <span>{shipperDetails?.shipper?.phone || selectedExpediteur.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Entreprise:</span>
                    <span>{shipperDetails?.shipper?.company_name || selectedExpediteur.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">SIRET:</span>
                    <span>{shipperDetails?.shipper?.tax_number || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border">
                <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Total colis:</span>
                    <span>{shipperDetails?.statistics?.totalParcels || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Colis réussis:</span>
                    <span className="text-green-600">{shipperDetails?.statistics?.deliveredParcels || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Taux de réussite:</span>
                    <span className="text-blue-600">{shipperDetails?.statistics?.successRate || "0.0"}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Chiffre d'affaires:</span>
                    <span className="text-green-600 font-semibold">€{shipperDetails?.statistics?.totalRevenue || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date d'inscription:</span>
                    <span>{shipperDetails?.shipper?.created_at ? new Date(shipperDetails.shipper.created_at).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white p-6 rounded-xl border mb-6">
              <h3 className="text-lg font-semibold mb-4">Paiements à cet expéditeur</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipperDetails?.payments?.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-gray-400">Aucun paiement trouvé pour cet expéditeur.</td></tr>
                    ) : (
                      shipperDetails?.payments?.map(payment => (
                        <tr key={payment.id}>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">
                            DT{parseFloat(payment.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{payment.payment_method || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{payment.reference || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {payment.status === "paid" ? "Payé" : "En attente"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Parcels */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="text-lg font-semibold mb-4">Colis récents</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Poids (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipperDetails?.parcels?.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-gray-400">Aucun colis trouvé pour cet expéditeur.</td></tr>
                    ) : (
                      shipperDetails?.parcels?.map((colis) => (
                        <tr key={colis.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{colis.tracking_number || colis.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              colis.status === "delivered" ? "bg-green-100 text-green-800" :
                              colis.status === "in_transit" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {colis.status === "delivered" ? "Livés" :
                               colis.status === "in_transit" ? "En cours" :
                               colis.status === "pending" ? "En attente" : colis.status}
                            </span>
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             {colis.created_date ? new Date(colis.created_date).toLocaleDateString() : "N/A"}
                           </td>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(colis.weight || 0).toFixed(2)} kg</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Main Commercial Component (Gestion Commerciaux)
const Commercial = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // List of Tunisian governorates
  const gouvernorats = [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", 
    "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine", 
    "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", 
    "Tozeur", "Tunis", "Zaghouan"
  ];

  const [commercials, setCommercials] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCommercial, setEditCommercial] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    title: "Commercial",
    governorate: "Tunis",
    clients_count: 0,
    shipments_received: 0
  });

  // Fetch commercials from backend
  useEffect(() => {
    const fetchCommercials = async () => {
      try {
        const data = await apiService.getCommercials();
        console.log('Commercials data:', data);
        setCommercials(data || []);
      } catch (error) {
        console.error('Error fetching commercials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommercials();
  }, []);

  // Add Commercial handler
  const handleAddCommercial = () => {
    setEditCommercial(null);
    setFormData({
      id: "",
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      title: "Commercial",
      governorate: "Tunis",
      clients_count: 0,
      shipments_received: 0
    });
    setShowEditModal(true);
  };

  // Edit Commercial handler
  const handleEditCommercial = (commercial) => {
    setEditCommercial(commercial);
    setFormData({
      ...commercial
    });
    setShowEditModal(true);
  };

  // Delete Commercial handler
  const handleDeleteCommercial = async (commercial) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce commercial ?")) {
      try {
        const result = await apiService.deleteCommercial(commercial.id);
        if (result && result.success) {
          setCommercials(commercials.filter((c) => c.id !== commercial.id));
        }
      } catch (error) {
        console.error('Error deleting commercial:', error);
        const errorMessage = error.message || 'Error deleting commercial. Please try again.';
        alert(errorMessage);
      }
    }
  };

  // Save Commercial handler
  const handleSaveCommercial = async (e) => {
    e.preventDefault();
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
      if (!editCommercial && !formData.password.trim()) {
        alert('Le mot de passe est requis pour créer un nouveau commercial');
        return;
      }

      
      if (editCommercial) {
        // Update existing commercial
        console.log('🔧 Updating commercial with data:', {
          id: editCommercial.id,
          formData: formData
        });
        
        const result = await apiService.updateCommercial(editCommercial.id, formData);
        console.log('📊 Update result:', result);
        
        if (result && result.success) {
          setCommercials(
            commercials.map((commercial) =>
              commercial.id === editCommercial.id ? result.data : commercial
            )
          );
          alert('Commercial mis à jour avec succès!');
        }
      } else {
        // Create new commercial
        const result = await apiService.createCommercial(formData);
        if (result && result.success) {
          setCommercials([...commercials, result.data]);
          alert(`Commercial créé avec succès!\n\nEmail: ${formData.email}\n\nLe commercial peut maintenant se connecter.`);
        }
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving commercial:', error);
      const errorMessage = error.message || 'Error saving commercial. Please try again.';
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

  const filteredCommercials = commercials.filter(commercial =>
    Object.values(commercial).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Define columns for the main Commercials table
  const commercialColumns = [
    { key: "id", header: "ID" },
    { key: "name", header: "NOM" },
    { key: "email", header: "EMAIL" },
    { key: "phone", header: "TÉLÉPHONE" },
    { key: "governorate", header: "GOUVERNORAT" },
    { key: "address", header: "ADRESSE" },
    { key: "title", header: "TITRE" },
    { key: "clients_count", header: "CLIENTS" },
    { key: "shipments_received", header: "EXPÉDITIONS REÇUES" },

    {
      key: "actions",
      header: "ACTIONS",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedCommercial(row); }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
            title="Voir les expéditeurs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEditCommercial(row); }}
            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
            title="Modifier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteCommercial(row); }}
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

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Commerciaux</h1>
          <p className="text-gray-600 mt-1">Gérez les commerciaux et leurs performances</p>
        </div>
        <button
          onClick={handleAddCommercial}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter Commercial
        </button>
      </div>

      {/* Tableau des commerciaux */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <DataTable
          data={commercials}
          columns={commercialColumns}
          onEdit={handleEditCommercial}
          onDelete={handleDeleteCommercial}
          onRowClick={(commercial) => setSelectedCommercial(commercial)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showActions={false}
        />
      )}
      {/* Modal d'ajout/édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editCommercial ? "Modifier Commercial" : "Ajouter Commercial"}
        size="md"
      >
        <form onSubmit={e => { e.preventDefault(); handleSaveCommercial(e); }}>
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
                Mot de passe {!editCommercial && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editCommercial}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder={editCommercial ? "Laisser vide pour ne pas changer" : "Entrez le mot de passe"}
              />
              {editCommercial && (
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
                Gouvernorat
              </label>
              <select
                name="governorate"
                value={formData.governorate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {gouvernorats.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Adresse
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ">
                Titre
              </label>
              <select
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Commercial">Commercial</option>
                <option value="Senior Commercial">Senior Commercial</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {editCommercial ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
      {/* Modal for Commercial Dashboard */}
      {selectedCommercial && (
        <Modal
          isOpen={!!selectedCommercial}
          onClose={() => setSelectedCommercial(null)}
          size="75"
        >
          <CommercialDashboard
            commercial={selectedCommercial}
            onViewExpediteur={() => {}}
          />
        </Modal>
      )}
    </div>
  );
};

export default Commercial;
