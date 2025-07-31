import React from 'react';

// Role-based Access Control Configuration
export const ROLE_PERMISSIONS = {
  // ADMINISTRATION - Full access to everything
  'Administration': {
    dashboard: true,
    personnel: {
      administration: true,
      commercial: true,
      finance: true,
      chef_agence: true,
      membre_agence: true,
      livreurs: true
    },
    expediteur: true,
    colis: true,
    pickup: true,
    pickup_client: true,
    secteurs: true,
    entrepots: true,
    paiment_expediteur: true,
    reclamation: true,
    commercial_payments: true // Add access to commercial payments management
  },

  // COMMERCIAL - Access to their own data and related modules
  'Commercial': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: false,
      chef_agence: false,
      membre_agence: false,
      livreurs: false
    },
    expediteur: true,
    colis: false,
    pickup: false,
    secteurs: false,
    entrepots: false,
    paiment_expediteur: true,
    reclamation: true,
    commercial_payments: true
  },

  // FINANCE - Access to financial operations
  'Finance': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: false, // Can manage finance team
      chef_agence: false,
      membre_agence: false,
      livreurs: false
    },
    expediteur: false, // Limited access to client financial data
    colis: false, // Limited access to billing info
    pickup: false, // Limited access to costs
    secteurs: false, // Limited access to financial data
    entrepots: false, // Limited access to costs
    paiment_expediteur: true, // Full access to payments
    reclamation: false // Limited access to financial complaints
  },

  // COMPTABLE - Access to financial operations (same as Finance)
  'Comptable': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: true, // Can manage finance team
      chef_agence: false,
      membre_agence: false,
      livreurs: false
    },
    expediteur: false, // Limited access to client financial data
    colis: false, // Limited access to billing info
    pickup: false, // Limited access to costs
    secteurs: false, // Limited access to financial data
    entrepots: false, // Limited access to costs
    paiment_expediteur: true, // Full access to payments
    reclamation: false // Limited access to financial complaints
  },

  // CHEF D'AGENCE - Access to operational management
  'Chef d\'agence': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: false,
      chef_agence: false, // Can manage their team
      membre_agence: true, // Can manage agency members
      livreurs: true // Can manage drivers
    },
    expediteur: true, // Can manage clients in their agency
    colis: true, // Can manage parcels in their agency
    pickup: true, // Full access to pickup missions
    pickup_client: true, // Full access to delivery missions
    secteurs: true, // Can manage sectors in their agency
    entrepots: true, // Can manage local warehouses
    paiment_expediteur: true, // Limited access
    reclamation: true // Can manage complaints in their agency
  },

  // MEMBRE DE L'AGENCE - Access to daily operations
  'Membre de l\'agence': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: false,
      chef_agence: false,
      membre_agence: false, // Can only see their own profile
      livreurs: false
    },
    expediteur: false, // Limited access to view clients
    colis: true, // Full access to manage parcels
    pickup: true, // Can view and manage pickup missions
    pickup_client: true, // Can view and manage delivery missions
    secteurs: false, // Limited access
    entrepots: false, // Limited access
    paiment_expediteur: false, // Limited access
    reclamation: true // Full access to manage complaints
  },

  // LIVREURS - Limited access for delivery operations
  'Livreurs': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: false,
      chef_agence: false,
      membre_agence: false,
      livreurs: false // Can only see their own profile
    },
    expediteur: false, // Limited access
    colis: false, // Limited access to view parcels for delivery
    pickup: false, // No pickup menu - they see missions in their dashboard
    pickup_client: false, // No pickup client menu - they see delivery missions separately
    delivery_missions: true, // Can access delivery missions page
    secteurs: false, // Limited access
    entrepots: false, // Limited access
    paiment_expediteur: false, // No access
    reclamation: false // Limited access to view complaints
  },

  // EXPÉDITEUR (CLIENT) - Client access for tracking parcels
  'Expéditeur': {
    dashboard: true,
    personnel: {
      administration: false,
      commercial: false,
      finance: false,
      chef_agence: false,
      membre_agence: false,
      livreurs: false
    },
    expediteur: false, // Cannot manage other clients
    colis: true, // Can track their own parcels
    pickup: false, // Cannot see pickup missions
    secteurs: false, // Limited access
    entrepots: false, // Limited access
    paiment_expediteur: true, // Can view their payment history
    reclamation: true // Can create and track complaints
  }
};

// Helper function to check if user has access to a specific module
export const hasAccess = (userRole, module, subModule = null) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) {
    console.warn(`No permissions found for role: ${userRole}`);
    return false;
  }

  if (subModule) {
    return permissions[module] && permissions[module][subModule];
  }

  return permissions[module];
};

// Helper function to get filtered menu based on user role
export const getFilteredMenu = (userRole) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) {
    console.warn(`No permissions found for role: ${userRole}`);
    return [];
  }

  // Base menu structure
  const baseMenu = [
    {
      label: "Tableau de Bord",
      key: "dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
    }
  ];

  // Add Personnel section if user has any personnel access
  if (permissions.personnel && Object.values(permissions.personnel).some(Boolean)) {
    const personnelChildren = [];
    
    if (permissions.personnel.administration) {
      personnelChildren.push({
        label: "Administration",
        key: "administration",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      });
    }

    if (permissions.personnel.commercial) {
      personnelChildren.push({
        label: "Commercial",
        key: "commercial",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      });
    }

    if (permissions.personnel.finance) {
      personnelChildren.push({
        label: "Finance",
        key: "finance",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      });
    }

    if (permissions.personnel.chef_agence) {
      personnelChildren.push({
        label: "Chef d'agence",
        key: "chef_agence",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      });
    }

    if (permissions.personnel.membre_agence) {
      personnelChildren.push({
        label: "Membre de l'agence",
        key: "membre_agence",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      });
    }

    if (permissions.personnel.livreurs) {
      personnelChildren.push({
        label: "Livreurs",
        key: "livreurs",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      });
    }

    baseMenu.push({
      label: "Personnel",
      key: "personnel",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      children: personnelChildren
    });
  }

  // Add main modules
  if (permissions.expediteur) {
    baseMenu.push({
      label: "Expéditeur",
      key: "expediteur",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    });
  }

  if (permissions.colis) {
    baseMenu.push({
      label: "Colis",
      key: "colis",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    });
  }

  if (permissions.pickup) {
    baseMenu.push({
      label: "Pickup",
      key: "pickup",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    });
  }

  if (permissions.pickup_client) {
    baseMenu.push({
      label: "Mission Livraison",
      key: "pickup_client",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    });
  }

  // Add delivery missions for livreurs
  if (permissions.delivery_missions) {
    baseMenu.push({
      label: "Missions de Livraison",
      key: "delivery_missions",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    });
  }

  if (permissions.secteurs) {
    baseMenu.push({
      label: "Secteurs",
      key: "secteurs",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    });
  }

  if (permissions.entrepots) {
    baseMenu.push({
      label: "Entrepôts",
      key: "entrepots",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    });
  }

  if (permissions.paiment_expediteur) {
    baseMenu.push({
      label: "Paiements Expéditeurs",
      key: "paiment_expediteur",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    });
  }

  if (permissions.commercial_payments) {
    baseMenu.push({
      label: "Paiements Commerciaux",
      key: "commercial_payments",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    });
  }

  if (permissions.reclamation) {
    baseMenu.push({
      label: "Réclamations",
      key: "reclamation",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    });
  }

  return baseMenu;
}; 