import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import html2pdf from "html2pdf.js";
import { apiService, warehousesService } from "../../services/api";

const mockDrivers = [
  { id: 1, name: "Pierre Dubois", phone: "+33 1 23 45 67 89" },
  { id: 2, name: "Sarah Ahmed", phone: "+33 1 98 76 54 32" },
  { id: 3, name: "Mohamed Ali", phone: "+33 1 11 22 33 44" },
];

const Expediteur = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current user to check role
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });
  
  // Check if user is Commercial (read-only access)
  const isCommercialUser = currentUser?.role === 'Commercial';

  const [shippers, setShippers] = useState([]);
  const [commercials, setCommercials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Governorates data
  const governorates = [
    "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", 
    "Bizerte", "Béja", "Jendouba", "Kef", "Siliana", "Sousse", 
    "Monastir", "Mahdia", "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", 
    "Gabès", "Medenine", "Tataouine", "Gafsa", "Tozeur", "Kebili"
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShipper, setEditingShipper] = useState(null);
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [shipperDetails, setShipperDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    minCommission: "",
    maxCommission: "",
    successRate: ""
  });
  const detailRef = useRef();
  
  // Search states for parcel and payment history
  const [colisSearchTerm, setColisSearchTerm] = useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  
  // États pour les modals CRUD des colis et paiements
  const [isColisModalOpen, setIsColisModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingColis, setEditingColis] = useState(null);

  // Check if we should open add modal from dashboard navigation
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch shippers, commercials, and warehouses data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        console.log('🔍 Current user:', user);
        console.log('🔍 User role:', user?.role);
        console.log('🔍 User email:', user?.email);
        
        // Fetch commercials for dropdown
        const commercialsData = await apiService.getCommercials();
        console.log('Commercials data:', commercialsData);
        setCommercials(commercialsData || []);
        
        // Fetch warehouses for dropdown
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
        
        // Fetch shippers based on user role
        let shippersData = [];
        
        if (isCommercialUser) {
          // For commercial users, get only their shippers
          const commercial = commercialsData.find(c => c.email === currentUser.email);
          if (commercial) {
            shippersData = await apiService.getShippersByCommercial(commercial.id);
            console.log('Commercial shippers data:', shippersData);
          } else {
            console.error('Commercial not found for user:', currentUser.email);
            shippersData = [];
          }
        } else if (user && user.role === 'Chef d\'agence') {
          // For Chef d'agence, get all shippers first, then filter by agency
          console.log('🔍 User is Chef d\'agence, applying filtering...');
          shippersData = await apiService.getShippers();
          console.log('🔍 All shippers data before filtering:', shippersData);
          
          // Get the user's agency from the agency_managers table
          try {
            console.log('🔍 Fetching agency managers for filtering...');
            const agencyManagerResponse = await apiService.getAgencyManagers();
            console.log('🔍 All agency managers response:', agencyManagerResponse);
            
            const agencyManager = agencyManagerResponse.find(am => am.email === user.email);
            console.log('🔍 Looking for agency manager with email:', user.email);
            console.log('🔍 Found agency manager:', agencyManager);
            
            if (agencyManager) {
              console.log('🔍 Agency manager found:', agencyManager);
              console.log('🔍 Agency manager agency:', agencyManager.agency);
              
              // Filter shippers by agency
              shippersData = shippersData.filter(shipper => {
                console.log(`🔍 Checking shipper ${shipper.name}: shipper.agency="${shipper.agency}" vs agencyManager.agency="${agencyManager.agency}"`);
                const matches = shipper.agency === agencyManager.agency;
                console.log(`🔍 Match result: ${matches}`);
                return matches;
              });
              console.log('🔍 Filtered shippers count:', shippersData.length);
              console.log('🔍 Filtered shippers:', shippersData);
            } else {
              console.log('⚠️ Agency manager not found for user:', user.email);
            }
          } catch (error) {
            console.error('❌ Error fetching agency manager data:', error);
          }
        } else {
          // For admin users, get all shippers
          shippersData = await apiService.getShippers();
          console.log('All shippers data:', shippersData);
        }
        
        setShippers(shippersData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isCommercialUser]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [colisFormData, setColisFormData] = useState({
    destination: "",
    type: "Standard",
    weight: "",
    status: "En attente",
    amount: "",
  });
  const [paymentFormData, setPaymentFormData] = useState({
    reference: "",
    method: "Carte bancaire",
    status: "En attente",
    amount: "",
  });
  
  const [formData, setFormData] = useState({
    // Form type selection
    formType: "individual", // "individual" or "company"
    
    // Common fields
    code: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    governorate: "",
    address: "",
    agency_id: "",
    commercial_id: "",
    delivery_fees: 8,
    return_fees: 0,
    status: "Actif",
    
    // Individual fields
    identity_number: "",
    id_document: null,
    page_name: "",
    
    // Company fields
    company_name: "",
    fiscal_number: "",
    company_address: "",
    company_governorate: "",
    company_documents: null,
  });

  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Nom" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Téléphone" },
    { 
      key: "company", 
      header: "Entreprise",
      render: (value, row) => {
        // For individual expediteurs, show page_name in the Entreprise column
        if (row.page_name) {
          return row.page_name;
        }
        // For company expediteurs, show company_name or company
        return row.company_name || row.company || value || "-";
      }
    },
    { 
      key: "address", 
      header: "Adresse",
      render: (value, row) => {
        // For individual expediteurs, show address
        if (row.address) {
          return row.address;
        }
        // For company expediteurs, show company_address
        if (row.company_address) {
          return row.company_address;
        }
        return "-";
      }
    },
    { 
      key: "governorate", 
      header: "Gouvernorat",
      render: (value, row) => {
        // For individual expediteurs, show governorate
        if (row.governorate) {
          return row.governorate;
        }
        // For company expediteurs, show company_governorate
        if (row.company_governorate) {
          return row.company_governorate;
        }
        return "-";
      }
    },
    { key: "total_parcels", header: "Total colis" },
    { key: "delivered_parcels", header: "Colis livrés" },
    { key: "returned_parcels", header: "Colis retournés" },
    { 
      key: "delivery_fees", 
      header: "Frais de livraison",
      render: (value) => `${parseFloat(value || 0).toFixed(2)} DT`
    },
    { 
      key: "return_fees", 
      header: "Frais de retour",
      render: (value) => `${parseFloat(value || 0).toFixed(2)} DT`
    },
    { 
      key: "status", 
      header: "Statut",
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
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
            title="Voir les détails"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {!isCommercialUser && (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                title="Modifier"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(row)}
                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Supprimer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleViewDetails = async (shipper) => {
    try {
      setLoadingDetails(true);
      setSelectedShipper(shipper);
      
      // Fetch detailed data for this shipper
      const details = await apiService.getShipperDetails(shipper.id);
      setShipperDetails(details);
    } catch (error) {
      console.error('Error fetching shipper details:', error);
      // Fallback to basic shipper data
      setShipperDetails({
        shipper: shipper,
        payments: [],
        parcels: [],
        statistics: {
          totalParcels: shipper.total_parcels || 0,
          deliveredParcels: shipper.delivered_parcels || 0,
          successRate: "0.0",
          totalRevenue: "0.00"
        }
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAdd = async () => {
    setEditingShipper(null);
    
    // For commercial users, automatically set the commercial_id
    let commercialId = "";
    let defaultAgency = "";
    
    if (isCommercialUser) {
      try {
        const commercials = await apiService.getCommercials();
        const commercial = commercials.find(c => c.email === currentUser.email);
        if (commercial) {
          commercialId = commercial.id;
        }
      } catch (error) {
        console.error('Error finding commercial:', error);
      }
    } else if (currentUser && currentUser.role === 'Chef d\'agence') {
      // For Chef d'agence, get their agency from the agency_managers table
      try {
        const agencyManagerResponse = await apiService.getAgencyManagers();
        const agencyManager = agencyManagerResponse.find(am => am.email === currentUser.email);
        
        if (agencyManager) {
          defaultAgency = agencyManager.agency;
          console.log('🔍 Setting agency for new shipper:', defaultAgency);
        }
      } catch (error) {
        console.error('Error fetching agency manager data:', error);
      }
    }
    
    setFormData({
      formType: "individual",
      code: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      agency: defaultAgency,
      commercial_id: commercialId,
      delivery_fees: 8,
      return_fees: 0,
      status: "Actif",
      identity_number: "",
      id_document: null,
      company_name: "",
      fiscal_number: "",
      company_address: "",
      company_governorate: "",
      company_documents: null,
      page_name: "",
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (shipper) => {
    setEditingShipper(shipper);
    
    // Determine form type based on shipper data (check both old and new field names)
    const hasCompanyInfo = shipper.company_name || shipper.company || shipper.fiscal_number || shipper.company_address;
    const formType = hasCompanyInfo ? "company" : "individual";
    
    setFormData({
      formType: formType,
      code: shipper.code || "",
      password: "", // Don't populate password field for security
      name: shipper.name || "",
      email: shipper.email || "",
      phone: shipper.phone || "",
      agency: shipper.agency || "",
      commercial_id: shipper.commercial_id || "",
      delivery_fees: shipper.delivery_fees || 0,
      return_fees: shipper.return_fees || 0,
      status: shipper.status || "Actif",
      identity_number: shipper.identity_number || "",
      id_document: null, // No file upload in this modal
      company_name: shipper.company_name || shipper.company || "", // Handle both old and new field names
      fiscal_number: shipper.fiscal_number || "",
      company_address: shipper.company_address || "",
      company_governorate: shipper.company_governorate || "",
      company_documents: null, // No file upload in this modal
      address: shipper.address || "",
      governorate: shipper.governorate || "",
      page_name: shipper.page_name || "",
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (shipper) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'expéditeur "${shipper.name}" ?\n\nCette action supprimera également :\n• Tous les paiements associés\n• Tous les colis associés\n• Le compte utilisateur\n\nCette action ne peut pas être annulée.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        console.log(`🗑️ Deleting shipper: ${shipper.name} (ID: ${shipper.id})`);
        
        // Try to delete with automatic dependency cleanup
        const result = await apiService.deleteShipperWithDependencies(shipper.id);
        
        if (result && result.success) {
          setShippers(shippers.filter(s => s.id !== shipper.id));
          if (selectedShipper?.id === shipper.id) {
            setSelectedShipper(null);
          }
          alert(`Expéditeur "${shipper.name}" supprimé avec succès!\n\nSupprimé :\n• ${result.deletedPayments || 0} paiements\n• ${result.deletedParcels || 0} colis\n• Compte utilisateur`);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('shipper-updated', { 
            detail: { shipperId: shipper.id, action: 'deleted' } 
          }));
        }
      } catch (error) {
        console.error('Error deleting shipper:', error);
        
        // If the new endpoint doesn't exist, fall back to the old method
        if (error.message.includes('deleteShipperWithDependencies')) {
          console.log('Falling back to manual dependency deletion...');
          await handleDeleteWithManualCleanup(shipper);
        } else {
          const errorMessage = error.message || 'Error deleting shipper. Please try again.';
          alert('Erreur lors de la suppression: ' + errorMessage);
        }
      }
    }
  };

  const handleDeleteWithManualCleanup = async (shipper) => {
    try {
      // First try to delete all payments
      try {
        await handleDeleteAllPayments(shipper);
        console.log('✅ Payments deleted successfully');
      } catch (paymentError) {
        console.log('⚠️ Could not delete payments:', paymentError.message);
      }
      
      // Then try to delete the shipper
      const result = await apiService.deleteShipper(shipper.id);
      if (result && result.success) {
        setShippers(shippers.filter(s => s.id !== shipper.id));
        if (selectedShipper?.id === shipper.id) {
          setSelectedShipper(null);
        }
        alert(`Expéditeur "${shipper.name}" supprimé avec succès!`);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('shipper-updated', { 
          detail: { shipperId: shipper.id, action: 'deleted' } 
        }));
      }
    } catch (error) {
      console.error('Error in manual cleanup:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      // Prepare form data for submission
      const submitData = new FormData();
      
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Form data being submitted:', formData);
      console.log('Form data keys:', Object.keys(formData));
      console.log('Editing shipper:', editingShipper);
      console.log('Form data values:');
      Object.keys(formData).forEach(key => {
        console.log(`  ${key}:`, formData[key], `(type: ${typeof formData[key]})`);
      });
      
      // Validate required fields for new shipper creation
      if (!editingShipper) {
        if (!formData.name || !formData.name.trim()) {
          alert('Le nom est requis');
          return;
        }
        if (!formData.email || !formData.email.trim()) {
          alert('L\'email est requis');
          return;
        }
        if (!formData.password || !formData.password.trim()) {
          alert('Le mot de passe est requis');
          return;
        }
        
        // Validate form type specific fields
        if (formData.formType === 'individual') {
          if (!formData.identity_number || !formData.identity_number.trim()) {
            alert('Le numéro d\'identité est requis pour les expéditeurs individuels');
            return;
          }
          if (!formData.address || !formData.address.trim()) {
            alert('L\'adresse est requise pour les expéditeurs avec carte d\'identité');
            return;
          }
          if (!formData.governorate || !formData.governorate.trim()) {
            alert('Le gouvernorat est requis pour les expéditeurs avec carte d\'identité');
            return;
          }
          if (!formData.page_name || !formData.page_name.trim()) {
            alert('Le nom de page est requis pour les expéditeurs avec carte d\'identité');
            return;
          }
        } else if (formData.formType === 'company') {
          if (!formData.company_name || !formData.company_name.trim()) {
            alert('Le nom de l\'entreprise est requis pour les expéditeurs entreprises');
            return;
          }
          if (!formData.fiscal_number || !formData.fiscal_number.trim()) {
            alert('Le matricule fiscal est requis pour les expéditeurs entreprises');
            return;
          }
          if (!formData.company_address || !formData.company_address.trim()) {
            alert('L\'adresse sociale est requise pour les expéditeurs entreprises');
            return;
          }
          if (!formData.company_governorate || !formData.company_governorate.trim()) {
            alert('Le gouvernorat de l\'entreprise est requis pour les expéditeurs entreprises');
            return;
          }
        }
      } else {
        // For editing, validate only if form type specific fields are being changed
        if (formData.formType === 'individual') {
          if (formData.identity_number !== undefined && (!formData.identity_number || !formData.identity_number.trim())) {
            alert('Le numéro d\'identité est requis pour les expéditeurs individuels');
            return;
          }
          if (formData.address !== undefined && (!formData.address || !formData.address.trim())) {
            alert('L\'adresse est requise pour les expéditeurs avec carte d\'identité');
            return;
          }
          if (formData.governorate !== undefined && (!formData.governorate || !formData.governorate.trim())) {
            alert('Le gouvernorat est requis pour les expéditeurs avec carte d\'identité');
            return;
          }
          if (formData.page_name !== undefined && (!formData.page_name || !formData.page_name.trim())) {
            alert('Le nom de page est requis pour les expéditeurs avec carte d\'identité');
            return;
          }
        } else if (formData.formType === 'company') {
          if (formData.company_name !== undefined && (!formData.company_name || !formData.company_name.trim())) {
            alert('Le nom de l\'entreprise est requis pour les expéditeurs entreprises');
            return;
          }
          if (formData.fiscal_number !== undefined && (!formData.fiscal_number || !formData.fiscal_number.trim())) {
            alert('Le matricule fiscal est requis pour les expéditeurs entreprises');
            return;
          }
          if (formData.company_address !== undefined && (!formData.company_address || !formData.company_address.trim())) {
            alert('L\'adresse sociale est requise pour les expéditeurs entreprises');
            return;
          }
          if (formData.company_governorate !== undefined && (!formData.company_governorate || !formData.company_governorate.trim())) {
            alert('Le gouvernorat de l\'entreprise est requis pour les expéditeurs entreprises');
            return;
          }
        }
      }
      
      // Check if we have any actual changes
      const hasChanges = Object.keys(formData).some(key => {
        if (key === 'id_document' || key === 'company_documents') return false;
        if (!editingShipper && key === 'code') return false;
        return formData[key] !== undefined && formData[key] !== null && formData[key] !== '';
      });
      
      if (editingShipper && !hasChanges) {
        alert('Aucune modification détectée. Veuillez modifier au moins un champ.');
        return;
      }
      
      // Add all form fields to FormData (only once)
      Object.keys(formData).forEach(key => {
        if (key !== 'id_document' && key !== 'company_documents') {
          // Don't send code field when creating new shipper (it will be auto-generated)
          if (!editingShipper && key === 'code') {
            return;
          }
          // Don't send company_name for individual form type
          if (formData.formType === 'individual' && key === 'company_name') {
            return;
          }
          // Only add non-empty values
          if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
            submitData.append(key, formData[key]);
            console.log(`Adding field: ${key} = ${formData[key]}`);
          }
        }
      });
      
      // Debug: Check if required fields are present
      console.log('Checking required fields:');
      console.log('name:', formData.name);
      console.log('email:', formData.email);
      console.log('password:', formData.password);
      console.log('formType:', formData.formType);
      
      // Validate required fields for new shipper creation
      if (!editingShipper) {
        if (!formData.password || !formData.password.trim()) {
          console.error('Password is required for new shipper creation');
          alert('Le mot de passe est requis pour créer un nouvel expéditeur');
          return;
        }
      }
      
      console.log('=== FORMDATA DEBUG ===');
      console.log('FormData entries:');
      for (let [key, value] of submitData.entries()) {
        console.log(`  ${key}: ${value} (type: ${typeof value})`);
      }
      console.log('FormData size:', submitData.entries().length);
      
      // Additional debug: Check if password is in FormData
      const hasPassword = submitData.has('password');
      console.log('FormData has password:', hasPassword);
      if (hasPassword) {
        console.log('Password value in FormData:', submitData.get('password'));
      }
      
      // Add files if they exist
      if (formData.id_document) {
        submitData.append('id_document', formData.id_document);
      }
      if (formData.company_documents) {
        submitData.append('company_documents', formData.company_documents);
      }
      
      if (editingShipper) {
        // Update existing shipper
        console.log('Calling updateShipper with:', editingShipper.id, submitData);
        const result = await apiService.updateShipper(editingShipper.id, submitData);
        console.log('Update result:', result);
        
        // Handle both response formats (wrapped and unwrapped)
        let success = false;
        let updatedData = null;
        
        if (result && result.success) {
          // Wrapped response format
          success = true;
          updatedData = result.data;
        } else if (result && result.id) {
          // Unwrapped response format (direct shipper data)
          success = true;
          updatedData = result;
        }
        
        if (success && updatedData) {
          setShippers(shippers.map(s => s.id === editingShipper.id ? updatedData : s));
          
          // Show appropriate success message based on password update
          const message = formData.password && formData.password.trim() 
            ? 'Expéditeur mis à jour avec succès! Le mot de passe a été modifié.'
            : 'Expéditeur mis à jour avec succès!';
          alert(message);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('shipper-updated', { 
            detail: { shipperId: editingShipper.id, action: 'updated' } 
          }));
        } else {
          console.error('Update failed - no success response:', result);
          alert('Erreur: La mise à jour a échoué. Vérifiez les données et réessayez.');
        }
      } else {
        // Create new shipper
        const result = await apiService.createShipper(submitData);
        if (result && result.success) {
          setShippers([...shippers, result.data]);
          alert(`Expéditeur créé avec succès!\n\nInformations de connexion:\nEmail: ${formData.email}\nMot de passe: ${formData.password}\n\nL'expéditeur peut maintenant se connecter avec ces identifiants.`);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('shipper-updated', { 
            detail: { shipperId: result.data.id, action: 'created' } 
          }));
        }
      }
      setIsAddModalOpen(false);
      setEditingShipper(null);
      setFormData({
        formType: "individual",
        code: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        agency: "",
        commercial_id: "",
        delivery_fees: 0,
        return_fees: 0,
        status: "Actif",
        identity_number: "",
        id_document: null,
        page_name: "",
        address: "",
        governorate: "",
        fiscal_number: "",
        company_address: "",
        company_governorate: "",
        company_documents: null,
      });
    } catch (error) {
      console.error('Error saving shipper:', error);
      const errorMessage = error.message || 'Error saving shipper. Please try again.';
      alert(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormTypeChange = (formType) => {
    setFormData(prev => ({ ...prev, formType }));
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  // Fonctions CRUD pour les colis
  const handleAddColis = () => {
    setEditingColis(null);
    setColisFormData({
      destination: "",
      type: "Standard",
      weight: "",
      status: "En attente",
      amount: "",
    });
    setIsColisModalOpen(true);
  };

  const handleEditColis = (colis) => {
    setEditingColis(colis);
    setColisFormData(colis);
    setIsColisModalOpen(true);
  };

  const handleDeleteColis = (colis) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce colis ?")) {
      const updatedShipper = {
        ...selectedShipper,
        colis: selectedShipper.colis.filter(c => c.id !== colis.id),
        totalShipments: selectedShipper.totalShipments - 1,
        successfulShipments: colis.status === "Livés" ? selectedShipper.successfulShipments - 1 : selectedShipper.successfulShipments
      };
      setShippers(shippers.map(s => s.id === selectedShipper.id ? updatedShipper : s));
      setSelectedShipper(updatedShipper);
    }
  };

  const handleSubmitColis = () => {
    const updatedColis = editingColis 
      ? { ...colisFormData, id: editingColis.id, date: editingColis.date }
      : { 
          ...colisFormData, 
          id: `COL${String(selectedShipper.colis.length + 1).padStart(3, '0')}`, 
          date: new Date().toISOString().slice(0, 10),
          amount: parseFloat(colisFormData.amount) || 0
        };

    const updatedShipper = {
      ...selectedShipper,
      colis: editingColis
        ? selectedShipper.colis.map(c => c.id === editingColis.id ? updatedColis : c)
        : [...selectedShipper.colis, updatedColis],
      totalShipments: editingColis ? selectedShipper.totalShipments : selectedShipper.totalShipments + 1,
      successfulShipments: editingColis 
        ? (editingColis.status === "Livés" && colisFormData.status !== "Livés") 
          ? selectedShipper.successfulShipments - 1 
          : (editingColis.status !== "Livés" && colisFormData.status === "Livés")
            ? selectedShipper.successfulShipments + 1
            : selectedShipper.successfulShipments
        : colisFormData.status === "Livés" ? selectedShipper.successfulShipments + 1 : selectedShipper.successfulShipments
    };

    setShippers(shippers.map(s => s.id === selectedShipper.id ? updatedShipper : s));
    setSelectedShipper(updatedShipper);
    setIsColisModalOpen(false);
  };

  const handleColisInputChange = (e) => {
    const { name, value } = e.target;
    setColisFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fonctions CRUD pour les paiements
  const handleAddPayment = () => {
    setEditingPayment(null);
    setPaymentFormData({
      reference: "",
      method: "Carte bancaire",
      status: "En attente",
      amount: "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentFormData(payment);
    setIsPaymentModalOpen(true);
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        await apiService.deletePayment(payment.id);
        
        // Update local state
        const updatedShipper = {
          ...selectedShipper,
          payments: selectedShipper.payments.filter(p => p.id !== payment.id)
        };
        setShippers(shippers.map(s => s.id === selectedShipper.id ? updatedShipper : s));
        setSelectedShipper(updatedShipper);
        
        alert('Paiement supprimé avec succès!');
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Erreur lors de la suppression du paiement: ' + error.message);
      }
    }
  };

  const handleDeleteAllPayments = async (shipper) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer TOUS les paiements de ${shipper.name} ?\n\nCette action ne peut pas être annulée !`;
    if (window.confirm(confirmMessage)) {
      try {
        const result = await apiService.deleteAllShipperPayments(shipper.id);
        
        // Update local state
        const updatedShipper = {
          ...shipper,
          payments: []
        };
        setShippers(shippers.map(s => s.id === shipper.id ? updatedShipper : s));
        if (selectedShipper && selectedShipper.id === shipper.id) {
          setSelectedShipper(updatedShipper);
        }
        
        alert(`✅ ${result.message}`);
      } catch (error) {
        console.error('Error deleting all payments:', error);
        alert('Erreur lors de la suppression des paiements: ' + error.message);
      }
    }
  };

  const handleSubmitPayment = () => {
    const updatedPayment = editingPayment 
      ? { ...paymentFormData, id: editingPayment.id, date: editingPayment.date }
      : { 
          ...paymentFormData, 
          id: `PAY${String(selectedShipper.payments.length + 1).padStart(3, '0')}`, 
          date: new Date().toISOString().slice(0, 10),
          amount: parseFloat(paymentFormData.amount) || 0
        };

    const updatedShipper = {
      ...selectedShipper,
      payments: editingPayment
        ? selectedShipper.payments.map(p => p.id === editingPayment.id ? updatedPayment : p)
        : [...selectedShipper.payments, updatedPayment]
    };

    setShippers(shippers.map(s => s.id === selectedShipper.id ? updatedShipper : s));
    setSelectedShipper(updatedShipper);
    setIsPaymentModalOpen(false);
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdvancedFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter shippers based on search and advanced filters
  const filteredShippers = shippers.filter(shipper => {
    const matchesSearch = searchTerm === "" || 
      Object.values(shipper).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    const successRate = (shipper.successfulShipments / shipper.totalShipments) * 100;
    const matchesSuccessRate = advancedFilters.successRate === "" || successRate >= parseFloat(advancedFilters.successRate);

    return matchesSearch && matchesSuccessRate;
  });

  const handleExportPDF = async () => {
    if (detailRef.current && selectedShipper) {
      setIsExporting(true);
      try {
        await html2pdf().set({
          margin: [0.3, 0.3, 0.3, 0.3],
          filename: `Expediteur_${selectedShipper.name.replace(/\s+/g, '_')}.pdf`,
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

  const getStatusBadge = (status) => {
    const colorMap = {
      "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Au dépôt": "bg-blue-100 text-blue-800 border-blue-300",
      "En cours": "bg-purple-100 text-purple-800 border-purple-300",
      "RTN dépot": "bg-orange-100 text-orange-800 border-orange-300",
      "Livés": "bg-green-100 text-green-800 border-green-300",
      "Livrés payés": "bg-emerald-100 text-emerald-800 border-emerald-300",
      "Retour définitif": "bg-red-100 text-red-800 border-red-300",
      "RTN client agence": "bg-pink-100 text-pink-800 border-pink-300",
      "Retour Expéditeur": "bg-gray-100 text-gray-800 border-gray-300",
      "Retour En Cours d'expédition": "bg-indigo-100 text-indigo-800 border-indigo-300",
      "Retour reçu": "bg-cyan-100 text-cyan-800 border-cyan-300",
    };
    return (
      <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const colorMap = {
      "Payé": "bg-green-100 text-green-800 border-green-300",
      "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Remboursé": "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
        {status}
      </span>
    );
  };

  // Vérifications de sécurité pour les propriétés manquantes
  const getSafeShipper = (shipper) => {
    return {
      ...shipper,
      colis: shipper.colis || [],
      payments: shipper.payments || [],
      statistics: shipper.statistics || {
        totalRevenue: 0,
        averagePerShipment: 0,
        onTimeDelivery: 0,
        customerRating: 0,
      },
      bankInfo: shipper.bankInfo || {
        bank: "Non renseigné",
        iban: "Non renseigné",
        bic: "Non renseigné"
      },
      documents: shipper.documents || [],
      successfulShipments: shipper.successfulShipments || 0,
    };
  };

  // Filter functions for parcel and payment history
  const getFilteredColis = (colis) => {
    if (!colisSearchTerm) return colis;
    const searchTerm = colisSearchTerm.toLowerCase();
    return colis.filter(colis => 
      (colis.id && colis.id.toString().toLowerCase().includes(searchTerm)) ||
      (colis.tracking_number && colis.tracking_number.toLowerCase().includes(searchTerm)) ||
      (colis.destination && colis.destination.toLowerCase().includes(searchTerm)) ||
      (colis.type && colis.type.toLowerCase().includes(searchTerm)) ||
      (colis.status && colis.status.toLowerCase().includes(searchTerm)) ||
      (colis.created_date && colis.created_date.toLowerCase().includes(searchTerm)) ||
      (colis.weight && colis.weight.toString().includes(searchTerm))
    );
  };

  const getFilteredPayments = (payments) => {
    if (!paymentSearchTerm) return payments;
    const searchTerm = paymentSearchTerm.toLowerCase();
    return payments.filter(payment => 
      (payment.id && payment.id.toString().toLowerCase().includes(searchTerm)) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchTerm)) ||
      (payment.payment_method && payment.payment_method.toLowerCase().includes(searchTerm)) ||
      (payment.status && payment.status.toLowerCase().includes(searchTerm)) ||
      (payment.date && payment.date.toLowerCase().includes(searchTerm)) ||
      (payment.amount && payment.amount.toString().includes(searchTerm))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header harmonisé */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Expéditeurs de mon Agence'
              : 'Gestion des expéditeurs'
            }
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser && currentUser.role === 'Chef d\'agence'
              ? 'Liste des expéditeurs de votre dépôt'
              : 'Liste des expéditeurs et leurs informations'
            }
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Nouvel expéditeur
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filtres avancés</h3>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showAdvancedFilters ? "Masquer" : "Afficher"}
          </button>
        </div>
        
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <input
              type="number"
              name="successRate"
              value={advancedFilters.successRate}
              onChange={handleAdvancedFilterChange}
              placeholder="Taux de réussite min (%)"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
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
          </div>
        )}
      </div>

      {/* Tableau des expéditeurs */}
      <DataTable
        data={filteredShippers}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showActions={false}
      />

      {/* Expéditeur Details Modal */}
      {selectedShipper && (
        <Modal
          isOpen={!!selectedShipper}
          onClose={() => setSelectedShipper(null)}
          size="xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Détails de l'expéditeur</h2>
                <p className="text-gray-600 mt-1">{selectedShipper.name} - {selectedShipper.company}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedShipper(null)}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {isExporting ? "Export en cours..." : "Exporter en PDF"}
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des détails...</p>
              </div>
            ) : (
              <div ref={detailRef}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-xl border">
                    <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Nom:</span>
                        <span>{shipperDetails?.shipper?.name || selectedShipper.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{shipperDetails?.shipper?.email || selectedShipper.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Téléphone:</span>
                        <span>{shipperDetails?.shipper?.phone || selectedShipper.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Entreprise:</span>
                        <span>{shipperDetails?.shipper?.company_name || selectedShipper.company}</span>
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
                        <span className="text-green-600 font-semibold">{shipperDetails?.statistics?.totalRevenue || "0.00"} DT</span>
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Paiements à cet expéditeur</h3>
                  </div>
                  
                  {/* Advanced Search for Payments */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher dans les paiements..."
                        value={paymentSearchTerm}
                        onChange={(e) => setPaymentSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
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
                        {getFilteredPayments(shipperDetails?.payments || []).length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-4 text-gray-400">
                            {shipperDetails?.payments?.length === 0 ? "Aucun paiement trouvé pour cet expéditeur." : "Aucun paiement ne correspond à votre recherche."}
                          </td></tr>
                        ) : (
                          getFilteredPayments(shipperDetails?.payments || []).map(payment => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">
                                {parseFloat(payment.amount || 0).toFixed(2)} DT
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Colis récents</h3>
                  </div>
                  
                  {/* Advanced Search for Parcels */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher dans les colis..."
                        value={colisSearchTerm}
                        onChange={(e) => setColisSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
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
                        {getFilteredColis(shipperDetails?.parcels || []).length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-gray-400">
                            {shipperDetails?.parcels?.length === 0 ? "Aucun colis trouvé pour cet expéditeur." : "Aucun colis ne correspond à votre recherche."}
                          </td></tr>
                        ) : (
                          getFilteredColis(shipperDetails?.parcels || []).map((colis) => (
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
            )}
          </div>
        </Modal>
      )}

      {/* Form Add/Edit */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingShipper(null);
          setFormData({
            formType: "individual",
            code: "",
            password: "",
            name: "",
            email: "",
            phone: "",
            agency: "",
            commercial_id: "",
            delivery_fees: 0,
            return_fees: 0,
            status: "Actif",
            identity_number: "",
            id_document: null,
            company_name: "",
            fiscal_number: "",
            company_address: "",
            company_governorate: "",
            company_documents: null,
          });
        }}
        title={editingShipper ? "Modifier l'expéditeur" : "Nouvel expéditeur"}
        size="xl"
      >
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          {/* Form Type Selection */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center font-semibold text-gray-700">
                <input
                  type="radio"
                  name="formType"
                  value="individual"
                  checked={formData.formType === "individual"}
                  onChange={() => handleFormTypeChange("individual")}
                  className="mr-2 accent-blue-600"
                />
                <span>Carte d'identité</span>
              </label>
              <label className="flex items-center font-semibold text-gray-700">
                <input
                  type="radio"
                  name="formType"
                  value="company"
                  checked={formData.formType === "company"}
                  onChange={() => handleFormTypeChange("company")}
                  className="mr-2 accent-blue-600"
                />
                <span>Patente</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Common Fields */}
            <div className="space-y-6 bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">👤</span>
                Informations générales
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Code *</label>
                <input 
                  type="text" 
                  name="code" 
                  value={editingShipper ? (formData.code || '') : "Généré automatiquement"} 
                  onChange={handleInputChange} 
                  required
                  readOnly={!editingShipper}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!editingShipper ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                />
                {!editingShipper && (
                  <p className="text-xs text-gray-500 mt-1">Le code sera généré automatiquement (EXP001, EXP002, etc.)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">
                  Mot de passe {!editingShipper && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password || ''} 
                  onChange={handleInputChange} 
                  required={!editingShipper}
                  placeholder={editingShipper ? "Laisser vide pour ne pas modifier" : "Mot de passe requis"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
                {editingShipper && (
                  <p className="text-xs text-gray-500 mt-1">Laisser vide pour conserver le mot de passe actuel</p>
                )}
                {editingShipper && editingShipper.has_password ? (
                  <p className="text-xs text-green-600 mt-1">✅ Mot de passe configuré (peut se connecter)</p>
                ) : editingShipper && !editingShipper.has_password ? (
                  <p className="text-xs text-orange-600 mt-1">⚠️ Aucun mot de passe configuré (ne peut pas se connecter)</p>
                ) : null}
                {formData.password && formData.password.trim() && (
                  <p className="text-xs text-blue-600 mt-1">💡 Le nouveau mot de passe sera immédiatement actif pour la connexion</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Nom et prénom *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              {formData.formType === "individual" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ">Numéro d'identité *</label>
                    <input 
                      type="text" 
                      name="identity_number" 
                      value={formData.identity_number || ''} 
                      onChange={handleInputChange} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ">Adresse *</label>
                    <textarea 
                      name="address" 
                      value={formData.address || ''} 
                      onChange={handleInputChange} 
                      required
                      rows={3}
                      placeholder="Adresse complète"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ">Gouvernorat *</label>
                    <select 
                      name="governorate" 
                      value={formData.governorate || ''} 
                      onChange={handleInputChange} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner un gouvernorat</option>
                      {governorates.map(governorate => (
                        <option key={governorate} value={governorate}>{governorate}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ">Nom de page *</label>
                    <input 
                      type="text" 
                      name="page_name" 
                      value={formData.page_name || ''} 
                      onChange={handleInputChange} 
                      required
                      placeholder="Nom de page"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Téléphone *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Depôt *</label>
                {currentUser && currentUser.role === 'Chef d\'agence' ? (
                  <input
                    type="text"
                    name="agency"
                    value={formData.agency || ''}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                ) : (
                  <select 
                    name="agency" 
                    value={formData.agency || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un dépôt</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.name}>{warehouse.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Commercial</label>
                {isCommercialUser ? (
                  <input
                    type="text"
                    value={commercials.find(c => c.id === formData.commercial_id)?.name || 'Commercial actuel'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                ) : (
                  <select 
                    name="commercial_id" 
                    value={formData.commercial_id || ''} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un commercial (optionnel)</option>
                    {commercials.map(commercial => (
                      <option key={commercial.id} value={commercial.id}>
                        {commercial.name} - {commercial.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Frais de livraison (DT)</label>
                <input 
                  type="number" 
                  name="delivery_fees" 
                  value={formData.delivery_fees || 0} 
                  onChange={handleInputChange} 
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Frais de retour (DT)</label>
                <input 
                  type="number" 
                  name="return_fees" 
                  value={formData.return_fees || 0} 
                  onChange={handleInputChange} 
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ">Statut</label>
                <select 
                  name="status" 
                  value={formData.status || 'Actif'} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>

              {/* Document Upload for Individual */}
              {formData.formType === "individual" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Télécharger la carte d'identité</label>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'id_document')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                  />
                  {formData.id_document && (
                    <p className="text-sm text-green-600 mt-1">Fichier sélectionné: {formData.id_document.name}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Company Fields (only shown when company is selected) */}
            {formData.formType === "company" && (
              <div className="space-y-6 bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm">
                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🏢</span>
                  Informations de l'entreprise
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Entreprise *</label>
                  <input 
                    type="text" 
                    name="company_name" 
                    value={formData.company_name || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Matricule fiscal *</label>
                  <input 
                    type="text" 
                    name="fiscal_number" 
                    value={formData.fiscal_number || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Adresse sociale *</label>
                  <textarea 
                    name="company_address" 
                    value={formData.company_address || ''} 
                    onChange={handleInputChange} 
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Gouvernorat de l'entreprise *</label>
                  <select 
                    name="company_governorate" 
                    value={formData.company_governorate || ''} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un gouvernorat</option>
                    {governorates.map(governorate => (
                      <option key={governorate} value={governorate}>{governorate}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Télécharger les documents de l'entreprise</label>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'company_documents')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                  />
                  {formData.company_documents && (
                    <p className="text-sm text-green-600 mt-1">Fichier sélectionné: {formData.company_documents.name}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Fermer
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow"
            >
              {editingShipper ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajout/Modification Colis */}
      <Modal
        isOpen={isColisModalOpen}
        onClose={() => setIsColisModalOpen(false)}
        title={editingColis ? "Modifier le colis" : "Nouveau colis"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Destination *</label>
            <input
              type="text"
              name="destination"
              value={colisFormData.destination}
              onChange={handleColisInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Type</label>
            <select
              name="type"
              value={colisFormData.type}
              onChange={handleColisInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Poids (kg)</label>
            <input
              type="text"
              name="weight"
              value={colisFormData.weight}
              onChange={handleColisInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ex: 2.5kg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Statut</label>
            <select
              name="status"
              value={colisFormData.status}
              onChange={handleColisInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="En attente">En attente</option>
              <option value="Au dépôt">Au dépôt</option>
              <option value="En cours">En cours</option>
              <option value="RTN dépot">RTN dépot</option>
              <option value="Livés">Livés</option>
              <option value="Livrés payés">Livrés payés</option>
              <option value="Retour définitif">Retour définitif</option>
              <option value="RTN client agence">RTN client agence</option>
              <option value="Retour Expéditeur">Retour Expéditeur</option>
              <option value="Retour En Cours d'expédition">Retour En Cours d'expédition</option>
              <option value="Retour reçu">Retour reçu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Montant (DT)</label>
            <input
              type="number"
              name="amount"
              value={colisFormData.amount}
              onChange={handleColisInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setIsColisModalOpen(false)}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmitColis}
            className="px-4 py-2 rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            {editingColis ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </Modal>

      {/* Modal Ajout/Modification Paiement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={editingPayment ? "Modifier le paiement" : "Nouveau paiement"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Référence</label>
            <input
              type="text"
              name="reference"
              value={paymentFormData.reference}
              onChange={handlePaymentInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ex: REF001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Méthode de paiement</label>
            <select
              name="method"
              value={paymentFormData.method}
              onChange={handlePaymentInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Carte bancaire">Carte bancaire</option>
              <option value="Virement">Virement</option>
              <option value="Chèque">Chèque</option>
              <option value="Espèces">Espèces</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Statut</label>
            <select
              name="status"
              value={paymentFormData.status}
              onChange={handlePaymentInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="En attente">En attente</option>
              <option value="Payé">Payé</option>
              <option value="Remboursé">Remboursé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">Montant (DT)</label>
            <input
              type="number"
              name="amount"
              value={paymentFormData.amount}
              onChange={handlePaymentInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmitPayment}
            className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {editingPayment ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Expediteur; 
