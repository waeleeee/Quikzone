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
  onRowClick
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
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      style={{ minWidth: column.minWidth || 'auto' }}
                    >
                      {column.header}
                    </th>
                  ))}
                  {showActions && (
                    <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-3 whitespace-nowrap text-sm text-gray-900"
                        style={{ minWidth: column.minWidth || 'auto' }}
                      >
                        {column.render ? column.render(item[column.key], item) : (item[column.key] || '-')}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          onView={onRowClick ? (e) => { e.stopPropagation(); onRowClick(item); } : undefined}
                          onEdit={onEdit ? (e) => { e.stopPropagation(); onEdit(item); } : undefined}
                          onDelete={onDelete ? (e) => { e.stopPropagation(); onDelete(item); } : undefined}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
