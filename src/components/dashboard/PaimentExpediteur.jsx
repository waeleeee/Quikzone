import React, { useState, useEffect } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import FactureColis from "./FactureColis";
import ColisSelectionModal from "./ColisSelectionModal";
import { apiService } from "../../services/api";

const PaimentExpediteur = () => {
  // Get current user
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    console.log('Current user from localStorage:', user);
    return user;
  });

  const [payments, setPayments] = useState([]);
  const [shippers, setShippers] = useState([]); // Add shippers state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New facture system states
  const [isColisSelectionOpen, setIsColisSelectionOpen] = useState(false);
  const [selectedShipperForFacture, setSelectedShipperForFacture] = useState(null);
  const [factureData, setFactureData] = useState(null);

  // Step-by-step wizard states
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [filteredShippers, setFilteredShippers] = useState([]);

  // Agency options
  const agencyOptions = [
    "Siège",
    "Tunis", 
    "Sousse",
    "Sfax",
    "Monastir"
  ];

  // Agency to expediteur mapping
  const agencyExpediteurMapping = {
    "Siège": ["Hayder altayeb"],
    "Tunis": ["Toumi Marwen", "Ritej Chaieb"],
    "Sousse": ["Ayeb Hichem", "fedi", "asma gharbi"],
    "Sfax": ["Wael Riahi"],
    "Monastir": []
  };

  // Fetch shippers based on user role
  useEffect(() => {
    const fetchShippers = async () => {
      try {
        console.log('Fetching shippers based on user role...');
        let shippersData;
        
        if (currentUser?.role === 'Commercial') {
          // For commercial users, get only their assigned shippers
          console.log('Commercial user - fetching assigned shippers...');
          const commercials = await apiService.getCommercials();
          const commercial = commercials.find(c => c.email === currentUser.email);
          
          if (commercial) {
            console.log('Found commercial:', commercial);
            shippersData = await apiService.getShippersByCommercial(commercial.id);
            console.log('Commercial shippers:', shippersData);
          } else {
            console.error('Commercial not found for user:', currentUser.email);
            shippersData = [];
          }
        } else if (currentUser?.role === 'Administration' || currentUser?.role === 'Finance') {
          // For admin/finance users, get all shippers
          console.log('Admin/Finance user - fetching all shippers...');
          shippersData = await apiService.getShippers();
        } else {
          shippersData = [];
        }
        
        console.log('Fetched shippers:', shippersData);
        console.log('Shippers count:', shippersData ? shippersData.length : 0);
        if (shippersData && shippersData.length > 0) {
          console.log('First shipper sample:', shippersData[0]);
        }
        setShippers(shippersData || []);
      } catch (error) {
        console.error('Error fetching shippers:', error);
        setShippers([]);
      }
    };

    // Only fetch shippers if user is admin/finance/commercial
    if (currentUser?.role === 'Administration' || currentUser?.role === 'Finance' || currentUser?.role === 'Commercial') {
      fetchShippers();
    }
  }, [currentUser]);

    // Fetch real payment data for the logged-in expéditeur
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentUser && currentUser.email) {
        console.log('Fetching payments for user:', currentUser.email);
        
        const userPayments = await apiService.getExpediteurPayments(currentUser.email);
        console.log('User payments received:', userPayments);
        console.log('User payments type:', typeof userPayments);
        console.log('User payments length:', userPayments ? userPayments.length : 'null/undefined');
        
        // If no payments from API, try to get payments based on user role
        let paymentsToUse = userPayments;
        if (!userPayments || userPayments.length === 0) {
          if (currentUser.role === 'Commercial') {
            // For commercial users, get payments from their assigned shippers
            try {
              console.log('Commercial user - fetching payments from assigned shippers...');
              const commercials = await apiService.getCommercials();
              const commercial = commercials.find(c => c.email === currentUser.email);
              
              if (commercial) {
                console.log('Found commercial:', commercial);
                const commercialShippers = await apiService.getShippersByCommercial(commercial.id);
                console.log('Commercial shippers:', commercialShippers);
                
                if (commercialShippers && commercialShippers.length > 0) {
                  // Get all payments and filter by commercial's shippers
                  const allPaymentsResponse = await apiService.getAllPayments();
                  const shipperIds = commercialShippers.map(s => s.id);
                  paymentsToUse = allPaymentsResponse.filter(payment => 
                    payment.shipper_id && shipperIds.includes(payment.shipper_id)
                  );
                  console.log('Filtered payments for commercial:', paymentsToUse);
                } else {
                  console.log('No shippers assigned to this commercial');
                  paymentsToUse = [];
                }
              } else {
                console.log('Commercial not found');
                paymentsToUse = [];
              }
            } catch (error) {
              console.log('Could not fetch commercial payments, using empty array:', error);
              paymentsToUse = [];
            }
          } else if (currentUser.role === 'Administration' || currentUser.role === 'Finance') {
            // For admin/finance users, try to get all payments
            try {
              console.log('Admin/Finance user - fetching all payments');
              const allPaymentsResponse = await apiService.getAllPayments();
              paymentsToUse = allPaymentsResponse || [];
            } catch (error) {
              console.log('Could not fetch all payments, using empty array');
              paymentsToUse = [];
            }
          } else {
            console.log('No payments found for this expéditeur');
            paymentsToUse = [];
          }
        }
        
        // Transform the data to match the expected format
        const transformedPayments = paymentsToUse.map(payment => {
          // Find the shipper name from the shippers list
          const shipper = shippers.find(s => s.id === payment.shipper_id);
          const shipperName = shipper ? shipper.name : (payment.shipper_name || "Expéditeur inconnu");
          
          // Map payment methods to French display names
          const methodMap = {
            'cash': 'Espèces',
            'check': 'Paiement avec chèque',
            'bank_transfer': 'Virements bancaires',
            'online': 'En ligne'
          };
          
          const displayMethod = methodMap[payment.payment_method] || payment.payment_method || "Non spécifié";
          
          return {
            id: payment.id || `PAY${payment.id}`,
            shipper: shipperName,
            amount: `${parseFloat(payment.amount || 0).toFixed(2)} DT`,
            date: payment.created_at ? new Date(payment.created_at).toLocaleString('fr-FR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }) : new Date().toLocaleString('fr-FR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            method: displayMethod, // Use French display name
            method_enum: payment.payment_method, // Keep original enum for backend operations
            reference: payment.reference || payment.id || "N/A",
            status: payment.status === "paid" ? "Payé" : "En attente",
            // New payment type specific fields
            check_date: payment.check_date,
            check_number: payment.check_number,
            transfer_date: payment.transfer_date,
            transfer_reference: payment.transfer_reference,
            cash_date: payment.cash_date,
            // Keep original payment data for invoice
            originalPayment: payment,
            // Also store the found shipper data for easier access
            shipperData: shipper
          };
        });
        
        console.log('Transformed payments:', transformedPayments);
        setPayments(transformedPayments);
      } else {
        console.log('No current user found');
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Erreur lors du chargement des paiements');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Call fetchPayments on component mount
  useEffect(() => {
    fetchPayments();
  }, [currentUser]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    shipper_id: "", // Change from shipper to shipper_id
    amount: "",
    date: "",
    method: "",
    reference: "",
    status: "En attente",
  });

  const [isFactureOpen, setIsFactureOpen] = useState(false);
  const [facturePayment, setFacturePayment] = useState(null);

  const columns = [
    { key: "id", header: "ID" },
    { key: "shipper", header: "Expéditeur" },
    { key: "amount", header: "Montant" },
    { key: "date", header: "Date" },
    { key: "method", header: "Méthode de paiement" },
    { key: "reference", header: "Référence" },
    { 
      key: "payment_details", 
      header: "Détails Paiement",
      render: (_, row) => {
        // Use the method_enum field for checking payment type
        const paymentMethod = row.method_enum || row.method;
        
        if (paymentMethod === 'check') {
          return (
            <div className="text-xs">
              <div>Chèque: {row.check_number || 'N/A'}</div>
              <div>Date: {row.check_date || 'N/A'}</div>
            </div>
          );
        } else if (paymentMethod === 'bank_transfer') {
          return (
            <div className="text-xs">
              <div>Virement: {row.transfer_reference || 'N/A'}</div>
              <div>Date: {row.transfer_date || 'N/A'}</div>
            </div>
          );
        } else if (paymentMethod === 'cash') {
          return (
            <div className="text-xs">
              <div>Date: {row.cash_date || 'N/A'}</div>
            </div>
          );
        }
        return '-';
      }
    },
    {
      key: "status",
      header: "Statut",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Payé"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { 
              console.log('👁️ Eye button clicked for payment:', row);
              console.log('👁️ Original payment data:', row.originalPayment);
              console.log('👁️ Shipper data stored:', row.shipperData);
              console.log('👁️ Available shippers:', shippers);
              
              // Pass the transformed row data (which includes shipperData) instead of originalPayment
              setFacturePayment(row); 
              setIsFactureOpen(true); 
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
            title="Voir la facture"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {(currentUser?.role === 'Administration' || currentUser?.role === 'Finance') && (
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

  const handleAdd = () => {
    setEditingPayment(null);
    setFormData({
      shipper_id: "", // Change from shipper to shipper_id
      amount: "",
      date: new Date().toISOString().split('T')[0], // Set today's date as default
      method: "",
      reference: "",
      status: "En attente",
      // New payment type specific fields
      check_date: "",
      check_number: "",
      transfer_date: "",
      transfer_reference: "",
      cash_date: "",
    });
    setCurrentStep(1);
    setSelectedAgency("");
    setFilteredShippers([]);
    setIsModalOpen(true);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    // Find the shipper ID from the shippers list based on the shipper name
    const selectedShipper = shippers.find(s => s.name === payment.shipper);
    setFormData({
      shipper_id: selectedShipper?.id || "",
      amount: payment.amount.replace(' DT', ''),
      date: payment.date,
      method: payment.method,
      reference: payment.reference,
      status: payment.status,
      // New payment type specific fields
      check_date: payment.check_date || "",
      check_number: payment.check_number || "",
      transfer_date: payment.transfer_date || "",
      transfer_reference: payment.transfer_reference || "",
      cash_date: payment.cash_date || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (payment) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        // Get the original payment ID from the transformed payment
        const originalPaymentId = payment.originalPayment?.id || payment.id;
        
        console.log('Deleting payment with ID:', originalPaymentId);
        
        // Call the API to delete the payment
        await apiService.deletePayment(originalPaymentId);
        
        // Update local state after successful deletion
        setPayments(payments.filter((p) => p.id !== payment.id));
        
        alert('Paiement supprimé avec succès!');
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Erreur lors de la suppression du paiement: ' + error.message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!formData.shipper_id) {
        alert('Veuillez sélectionner un expéditeur');
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        alert('Veuillez saisir un montant valide');
        return;
      }
      if (!formData.date) {
        alert('Veuillez saisir une date');
        return;
      }
      if (!formData.method) {
        alert('Veuillez sélectionner une méthode de paiement');
        return;
      }

      // Find the selected shipper
      console.log('Available shippers:', shippers);
      console.log('Selected shipper_id:', formData.shipper_id, 'Type:', typeof formData.shipper_id);
      const selectedShipper = shippers.find(s => s.id == formData.shipper_id);
      console.log('Found shipper:', selectedShipper);
      if (!selectedShipper) {
        alert('Expéditeur non trouvé');
        return;
      }

      // Map payment method to database enum values
      const paymentMethodMap = {
        'Espèces': 'cash',
        'Paiement avec chèque': 'check',
        'Virements bancaires': 'bank_transfer'
      };
      
      const mappedPaymentMethod = paymentMethodMap[formData.method] || formData.method;
      
      // Determine the main reference based on payment method
      let mainReference = formData.reference;
      if (mappedPaymentMethod === 'check' && formData.check_number) {
        mainReference = formData.check_number; // Use check number as main reference
      } else if (mappedPaymentMethod === 'bank_transfer' && formData.transfer_reference) {
        mainReference = formData.transfer_reference; // Use transfer reference as main reference
      } else if (!mainReference) {
        mainReference = `REF-${Date.now()}`; // Fallback to generated reference
      }

      // Create payment data
      const paymentData = {
        shipper_id: parseInt(formData.shipper_id), // Convert to integer
        amount: parseFloat(formData.amount),
        payment_method: mappedPaymentMethod,
        reference: mainReference, // Use the determined main reference
        status: formData.status === "Payé" ? "paid" : "pending",
        payment_date: formData.date,
        // Add payment type specific fields
        check_date: formData.check_date || null,
        check_number: formData.check_number || null,
        transfer_date: formData.transfer_date || null,
        transfer_reference: formData.transfer_reference || null,
        cash_date: formData.cash_date || null
      };

      if (editingPayment) {
        // Update existing payment
        console.log('Updating payment with data:', paymentData);
        console.log('Editing payment ID:', editingPayment.id);
        
        // Get the original payment ID
        const originalPaymentId = editingPayment.originalPayment?.id || editingPayment.id;
        
        // Call API to update payment
        const result = await apiService.updatePayment(originalPaymentId, paymentData);
        
        console.log('Payment update result:', result);
        
        if (result && result.id) {
          // Update the payment in the list
          const updatedPayment = {
            id: editingPayment.id,
            shipper: selectedShipper.name,
            amount: `${parseFloat(formData.amount).toFixed(2)} DT`,
            date: formData.date,
            method: formData.method,
            reference: formData.reference || editingPayment.reference,
            status: formData.status === 'pending' ? 'En attente' : 'Payé',
            originalPayment: result
          };
          
          setPayments(payments.map(p => p.id === editingPayment.id ? updatedPayment : p));
          alert('Paiement modifié avec succès!');
          setIsModalOpen(false);
          setEditingPayment(null);
        } else {
          alert('Erreur lors de la modification du paiement');
        }
      } else {
        // Create new payment
        console.log('Creating payment with data:', paymentData);

        // Call API to create payment
        const result = await apiService.createPayment(paymentData);
        
        console.log('Payment creation result:', result);
        
        if (result && result.id) {
          // Add the new payment to the list
          const newPayment = {
            id: result.id,
            shipper: selectedShipper.name,
            amount: `${parseFloat(formData.amount).toFixed(2)} DT`,
            date: formData.date,
            method: formData.method,
            reference: formData.reference || `REF-${Date.now()}`,
            status: formData.status === 'pending' ? 'En attente' : 'Payé',
            originalPayment: result
          };
          
          setPayments([newPayment, ...payments]);
          alert('Paiement créé avec succès!');
          setIsModalOpen(false);
        } else {
          alert('Erreur lors de la création du paiement');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      const action = editingPayment ? 'modification' : 'création';
      alert(`Erreur lors de la ${action} du paiement: ` + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Agency change handler
  const handleAgencyChange = (e) => {
    const agency = e.target.value;
    setSelectedAgency(agency);
    
    if (agency) {
      // Filter shippers based on agency
      const agencyShippers = shippers.filter(shipper => {
        // Check if shipper belongs to the selected agency
        const shipperName = shipper.name || `${shipper.first_name || ''} ${shipper.last_name || ''}`.trim();
        return agencyExpediteurMapping[agency]?.includes(shipperName) || 
               shipper.agency === agency ||
               shipper.governorate === agency;
      });
      setFilteredShippers(agencyShippers);
    } else {
      setFilteredShippers([]);
    }
    
    // Reset shipper selection when agency changes
    setFormData(prev => ({
      ...prev,
      shipper_id: ""
    }));
  };

  // New facture system handlers
  const handleColisSelectionConfirm = async (data) => {
    console.log('📦 Selected data for facture:', data);
    
    // Extract parcels from the data object
    const selectedParcels = data.parcels || data;
    const paymentMethod = data.paymentMethod;
    const paymentDetails = data.paymentDetails;
    
    console.log('📦 Selected parcels:', selectedParcels);
    console.log('💰 Payment method:', paymentMethod);
    console.log('📝 Payment details:', paymentDetails);
    
    try {
      // Get shipper info
      const shipper = shippers.find(s => s.id == selectedParcels[0]?.shipper_id);
      if (!shipper) {
        alert('Erreur: Expéditeur non trouvé');
        return;
      }
      
      // Calculate total amount
      const totalAmount = selectedParcels.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
      
      // Map payment method to database enum values
      const paymentMethodMap = {
        'Espèces': 'cash',
        'Paiement avec chèque': 'check',
        'Virements bancaires': 'bank_transfer'
      };
      
      const mappedPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod;
      
      // Prepare payment data for API
      const paymentData = {
        shipper_id: shipper.id,
        amount: totalAmount,
        payment_method: mappedPaymentMethod,
        reference: `PAY-${Date.now().toString().slice(-6)}`,
        status: "pending",
        payment_date: new Date().toISOString().split('T')[0],
        // Payment type specific fields
        check_date: paymentDetails.check_date || null,
        check_number: paymentDetails.check_number || null,
        transfer_date: paymentDetails.transfer_date || null,
        transfer_reference: paymentDetails.transfer_reference || null,
        cash_date: paymentDetails.cash_date || null,
        // Parcel IDs to update status
        parcel_ids: selectedParcels.map(p => p.id)
      };
      
      console.log('💾 Saving payment to database:', paymentData);
      console.log('📦 Parcel IDs to update:', selectedParcels.map(p => p.id));
      
      // Save payment to database
      const response = await apiService.createPayment(paymentData);
      
      console.log('📡 Payment creation response:', response);
      console.log('📡 Response type:', typeof response);
      console.log('📡 Response keys:', Object.keys(response || {}));
      
      if (response && response.success && response.data) {
        console.log('✅ Payment saved successfully:', response.data);
        
        // Simple and direct approach: Update parcel statuses by tracking number
        try {
          console.log('📦 Updating parcel statuses by tracking number...');
          
          for (const parcel of selectedParcels) {
            const trackingNumber = parcel.tracking_number;
            const currentStatus = parcel.status?.toLowerCase();
            
            console.log(`📦 Processing parcel: ${trackingNumber} (Status: ${parcel.status})`);
            
            // Determine new status based on current status
            let newStatus;
            if (currentStatus === 'livrés') {
              newStatus = 'Livrés payés';
            } else if (currentStatus === 'retour') {
              newStatus = 'Retour En Cours';
            } else {
              console.log(`⚠️ Skipping parcel ${trackingNumber} - status "${parcel.status}" not eligible for update`);
              continue;
            }
            
            console.log(`🔄 Updating ${trackingNumber}: "${parcel.status}" → "${newStatus}"`);
            
            try {
              // Update the parcel status (only send status field)
              const updateResult = await apiService.updateParcel(parcel.id, {
                status: newStatus
              });
              
              console.log(`✅ Successfully updated ${trackingNumber} to "${newStatus}"`);
              
            } catch (updateError) {
              console.error(`❌ Failed to update ${trackingNumber}:`, updateError.message);
            }
          }
          
          console.log('✅ Parcel status update process completed');
          
        } catch (error) {
          console.error('❌ Error updating parcel statuses:', error);
        }
        
        // Refresh payments list
        try {
          console.log('🔄 Refreshing payments list...');
          await fetchPayments();
          console.log('✅ Payments list refreshed successfully');
        } catch (error) {
          console.error('❌ Error refreshing payments:', error);
          // Don't fail the entire operation if refresh fails
        }
        
        // Generate invoice number
        const invoiceNumber = `REF-${Date.now().toString().slice(-3)}-${new Date().getFullYear().toString().slice(-2)}`;
        const invoiceDate = new Date().toISOString().split('T')[0];
        
        // Transform parcels data for facture
        const factureParcels = selectedParcels.map(parcel => ({
          id: parcel.id,
          code: parcel.tracking_number,
          date: parcel.created_at ? new Date(parcel.created_at).toISOString().split('T')[0] : invoiceDate,
          status: parcel.status === 'delivered' ? 'Livré' : 
                 parcel.status === 'returned' ? 'Retour' : 
                 parcel.status === 'Livrés' ? 'Livré' :
                 parcel.status === 'Livrés payés' ? 'Livré' : parcel.status,
          client_name: parcel.recipient_name,
          client_phone: parcel.recipient_phone,
          designation: parcel.package_type || 'Colis',
          governorate: parcel.recipient_city || parcel.destination,
          prix: parcel.price || 0
        }));

        // Calculate financial data
        const totalLivres = factureParcels.filter(p => p.status === 'Livré' || p.status === 'Livrés' || p.status === 'Livrés payés').length;
        const totalRetour = factureParcels.filter(p => p.status === 'Retour').length;
        
        const factureData = {
          colis: factureParcels,
          expediteur: shipper || {},
          prix: {
            delivery_fees: totalLivres * 8000, // 8 TND per delivered parcel
            return_fees: totalRetour * 4000,   // 4 TND per returned parcel
            package_amount_ht: totalAmount * 0.69, // 69% of total (HT)
            vat_amount: totalAmount * 0.69 * 0.07, // 7% VAT on HT amount
            withholding_tax: totalAmount * 0.69 * (shipper?.id_type === 'patente' ? 0.01 : 0.03),
            stamp_amount: 1000
          },
          invoiceNumber,
          invoiceDate
        };

        setFactureData(factureData);
        setIsFactureOpen(true);
        
        // Count parcels by status change
        const livresCount = selectedParcels.filter(p => p.status?.toLowerCase() === 'livrés').length;
        const retourCount = selectedParcels.filter(p => p.status?.toLowerCase() === 'retour').length;
        
        let statusMessage = '';
        if (livresCount > 0 && retourCount > 0) {
          statusMessage = `📦 ${livresCount} colis "Livrés" → "Livrés payés"\n📦 ${retourCount} colis "Retour" → "Retour En Cours"`;
        } else if (livresCount > 0) {
          statusMessage = `📦 ${livresCount} colis "Livrés" → "Livrés payés"`;
        } else if (retourCount > 0) {
          statusMessage = `📦 ${retourCount} colis "Retour" → "Retour En Cours"`;
        }
        
        alert(`✅ Paiement enregistré avec succès!\n\n${statusMessage}\n\nLa facture va s'afficher.`);
      } else {
        console.error('❌ Failed to save payment:', response);
        console.error('❌ Response details:', {
          success: response?.success,
          message: response?.message,
          error: response?.error,
          data: response?.data
        });
        
        // Check if response has data but no success flag (fallback)
        if (response && response.data && !response.success) {
          console.log('⚠️ Response has data but no success flag, treating as success');
          // Continue with success flow
        } else {
          alert('Erreur lors de l\'enregistrement du paiement: ' + (response?.message || response?.error || 'Erreur inconnue'));
          return;
        }
      }
      
      // Success flow - execute if we have valid response data
      if (response && response.data) {
        console.log('✅ Payment saved successfully:', response.data);
        
        // Refresh payments list
        try {
          console.log('🔄 Refreshing payments list...');
          await fetchPayments();
          console.log('✅ Payments list refreshed successfully');
        } catch (error) {
          console.error('❌ Error refreshing payments:', error);
          // Don't fail the entire operation if refresh fails
        }
        
        // Generate invoice number
        const invoiceNumber = `REF-${Date.now().toString().slice(-3)}-${new Date().getFullYear().toString().slice(-2)}`;
        const invoiceDate = new Date().toISOString().split('T')[0];
        
        // Transform parcels data for facture
        const factureParcels = selectedParcels.map(parcel => ({
          id: parcel.id,
          code: parcel.tracking_number,
          date: parcel.created_at ? new Date(parcel.created_at).toISOString().split('T')[0] : invoiceDate,
          status: parcel.status === 'delivered' ? 'Livré' : 
                 parcel.status === 'returned' ? 'Retour' : 
                 parcel.status === 'Livrés' ? 'Livré' :
                 parcel.status === 'Livrés payés' ? 'Livré' : parcel.status,
          client_name: parcel.recipient_name,
          client_phone: parcel.recipient_phone,
          designation: parcel.package_type || 'Colis',
          governorate: parcel.recipient_city || parcel.destination,
          prix: parcel.price || 0
        }));

        // Calculate financial data
        const totalLivres = factureParcels.filter(p => p.status === 'Livré' || p.status === 'Livrés' || p.status === 'Livrés payés').length;
        const totalRetour = factureParcels.filter(p => p.status === 'Retour').length;
        
        const factureData = {
          colis: factureParcels,
          expediteur: shipper || {},
          prix: {
            delivery_fees: totalLivres * 8000, // 8 TND per delivered parcel
            return_fees: totalRetour * 4000,   // 4 TND per returned parcel
            package_amount_ht: totalAmount * 0.69, // 69% of total (HT)
            vat_amount: totalAmount * 0.69 * 0.07, // 7% VAT on HT amount
            withholding_tax: totalAmount * 0.69 * (shipper?.id_type === 'patente' ? 0.01 : 0.03),
            stamp_amount: 1000
          },
          invoiceNumber,
          invoiceDate
        };

        setFactureData(factureData);
        setIsFactureOpen(true);
        
        // Count parcels by status change
        const livresCount2 = selectedParcels.filter(p => p.status?.toLowerCase() === 'livrés').length;
        const retourCount2 = selectedParcels.filter(p => p.status?.toLowerCase() === 'retour').length;
        
        let statusMessage2 = '';
        if (livresCount2 > 0 && retourCount2 > 0) {
          statusMessage2 = `📦 ${livresCount2} colis "Livrés" → "Livrés payés"\n📦 ${retourCount2} colis "Retour" → "Retour En Cours"`;
        } else if (livresCount2 > 0) {
          statusMessage2 = `📦 ${livresCount2} colis "Livrés" → "Livrés payés"`;
        } else if (retourCount2 > 0) {
          statusMessage2 = `📦 ${retourCount2} colis "Retour" → "Retour En Cours"`;
        }
        
        alert(`✅ Paiement enregistré avec succès!\n\n${statusMessage2}\n\nLa facture va s'afficher.`);
      }
    } catch (error) {
      console.error('❌ Error saving payment:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert('Erreur lors de l\'enregistrement du paiement: ' + (error.response?.data?.message || error.message));
    }
  };

  // Generate facture data from real payment data
  const getFactureData = (payment) => {
    const originalPayment = payment.originalPayment;
    const amount = parseFloat(payment.amount.replace(' DT', ''));
    
    // Use the stored shipper data if available, otherwise find it
    const shipper = payment.shipperData || 
                   shippers.find(s => s.id === originalPayment?.shipper_id) || 
                   shippers.find(s => s.name === payment.shipper) ||
                   shippers.find(s => s.name === originalPayment?.shipper_name);
    
    console.log('🔍 Looking for shipper data:', {
      payment_shipper: payment.shipper,
      original_shipper_id: originalPayment?.shipper_id,
      original_shipper_name: originalPayment?.shipper_name,
      stored_shipper_data: payment.shipperData ? payment.shipperData.name : 'None',
      found_shipper: shipper ? shipper.name : 'Not found',
      total_shippers: shippers.length
    });
    
    // Create a mock parcel for the invoice since we don't have actual parcel data for existing payments
    const mockParcel = {
      id: payment.id,
      code: payment.reference,
      date: payment.date || new Date().toISOString().split('T')[0],
      status: 'Livré',
      client_name: payment.shipper,
      client_phone: shipper?.phone || originalPayment?.shipper_phone || "N/A",
      designation: 'Colis QuickZone',
      governorate: shipper?.governorate || originalPayment?.destination || "N/A",
      prix: amount
    };
    
    return {
      colis: [mockParcel], // Make it an array
      expediteur: {
        name: shipper?.name || payment.shipper,
        company_name: shipper?.company_name || shipper?.name || payment.shipper,
        fiscal_number: shipper?.fiscal_number || null,
        identity_number: shipper?.identity_number || null,
        address: shipper?.address || shipper?.company_address || "Adresse non spécifiée",
        governorate: shipper?.governorate || shipper?.company_governorate || "N/A",
        phone: shipper?.phone || "N/A",
        email: shipper?.email || "N/A",
        id_type: shipper?.id_type || 'cin' // Default to CIN if not specified
      },
      prix: {
        delivery_fees: 8, // 8 TND per delivered parcel
        return_fees: 0,   // 0 TND for returned parcel
        package_amount_ht: amount * 0.93, // 93% of amount (HT)
        vat_amount: amount * 0.93 * 0.07, // 7% VAT on HT amount
        withholding_tax: amount * 0.93 * 0.07 * 0.03, // 3% withholding tax
        stamp_amount: 1 // 1 TND stamp
      },
      invoiceNumber: payment.reference,
      invoiceDate: payment.date || new Date().toISOString().split('T')[0],
      payment: {
        ...payment,
        // Ensure check_number and check_date are available from the original payment
        check_number: payment.check_number || payment.originalPayment?.check_number,
        check_date: payment.check_date || payment.originalPayment?.check_date,
        method_enum: payment.method_enum || payment.originalPayment?.payment_method
      }
    };

    // Debug: Log the payment data being passed to invoice
    console.log('🔍 Payment data for invoice:', {
      payment_reference: payment.reference,
      payment_check_number: payment.check_number,
      original_check_number: payment.originalPayment?.check_number,
      method_enum: payment.method_enum || payment.originalPayment?.payment_method,
      final_check_number: payment.check_number || payment.originalPayment?.check_number
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Chargement des paiements...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser?.role === 'Expéditeur' ? 'Mes Paiements' : 
             currentUser?.role === 'Commercial' ? 'Paiements de mes Expéditeurs' : 'Gestion des Paiements'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser?.role === 'Expéditeur' 
              ? 'Historique de vos paiements et transactions' 
              : currentUser?.role === 'Commercial'
              ? 'Paiements des expéditeurs assignés à votre compte'
              : 'Gérez les paiements et les transactions des expéditeurs'
            }
          </p>
        </div>
        {(currentUser?.role === 'Administration' || currentUser?.role === 'Finance') && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsColisSelectionOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Créer Facture avec Colis
            </button>
            <button
              onClick={() => {
                console.log('Debug: Current shippers:', shippers);
                console.log('Debug: Shippers count:', shippers.length);
                if (shippers.length > 0) {
                  console.log('Debug: First shipper:', shippers[0]);
                }
                alert(`Shippers loaded: ${shippers.length}\nFirst shipper: ${shippers.length > 0 ? JSON.stringify(shippers[0], null, 2) : 'None'}`);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Debug Shippers
            </button>
          </div>
        )}
      </div>

      <DataTable
        data={payments}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showActions={false}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentStep(1);
          setSelectedAgency("");
          setFilteredShippers([]);
        }}
        title={editingPayment ? "Modifier le paiement" : "Ajouter un paiement"}
        size="75%"
      >
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4" dir="ltr">
          {/* Beautiful Step-by-Step Wizard Design */}
          <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-lg">
            
            {/* Header Section */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement Expéditeur'}
              </h3>
              <p className="text-sm text-gray-600">Suivez les étapes pour créer le paiement</p>
            </div>

            {/* Step Progress Indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, title: "Agence", icon: "🏢", color: "blue" },
                  { step: 2, title: "Expéditeur", icon: "👤", color: "green" },
                  { step: 3, title: "Paiement", icon: "💰", color: "purple" }
                ].map((stepInfo, index) => (
                  <div key={stepInfo.step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                      currentStep >= stepInfo.step 
                        ? `bg-${stepInfo.color}-600 border-${stepInfo.color}-600 text-white` 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      <span className="text-sm">{stepInfo.icon}</span>
                    </div>
                    <div className="ml-2">
                      <div className={`text-xs font-medium ${
                        currentStep >= stepInfo.step ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        Étape {stepInfo.step}
                      </div>
                      <div className={`text-xs ${
                        currentStep >= stepInfo.step ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {stepInfo.title}
                      </div>
                    </div>
                    {index < 2 && (
                      <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                        currentStep > stepInfo.step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              
              {/* Step 1: Agency Selection */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2">
                      <span className="text-xl">🏢</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">Sélection de l'Agence</h4>
                    <p className="text-xs text-gray-600">Choisissez l'agence de l'expéditeur</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Agence *
                      </label>
                      <select
                        name="agency"
                        value={selectedAgency}
                        onChange={handleAgencyChange}
                        className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        required
                      >
                        <option value="">-- Sélectionner un dépôt --</option>
                        {agencyOptions.map(agency => (
                          <option key={agency} value={agency} className="">
                            {agency}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="bg-blue-50 rounded-md p-2 border border-blue-200">
                        <p className="text-xs text-blue-700 ">
                          Le dépôt détermine les expéditeurs disponibles
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Expediteur Selection */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2">
                      <span className="text-xl">👤</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">Sélection de l'Expéditeur</h4>
                    <p className="text-xs text-gray-600">Choisissez l'expéditeur pour le paiement</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Expéditeur *
                      </label>
              <select 
                name="shipper_id" 
                value={formData.shipper_id} 
                onChange={handleInputChange} 
                        className={`block w-full px-3 py-2 border-2 rounded-md  text-sm transition-all duration-200 ${
                          !selectedAgency 
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                        }`}
                required
                        disabled={!selectedAgency}
                      >
                        <option value="" className="">
                          {selectedAgency ? "-- Sélectionner un expéditeur --" : "-- Sélectionnez d'abord un dépôt --"}
                        </option>
                        {filteredShippers.map(shipper => (
                          <option key={shipper.id} value={shipper.id} className="">
                            {shipper.name || `${shipper.first_name || ''} ${shipper.last_name || ''}`.trim()} - {shipper.email}
                  </option>
                ))}
              </select>
            </div>
                    <div className="flex items-end">
                      <div className="bg-green-50 rounded-md p-2 border border-green-200">
                        <p className="text-xs text-green-700 ">
                          {filteredShippers.length} expéditeur(s) disponible(s) pour ce dépôt
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Details */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-2">
                      <span className="text-xl">💰</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">Détails du Paiement</h4>
                    <p className="text-xs text-gray-600">Remplissez les informations de paiement</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Montant (DT) *
                      </label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleInputChange} 
                step="0.01"
                min="0"
                required
                placeholder="Ex : 250.00" 
                        className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
              />
            </div>
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Date *
                      </label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                required
                        className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
              />
            </div>
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Méthode de paiement *
                      </label>
              <select 
                name="method" 
                value={formData.method} 
                onChange={handleInputChange} 
                required
                        className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400"
                      >
                        <option value="" className="">Sélectionner une méthode</option>
                        <option value="Espèces" className="">💵 Espèces</option>
                        <option value="Paiement avec chèque" className="">📄 Paiement avec chèque</option>
                        <option value="Virements bancaires" className="">🏦 Virements bancaires</option>
              </select>
            </div>
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Référence
                      </label>
              <input 
                type="text" 
                name="reference" 
                value={formData.reference} 
                onChange={handleInputChange} 
                placeholder="Ex : REF-001-2024"
                        className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
              />
            </div>

            {/* Payment Type Specific Fields */}
            {formData.method === 'Paiement avec chèque' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 ">
                    Date du chèque *
                  </label>
                  <input 
                    type="date" 
                    name="check_date" 
                    value={formData.check_date} 
                    onChange={handleInputChange} 
                    required
                    className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 ">
                    N° Chèque *
                  </label>
                  <input 
                    type="text" 
                    name="check_number" 
                    value={formData.check_number} 
                    onChange={handleInputChange} 
                    required
                    placeholder="Ex : CHK-001-2024"
                    className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
                  />
                </div>
              </>
            )}

            {formData.method === 'Virements bancaires' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 ">
                    Date du virement *
                  </label>
                  <input 
                    type="date" 
                    name="transfer_date" 
                    value={formData.transfer_date} 
                    onChange={handleInputChange} 
                    required
                    className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 ">
                    Référence du virement *
                  </label>
                  <input 
                    type="text" 
                    name="transfer_reference" 
                    value={formData.transfer_reference} 
                    onChange={handleInputChange} 
                    required
                    placeholder="Ex : VIR-001-2024"
                    className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
                  />
                </div>
              </>
            )}

            {formData.method === 'Espèces' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 ">
                  Date de paiement *
                </label>
                <input 
                  type="date" 
                  name="cash_date" 
                  value={formData.cash_date} 
                  onChange={handleInputChange} 
                  required
                  className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400" 
                />
              </div>
            )}

            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 ">
                        Statut
                      </label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange} 
                        className="block w-full px-3 py-2 border-2 border-gray-300 rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-gray-400"
                      >
                        <option value="En attente" className="">En attente</option>
                        <option value="Payé" className="">Payé</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Step Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center space-x-1 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Précédent</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Annuler
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-1"
                  >
                    <span>Suivant</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-1"
                  >
                    <span>{editingPayment ? 'Modifier le Paiement' : 'Créer le Paiement'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isFactureOpen}
        onClose={() => {
          setIsFactureOpen(false);
          setFacturePayment(null);
          setFactureData(null);
        }}
        title="Facture du paiement"
        size="xl"
      >
        {facturePayment && (
          <FactureColis {...getFactureData(facturePayment)} />
        )}
        {factureData && !facturePayment && (
          <FactureColis {...factureData} />
        )}
      </Modal>

      {/* New Colis Selection Modal */}
      <ColisSelectionModal
        isOpen={isColisSelectionOpen}
        onClose={() => setIsColisSelectionOpen(false)}
        onConfirm={handleColisSelectionConfirm}
        expediteurId={null}
        expediteurEmail={null}
        shippers={shippers}
      />


    </div>
  );
};

export default PaimentExpediteur; 
