import React from "react";
import ActionButtons from "./ActionButtons";

const DataTable = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  searchTerm = "", 
  onSearchChange,
  showSearch = true,
  showActions = true,
  onRowClick,
  customActionButtons,
  onScan,
  onChefAgenceScan,
  currentUser
}) => {
  // Ensure data is always an array and handle null/undefined items
  const safeData = Array.isArray(data) ? data : [];
  const filteredData = safeData.filter(item =>
    item && Object.values(item).some(value =>
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Table Container with Horizontal Scroll */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                  style={{ minWidth: column.minWidth || '120px' }}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredData.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100"
                    style={{ minWidth: column.minWidth || '120px' }}
                  >
                    {column.render ? column.render(item[column.key], item) : (item[column.key] || '-')}
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-b border-gray-100">
                    {customActionButtons ? (
                      customActionButtons(item)
                    ) : (
                      <ActionButtons
                        onView={onRowClick ? (e) => { e.stopPropagation(); onRowClick(item); } : undefined}
                        onEdit={onEdit ? (e) => { e.stopPropagation(); onEdit(item); } : undefined}
                        onDelete={onDelete ? (e) => { e.stopPropagation(); onDelete(item); } : undefined}
                        onScan={onScan ? (e) => { e.stopPropagation(); onScan(item); } : undefined}
                        onChefAgenceScan={onChefAgenceScan ? (e) => { e.stopPropagation(); onChefAgenceScan(item); } : undefined}

                        currentUser={currentUser}
                        item={item}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune donnée à afficher</p>
        </div>
      )}

      {/* Scroll Indicator */}
      {columns.length > 8 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
          ← Faites défiler horizontalement pour voir plus de colonnes →
        </div>
      )}
    </div>
  );
};

export default DataTable; 
