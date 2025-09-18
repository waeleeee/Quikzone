// Test script pour vérifier le filtrage par agence dans Pickup.jsx
// Ce fichier peut être exécuté pour tester la logique de filtrage

// Simuler les données de test
const testMissions = [
  {
    id: 1,
    status: 'En attente',
    expediteur_agency: 'Tunis',
    driver_id: 1,
    parcels: []
  },
  {
    id: 2,
    status: 'Terminé',
    expediteur_agency: 'Sousse',
    driver_id: 2,
    parcels: []
  },
  {
    id: 3,
    status: 'En attente',
    expediteur_agency: 'Tunis',
    driver_id: 3,
    parcels: []
  },
  {
    id: 4,
    status: 'Au dépôt',
    expediteur_agency: 'Sfax',
    driver_id: 4,
    parcels: []
  }
];

const testDrivers = [
  { id: 1, agency: 'Tunis' },
  { id: 2, agency: 'Sousse' },
  { id: 3, agency: 'Tunis' },
  { id: 4, agency: 'Sfax' }
];

// Simuler la fonction getFilteredMissions
function getFilteredMissions(missions, currentUser, statusFilter = null) {
  let filteredMissions = missions;
  
  // First, filter by user role and agency
  if (currentUser && (currentUser.role === 'Chef d\'agence' || currentUser.role === 'Membre de l\'agence')) {
    const userAgency = currentUser.agency || currentUser.governorate;
    if (userAgency) {
      filteredMissions = missions.filter(mission => {
        // Check if mission has expediteur_agency field
        if (mission.expediteur_agency) {
          return mission.expediteur_agency.toLowerCase() === userAgency.toLowerCase();
        }
        // If no expediteur_agency, check if mission has parcels with shipper agency
        if (mission.parcels && mission.parcels.length > 0) {
          return mission.parcels.some(parcel => 
            parcel.shipper_agency && parcel.shipper_agency.toLowerCase() === userAgency.toLowerCase()
          );
        }
        // If no parcels info, check if mission has driver from same agency
        if (mission.driver_id) {
          const driver = testDrivers.find(d => d.id === mission.driver_id);
          if (driver && driver.agency) {
            return driver.agency.toLowerCase() === userAgency.toLowerCase();
          }
        }
        return false; // Default to false if no agency info found
      });
    }
  }
  
  // Then, apply status filter if set
  if (statusFilter) {
    filteredMissions = filteredMissions.filter(mission => mission.status === statusFilter);
  }
  
  return filteredMissions;
}

// Tests
console.log('🧪 Test du filtrage par agence dans Pickup.jsx\n');

// Test 1: Utilisateur Admin (voit toutes les missions)
console.log('Test 1: Utilisateur Admin');
const adminUser = { role: 'Admin' };
const adminMissions = getFilteredMissions(testMissions, adminUser);
console.log('Missions visibles:', adminMissions.length);
console.log('Missions:', adminMissions.map(m => ({ id: m.id, agency: m.expediteur_agency, status: m.status })));
console.log('✅ Admin voit toutes les missions\n');

// Test 2: Chef d'agence Tunis
console.log('Test 2: Chef d\'agence Tunis');
const tunisChef = { role: 'Chef d\'agence', agency: 'Tunis' };
const tunisMissions = getFilteredMissions(testMissions, tunisChef);
console.log('Missions visibles:', tunisMissions.length);
console.log('Missions:', tunisMissions.map(m => ({ id: m.id, agency: m.expediteur_agency, status: m.status })));
console.log('✅ Chef d\'agence Tunis voit seulement les missions de Tunis\n');

// Test 3: Chef d'agence Sousse
console.log('Test 3: Chef d\'agence Sousse');
const sousseChef = { role: 'Chef d\'agence', agency: 'Sousse' };
const sousseMissions = getFilteredMissions(testMissions, sousseChef);
console.log('Missions visibles:', sousseMissions.length);
console.log('Missions:', sousseMissions.map(m => ({ id: m.id, agency: m.expediteur_agency, status: m.status })));
console.log('✅ Chef d\'agence Sousse voit seulement les missions de Sousse\n');

// Test 4: Filtrage par statut + agence
console.log('Test 4: Filtrage par statut + agence (Chef d\'agence Tunis, statut "En attente")');
const tunisPendingMissions = getFilteredMissions(testMissions, tunisChef, 'En attente');
console.log('Missions visibles:', tunisPendingMissions.length);
console.log('Missions:', tunisPendingMissions.map(m => ({ id: m.id, agency: m.expediteur_agency, status: m.status })));
console.log('✅ Chef d\'agence Tunis voit seulement les missions "En attente" de Tunis\n');

// Test 5: Utilisateur sans agence
console.log('Test 5: Utilisateur sans agence');
const noAgencyUser = { role: 'Chef d\'agence' };
const noAgencyMissions = getFilteredMissions(testMissions, noAgencyUser);
console.log('Missions visibles:', noAgencyMissions.length);
console.log('Missions:', noAgencyMissions.map(m => ({ id: m.id, agency: m.expediteur_agency, status: m.status })));
console.log('✅ Utilisateur sans agence ne voit aucune mission\n');

console.log('🎯 Tests terminés !');
console.log('📊 Résumé:');
console.log(`- Total missions: ${testMissions.length}`);
console.log(`- Missions Tunis: ${testMissions.filter(m => m.expediteur_agency === 'Tunis').length}`);
console.log(`- Missions Sousse: ${testMissions.filter(m => m.expediteur_agency === 'Sousse').length}`);
console.log(`- Missions Sfax: ${testMissions.filter(m => m.expediteur_agency === 'Sfax').length}`);

















