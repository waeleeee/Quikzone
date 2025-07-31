import React, { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import { apiService } from "../../services/api";

const DashboardReport = ({ isOpen, onClose, currentUser, roleSpecificStats, expediteurStats, expediteurChartData, adminChartData, chefAgenceStats }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Helper function to format numbers with 3 digits before and after decimal
  const formatRevenue = (value) => {
    if (!value || value === 0) return "000.000";
    
    const num = parseFloat(value);
    if (isNaN(num)) return "000.000";
    
    // Format to 3 decimal places
    const formatted = num.toFixed(3);
    
    // Split into integer and decimal parts
    const parts = formatted.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Pad integer part to 3 digits
    const paddedInteger = integerPart.padStart(3, '0');
    
    return `${paddedInteger}.${decimalPart}`;
  };

  // Generate comprehensive report data
  const generateReportData = () => {
    const now = new Date();
    const reportDate = now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const baseData = {
      reportDate,
      userInfo: {
        name: currentUser?.name || currentUser?.firstName || currentUser?.email || 'Utilisateur',
        role: currentUser?.role || 'Utilisateur',
        email: currentUser?.email || 'N/A'
      },
      statistics: roleSpecificStats?.cards || [],
      role: currentUser?.role || 'Utilisateur'
    };

    // Add role-specific data
    switch (currentUser?.role) {
      case 'Expéditeur':
        return {
          ...baseData,
          expediteurStats: expediteurStats || {},
          chartData: expediteurChartData || {},
          title: "Rapport Expéditeur - QuickZone"
        };
      
      case 'Administration':
      case 'Admin':
        return {
          ...baseData,
          adminData: adminChartData || {},
          title: "Rapport Administratif - QuickZone"
        };
      
      case 'Chef d\'agence':
        return {
          ...baseData,
          chefAgenceData: chefAgenceStats || {},
          title: "Rapport Chef d'Agence - QuickZone"
        };
      
      default:
        return {
          ...baseData,
          title: "Rapport Dashboard - QuickZone"
        };
    }
  };

  useEffect(() => {
    if (isOpen) {
      const data = generateReportData();
      setReportData(data);
    }
  }, [isOpen, currentUser, roleSpecificStats, expediteurStats, expediteurChartData, adminChartData, chefAgenceStats]);

  const exportToPDF = async () => {
    if (!reportData) return;

    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red color
      doc.text(reportData.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Report date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${reportData.reportDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // User information
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Informations Utilisateur', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nom: ${reportData.userInfo.name}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Rôle: ${reportData.userInfo.role}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Email: ${reportData.userInfo.email}`, margin, yPosition);
      yPosition += 15;

      // Statistics section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Statistiques Principales', margin, yPosition);
      yPosition += 10;

      // Create statistics table
      const statsData = reportData.statistics.map(stat => [
        stat.title,
        stat.value,
        stat.change
      ]);

      const tableHeaders = ['Métrique', 'Valeur', 'Évolution'];
      const tableData = [tableHeaders, ...statsData];

      // Calculate table dimensions
      const colWidths = [80, 50, 40];
      const rowHeight = 8;
      const tableHeight = (tableData.length + 1) * rowHeight;

      // Check if we need a new page
      if (yPosition + tableHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Draw table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Headers
      let xPos = margin;
      tableHeaders.forEach((header, index) => {
        doc.rect(xPos, yPosition - 5, colWidths[index], rowHeight, 'S');
        doc.text(header, xPos + 2, yPosition);
        xPos += colWidths[index];
      });
      yPosition += rowHeight;

      // Data rows
      doc.setFont('helvetica', 'normal');
      statsData.forEach(row => {
        xPos = margin;
        row.forEach((cell, index) => {
          doc.rect(xPos, yPosition - 5, colWidths[index], rowHeight, 'S');
          doc.text(cell.toString(), xPos + 2, yPosition);
          xPos += colWidths[index];
        });
        yPosition += rowHeight;
      });

      yPosition += 15;

      // Role-specific detailed data
      if (reportData.role === 'Expéditeur' && reportData.expediteurStats) {
        if (yPosition + 50 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Détails Expéditeur', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Colis: ${reportData.expediteurStats.totalParcels || 0}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Colis Livrés: ${reportData.expediteurStats.statusStats?.['Livrés'] || 0}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Colis Livrés Payés: ${reportData.expediteurStats.statusStats?.['Livrés payés'] || 0}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Solde: ${reportData.expediteurStats.balance?.toFixed(2) || '0.00'} DT`, margin, yPosition);
        yPosition += 7;
        doc.text(`Réclamations: ${reportData.expediteurStats.complaintsCount || 0}`, margin, yPosition);
      }

      if (reportData.role === 'Administration' && reportData.adminData) {
        if (yPosition + 50 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Métriques Administratives', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        if (reportData.adminData.keyMetrics) {
          const metrics = reportData.adminData.keyMetrics;
          doc.text(`Total Utilisateurs: ${metrics.totalUsers?.toLocaleString() || 0}`, margin, yPosition);
          yPosition += 7;
          doc.text(`Total Colis: ${metrics.totalColis?.toLocaleString() || 0}`, margin, yPosition);
          yPosition += 7;
          doc.text(`Colis Livrés: ${metrics.livraisonsCompletees?.toLocaleString() || 0}`, margin, yPosition);
          yPosition += 7;
          doc.text(`Total Expéditeurs: ${metrics.totalShippers?.toLocaleString() || 0}`, margin, yPosition);
          yPosition += 7;
          doc.text(`Revenus Mensuels: ${formatRevenue(metrics.monthlyRevenue)} DT`, margin, yPosition);
        }
      }

      if (reportData.role === 'Chef d\'agence' && reportData.chefAgenceData) {
        if (yPosition + 50 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Métriques Opérationnelles', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const chefData = reportData.chefAgenceData;
        doc.text(`Membres d'Équipe: ${chefData.teamMembers || 0}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Missions Actives: ${chefData.activeMissions || 0}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Colis en Traitement: ${chefData.processingParcels || 0}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Performance: ${chefData.performance || 0}%`, margin, yPosition);
      }

      // Footer
      doc.addPage();
      yPosition = margin;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('QuickZone - Système de Livraison', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Ce rapport a été généré automatiquement par le système QuickZone.', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;
      doc.text('Pour toute question, veuillez contacter l\'équipe de support.', pageWidth / 2, yPosition, { align: 'center' });

      // Save the PDF
      const fileName = `Rapport_${reportData.role}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;
      doc.save(fileName);

      alert('✅ Rapport PDF généré avec succès!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Erreur lors de la génération du rapport PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !reportData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{reportData.title}</h2>
              <p className="text-red-100 mt-1">Rapport détaillé du tableau de bord</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations Utilisateur</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-semibold">{reportData.userInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rôle</p>
                <p className="font-semibold">{reportData.userInfo.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{reportData.userInfo.email}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques Principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.statistics.map((stat, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm font-semibold ${
                        stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role-specific detailed data */}
          {reportData.role === 'Expéditeur' && reportData.expediteurStats && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails Expéditeur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Colis</p>
                  <p className="font-semibold">{reportData.expediteurStats.totalParcels || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Colis Livrés</p>
                  <p className="font-semibold">{reportData.expediteurStats.statusStats?.['Livrés'] || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Colis Livrés Payés</p>
                  <p className="font-semibold">{reportData.expediteurStats.statusStats?.['Livrés payés'] || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Solde</p>
                  <p className="font-semibold">{reportData.expediteurStats.balance?.toFixed(2) || '0.00'} DT</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Réclamations</p>
                  <p className="font-semibold">{reportData.expediteurStats.complaintsCount || 0}</p>
                </div>
              </div>
            </div>
          )}

          {reportData.role === 'Administration' && reportData.adminData && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Métriques Administratives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.adminData.keyMetrics && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Total Utilisateurs</p>
                      <p className="font-semibold">{reportData.adminData.keyMetrics.totalUsers?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Colis</p>
                      <p className="font-semibold">{reportData.adminData.keyMetrics.totalColis?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Colis Livrés</p>
                      <p className="font-semibold">{reportData.adminData.keyMetrics.livraisonsCompletees?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Expéditeurs</p>
                      <p className="font-semibold">{reportData.adminData.keyMetrics.totalShippers?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenus Mensuels</p>
                      <p className="font-semibold">{formatRevenue(reportData.adminData.keyMetrics.monthlyRevenue)} DT</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {reportData.role === 'Chef d\'agence' && reportData.chefAgenceData && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Métriques Opérationnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Membres d'Équipe</p>
                  <p className="font-semibold">{reportData.chefAgenceData.teamMembers || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missions Actives</p>
                  <p className="font-semibold">{reportData.chefAgenceData.activeMissions || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Colis en Traitement</p>
                  <p className="font-semibold">{reportData.chefAgenceData.processingParcels || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Performance</p>
                  <p className="font-semibold">{reportData.chefAgenceData.performance || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Report Date */}
          <div className="text-center text-sm text-gray-500">
            Rapport généré le {reportData.reportDate}
          </div>
        </div>

        {/* Footer with Export Button */}
        <div className="bg-gray-50 p-6 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={exportToPDF}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Génération...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exporter PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReport; 