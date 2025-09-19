import React, { useRef, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { apiService } from '../../services/api';
import Barcode from "react-barcode";
import html2pdf from "html2pdf.js";

const BonLivraisonColis = ({ parcelId, parcelData }) => {
  const { id } = useParams();
  const { user } = useAppStore();
  const [parcel, setParcel] = useState(parcelData || null);
  const [loading, setLoading] = useState(!parcelData);
  const [error, setError] = useState(null);
  const [expediteurData, setExpediteurData] = useState(null);
  
  // Use parcelId prop if provided, otherwise use URL parameter
  const finalParcelId = parcelId || id;
  
  const ref = useRef();
  const exportBtnRef = useRef();

  useEffect(() => {
    const fetchParcelData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching parcel with ID:', finalParcelId);
        
        const parcelData = await apiService.getParcel(finalParcelId);
        console.log('📦 Raw parcel data response:', parcelData);
        
        if (parcelData) {
          console.log('📦 Fetched parcel data:', parcelData);
          setParcel(parcelData);
          
          // Fetch expediteur data after parcel is loaded
          if (parcelData.shipper_id) {
            try {
              const shippersResponse = await apiService.getShippers();
              const expediteur = shippersResponse.find(s => s.id === parcelData.shipper_id);
              
              if (expediteur) {
                // Determine if this is an individual or company expediteur
                const isIndividual = expediteur.identity_number && !expediteur.fiscal_number;
                
                if (isIndividual) {
                  // Individual expediteur (Carte d'identité)
                  setExpediteurData({
                    nom: expediteur.name || 'N/A',
                    societe: expediteur.page_name || 'N/A',
                    matriculeFiscal: expediteur.identity_number || 'N/A',
                    adresse: expediteur.address || 'N/A',
                    tel: expediteur.phone || 'N/A',
                    governorate: expediteur.governorate || 'Tunis',
                    baseDeliveryFee: expediteur.delivery_fees || 8.00
                  });
                } else {
                  // Company expediteur (Patente)
                  setExpediteurData({
                    nom: expediteur.name || 'N/A',
                    societe: expediteur.company_name || expediteur.company || 'N/A',
                    matriculeFiscal: expediteur.fiscal_number || expediteur.tax_number || 'N/A',
                    adresse: expediteur.company_address || 'N/A',
                    tel: expediteur.phone || 'N/A',
                    governorate: expediteur.company_governorate || expediteur.city || 'Tunis',
                    baseDeliveryFee: expediteur.delivery_fees || 8.00
                  });
                }
                console.log('✅ Expediteur data loaded:', expediteurData);
              }
            } catch (error) {
              console.error('Error fetching expediteur data:', error);
            }
          }
        } else {
          console.error('❌ No parcel data returned');
          setError('Failed to fetch parcel data - no data returned');
        }
      } catch (err) {
        console.error('❌ Error fetching parcel:', err);
        setError(`Error loading parcel data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (finalParcelId) {
      console.log('🚀 Starting to fetch parcel data for ID:', finalParcelId);
      fetchParcelData();
    } else {
      console.error('❌ No parcel ID provided');
      setError('No parcel ID provided');
      setLoading(false);
    }
  }, [finalParcelId]);

  // Function to get price based on client name - now uses real data
  const getClientPrice = (clientName) => {
    // If we have real price data, use it
    if (parcel && parcel.price) {
      return parseFloat(parcel.price);
    }
    
    // Fallback to name-based pricing for backward compatibility
    const name = clientName?.toLowerCase();
    if (name === 'sana') return 442;
    if (name === 'nour') return 200;
    if (name === 'achref') return 60;
    return 60; // default
  };

  // Get expediteur data from state or fallback
  const getExpediteurData = () => {
    if (expediteurData) {
      return expediteurData;
    }
    
    // Fallback data if no expediteur found
    return {
      nom: parcel?.shipper_name || "Ritej Chaieb",
      societe: "Zina Wear",
      matriculeFiscal: "14620509",
      adresse: "ksour sef, Mahdia",
      tel: parcel?.shipper_phone || "27107374",
      governorate: "Mahdia",
      baseDeliveryFee: 8.00
    };
  };

  // Get destinataire data from parcel creation form
  const getDestinataireData = () => {
    if (parcel) {
      return {
        nom: parcel.recipient_name || 'N/A',
        tel: parcel.recipient_phone || 'N/A',
        adresse: parcel.recipient_address || 'N/A',
        governorate: parcel.recipient_governorate || 'N/A'
      };
    }
    
    // Fallback data
    return {
      nom: "achref",
      tel: "25598659",
      adresse: "hajeb layoun, kairauan",
      governorate: "Kairouan"
    };
  };

  // Get article name from parcel data (should be stored during creation)
  const getArticleName = () => {
    if (parcel && parcel.article_name) {
      return parcel.article_name;
    }
    if (parcel && parcel.destination) {
      // Fallback: Try to extract article name from destination
      const parts = parcel.destination.split(' - ');
      return parts[0] || parcel.type || "Livraison";
    }
    return "Livraison";
  };

  // Get note/remark from parcel data (should be stored during creation)
  const getNote = () => {
    // This should come from the remark field in the creation form
    return parcel?.remark || parcel?.note || "Livraison";
  };

  const expediteur = getExpediteurData();
  const destinataire = getDestinataireData();
  const clientPrice = getClientPrice(destinataire.nom);
  const clientPriceHT = clientPrice / 1.07; // Remove 7% VAT
  const clientTVA = clientPrice - clientPriceHT;
  const articleName = getArticleName();
  const note = getNote();
  
  // Use the delivery_fees that were calculated during creation
  const deliveryFees = parseFloat(parcel?.delivery_fees) || 8.00;
  
  // Get the expediteur's base delivery fee from the expediteur data
  const getExpediteurBaseFee = () => {
    // Try to get from expediteur data if available
    if (expediteurData && expediteurData.baseDeliveryFee) {
      return parseFloat(expediteurData.baseDeliveryFee);
    }
    
    // Fallback to calculating from the final delivery fees
    const weight = parseFloat(parcel?.weight) || 0;
    const finalFees = parseFloat(parcel?.delivery_fees) || 8.00;
    
    // Reverse calculate the base fee based on weight rules
    if (weight <= 10.99) {
      return finalFees; // Base fee equals final fees for light packages
    } else if (weight > 10.99 && weight <= 15) {
      const surcharge = (weight - 10.99) * 0.9;
      return finalFees - surcharge; // Subtract surcharge to get base fee
    } else if (weight >= 16) {
      return finalFees / 2; // Base fee is half of final fees for heavy packages
    }
    
    return finalFees; // Default fallback
  };
  
  const baseDeliveryFee = getExpediteurBaseFee();
  
  // Calculate weight surcharge based on the same rule
  const calculateWeightSurcharge = () => {
    const weight = parseFloat(parcel?.weight) || 0;
    const base = baseDeliveryFee;
    
    if (weight <= 10.99) return 0;
    if (weight > 10.99 && weight <= 15) {
      return (weight - 10.99) * 0.9;
    }
    if (weight >= 16) {
      return base; // Base price x2 means surcharge = base price
    }
    return 0;
  };
  
  const weightSurcharge = calculateWeightSurcharge();
  
  // Debug nb_pieces
  console.log('🔍 Debug nb_pieces in BonLivraisonColis:', {
    parcel: parcel,
    nb_pieces: parcel?.nb_pieces,
    nb_pieces_type: typeof parcel?.nb_pieces
  });

  // Generate route from real data
  const generateRoute = () => {
    if (parcel) {
      const expediteurGouv = expediteur.governorate || "Tunis";
      const destinataireGouv = destinataire.governorate || "Béja";
      return `${expediteurGouv} >> ---- Dispatch ---- >> ${destinataireGouv}`;
    }
    return "Mahdia >> ---- Dispatch ---- >> Kairouan";
  };

  // Get current date if not provided
  const getCurrentDate = () => {
    let dateStr;
    if (parcel && parcel.created_at) {
      dateStr = parcel.created_at.split('T')[0];
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    // Convert from YYYY-MM-DD to DD-MM-YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  // Get document number from real data
  const getDocNumber = () => {
    if (parcel && parcel.tracking_number) {
      return parcel.tracking_number;
    }
    return "C-000000";
  };

  const handleExportPDF = () => {
    if (ref.current) {
      // Hide the button before export
      if (exportBtnRef.current) exportBtnRef.current.style.display = "none";
      html2pdf().set({
        margin: 0.1,
        filename: `Bon_Livraison_${getDocNumber()}.pdf`,
        html2canvas: { scale: 2 },
        // Export as A4 landscape for horizontal layout with specific dimensions
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "landscape",
          compress: true
        }
      }).from(ref.current).save().then(() => {
        // Show the button again after export
        if (exportBtnRef.current) exportBtnRef.current.style.display = "";
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-red-600">Erreur: {error || 'Parcel not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Export PDF Button */}
      <div className="text-center mb-4">
        <button
          ref={exportBtnRef}
          onClick={handleExportPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exporter en PDF
        </button>
      </div>

      {/* Horizontal Two-Page Container */}
      <div
        ref={ref}
        className="bg-white mx-auto shadow-2xl rounded-lg border border-gray-200 flex"
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          color: '#222', 
          width: '280mm', // Slightly smaller than A4 width to ensure fit
          height: '200mm', // Slightly smaller than A4 height to ensure fit
          maxWidth: '280mm',
          fontSize: '9px',
          lineHeight: '1.2'
        }}
      >
        {/* Left Page - Bon de Livraison */}
        <div 
          className="flex-1 p-3 border-r border-gray-300"
          style={{ width: '140mm' }}
        >
          {/* Header with company logo and invoice info */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <div>
                <img 
                  src="https://raw.githubusercontent.com/waeleeee/Quikzone/main/public/images/quickzonelogo.png" 
                  alt="QuickZone Logo" 
                  className="h-14 w-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="text-sm font-bold text-black" style={{display: 'none'}}>QUICKZONE delivery</div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-semibold text-black mb-2">Facture N°: {getDocNumber()}</div>
              <Barcode value={getDocNumber()} width={2} height={40} fontSize={10} margin={0} />
            </div>
          </div>

          {/* Bon de Livraison section */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col items-center">
              <div className="font-bold text-sm mb-2 text-black">Bon de Livraison</div>
              <div className="text-xs text-black mb-2">Date: {getCurrentDate()}</div>
              <div className="font-bold text-xs mb-2 text-black">{generateRoute()}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm">
                <div className="text-black mb-2 text-center font-bold">Nombre de tentative</div>
                <div className="flex justify-center">
                  <div className="flex space-x-2">
                    <div className="w-7 h-7 border-2 border-gray-400 rounded-full"></div>
                    <div className="w-7 h-7 border-2 border-gray-400 rounded-full"></div>
                    <div className="w-7 h-7 border-2 border-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal line */}
          <div className="border-t border-gray-200 mb-3"></div>

          {/* Main content - Two columns */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Left Column - Expéditeur Details */}
            <div className="border border-gray-200 p-2 rounded">
              <div className="font-bold text-xs mb-2 border-b border-red-300 pb-2 text-black">
                Détails du Expéditeur
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-black">Nom et prénom:</span>
                  <span className="text-black">{expediteur.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-black">Nome de société:</span>
                  <span className="text-black">{expediteur.societe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-black">N°M.Fiscale/N°CIN:</span>
                  <span className="text-black">{expediteur.matriculeFiscal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-black">Adresse:</span>
                  <span className="text-black">{expediteur.adresse},{expediteur.governorate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-black">Numéro téléphone:</span>
                  <span className="text-black">{expediteur.tel}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Colis Details */}
            <div className="border border-gray-200 p-2 rounded">
              <div className="font-bold text-xs mb-2 border-b border-red-300 pb-2 text-black">
                Détails du Colis
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-black flex-shrink-0">Nom de l'article:</span>
                  <span className="text-black text-right ml-2">{articleName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-black flex-shrink-0">Nom du client:</span>
                  <span className="text-black text-right ml-2">{destinataire.nom}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-black flex-shrink-0">Numero telephone:</span>
                  <span className="text-black text-right ml-2">{destinataire.tel}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-black flex-shrink-0">Adresse:</span>
                  <span className="text-black text-right ml-2 break-words" style={{ wordBreak: 'break-word', maxWidth: '65%' }}>{destinataire.adresse}, {destinataire.governorate}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-black flex-shrink-0">Poids:</span>
                  <span className="text-black text-right ml-2">{parcel.weight ? `${parcel.weight} kg` : "1.00 kg"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-black flex-shrink-0">Note:</span>
                  <span className="text-black text-right ml-2">{note}</span>
                </div>

              </div>
            </div>
          </div>

          {/* Horizontal line */}
          <div className="border-t border-gray-200 mb-2"></div>

          {/* Pricing Details */}
          <div className="mb-2">
            <div className="font-bold text-xs mb-2 border-b border-red-300 pb-2 text-black">
              Détails des Prix
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-black">cout de livraison de bas:</span>
                <span className="text-black">{baseDeliveryFee.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">couts supplémentaires (poids):</span>
                <span className="text-black">{weightSurcharge.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-1">
                <span className="text-black">Total frais de livraison TTC:</span>
                <span className="text-red-600">{deliveryFees.toFixed(2)} DT</span>
              </div>
            </div>
          </div>

          {/* Horizontal line */}
          <div className="border-t border-gray-200 mb-2"></div>

          {/* COLIS section */}
          <div className="mb-2">
            <div className="font-bold text-xs mb-2 border-b border-red-300 pb-2 text-black">
              Détails des COLIS 
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-black">TOTAL HT:</span>
                <span className="text-black">{clientPriceHT.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">TVA 7%:</span>
                <span className="text-black">{clientTVA.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-1">
                <span className="text-black">PRIX COLIS TTC:</span>
                <span className="text-red-600">{clientPrice} DT</span>
              </div>
            </div>
          </div>

          {/* Horizontal line */}
          <div className="border-t border-gray-200 mb-2"></div>

          {/* Total Price */}
          <div className="mb-2">
            <div className="flex justify-between font-bold text-sm">
              <span className="text-black">PRIX TOTAL TTC:</span>
              <span className="text-red-600">{(clientPrice + deliveryFees).toFixed(2)} DT</span>
            </div>
          </div>

          {/* Signature */}
          <div className="border border-gray-200 p-2 bg-gray-50 rounded mt-2">
            <div className="font-semibold text-xs text-black mb-1">Signature expéditeur obligatoire:</div>
            <div className="border-b border-gray-300 h-4 mt-1"></div>
          </div>
        </div>

        {/* Right Page - عقد توكيل Contract */}
        <div 
          className="flex-1 p-3"
          style={{ width: '140mm' }}
        >
          <div className="text-right" style={{ direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
            <h2 className="text-lg font-bold mb-4 text-center" style={{ fontSize: '14px' }}>
              عقد توكيل
            </h2>
            <h3 className="text-sm font-bold mb-3" style={{ fontSize: '10px' }}>
              نقل البضائع غير الخاضعة لإجراءات خاصة لحساب الغير عبر الطرقات البرية
            </h3>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              بين الطرفين الممضين اسفله:
            </p>
            
            <p className="text-xs mb-3 font-bold" style={{ fontSize: '8px', lineHeight: '1.4', color: '#000' }}>
              السيد {expediteur.nom} صاحب اسم تجاري أو شركة : {expediteur.societe}
            </p>
            
            <p className="text-xs mb-3 font-bold" style={{ fontSize: '8px', lineHeight: '1.4', color: '#000' }}>
              ذات معرف جبائي رقم {expediteur.matriculeFiscal}
            </p>
            
            <p className="text-xs mb-3 font-bold" style={{ fontSize: '8px', lineHeight: '1.4', color: '#000' }}>
              بعنوان : {expediteur.adresse}, {expediteur.governorate}
            </p>
            
            <p className="text-xs mb-3 text-center font-bold" style={{ fontSize: '8px', lineHeight: '1.4', color: '#000' }}>
              بصفته البائع والعارض لسلع
            </p>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              ثانيا شركة <span className="font-bold px-2">كويك زون (Quick zone)</span> صاحبة المعرف الجبائي رقم :1902505/X 
            </p>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              الكائن مقرها الاجتماعي ب10 شارع أمستردام 2036 سكرة أريانة - تونس
            </p>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              صاحبة الوكالات الفرعية وذات النشاط الأصلي المصرح به لدى السلط الإدارية المعنية "نقل البضائع غير الخاضعة لإجراءات خاصة لحساب الغير عبر الطرقات البرية"،
            </p>
            
            <p className="text-xs mb-3 text-center font-bold" style={{ fontSize: '8px', lineHeight: '1.4', color: '#000' }}>
              بصفتها ناقلة لحساب الغير
            </p>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              حيث ان الطرف الأول يعرض للبيع على موقعه الرقمي الافتراضي او بقاعة العرض الخاصة به بضاعة أو منتوجات للحرفاء، وحيث قام الحريف الشاري بإصدار طلبية لدى البائع، واتفقا على شروطها من حيث الثمن والبضاعة وكلفة النقل، وحيث تتولى شركة كويك زون  بصفتها الناقل المتعاقد مع البائع مهمة إيصال الطلبية الى الشاري في شكل طرد محكم الغلق يحتوي على كل البيانات الخاصة بوصف البضاعة وثمنها وبيانات الحريف وعنوان التسليم في الآجال المتفق عليها، كما تتولى الشركة الناقلة تسليم الطرد للحريف وتتسلم نيابة عن البائع المبلغ المسجل على الطرد بما في ذلك كلفة النقل
            </p>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              وبناء على ذلك اتفق الطرفان على:
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل الأول:</span> تعتبر المقدمة جزء لا يتجزأ من العقد / توكيل
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل الثاني:</span> تتولى الشركة الناقلة المحافظة على الطرود وإيصالها للحرفاء على الحالة التي تسلمتهم عليها وذلك بالعنوان المحدد من طرف البائع بكامل تراب الجمهورية. وعند تعذر تسليم الطرد لاي سبب كان "غياب الحريف او عدم جاهزيته لاستلام الطرد او ... " واستنفاذ كل المحاولات ثلاث مرات ، يقع ارجاع الطرد الى الباعث بصفته البائع.
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل الثالث:</span> تقوم الشركة الناقلة بتسليم الطرد الى الحريف بالعنوان المحدد من طرف البائع، عند تعذر تسليم الطرد لاي سبب كان "غياب الحريف او عدم جاهزيته لاستلام الطرد او ... " واستنفاذ كل المحاولات، يقع ارجاع الطرد الى الباعث بصفته البائع،
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل الرابع:</span> الشركة الناقلة لا تتحمل أية مسؤولية تتعلق بنوع ومواصفات ومحتوى البضاعة داخل الطرد، حيث يحل البائع مكانها عند وجود أي نزاع كان ويتحمل المسؤولية القانونية والجزائية اذا كانت أالبضائع فيها أي ممنوعات كانت .
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل الخامس:</span> يفوض الطرف الأول بصفته البائع الطرف الثاني بصفته ناقل، استلام ثمن الطرد وكلفة النقل وموافقته على عدم تسليم الطرد للحريف الا بعد استيفاء شروط البيع (تسلم كامل المبلغ).
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل السادس:</span> ان امضاء وصل الاستلام من طرف الحريف يعتبر حجة فى تسلمه للطرد وخلاص قيمته ومعلوم النقل الغلق وهو عبارة علي فاتورة رسمية  تحتوي على كل البيانات الخاصة بوصف البضاعة وثمنها وبيانات الحريف وعنوان التسليم في الآجال المتفق عليها، كما تتولى الشركة الناقلة تسليم الطرد للحريف وتتسلم نيابة عن البائع المبلغ المسجل على الطرد بما في ذلك كلفة النقل .
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل السابع:</span> في صورة توفر حالة من حالات القوة القاهرة التي تحول دون تسليم الطرد، يقوم الناقل بالتنسيق مع الحريف لإيجاد حل، وعند ثبوت ضياع او تلف للطرد، يلجأ الطرفان (البائع والناقل) للتعويض المادي وفق الشروط المتفق عليها.
            </p>
            
            <p className="text-xs mb-2" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">الفصل الثامن:</span> يلتزم الطرفان بفض كل خلاف يطرأ بينهما بشكل ودي. وفي حال استعصى الامر، يتم الالتجاء لمحاكم ولاية اريانة لفض النزاع.
            </p>
            
            <p className="text-xs mb-3" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <span className="font-bold">المراجع القانونية التونسية :</span>
            </p>
            
            <p className="text-xs mb-1" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              * القانون عدد 33 لسنة 2004 مؤرخ في 19 أفريل 2004، الفصل 37،
            </p>
            
            <p className="text-xs mb-1" style={{ fontSize: '8px', lineHeight: '1.4' }}>
              ** أحكام الفصل 18 من مجلة الأداء على القيمة المضافة المتعلق بالوثائق المصاحبة لعملية نقل البضائع في إطار عملية البيع عن بعد من خلال موقع واب او صفحة تهم البائع
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonLivraisonColis; 
