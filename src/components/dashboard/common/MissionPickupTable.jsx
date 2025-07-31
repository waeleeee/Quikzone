import React from "react";
import DataTable from "./DataTable";

const statusColors = {
  "En attente": "bg-yellow-100 text-yellow-800",
  "Au dépôt": "bg-blue-100 text-blue-800",
  "En cours": "bg-purple-100 text-purple-800",
  "RTN dépot": "bg-orange-100 text-orange-800",
  "Livés": "bg-green-100 text-green-800",
  "Livrés payés": "bg-emerald-100 text-emerald-800",
  "Retour définitif": "bg-red-100 text-red-800",
  "RTN client dépôt": "bg-pink-100 text-pink-800",
  "Retour Expéditeur": "bg-gray-100 text-gray-800",
  "Retour En Cours d'expédition": "bg-indigo-100 text-indigo-800",
  "Retour reçu": "bg-cyan-100 text-cyan-800",
  "Accepté par livreur": "bg-green-50 text-green-700 border-green-300",
  "Refusé par livreur": "bg-red-50 text-red-700 border-red-300",
  "En cours de ramassage": "bg-orange-100 text-orange-800",
  "Ramassage terminé": "bg-blue-100 text-blue-800",
  "Mission terminée": "bg-green-100 text-green-800",
};

const MissionPickupTable = ({ missions, onView, onEdit, onDelete, searchTerm, onSearchChange, securityCodes = {} }) => {
  const columns = [
    { key: "mission_number", header: "N° Mission" },
    { 
      key: "driver", 
      header: "Livreur",
      render: (driver) => driver?.name || "Non assigné"
    },
    { 
      key: "shipper", 
      header: "Expéditeur",
      render: (shipper) => shipper?.name || "Non assigné"
    },
    {
      key: "parcels",
      header: "Colis",
      render: (parcels) => (
        <span className="text-xs text-gray-700">{parcels?.map(c => c.id).join(", ") || "Aucun colis"}</span>
      ),
    },
    { 
      key: "scheduled_time", 
      header: "Date prévue",
      render: (date) => new Date(date).toLocaleString('fr-FR')
    },
    {
      key: "status",
      header: "Statut",
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
          {value}
        </span>
      ),
    },
    {
      key: "security_code",
      header: "Code de Sécurité",
      render: (_, mission) => {
        const code = securityCodes[mission.id];
        if (!code) return <span className="text-gray-400 text-xs">Non généré</span>;
        return (
          <div className="flex items-center space-x-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800">
              {code}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(code);
              }}
              className="text-blue-600 hover:text-blue-800 text-xs"
              title="Copier le code"
            >
              📋
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={missions}
      columns={columns}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      showActions={true}
      onEdit={onEdit}
      onDelete={onDelete}
      onRowClick={onView}
    />
  );
};

export default MissionPickupTable; 
