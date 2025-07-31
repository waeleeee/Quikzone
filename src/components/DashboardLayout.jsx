import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";

const quickToKey = {
  colis: "colis",
  expediteur: "expediteur",
  livreurs: "livreurs",
  reclamation: "reclamation",
  finance: "finance",
};

const DashboardLayout = () => {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.quick && quickToKey[location.state.quick]) {
      setSelectedKey(quickToKey[location.state.quick]);
    }
  }, [location.state]);

  return (
    <div className="dashboard-container">
      <Sidebar onSelect={setSelectedKey} selectedKey={selectedKey} />
      <main className="main-content">
        <Dashboard selectedKey={selectedKey} />
      </main>
    </div>
  );
};

export default DashboardLayout; 
