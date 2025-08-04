import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasAccess } from "../config/permissions.jsx";
import DashboardHome from "./dashboard/DashboardHome";
import Administration from "./dashboard/Administration";
import Commercial from "./dashboard/Commercial";
import CommercialProfile from "./dashboard/CommercialProfile";
import Finance from "./dashboard/Finance";
import ChefAgence from "./dashboard/ChefAgence";
import MembreAgence from "./dashboard/MembreAgence";
import MembreAgenceManagement from "./dashboard/MembreAgenceManagement";
import Livreurs from "./dashboard/Livreurs";
import LivreurDashboard from "./dashboard/LivreurDashboard";
import Expediteur from "./dashboard/Expediteur";
import Colis from "./dashboard/Colis";
import ColisClient from "./dashboard/ColisClient";
import Pickup from "./dashboard/Pickup";
import PickupDepot from "./dashboard/PickupDepot";
import PickupClient from "./dashboard/PickupClient";
import LivreurDeliveryMissions from "./dashboard/LivreurDeliveryMissions";
import LivreurPickupMissions from "./dashboard/LivreurPickupMissions";
import Secteurs from "./dashboard/Secteurs";
import Entrepots from "./dashboard/Entrepots";
import PaimentExpediteur from "./dashboard/PaimentExpediteur";
import CommercialPayments from "./dashboard/CommercialPayments";
import ClientPayments from "./dashboard/ClientPayments";
import Reclamation from "./dashboard/Reclamation";
import Demande from "./dashboard/Demande";
import PickupMissions from "./dashboard/PickupMissions";

const Dashboard = ({ selectedKey = "dashboard" }) => {
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user;
  });

  // Check if user has access to the selected module
  const checkAccess = (module, subModule = null) => {
    if (!currentUser || !currentUser.role) {
      return false;
    }
    return hasAccess(currentUser.role, module, subModule);
  };

  const renderContent = () => {
    // Dashboard home - accessible to all roles
    if (selectedKey === "dashboard") {
      // Show specialized dashboards for specific roles
      if (currentUser?.role === "Livreurs") {
        return <LivreurDashboard />;
      }
      if (currentUser?.role === "Membre de l'agence") {
        return <MembreAgence />;
      }
      return <DashboardHome />;
    }

    // Personnel management - check specific sub-module access
    if (selectedKey === "administration" && checkAccess("personnel", "administration")) {
      return <Administration />;
    }
    if (selectedKey === "commercial" && checkAccess("personnel", "commercial")) {
      // Show CommercialProfile for Commercial users, Commercial management for admins
      if (currentUser?.role === "Commercial") {
        return <CommercialProfile />;
      } else {
        return <Commercial />;
      }
    }
    if (selectedKey === "finance" && checkAccess("personnel", "finance")) {
      return <Finance />;
    }
    if (selectedKey === "chef_agence" && checkAccess("personnel", "chef_agence")) {
      return <ChefAgence />;
    }
    if (selectedKey === "membre_agence" && checkAccess("personnel", "membre_agence")) {
      // Admin and Chef d'agence get the management component, Membre de l'agence gets their dashboard
      if (currentUser?.role === "Administration" || currentUser?.role === "Admin" || currentUser?.role === "Chef d'agence") {
        return <MembreAgenceManagement />;
      } else {
        return <MembreAgence />;
      }
    }
    if (selectedKey === "livreurs" && checkAccess("personnel", "livreurs")) {
      return <Livreurs />;
    }

    // Main modules - check module access
    if (selectedKey === "expediteur" && checkAccess("expediteur")) {
      return <Expediteur />;
    }
    if (selectedKey === "colis" && checkAccess("colis")) {
      // Use specialized component for Expéditeur role
      if (currentUser?.role === "Expéditeur") {
        return <ColisClient />;
      }
      return <Colis />;
    }
    if (selectedKey === "pickup" && checkAccess("pickup")) {
      // For Livreurs, show their own dashboard instead of admin pickup
      if (currentUser?.role === "Livreurs") {
        return <LivreurDashboard />;
      }
      return <Pickup />;
    }
    if (selectedKey === "pickup_client" && checkAccess("pickup_client")) {
      return <PickupClient />;
    }
    if (selectedKey === "delivery_missions" && checkAccess("delivery_missions")) {
      return <LivreurDeliveryMissions />;
    }
    if (selectedKey === "pickup_missions" && checkAccess("pickup_missions")) {
      return <LivreurPickupMissions />;
    }
    if (selectedKey === "pickup_depot" && checkAccess("pickup")) {
      return <PickupDepot />;
    }
    if (selectedKey === "secteurs" && checkAccess("secteurs")) {
      return <Secteurs />;
    }
    if (selectedKey === "entrepots" && checkAccess("entrepots")) {
      return <Entrepots />;
    }
    if (selectedKey === "paiment_expediteur" && checkAccess("paiment_expediteur")) {
      return <PaimentExpediteur />;
    }
    if (selectedKey === "commercial_payments" && checkAccess("commercial_payments")) {
      return <CommercialPayments />;
    }
    if (selectedKey === "reclamation" && checkAccess("reclamation")) {
      return <Reclamation />;
    }
    if (selectedKey === "demande" && checkAccess("demands")) {
      return <Demande />;
    }
    // pickup_missions is handled above for livreurs

    // Default fallback - show dashboard home
    return <DashboardHome />;
  };

  return (
    <div className="dashboard-content">
      {renderContent()}
    </div>
  );
};

export default Dashboard; 
