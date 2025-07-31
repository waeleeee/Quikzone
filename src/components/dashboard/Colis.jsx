import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import ColisTimeline from "./common/ColisTimeline";
import ColisCreate from "./ColisCreate";
import { useParcels, useCreateParcel, useUpdateParcel, useDeleteParcel } from "../../hooks/useApi";
import { useAppStore } from "../../stores/useAppStore";
import { useForm } from "react-hook-form";
import { apiService } from "../../services/api";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Function to format numbers with 3 digits before decimal and 3 after
const formatValue = (value) => {
  const num = parseFloat(value) || 0;
  
  // Format to exactly 3 decimal places
  const formatted = num.toFixed(3);
  
  // Split by decimal point
  const parts = formatted.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add leading zeros to make it 3 digits before decimal
  const paddedInteger = integerPart.padStart(3, '0');
  
  // Combine with decimal part (already 3 digits from toFixed)
  return `${paddedInteger}.${decimalPart}`;
};

const Colis = () => {
  const location = useLocation();
  const { parcels, loading, selectedParcel, setSelectedParcel } = useAppStore();
  const { data: parcelsData, isLoading } = useParcels();
  const createParcelMutation = useCreateParcel();
  const updateParcelMutation = useUpdateParcel();
  const deleteParcelMutation = useDeleteParcel();

  // Get current user to check permissions
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });

  // Check if user can edit/delete (Admin, Administration, Chef d'agence)
  const canEdit = currentUser?.role === 'Administration' || 
                  currentUser?.role === 'Admin' || 
                  currentUser?.role === 'Chef d\'agence' ||
                  currentUser?.role === 'Administrateur';

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    shipper: "",
    destination: "",
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    pages: 0
  });

  const [userAgency, setUserAgency] = useState(null);
  const [shippersByAgency, setShippersByAgency] = useState({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Check if we should open create modal from dashboard navigation
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsCreateModalOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch agency information for Chef d'agence users
  useEffect(() => {
    const fetchAgencyData = async () => {
      if (currentUser && currentUser.role === 'Chef d\'agence') {
        try {
          console.log('🔍 Fetching agency data for Chef d\'agence...');
          
          // Get user's agency
          const agencyManagerResponse = await apiService.getAgencyManagers();
          const agencyManager = agencyManagerResponse.find(am => am.email === currentUser.email);
          
          if (agencyManager) {
            setUserAgency(agencyManager.agency);
            console.log('🔍 User agency:', agencyManager.agency);
            
            // Get all shippers to filter by agency
            const shippersData = await apiService.getShippers();
            const agencyShippers = shippersData.filter(shipper => shipper.agency === agencyManager.agency);
            
            // Create a map of shipper IDs by agency for quick lookup
            const shippersMap = {};
            agencyShippers.forEach(shipper => {
              shippersMap[shipper.id] = shipper;
            });
            
            setShippersByAgency(shippersMap);
            console.log('🔍 Agency shippers:', agencyShippers.map(s => ({ id: s.id, name: s.name, agency: s.agency })));
          }
        } catch (error) {
          console.error('❌ Error fetching agency data:', error);
        }
      }
    };

    fetchAgencyData();
  }, [currentUser]);

  const statusOptions = [
    "En attente",
    "Au dépôt",
    "En cours",
    "RTN dépot",
    "Livés",
    "Livrés payés",
    "Retour définitif",
    "RTN client dépôt",
    "Retour Expéditeur",
    "Retour En Cours d'expédition",
    "Retour reçu",
  ];

  // Export to Excel function
  const exportToExcel = () => {
    const headers = [
      'N° Colis', 'N° Suivi', 'Expéditeur', 'Code Expéditeur', 'Destination', 'Statut',
      'Poids (kg)', 'Type', 'Prix (DT)', 'Frais Livraison', 'Frais Retour',
      'Date de création', 'Date estimée', 'Date réelle', 'Téléphone', 'Email', 'Société'
    ];
    
    // Create Excel content with proper formatting
    let excelContent = '';
    
    // Add headers
    excelContent += headers.join('\t') + '\n';
    
    // Add data rows
    filteredParcels.forEach(parcel => {
      const row = [
        parcel.id,
        parcel.tracking_number,
        parcel.shipper_name,
        parcel.shipper_code,
        parcel.destination,
        parcel.status,
        parcel.weight,
        parcel.type,
        parcel.price,
        parcel.delivery_fees,
        parcel.return_fees,
        parcel.created_date,
        parcel.estimated_delivery_date,
        parcel.actual_delivery_date,
        parcel.shipper_phone,
        parcel.shipper_email,
        parcel.shipper_company
      ].join('\t');
      excelContent += row + '\n';
    });
    
    // Create BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + excelContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `colis_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export page to PDF
  const exportToPDF = async () => {
    try {
      // Get the main content element
      const element = document.getElementById('colis-content');
      if (!element) {
        alert('Erreur: Impossible de trouver le contenu à exporter');
        return;
      }

      // Show loading message
      const loadingMessage = document.createElement('div');
      loadingMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 9999;
        font-size: 16px;
      `;
      loadingMessage.textContent = 'Génération du PDF en cours...';
      document.body.appendChild(loadingMessage);

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove loading message
      document.body.removeChild(loadingMessage);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `colis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert('PDF exporté avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  const columns = [
    { 
      key: "id", 
      header: "N° Colis",
      minWidth: "80px",
      render: (value) => <span className="font-semibold text-blue-600">#{value}</span>
    },
    { 
      key: "tracking_number", 
      header: "N° Suivi",
      minWidth: "120px",
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    { 
      key: "shipper_name", 
      header: "Expéditeur",
      minWidth: "150px",
      render: (value) => <span className="font-medium">{value || '-'}</span>
    },
    { 
      key: "shipper_code", 
      header: "Code Expéditeur",
      minWidth: "120px",
      render: (value) => <span className="text-xs bg-gray-100 px-2 py-1 rounded">{value || '-'}</span>
    },
    { 
      key: "destination", 
      header: "Destination",
      minWidth: "200px",
      render: (value) => <span className="max-w-xs truncate" title={value}>{value || '-'}</span>
    },
    {
      key: "status",
      header: "Statut",
      minWidth: "120px",
      render: (value) => {
        const statusColors = {
          "En attente": "bg-yellow-100 text-yellow-800",
          "Au dépôt": "bg-blue-100 text-blue-800",
          "En cours": "bg-purple-100 text-purple-800",
          "RTN dépot": "bg-orange-100 text-orange-800",
          "Livés": "bg-green-100 text-green-800",
          "Livrés payés": "bg-emerald-100 text-emerald-800",
          "Retour définitif": "bg-red-100 text-red-800",
          "RTN client dépôt": "bg-pink-100 text-pink-800",
          "Retour Expéditeur": "bg-gray-100 text-gray-800",
          "Retour En Cours d'expédition": "bg-indigo-100 text-indigo-800",
          "Retour reçu": "bg-cyan-100 text-cyan-800",
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
            {value || '-'}
          </span>
        );
      },
    },
    { 
      key: "weight", 
      header: "Poids (kg)",
      minWidth: "100px",
      render: (value) => <span className="font-mono">{value ? `${value} kg` : '-'}</span>
    },
    { 
      key: "type", 
      header: "Type",
      minWidth: "100px",
      render: (value) => {
        const typeColors = {
          "Standard": "bg-gray-100 text-gray-700",
          "Express": "bg-blue-100 text-blue-700",
          "Premium": "bg-purple-100 text-purple-700"
        };
        return (
          <span className={`px-2 py-1 text-xs rounded ${typeColors[value] || "bg-gray-100 text-gray-700"}`}>
            {value || '-'}
          </span>
        );
      }
    },
    { 
      key: "price", 
      header: "Prix (DT)",
      minWidth: "100px",
      render: (value) => <span className="font-semibold text-green-600">{value ? `${value} DT` : '-'}</span>
    },
    { 
      key: "delivery_fees", 
      header: "Frais Livraison",
      minWidth: "120px",
      render: (value) => <span className="text-sm">{value ? `${value} DT` : '-'}</span>
    },
    { 
      key: "return_fees", 
      header: "Frais Retour",
      minWidth: "120px",
      render: (value) => <span className="text-sm">{value ? `${value} DT` : '-'}</span>
    },
    { 
      key: "created_date", 
      header: "Date de création",
      minWidth: "120px",
      render: (value) => <span className="text-sm text-gray-600">{value ? new Date(value).toLocaleDateString('fr-FR') : '-'}</span>
    },
    { 
      key: "estimated_delivery_date", 
      header: "Date estimée",
      minWidth: "120px",
      render: (value) => <span className="text-sm text-blue-600">{value ? new Date(value).toLocaleDateString('fr-FR') : '-'}</span>
    },
    { 
      key: "actual_delivery_date", 
      header: "Date réelle",
      minWidth: "120px",
      render: (value) => <span className="text-sm text-green-600">{value ? new Date(value).toLocaleDateString('fr-FR') : '-'}</span>
    },
    { 
      key: "shipper_phone", 
      header: "Téléphone",
      minWidth: "130px",
      render: (value) => <span className="text-sm font-mono">{value || '-'}</span>
    },
    { 
      key: "shipper_email", 
      header: "Email",
      minWidth: "180px",
      render: (value) => <span className="text-sm text-blue-600 truncate max-w-32" title={value}>{value || '-'}</span>
    },
    { 
      key: "shipper_company", 
      header: "Société",
      minWidth: "150px",
      render: (value) => <span className="text-sm truncate max-w-32" title={value}>{value || '-'}</span>
    },
  ];

  // Mock data for parcels (colis)
  const MOCK_PARCELS = [
    {
      id: 92,
      tracking_number: "C-123456",
      shipper_name: "EXPEDITEUR SARL",
      shipper_code: "EXP001",
      destination: "Tunis, Tunisie",
      status: "En cours",
      weight: "0.79",
      type: "Standard",
      price: "11.00",
      delivery_fees: "8.00",
      return_fees: "3.00",
      created_date: "2024-06-13",
      estimated_delivery_date: "2024-06-15",
      actual_delivery_date: null,
      shipper_phone: "+216 20 123 456",
      shipper_email: "contact@expediteur.tn",
      shipper_company: "EXPEDITEUR SARL"
    },
    {
      id: 91,
      tracking_number: "C-654321",
      shipper_name: "EXPEDITEUR SARL",
      shipper_code: "EXP001",
      destination: "Tunis, Tunisie",
      status: "En cours",
      weight: "1.24",
      type: "Express",
      price: "56.00",
      delivery_fees: "45.00",
      return_fees: "11.00",
      created_date: "2024-06-12",
      estimated_delivery_date: "2024-06-14",
      actual_delivery_date: null,
      shipper_phone: "+216 20 123 456",
      shipper_email: "contact@expediteur.tn",
      shipper_company: "EXPEDITEUR SARL"
    },
    {
      id: 90,
      tracking_number: "C-789012",
      shipper_name: "EXPEDITEUR SARL",
      shipper_code: "EXP001",
      destination: "Tunis, Tunisie",
      status: "Livrés",
      weight: "4.13",
      type: "Standard",
      price: "16.00",
      delivery_fees: "12.00",
      return_fees: "4.00",
      created_date: "2024-06-10",
      estimated_delivery_date: "2024-06-12",
      actual_delivery_date: "2024-06-12",
      shipper_phone: "+216 20 123 456",
      shipper_email: "contact@expediteur.tn",
      shipper_company: "EXPEDITEUR SARL"
    },
  ];

  // Memoized filtered data for better performance
  const filteredParcels = useMemo(() => {
    const data = parcelsData && parcelsData.length > 0 ? parcelsData : MOCK_PARCELS;
    
    // Filter by agency for Chef d'agence users
    let agencyFilteredData = data;
    if (currentUser && currentUser.role === 'Chef d\'agence' && userAgency && Object.keys(shippersByAgency).length > 0) {
      console.log('🔍 User is Chef d\'agence, applying agency filtering...');
      console.log('🔍 User agency:', userAgency);
      console.log('🔍 Available shippers in agency:', Object.keys(shippersByAgency));
      
      // Filter parcels to only show those from shippers in the same agency
      agencyFilteredData = data.filter(parcel => {
        // Check if the parcel's shipper is in the user's agency
        // We need to match by shipper ID or shipper name
        const shipperInAgency = Object.values(shippersByAgency).some(agencyShipper => 
          agencyShipper.id === parcel.shipper_id || 
          agencyShipper.name === parcel.shipper_name ||
          agencyShipper.code === parcel.shipper_code
        );
        
        console.log(`🔍 Checking parcel ${parcel.id}: shipper_id=${parcel.shipper_id}, shipper_name=${parcel.shipper_name}, shipper_code=${parcel.shipper_code}, in_agency=${shipperInAgency}`);
        
        return shipperInAgency;
      });
      
      console.log('🔍 Filtered parcels count:', agencyFilteredData.length);
    }
    
    return agencyFilteredData.filter((parcel) => {
      // Recherche simple
      const matchesSearch = searchTerm === "" || 
        Object.values(parcel).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filtres avancés
      const matchesStatus = advancedFilters.status === "" || parcel.status === advancedFilters.status;
      const matchesShipper = advancedFilters.shipper === "" || 
        (parcel.shipper_name && parcel.shipper_name.toLowerCase().includes(advancedFilters.shipper.toLowerCase()));
      const matchesDestination = advancedFilters.destination === "" || 
        (parcel.destination && parcel.destination.toLowerCase().includes(advancedFilters.destination.toLowerCase()));
      
      const matchesDateFrom = advancedFilters.dateFrom === "" || 
        new Date(parcel.created_date) >= new Date(advancedFilters.dateFrom);
      const matchesDateTo = advancedFilters.dateTo === "" || 
        new Date(parcel.created_date) <= new Date(advancedFilters.dateTo);

      return matchesSearch && matchesStatus && matchesShipper && 
             matchesDestination && matchesDateFrom && matchesDateTo;
    });
  }, [parcelsData, searchTerm, advancedFilters, currentUser, userAgency, shippersByAgency]);

  const handleAdd = () => {
    setEditingParcel(null);
    reset();
    setIsModalOpen(true);
  };

  const handleEdit = (parcel) => {
    setEditingParcel(parcel);
    reset(parcel);
    setIsModalOpen(true);
  };

  const handleDelete = (parcel) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce colis ?")) {
      deleteParcelMutation.mutate(parcel.id);
    }
  };

  const onSubmit = (formData) => {
    console.log('📦 Form submission:', { editingParcel, formData });
    
    if (editingParcel) {
      console.log('📦 Updating parcel:', editingParcel.id);
      console.log('📦 Update data:', formData);
      updateParcelMutation.mutate({ id: editingParcel.id, updates: formData });
    } else {
      console.log('📦 Creating new parcel');
      createParcelMutation.mutate(formData);
    }
    setIsModalOpen(false);
  };

  const handleAdvancedFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // For tracking modal
  const [trackingParcel, setTrackingParcel] = useState(null);
  const handleRowClick = (parcel) => {
    setTrackingParcel(parcel);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div id="colis-content" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
                            {currentUser && currentUser.role === 'Chef d\'agence'
                  ? 'Colis de mon Dépôt'
                  : 'Gestion des Colis'
                }
          </h1>
          <p className="text-gray-600">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Gérez les colis de votre dépôt et suivez leur statut'
              : 'Gérez vos colis et suivez leur statut'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>+</span>
            <span>Créer un colis</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Colis</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredParcels.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Livrés</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredParcels.filter(p => p.status === 'delivered' || p.status === 'Livrés' || p.status === 'Livrés payés').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredParcels.filter(p => p.status === 'in_transit' || p.status === 'En cours' || p.status === 'Au dépôt' || p.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatValue(filteredParcels.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0))} DT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Excel
          </button>
          
          <button
            onClick={exportToPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter PDF
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Recherche avancée
          </button>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        {showAdvancedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <select
              name="status"
              value={advancedFilters.status}
              onChange={handleAdvancedFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            
            <input
              type="date"
              name="dateFrom"
              value={advancedFilters.dateFrom}
              onChange={handleAdvancedFilterChange}
              placeholder="Date de début"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
            <input
              type="date"
              name="dateTo"
              value={advancedFilters.dateTo}
              onChange={handleAdvancedFilterChange}
              placeholder="Date de fin"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
            <input
              type="text"
              name="shipper"
              value={advancedFilters.shipper}
              onChange={handleAdvancedFilterChange}
              placeholder="Expéditeur"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
            <input
              type="text"
              name="destination"
              value={advancedFilters.destination}
              onChange={handleAdvancedFilterChange}
              placeholder="Destination"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
            </div>

      {/* Data Table */}
      <DataTable
        data={filteredParcels}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showActions={canEdit}
        onRowClick={handleRowClick}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canEdit ? handleDelete : undefined}
      />

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-700">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} colis
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {pagination.page} sur {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      <Modal isOpen={!!trackingParcel} onClose={() => setTrackingParcel(null)} size="xl">
        {trackingParcel && <ColisTimeline parcel={trackingParcel} onClose={() => setTrackingParcel(null)} />}
      </Modal>

      {/* Parcel Details */}
      {selectedParcel && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Détails du colis {selectedParcel.id}</h3>
            <button
              onClick={() => setSelectedParcel(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <ColisTimeline parcel={selectedParcel} />
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingParcel ? 'Modifier le colis' : 'Créer un nouveau colis'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de suivi
                </label>
                <input
                  {...register("tracking_number", { required: "Le numéro de suivi est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: C-123456"
                />
                {errors.tracking_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.tracking_number.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Expéditeur
                </label>
                <input
                  {...register("shipper_id")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'expéditeur
                </label>
                <input
                  {...register("shipper_name")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nom de l'expéditeur"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  {...register("destination", { required: "La destination est requise" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: Tunis, Tunisie"
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone expéditeur
                </label>
                <input
                  {...register("shipper_phone")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: +216 20 123 456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email expéditeur
                </label>
                <input
                  {...register("shipper_email")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Société expéditeur
                </label>
                <input
                  {...register("shipper_company")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: Ma Société SARL"
                />
              </div>
              

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("weight", { required: "Le poids est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 2.5"
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price", { required: "Le prix est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 15.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais de livraison (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("delivery_fees")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 8.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais de retour (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("return_fees")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 3.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de livraison estimée
                </label>
                <input
                  type="date"
                  {...register("estimated_delivery_date")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'article
                </label>
                <input
                  {...register("article_name")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: Livraison"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note/Remarque
                </label>
                <input
                  {...register("remark")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: Livraison"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de pièces
                </label>
                <input
                  type="number"
                  {...register("nb_pieces")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du destinataire
                </label>
                <input
                  {...register("recipient_name")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: Client Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone destinataire
                </label>
                <input
                  {...register("recipient_phone")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: +216 20 123 456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse destinataire
                </label>
                <input
                  {...register("recipient_address")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 123 Rue Example, Ville"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  {...register("status", { required: "Le statut est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingParcel ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="xxl">
        <ColisCreate onClose={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Colis; 
