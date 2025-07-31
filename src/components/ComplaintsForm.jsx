import React, { useState } from 'react';
import { apiService } from '../services/api';

const ComplaintsForm = () => {
  const [formData, setFormData] = useState({
    order_number: '',
    email: '',
    full_name: '',
    phone: '',
    subject: '',
    description: '',
    confirm: false
  });
  
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const problemTypes = [
    'Retard de livraison',
    'Mauvais article reçu',
    'Colis endommagé',
    'Problème de facturation',
    'Service client insatisfaisant',
    'Erreur d\'adresse',
    'Autre'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log('Input change:', { name, value, type, checked });
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      console.log('Updated form data:', newData);
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const clearForm = () => {
    setFormData({
      order_number: '',
      email: '',
      full_name: '',
      phone: '',
      subject: '',
      description: '',
      confirm: false
    });
    setAttachments([]);
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    if (!formData.email || !formData.full_name || !formData.subject || !formData.description) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return false;
    }
    
    if (!formData.confirm) {
      setMessage({ type: 'error', text: 'Veuillez confirmer les informations.' });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Veuillez entrer une adresse email valide.' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log('Form data before submission:', formData);
      const complaintData = {
        ...formData,
        attachments
      };
      console.log('Complaint data being sent:', complaintData);
      
      const response = await apiService.createComplaint(complaintData);
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: 'Votre réclamation a été soumise avec succès. Nous vous contacterons dans les plus brefs délais.' 
        });
        clearForm();
      } else {
        setMessage({ 
          type: 'error', 
          text: response.message || 'Une erreur est survenue lors de la soumission.' 
        });
      }
    } catch (error) {
      console.error('Complaint submission error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Une erreur est survenue lors de la soumission. Veuillez réessayer.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-white via-red-50 to-red-50 rounded-3xl p-10 shadow-2xl border border-red-100 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-red-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
            <i className="fas fa-headset text-3xl text-white"></i>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Formulaire de Réclamation</h3>
          <p className="text-gray-600">Nous nous engageons à traiter votre demande dans les plus brefs délais</p>
        </div>

        {/* Message display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span>{message.text}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-receipt text-red-500"></i>
                  Numéro de commande
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="order_number"
                    value={formData.order_number}
                    onChange={handleInputChange}
                    placeholder="QZ-XXXXX" 
                    className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-lg shadow-sm hover:shadow-md" 
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-receipt text-gray-400"></i>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-envelope text-red-500"></i>
                  Email *
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre.email@exemple.com" 
                    className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-lg shadow-sm hover:shadow-md" 
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-user text-red-500"></i>
                  Nom complet *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Votre nom complet" 
                    className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-lg shadow-sm hover:shadow-md" 
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-red-500"></i>
                  Type de problème *
                </label>
                <div className="relative">
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-lg shadow-sm hover:shadow-md appearance-none"
                    required
                  >
                    <option value="">Sélectionner le type de problème</option>
                    {problemTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fas fa-comment-dots text-red-500"></i>
              Détails du problème *
            </label>
            <div className="relative">
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Veuillez fournir des détails sur votre problème..." 
                rows="5" 
                className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-lg shadow-sm hover:shadow-md resize-none" 
                required
              ></textarea>
              <div className="absolute top-5 right-5 pointer-events-none">
                <i className="fas fa-comment-dots text-gray-400"></i>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fas fa-paperclip text-red-500"></i>
              Pièces jointes (optionnel)
            </label>
            <div className="relative">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF jusqu'à 10MB</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {attachments.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Fichiers sélectionnés:</p>
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-file text-red-500"></i>
                        <span>{file.name}</span>
                        <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-2xl border border-red-200">
              <input 
                type="checkbox" 
                id="confirm" 
                name="confirm"
                checked={formData.confirm}
                onChange={handleInputChange}
                className="w-5 h-5 text-red-600 mt-1 rounded focus:ring-red-500" 
                required
              />
              <label htmlFor="confirm" className="text-gray-700 text-sm leading-relaxed">
                <strong>Je confirme</strong> que les informations fournies sont exactes et vraies. 
                J'autorise QuickZone à me contacter pour traiter ma réclamation.
              </label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              type="submit"
              disabled={loading}
              className="group flex-1 relative bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-5 rounded-2xl text-lg font-bold hover:from-red-700 hover:to-red-800 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-xl"></i>
                    <span>Soumission en cours...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane text-xl group-hover:animate-bounce"></i>
                    <span>Soumettre la réclamation</span>
                  </>
                )}
              </div>
            </button>
            <button 
              type="button"
              onClick={clearForm}
              className="flex-1 bg-gray-200 text-gray-700 px-8 py-5 rounded-2xl text-lg font-bold hover:bg-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <i className="fas fa-eraser mr-2"></i>
              Effacer le formulaire
            </button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <i className="fas fa-clock text-red-500"></i>
                <span>Traitement sous 48h</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-shield-alt text-red-500"></i>
                <span>Confidentialité garantie</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintsForm; 
