import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import ColisTimeline from "./common/ColisTimeline";
import ColisCreate from "./ColisCreate";
import BonLivraisonColis from "./BonLivraisonColis";
import { useParcels, useCreateParcel, useUpdateParcel, useDeleteParcel } from "../../hooks/useApi";
import { useAppStore } from "../../stores/useAppStore";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from 'jspdf';
import { apiService } from "../../services/api";

const ColisClient = () => {
  const navigate = useNavigate();
  const { parcels, loading, selectedParcel, setSelectedParcel } = useAppStore();
  const { data: parcelsData, isLoading } = useParcels();

  // Get current user
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });

  // State for real parcel data
  const [realParcelsData, setRealParcelsData] = useState([]);
  const [loadingParcels, setLoadingParcels] = useState(true);
  const [error, setError] = useState(null);

  // Status mapping function
  const mapStatusToFrench = (status) => {
    const statusMap = {
      'pending': 'En attente',
      'to_pickup': 'À enlever',
      'picked_up': 'Enlevé',
      'at_warehouse': 'Au dépôt',
      'in_transit': 'En cours',
      'return_to_warehouse': 'RTN dépôt',
      'delivered': 'Livrés',
      'delivered_paid': 'Livrés payés',
      'definitive_return': 'Retour définitif',
      'return_to_client_agency': 'RTN client dépôt',
      'return_to_sender': 'Retour Expéditeur',
      'return_in_transit': 'Retour En Cours',
      'return_received': 'Retour reçu'
    };
    return statusMap[status] || status;
  };

  // Fetch real parcel data for the logged-in expéditeur
  useEffect(() => {
    const fetchParcels = async () => {
      try {
        setLoadingParcels(true);
        setError(null);
        
        if (currentUser && currentUser.email) {
          console.log('Fetching parcels for user:', currentUser.email);
          
          // Use the new expediteur-specific API endpoint
          const userParcels = await apiService.getExpediteurParcels(currentUser.email);
          console.log('User parcels received:', userParcels);
          
          // Transform the data to match the expected format
          const transformedParcels = userParcels.map(parcel => ({
            id: parcel.id, // Keep the original database ID
            tracking_number: parcel.tracking_number || parcel.id, // Use tracking number for display
            shipper: parcel.shipper_name || currentUser.name || "Expéditeur",
            destination: parcel.destination || "Adresse non spécifiée",
            status: mapStatusToFrench(parcel.status) || "En attente",
            weight: `${parcel.weight || 0} kg`,
            dateCreated: parcel.created_at ? new Date(parcel.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            estimatedDelivery: parcel.estimated_delivery_date ? new Date(parcel.estimated_delivery_date).toISOString().split('T')[0] : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            price: `${parseFloat(parcel.price || 0).toFixed(2)} DT`,
            phone: parcel.shipper_phone || "N/A",
            email: parcel.shipper_email || "N/A",
            reference: parcel.tracking_number || parcel.id,
            description: parcel.type || "Colis standard",
            // Add client code for delivery verification
            client_code: parcel.client_code || "N/A",
            // Add shipper city information for timeline
            shipper_city: parcel.shipper_city || currentUser.governorate || "Tunis",
            // Keep original parcel data for timeline
            created_at: parcel.created_at,
            type: parcel.type
          }));
          
          console.log('Transformed parcels:', transformedParcels);
          setRealParcelsData(transformedParcels);
        } else {
          console.log('No current user found');
          setRealParcelsData([]);
        }
      } catch (error) {
        console.error('Error fetching parcels:', error);
        setError('Erreur lors du chargement des colis');
        setRealParcelsData([]);
      } finally {
        setLoadingParcels(false);
      }
    };

    fetchParcels();
  }, [currentUser]);

  // Use real data instead of mock data
  const parcelsToDisplay = realParcelsData;

  // Calculate statistics from real data
  const statistics = useMemo(() => {
    const total = parcelsToDisplay.length;
    const statusCounts = parcelsToDisplay.reduce((acc, parcel) => {
      acc[parcel.status] = (acc[parcel.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      "En attente": statusCounts["En attente"] || statusCounts["pending"] || 0,
      "À enlever": statusCounts["À enlever"] || statusCounts["to_pickup"] || 0,
      "Enlevé": statusCounts["Enlevé"] || statusCounts["picked_up"] || 0,
      "Au dépôt": statusCounts["Au dépôt"] || statusCounts["at_warehouse"] || 0,
      "En cours": statusCounts["En cours"] || statusCounts["in_transit"] || 0,
      "RTN dépôt": statusCounts["RTN dépôt"] || statusCounts["return_to_warehouse"] || 0,
      "Livrés": statusCounts["Livrés"] || statusCounts["delivered"] || 0,
      "Livrés payés": statusCounts["Livrés payés"] || statusCounts["delivered_paid"] || 0,
      "Retour définitif": statusCounts["Retour définitif"] || statusCounts["definitive_return"] || 0,
      "RTN client dépôt": statusCounts["RTN client dépôt"] || statusCounts["return_to_client_agency"] || 0,
      "Retour Expéditeur": statusCounts["Retour Expéditeur"] || statusCounts["return_to_sender"] || 0,
      "Retour En Cours": statusCounts["Retour En Cours"] || statusCounts["return_in_transit"] || 0,
      "Retour reçu": statusCounts["Retour reçu"] || statusCounts["return_received"] || 0,
    };
  }, [parcelsToDisplay]);

  const createParcelMutation = useCreateParcel();
  const updateParcelMutation = useUpdateParcel();
  const deleteParcelMutation = useDeleteParcel();

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
  const [statusModal, setStatusModal] = useState({ open: false, status: null, parcels: [] });
  const [factureColis, setFactureColis] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [parcelsPerPage] = useState(10);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const statusOptions = [
    "En attente",
    "À enlever",
    "Enlevé",
    "Au dépôt",
    "En cours",
    "RTN dépôt",
    "Livrés",
    "Livrés payés",
    "Retour définitif",
          "RTN client dépôt",
    "Retour Expéditeur",
    "Retour En Cours d'expédition",
    "Retour reçu",
  ];

  const statusColors = {
    "En attente": "bg-yellow-100 text-yellow-800",
    "À enlever": "bg-orange-100 text-orange-800",
    "Enlevé": "bg-blue-100 text-blue-800",
    "Au dépôt": "bg-indigo-100 text-indigo-800",
    "En cours": "bg-purple-100 text-purple-800",
    "RTN dépôt": "bg-pink-100 text-pink-800",
    "Livrés": "bg-green-100 text-green-800",
    "Livrés payés": "bg-emerald-100 text-emerald-800",
    "Retour définitif": "bg-red-100 text-red-800",
          "RTN client dépôt": "bg-rose-100 text-rose-800",
    "Retour Expéditeur": "bg-gray-100 text-gray-800",
    "Retour En Cours d'expédition": "bg-violet-100 text-violet-800",
    "Retour reçu": "bg-cyan-100 text-cyan-800",
  };

  const columns = [
    { key: "tracking_number", label: "N° Colis" },
    { key: "shipper", label: "Expéditeur" },
    { key: "destination", label: "Destination" },
    {
      key: "status",
      label: "Statut",
      render: (value) => {
            const statusColors = {
      "En attente": "bg-yellow-100 text-yellow-800",
      "À enlever": "bg-orange-100 text-orange-800",
      "Enlevé": "bg-blue-100 text-blue-800",
      "Au dépôt": "bg-indigo-100 text-indigo-800",
      "En cours": "bg-purple-100 text-purple-800",
      "RTN dépôt": "bg-pink-100 text-pink-800",
      "Livrés": "bg-green-100 text-green-800",
      "Livrés payés": "bg-emerald-100 text-emerald-800",
      "Retour définitif": "bg-red-100 text-red-800",
      "RTN client dépôt": "bg-rose-100 text-rose-800",
      "Retour Expéditeur": "bg-gray-100 text-gray-800",
      "Retour En Cours d'expédition": "bg-violet-100 text-violet-800",
      "Retour reçu": "bg-cyan-100 text-cyan-800",
    };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
            {value}
          </span>
        );
      },
    },
    { key: "weight", label: "Poids" },
    { key: "dateCreated", label: "Date de création" },
    { key: "estimatedDelivery", label: "Date de livraison estimée" },
    { key: "price", label: "Prix" },
    { 
      key: "client_code", 
      label: "Code Client",
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full font-mono">
          {value}
        </span>
      )
    },
  ];

  // Memoized filtered data for better performance
  const filteredParcels = useMemo(() => {
    // Use real data from API
    const dataToUse = parcelsToDisplay;
    
    console.log('🔍 Filtering parcels:', {
      totalParcels: dataToUse.length,
      searchTerm,
      advancedFilters,
      sampleParcel: dataToUse[0]
    });
    
    const filtered = dataToUse.filter((parcel) => {
      // Recherche simple
      const matchesSearch = searchTerm === "" || 
        Object.values(parcel).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filtres avancés
      const matchesStatus = advancedFilters.status === "" || parcel.status === advancedFilters.status;
      const matchesShipper = advancedFilters.shipper === "" || 
        parcel.shipper.toLowerCase().includes(advancedFilters.shipper.toLowerCase());
      const matchesDestination = advancedFilters.destination === "" || 
        parcel.destination.toLowerCase().includes(advancedFilters.destination.toLowerCase());
      
      const matchesDateFrom = advancedFilters.dateFrom === "" || 
        new Date(parcel.dateCreated) >= new Date(advancedFilters.dateFrom);
      const matchesDateTo = advancedFilters.dateTo === "" || 
        new Date(parcel.dateCreated) <= new Date(advancedFilters.dateTo);

      return matchesSearch && matchesStatus && matchesShipper && 
             matchesDestination && matchesDateFrom && matchesDateTo;
    });
    
    console.log('✅ Filtered parcels:', {
      filteredCount: filtered.length,
      sampleFiltered: filtered[0]
    });
    
    return filtered;
  }, [parcelsToDisplay, searchTerm, advancedFilters]);

  // Pagination logic
  const indexOfLastParcel = currentPage * parcelsPerPage;
  const indexOfFirstParcel = indexOfLastParcel - parcelsPerPage;
  const currentParcels = filteredParcels.slice(indexOfFirstParcel, indexOfLastParcel);
  const totalPages = Math.ceil(filteredParcels.length / parcelsPerPage);
  
  console.log('📄 Pagination:', {
    currentPage,
    parcelsPerPage,
    indexOfFirstParcel,
    indexOfLastParcel,
    totalPages,
    currentParcelsCount: currentParcels.length,
    sampleCurrentParcel: currentParcels[0]
  });

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, advancedFilters]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate detailed statistics for each status
  const statusStatistics = {
    "En attente": filteredParcels.filter(p => p.status === "En attente").length,
    "À enlever": filteredParcels.filter(p => p.status === "À enlever").length,
    "Enlevé": filteredParcels.filter(p => p.status === "Enlevé").length,
    "Au dépôt": filteredParcels.filter(p => p.status === "Au dépôt").length,
    "En cours": filteredParcels.filter(p => p.status === "En cours").length,
    "RTN dépôt": filteredParcels.filter(p => p.status === "RTN dépôt").length,
    "Livrés": filteredParcels.filter(p => p.status === "Livrés").length,
    "Livrés payés": filteredParcels.filter(p => p.status === "Livrés payés").length,
    "Retour définitif": filteredParcels.filter(p => p.status === "Retour définitif").length,
          "RTN client dépôt": filteredParcels.filter(p => p.status === "RTN client dépôt").length,
    "Retour Expéditeur": filteredParcels.filter(p => p.status === "Retour Expéditeur").length,
    "Retour En Cours d'expédition": filteredParcels.filter(p => p.status === "Retour En Cours d'expédition").length,
    "Retour reçu": filteredParcels.filter(p => p.status === "Retour reçu").length,
  };

  const totalParcels = filteredParcels.length;

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
    if (editingParcel) {
      updateParcelMutation.mutate({ id: editingParcel.id, updates: formData });
    } else {
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

  const handleRowClick = (parcel) => {
    setSelectedParcel(selectedParcel?.id === parcel.id ? null : parcel);
  };

  const handleStatusCardClick = (status) => {
    const parcelsInStatus = filteredParcels.filter(p => p.status === status);
    setStatusModal({ open: true, status, parcels: parcelsInStatus });
  };

  const handleViewInvoice = (parcel) => {
    // Use the parcel ID to fetch real data
    setFactureColis(parcel);
  };

  const handleViewDeliveryNote = (parcel) => {
    // Navigate to the delivery note page with the parcel ID
    navigate(`/bon-livraison/${parcel.id}`);
  };

  // Données réelles pour le bon de livraison
  const getBonLivraisonData = (parcel) => {
    console.log('🔍 getBonLivraisonData called with parcel:', parcel);
    
    // Get current user for expéditeur information
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    console.log('🔍 Current user:', currentUser);
    
    // Mock data for the specific parcels you provided
    const mockData = {
      'C-487315': {
        expediteur: {
          nom: 'Ritej Chaieb',
          adresse: 'Mahdia',
          tel: '27107374',
          nif: 'N/A'
        },
        destinataire: {
          nom: 'Nour',
          adresse: 'korba ,Nabeul',
          tel: '90401638'
        },
        route: 'Mahdia >> ---- Dispatch ---- >> Nabeul',
        designation: 'Zina Wear coli 1',
        instructions: 'Zina Wear coli 1'
      },
      'C-487316': {
        expediteur: {
          nom: 'Ritej Chaieb',
          adresse: 'Mahdia',
          tel: '27107374',
          nif: 'N/A'
        },
        destinataire: {
          nom: 'sana',
          adresse: 'Msaken , Sousse',
          tel: '28615601'
        },
        route: 'Mahdia >> ---- Dispatch ---- >> Sousse',
        designation: 'Zina Wear coli 2',
        instructions: 'Zina Wear coli 2'
      },
      'C-487317': {
        expediteur: {
          nom: 'Ritej Chaieb',
          adresse: 'Mahdia',
          tel: '27107374',
          nif: 'N/A'
        },
        destinataire: {
          nom: 'achref',
          adresse: 'hajeb layoun , kairauan',
          tel: '25598659'
        },
        route: 'Mahdia >> ---- Dispatch ---- >> Kairouan',
        designation: 'Zina Wear coli 3',
        instructions: 'Zina Wear coli 3'
      }
    };
    
    // Check if we have mock data for this parcel
    const mockParcelData = mockData[parcel.tracking_number];
    
    if (mockParcelData) {
      console.log('🎯 Using mock data for parcel:', parcel.tracking_number);
      const bonLivraisonData = {
        colis: {
          code: parcel.tracking_number || parcel.id,
          nom: mockParcelData.designation || "Colis",
          adresse: parcel.destination,
          poids: parcel.weight,
        },
        expediteur: mockParcelData.expediteur,
        destinataire: mockParcelData.destinataire,
        route: mockParcelData.route,
        date: parcel.dateCreated || parcel.created_at || new Date().toISOString().split('T')[0],
        docNumber: parcel.tracking_number || parcel.id,
        instructions: mockParcelData.instructions || "Colis standard",
        montant: parcel.price ? `${parseFloat(parcel.price).toFixed(2)} DT` : "0.00 DT",
        tva: "0.00 DT",
        quantite: 1,
        designation: mockParcelData.designation || "Colis",
        pageCount: 1,
        pageIndex: 1,
      };
      
      console.log('📋 Generated bon de livraison data with mock data:', bonLivraisonData);
      return bonLivraisonData;
    }
    
    // Fallback to original logic for other parcels
    console.log('🔄 Using fallback logic for parcel:', parcel.tracking_number);
    
    // Extract governorates from destination (format: "Client Name - address, Governorate")
    const destinationParts = parcel.destination?.split(', ') || [];
    const destinationGovernorate = destinationParts[destinationParts.length - 1] || "Tunis";
    
    // Get origin governorate (expéditeur's city)
    const originGovernorate = parcel.shipper_company_governorate || parcel.shipper_city || "Tunis";
    
    // Create route: Origin >> ---- Dispatch ---- >> Destination
    const route = `${originGovernorate} >> ---- Dispatch ---- >> ${destinationGovernorate}`;
    
    const bonLivraisonData = {
      colis: {
        code: parcel.tracking_number || parcel.id,
        nom: parcel.description || parcel.articleNom || "Colis",
        adresse: parcel.destination,
        poids: parcel.weight,
      },
      expediteur: {
        nom: parcel.shipper_name || currentUser?.name || "Expéditeur",
        adresse: parcel.shipper_company_governorate || parcel.shipper_city || "Tunis",
        tel: parcel.shipper_phone || currentUser?.phone || "N/A",
        nif: parcel.shipper_fiscal_number || parcel.shipper_tax_number || currentUser?.fiscalNumber || "N/A",
      },
      destinataire: {
        nom: parcel.recipient_name || destinationParts[0] || parcel.clientNom || parcel.shipper || "Client",
        adresse: parcel.recipient_address || parcel.clientAdresse || parcel.destination,
        tel: parcel.recipient_phone || parcel.clientTel || parcel.clientTel2 || "N/A",
      },
      route: route,
      date: parcel.dateCreated || parcel.created_at || new Date().toISOString().split('T')[0],
      docNumber: parcel.tracking_number || parcel.id,
      instructions: parcel.description || parcel.remarque || "Colis standard",
      montant: parcel.price ? `${parseFloat(parcel.price).toFixed(2)} DT` : "0.00 DT",
      tva: "0.00 DT", // Calculate based on price if needed
      quantite: 1,
      designation: parcel.description || parcel.articleNom || "Colis",
      pageCount: 1,
      pageIndex: 1,
    };
    
    console.log('📋 Generated bon de livraison data with fallback:', bonLivraisonData);
    return bonLivraisonData;
  };

  const exportToExcel = () => {
    try {
      if (!statusModal.parcels.length) {
        alert('❌ Aucun colis à exporter pour ce statut');
        return;
      }
      
      // Prepare data for Excel export
      const excelData = statusModal.parcels.map(p => ({
        'N° Colis': p.id || '',
        'N° Suivi': p.tracking_number || p.id || '',
        'Expéditeur': p.shipper || '',
        'Destination': p.destination || '',
        'Statut': p.status || '',
        'Poids (kg)': p.weight ? p.weight.replace(' kg', '') : '',
        'Date de création': p.dateCreated || '',
        'Date de livraison estimée': p.estimatedDelivery || '',
        'Prix (DT)': p.price ? p.price.replace(' DT', '') : '',
        'Téléphone': p.phone || '',
        'Email': p.email || '',
        'Référence': p.reference || '',
        'Description': p.description || '',
        'Code Client': p.client_code || ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Add header styling (bold headers)
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      }

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // N° Colis
        { wch: 15 },  // N° Suivi
        { wch: 20 },  // Expéditeur
        { wch: 30 },  // Destination
        { wch: 12 },  // Statut
        { wch: 10 },  // Poids (kg)
        { wch: 12 },  // Date de création
        { wch: 12 },  // Date de livraison estimée
        { wch: 12 },  // Prix (DT)
        { wch: 15 },  // Téléphone
        { wch: 25 },  // Email
        { wch: 15 },  // Référence
        { wch: 20 },  // Description
        { wch: 15 }   // Code Client
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, `Colis_${statusModal.status}`);

      // Create summary worksheet
      const summaryData = [
        { 'Statistique': 'Statut', 'Valeur': statusModal.status },
        { 'Statistique': 'Nombre de colis', 'Valeur': excelData.length },
        { 'Statistique': 'Valeur totale (DT)', 'Valeur': excelData.reduce((sum, p) => sum + (parseFloat(p['Prix (DT)']) || 0), 0).toFixed(2) },
        { 'Statistique': 'Date d\'export', 'Valeur': new Date().toLocaleString('fr-FR') },
        { 'Statistique': 'Expéditeur', 'Valeur': currentUser?.name || currentUser?.email || 'Non spécifié' }
      ];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Résumé');

      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Colis_${statusModal.status}_${currentUser?.name || 'Client'}_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      // Show success message
      alert(`✅ Export Excel réussi!\n\nFichier: ${filename}\n\nNombre de colis exportés: ${excelData.length}\n\nStatut: ${statusModal.status}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel. Veuillez réessayer.');
    }
  };

  // Function to export to PDF
  const exportToPDF = async () => {
    try {
      if (!statusModal.parcels.length) {
        alert('❌ Aucun colis à exporter pour ce statut');
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

      // Create PDF document
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table fit
      
      // Set font
      pdf.setFont('helvetica');
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rapport des Colis - ${statusModal.status}`, 14, 20);
      
      // Add export info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date d'export: ${new Date().toLocaleString('fr-FR')}`, 14, 30);
      pdf.text(`Expéditeur: ${currentUser?.name || currentUser?.email || 'Non spécifié'}`, 14, 35);
      pdf.text(`Nombre de colis: ${statusModal.parcels.length}`, 14, 40);
      pdf.text(`Statut: ${statusModal.status}`, 14, 45);
      
      // Calculate total value
      const totalValue = statusModal.parcels.reduce((sum, p) => {
        const price = parseFloat(p.price?.replace(' DT', '') || 0);
        return sum + price;
      }, 0);
      
      pdf.text(`Valeur totale: ${totalValue.toFixed(2)} DT`, 14, 50);
      
      // Define table headers
      const headers = [
        'N° Colis',
        'Expéditeur',
        'Destination',
        'Poids',
        'Date création',
        'Prix (DT)',
        'Référence'
      ];
      
      // Calculate column widths (landscape A4: 297mm width, 14mm margins = 269mm available)
      const colWidths = [
        20, // N° Colis
        35, // Expéditeur
        40, // Destination
        20, // Poids
        25, // Date création
        25, // Prix (DT)
        30  // Référence
      ];
      
      // Starting position
      let y = 65;
      const startX = 14;
      
      // Draw table header
      pdf.setFillColor(200, 200, 200);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      
      let x = startX;
      headers.forEach((header, index) => {
        pdf.rect(x, y, colWidths[index], 8, 'F');
        pdf.text(header, x + 2, y + 5);
        x += colWidths[index];
      });
      
      // Draw table data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      let rowCount = 0;
      const maxRowsPerPage = 20; // Adjust based on font size and row height
      
      statusModal.parcels.forEach((parcel, index) => {
        // Check if we need a new page
        if (rowCount >= maxRowsPerPage) {
          pdf.addPage();
          y = 20; // Reset Y position for new page
          rowCount = 0;
          
          // Redraw header on new page
          pdf.setFillColor(200, 200, 200);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          x = startX;
          headers.forEach((header, headerIndex) => {
            pdf.rect(x, y, colWidths[headerIndex], 8, 'F');
            pdf.text(header, x + 2, y + 5);
            x += colWidths[headerIndex];
          });
          y += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
        }
        
        y += 6; // Row height
        rowCount++;
        
        // Draw row data
        x = startX;
        
        // N° Colis
        pdf.text(parcel.id?.toString() || '', x + 1, y);
        x += colWidths[0];
        
        // Expéditeur
        const shipperName = parcel.shipper || '';
        pdf.text(shipperName.length > 25 ? shipperName.substring(0, 22) + '...' : shipperName, x + 1, y);
        x += colWidths[1];
        
        // Destination
        const destination = parcel.destination || '';
        pdf.text(destination.length > 30 ? destination.substring(0, 27) + '...' : destination, x + 1, y);
        x += colWidths[2];
        
        // Poids
        const weight = parcel.weight?.replace(' kg', '') || '';
        pdf.text(weight, x + 1, y);
        x += colWidths[3];
        
        // Date création
        pdf.text(parcel.dateCreated || '', x + 1, y);
        x += colWidths[4];
        
        // Prix (DT)
        const price = parcel.price?.replace(' DT', '') || '';
        pdf.text(price, x + 1, y);
        x += colWidths[5];
        
        // Référence
        const reference = parcel.reference || '';
        pdf.text(reference.length > 20 ? reference.substring(0, 17) + '...' : reference, x + 1, y);
      });
      
      // Add summary page at the end
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Résumé des Colis', 14, 20);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Statut: ${statusModal.status}`, 14, 40);
      pdf.text(`Nombre de colis: ${statusModal.parcels.length}`, 14, 50);
      pdf.text(`Valeur totale: ${totalValue.toFixed(2)} DT`, 14, 60);
      pdf.text(`Date d'export: ${new Date().toLocaleString('fr-FR')}`, 14, 70);
      pdf.text(`Expéditeur: ${currentUser?.name || currentUser?.email || 'Non spécifié'}`, 14, 80);
      
      // Remove loading message
      document.body.removeChild(loadingMessage);
      
      // Save the PDF
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Colis_${statusModal.status}_${currentUser?.name || 'Client'}_${currentDate}.pdf`;
      pdf.save(filename);
      
      // Show success message
      alert(`✅ Export PDF réussi!\n\nFichier: ${filename}\n\nNombre de colis exportés: ${statusModal.parcels.length}\n\nStatut: ${statusModal.status}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export PDF:', error);
      alert('❌ Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  if (loadingParcels) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos colis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Colis</h1>
          <p className="text-gray-600">Suivez et gérez vos colis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-semibold">Nouveau Colis</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-blue-600">{statistics.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("En attente")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">En attente</p>
              <p className="text-xl font-bold text-yellow-600">{statistics["En attente"]}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("À enlever")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">À enlever</p>
              <p className="text-xl font-bold text-orange-600">{statistics["À enlever"]}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-full">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Enlevé")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Enlevé</p>
              <p className="text-xl font-bold text-blue-600">{statistics["Enlevé"]}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Au dépôt")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Au dépôt</p>
              <p className="text-xl font-bold text-indigo-600">{statistics["Au dépôt"]}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-full">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("En cours")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">En cours</p>
              <p className="text-xl font-bold text-purple-600">{statistics["En cours"]}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("RTN dépôt")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">RTN dépôt</p>
              <p className="text-xl font-bold text-pink-600">{statistics["RTN dépôt"]}</p>
            </div>
            <div className="p-2 bg-pink-100 rounded-full">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Livrés")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Livrés</p>
              <p className="text-xl font-bold text-green-600">{statistics["Livrés"]}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Livrés payés")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Livrés payés</p>
              <p className="text-xl font-bold text-emerald-600">{statistics["Livrés payés"]}</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-full">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Retour définitif")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Retour définitif</p>
              <p className="text-xl font-bold text-red-600">{statistics["Retour définitif"]}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
                          onClick={() => handleStatusCardClick("RTN client dépôt")}
        >
          <div className="flex items-center justify-between">
            <div>
                              <p className="text-xs font-medium text-gray-600">RTN client dépôt</p>
                <p className="text-xl font-bold text-pink-600">{statistics["RTN client dépôt"]}</p>
            </div>
            <div className="p-2 bg-pink-100 rounded-full">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Retour Expéditeur")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Retour Expéditeur</p>
              <p className="text-xl font-bold text-gray-600">{statistics["Retour Expéditeur"]}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Retour En Cours")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Retour En Cours</p>
              <p className="text-xl font-bold text-indigo-600">{statistics["Retour En Cours"]}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-full">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleStatusCardClick("Retour reçu")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Retour reçu</p>
              <p className="text-xl font-bold text-cyan-600">{statistics["Retour reçu"]}</p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-full">
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recherche avancée</h3>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showAdvancedSearch ? "Masquer" : "Afficher"}
          </button>
        </div>
        
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
      {console.log('🎯 DataTable props:', {
        dataLength: currentParcels.length,
        sampleData: currentParcels[0],
        columns: columns.length
      })}
      <DataTable
        data={currentParcels}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {indexOfFirstParcel + 1} à {Math.min(indexOfLastParcel, filteredParcels.length)} sur {filteredParcels.length} colis
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

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
            {editingParcel ? "Modifier le colis" : "Ajouter un colis"}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expéditeur
                </label>
                <input
                  {...register("shipper", { required: "L'expéditeur est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.shipper && (
                  <p className="text-red-500 text-sm mt-1">{errors.shipper.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  {...register("destination", { required: "La destination est requise" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids
                </label>
                <input
                  {...register("weight", { required: "Le poids est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de livraison estimée
                </label>
                <input
                  type="date"
                  {...register("estimatedDelivery", { required: "La date de livraison est requise" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.estimatedDelivery && (
                  <p className="text-red-500 text-sm mt-1">{errors.estimatedDelivery.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix
                </label>
                <input
                  {...register("price", { required: "Le prix est requis" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
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
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createParcelMutation.isPending || updateParcelMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createParcelMutation.isPending || updateParcelMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="full">
        <div className="p-0">
        <ColisCreate onClose={() => setIsCreateModalOpen(false)} />
        </div>
      </Modal>

      {/* Status Details Modal */}
      <Modal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, status: null, parcels: [] })}
        title={`Colis - ${statusModal.status}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter Excel
            </button>
            <button
              onClick={exportToPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter PDF
            </button>
            <button
              onClick={() => setStatusModal({ open: false, status: null, parcels: [] })}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Fermer
            </button>
          </div>

          {/* Parcels Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">N° Colis</th>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">Expéditeur</th>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">Poids</th>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">Date de création</th>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statusModal.parcels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Aucun colis pour ce statut
                    </td>
                  </tr>
                ) : (
                  statusModal.parcels.map((parcel) => (
                    <tr key={parcel.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {parcel.id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {parcel.shipper}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {parcel.destination}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {parcel.weight}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {parcel.dateCreated}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {parcel.price}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleRowClick(parcel)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            title="Voir les détails"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleViewInvoice(parcel)}
                            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                            title="Voir la facture"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Bon de Livraison Modal */}
      <Modal
        isOpen={!!factureColis}
        onClose={() => setFactureColis(null)}
        title="Bon de Livraison"
        size="xl"
      >
        {factureColis && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Debug Info:</strong> Parcel ID: {factureColis.id}, 
                Tracking Number: {factureColis.tracking_number || 'N/A'}
              </p>
            </div>
            <BonLivraisonColis parcelId={factureColis.id} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ColisClient; 
