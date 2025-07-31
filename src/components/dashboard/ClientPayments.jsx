import React, { useState } from "react";
import DataTable from "./common/DataTable";
import Modal from "./common/Modal";
import FactureColis from "./FactureColis";

const ClientPayments = () => {
  const [payments, setPayments] = useState([
    {
      id: "PAY001",
      shipper: "Ahmed Mohamed",
      amount: "250,00 DT",
      date: "2024-01-15",
      method: "Virement bancaire",
      reference: "REF-001",
      status: "Payé",
    },
    {
      id: "PAY002",
      shipper: "Ahmed Mohamed",
      amount: "180,00 DT",
      date: "2024-01-14",
      method: "Espèces",
      reference: "REF-002",
      status: "Payé",
    },
    {
      id: "PAY003",
      shipper: "Ahmed Mohamed",
      amount: "320,00 DT",
      date: "2024-01-13",
      method: "Chèque",
      reference: "REF-003",
      status: "En attente",
    },
    {
      id: "PAY004",
      shipper: "Ahmed Mohamed",
      amount: "150,00 DT",
      date: "2024-01-10",
      method: "Virement bancaire",
      reference: "REF-004",
      status: "Payé",
    },
    {
      id: "PAY005",
      shipper: "Ahmed Mohamed",
      amount: "95,00 DT",
      date: "2024-01-08",
      method: "Espèces",
      reference: "REF-005",
      status: "En attente",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
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
      key: "facture",
      header: "Facture",
      render: (_, row) => (
        <button
          onClick={() => { setFacturePayment(row); setIsFactureOpen(true); }}
          className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold"
        >
          Facture
        </button>
      ),
    },
  ];

  // Données mock pour la facture (à remplacer par les vraies données si dispo)
  const getFactureData = (payment) => ({
    colis: {
      code: payment.reference,
      nom: "Colis démo",
      adresse: "Béja centre, Béja",
      poids: "1.00",
    },
    client: {
      nom: payment.shipper,
      tel: "29596971",
    },
    expediteur: {
      nif: "1904056B/NM/000",
      tel: "23613518",
      societe: "Roura ever shop",
      nom: "Sarah Mathlouthi",
      adresse: "33 rue Rabta beb jdidi Tunis",
    },
    prix: {
      livraisonBase: "8.00 DT",
      suppPoids: "0.00 DT",
      suppRapide: "8.00 DT",
      totalLivraison: "8.00 DT",
      ht: "29.17 DT",
      tva: "5.83 DT",
      prixColis: payment.amount,
      ttc: "43.00 DT",
    },
    note: "Le jeudi svp",
    payment: payment // Pass the payment data to the invoice
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Paiements</h1>
          <p className="text-gray-600 mt-1">Historique de vos paiements et transactions</p>
        </div>
      </div>

      <DataTable
        data={payments}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showActions={false}
      />

      <Modal
        isOpen={isFactureOpen}
        onClose={() => setIsFactureOpen(false)}
        title="Facture du paiement"
        size="xl"
      >
        {facturePayment && (
          <FactureColis {...getFactureData(facturePayment)} />
        )}
      </Modal>
    </div>
  );
};

export default ClientPayments; 
