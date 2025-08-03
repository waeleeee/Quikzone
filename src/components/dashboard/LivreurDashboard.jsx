import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import LivreurBarcodeScan from "./LivreurBarcodeScan";
import { missionsPickupService, deliveryMissionsService, apiService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Status mapping and helper functions
const statusMapping = {
  "En attente": "En attente",
  "À enlever": "À enlever",
  "Enlevé": "Enlevé",
  "Au dépôt": "Au dépôt",
  "Mission terminée": "Au dépôt",
  "Refusé par livreur": "Refusé par livreur"
};

const statusBadge = (status) => {
  const colorMap = {
    "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "À enlever": "bg-blue-100 text-blue-800 border-blue-300",
    "Enlevé": "bg-green-100 text-green-800 border-green-300",
    "Au dépôt": "bg-purple-100 text-purple-800 border-purple-300",
    "Refusé par livreur": "bg-red-50 text-red-700 border-red-300",
  };
  return <span className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>{status}</span>;
};

const LivreurDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [livreurProfile, setLivreurProfile] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMission, setSelectedMission] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanningMission, setScanningMission] = useState(null);

  // Fetch user and profile data
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!user) {
          console.error('No user found in localStorage');
          return;
        }
        
        setCurrentUser(user);
        
        // Fetch livreur profile
        const drivers = await apiService.getDrivers();
        const livreur = drivers.find(driver => driver.email === user.email);
        
        if (livreur) {
          setLivreurProfile(livreur);
        } else {
          setLivreurProfile({
            name: user.name || user.firstName + ' ' + user.lastName,
            email: user.email,
            phone: user.phone || 'N/A',
            driving_license: user.driving_license || 'N/A',
            car_type: user.car_type || 'N/A',
            car_number: user.car_number || 'N/A',
            agency: user.agency || 'Siège'
          });
        }
      } catch (error) {
        console.error('Error fetching user and profile:', error);
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null') || {
          name: "Livreur",
          email: "livreur@quickzone.tn",
          role: "Livreurs"
        };
        setCurrentUser(user);
        setLivreurProfile({
          name: user.name,
          email: user.email,
          phone: 'N/A',
          driving_license: 'N/A',
          car_type: 'N/A',
          car_number: 'N/A',
          agency: 'Siège'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []);

  // Fetch missions
  useEffect(() => {
    const fetchMissions = async () => {
      if (!currentUser?.email) return;
      
      try {
        const response = await missionsPickupService.getMissionsPickup();
        let allMissions = [];
        
        if (Array.isArray(response)) {
          allMissions = response;
        } else if (response.success && response.data) {
          allMissions = response.data;
        }
        
        // Filter missions for this driver
        const driverMissions = allMissions.filter(mission => {
          const driverName = mission.driver?.name || mission.driver_name || '';
          const driverEmail = mission.driver?.email || mission.driver_email || '';
          const matchesName = driverName.toLowerCase().includes(livreurProfile?.name?.toLowerCase() || '');
          const matchesEmail = driverEmail.toLowerCase() === currentUser.email.toLowerCase();
          return matchesName || matchesEmail;
        });
        
        setMissions(driverMissions);
      } catch (error) {
        console.error('Error fetching missions:', error);
        setMissions([]);
      }
    };

    fetchMissions();
  }, [currentUser?.email, livreurProfile?.name]);

  // Calculate statistics
  const totalMissions = missions.length;
  const pendingMissions = missions.filter(m => m.status === "En attente").length;
  const acceptedMissions = missions.filter(m => m.status === "À enlever").length;
  const inProgressMissions = missions.filter(m => m.status === "Enlevé").length;
  const completedMissions = missions.filter(m => m.status === "Au dépôt").length;

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handlePickupAction = async (missionId, action) => {
    try {
      const frenchStatus = action === "accept" ? "À enlever" : "Refusé par livreur";
      const dbStatus = statusMapping[frenchStatus];
      
      const response = await missionsPickupService.updateMissionPickup(missionId, { status: dbStatus });
      
      if (response.data) {
        setMissions((prevMissions) =>
          prevMissions.map((m) => m.id === missionId ? response.data : m)
        );
      }
      
      alert(`Mission ${action === 'accept' ? 'acceptée' : 'refusée'} avec succès!`);
    } catch (error) {
      console.error('Error updating mission status:', error);
      alert('Erreur lors de la mise à jour du statut de la mission');
    }
  };

  const handleStartScanning = (mission) => {
    setScanningMission(mission);
    setShowScanModal(true);
  };

  const handleCompleteScanning = async () => {
    try {
      const response = await missionsPickupService.updateMissionPickup(scanningMission.id, { status: "Enlevé" });
      
      if (response.data) {
        setMissions((prevMissions) =>
          prevMissions.map((mission) =>
            mission.id === scanningMission.id ? response.data : mission
          )
        );
      }
      
      setShowScanModal(false);
      setScanningMission(null);
      alert('Mission mise à jour: Enlevé');
    } catch (error) {
      console.error('Error completing scanning:', error);
      alert('Erreur lors de la mise à jour de la mission');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement du profil...
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !livreurProfile) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-gray-500">
            Impossible de charger les informations du livreur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <img src="/images/quickzonelogo.png" alt="QuickZone" className="h-8 w-auto" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-red-600">QUICKZONE delivery</h1>
              <p className="text-xs text-gray-500">Système de Gestion</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">
                  {livreurProfile?.name?.charAt(0)?.toUpperCase() || 'L'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{livreurProfile?.name || 'Livreur'}</h3>
                <p className="text-sm text-gray-600">{livreurProfile?.email || 'livreur@quickzone.tn'}</p>
                <p className="text-xs text-red-600 font-medium">{currentUser?.role || 'Livreurs'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-6 flex-1">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">Tableau de Bord</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'missions'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">Missions de Livraison</span>
            </button>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">
                    {livreurProfile?.name?.charAt(0)?.toUpperCase() || 'L'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{livreurProfile?.name || 'Livreur'}</h2>
                  <p className="text-sm text-gray-600">{currentUser?.role || 'Livreurs'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {livreurProfile?.email || 'livreur@quickzone.tn'}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {livreurProfile?.phone || 'N/A'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Permis de conduire</div>
              <div className="text-lg font-bold text-blue-600">{livreurProfile?.driving_license || 'N/A'}</div>
              <div className="text-sm text-gray-500 mt-1">Véhicule</div>
              <div className="text-sm font-medium text-gray-700">
                {livreurProfile?.car_type || 'N/A'} - {livreurProfile?.car_number || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dashboard'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tableau de Bord
                </button>
                <button
                  onClick={() => setActiveTab('missions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'missions'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mes Missions ({totalMissions})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Missions */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-90">Total Missions</p>
                          <p className="text-2xl font-bold">{totalMissions}</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-25 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">📋</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-75 flex items-center justify-between">
                        <span>Cliquez pour voir toutes</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* En Attente */}
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-xl shadow-lg text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-90">En Attente</p>
                          <p className="text-2xl font-bold">{pendingMissions}</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-25 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">⏰</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-75 flex items-center justify-between">
                        <span>Cliquez pour voir</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* À enlever */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl shadow-lg text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-90">À enlever</p>
                          <p className="text-2xl font-bold">{acceptedMissions}</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-25 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">✅</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-75 flex items-center justify-between">
                        <span>Cliquez pour voir</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Enlevé */}
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-90">Enlevé</p>
                          <p className="text-2xl font-bold">{inProgressMissions}</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-25 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">⚡</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-75 flex items-center justify-between">
                        <span>Cliquez pour voir</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Terminées */}
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium opacity-90">Terminées</p>
                          <p className="text-2xl font-bold">{completedMissions}</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-25 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">🎯</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-75 flex items-center justify-between">
                        <span>Cliquez pour voir</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Recent Missions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Missions Récentes</h3>
                    {missions.slice(0, 3).map((mission) => (
                      <div key={mission.id} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Mission #{mission.mission_number || mission.id}</h4>
                            <p className="text-sm text-gray-600">{mission.shipper?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{mission.scheduled_time}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {statusBadge(mission.status)}
                            <button
                              onClick={() => setSelectedMission(mission)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {missions.length === 0 && (
                      <p className="text-gray-500 text-center py-4">Aucune mission récente</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'missions' && (
                <div className="space-y-4">
                  {/* Missions Table */}
                  {missions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission trouvée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Aucune mission de ramassage ne vous a été assignée pour le moment.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mission</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Colis</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {missions.map((mission) => (
                            <tr key={mission.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {mission.mission_number || mission.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{statusBadge(mission.status)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {mission.scheduled_time}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {mission.shipper?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                                {mission.shipper?.address || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {mission.parcels?.length || 0} colis
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {(mission.status === "En attente") && (
                                    <>
                                      <button
                                        onClick={() => handlePickupAction(mission.id, "accept")}
                                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold"
                                        title="Accepter la mission"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => handlePickupAction(mission.id, "refuse")}
                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold"
                                        title="Refuser la mission"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  )}
                                  
                                  {(mission.status === "À enlever") && (
                                    <button
                                      onClick={() => handleStartScanning(mission)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold"
                                      title="Scanner les colis"
                                    >
                                      📱
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => setSelectedMission(mission)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                    title="Voir les détails"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mission Details Modal */}
      <Modal
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        title={selectedMission ? `Détail de la mission #${selectedMission.mission_number || selectedMission.id}` : ""}
        size="lg"
      >
        {selectedMission && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-700 mb-2">Statut :</div>
                {statusBadge(selectedMission.status)}
              </div>
              <div className="flex space-x-2">
                {(selectedMission.status === "En attente") && (
                  <>
                    <button
                      onClick={() => handlePickupAction(selectedMission.id, "accept")}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold"
                    >
                      Accepter la mission
                    </button>
                    <button
                      onClick={() => handlePickupAction(selectedMission.id, "refuse")}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold"
                    >
                      Refuser la mission
                    </button>
                  </>
                )}
                {(selectedMission.status === "À enlever") && (
                  <button
                    onClick={() => handleStartScanning(selectedMission)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    📱 Scanner les colis
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-gray-700">Date prévue :</div>
                <div className="text-sm">{selectedMission.scheduled_time}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Téléphone :</div>
                <div className="text-sm">{selectedMission.shipper?.phone || 'N/A'}</div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-700">Expéditeur :</div>
              <div className="text-sm">{selectedMission.shipper?.name || 'N/A'}</div>
              <div className="font-semibold text-gray-700 mt-2">Adresse :</div>
              <div className="text-sm">
                {selectedMission.shipper?.address || 'N/A'}
              </div>
            </div>

            <div>
              <div className="font-semibold text-gray-700 mb-3">Colis associés ({selectedMission.parcels?.length || 0}) :</div>
              <div className="space-y-2">
                {selectedMission.parcels?.map((parcel) => (
                  <div key={parcel.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm">{parcel.recipient_name || parcel.destination || 'Colis sans nom'}</span>
                          {statusBadge(parcel.status)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {parcel.destination || 'Destination non spécifiée'}
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-gray-500 text-sm">Aucun colis associé à cette mission</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Barcode Scanning Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setScanningMission(null);
        }}
        title="Scanner les colis"
        size="xl"
      >
        {scanningMission && (
          <LivreurBarcodeScan
            mission={scanningMission}
            onScan={(parcelId, barcode) => {
              console.log('Parcel scanned:', parcelId, barcode);
            }}
            onClose={() => {
              handleCompleteScanning();
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default LivreurDashboard; 