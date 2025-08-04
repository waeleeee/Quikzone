import React, { useState, useEffect } from "react";
import { getFilteredMenu, hasAccess } from "../config/permissions.jsx";
import { apiService } from "../services/api";

const Sidebar = ({ onSelect, selectedKey }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filteredMenu, setFilteredMenu] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    if (user && user.role) {
      const menu = getFilteredMenu(user.role);
      setFilteredMenu(menu);
    }
  }, []);

  const handleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  // If no user or no menu items, show loading or empty state
  if (!currentUser || filteredMenu.length === 0) {
    return (
      <aside className="sidebar" style={{ background: 'linear-gradient(180deg, #fff 0%, #f7f7f7 100%)', borderRight: '1px solid #ececec' }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-4">
          {!currentUser ? 'No user found' : 'No menu items'}
        </div>
      </aside>
    );
  }

      return (
    <aside className="sidebar" style={{ background: 'linear-gradient(180deg, #fff 0%, #f7f7f7 100%)', borderRight: '1px solid #ececec' }}>
      {/* Logo QuickZone */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center mb-1">
          <img src="/images/quickzonelogo.png" alt="QuickZone" className="h-9 w-auto" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.04))' }} />
        </div>
        <div className="text-xs text-gray-500 font-medium">Système de Gestion</div>
      </div>

      {/* Informations utilisateur */}
      <div className="bg-white rounded-xl p-3 mb-4 border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#D32F2F] font-bold text-base">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">
              {currentUser?.name || 'Utilisateur'}
            </div>
            <div className="text-[10px] text-gray-600 truncate">
              {currentUser?.email || 'user@quickzone.tn'}
            </div>
            <div className="text-[10px] text-[#D32F2F] font-medium mt-0.5">
              {currentUser?.role || 'Administrateur'}
            </div>
            {currentUser?.role !== 'Admin' && currentUser?.agency && (
              <div className="text-[10px] text-gray-500 mt-0.5">
                {currentUser.agency}
              </div>
            )}
            {currentUser?.role !== 'Admin' && currentUser?.governorate && !currentUser?.agency && (
              <div className="text-[10px] text-gray-500 mt-0.5">
                {currentUser.governorate}
              </div>
            )}

          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {filteredMenu.map((item) =>
            item.children ? (
              <li key={item.key} className="mb-0.5">
                <button
                  className={`group flex justify-between items-center w-full px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 text-sm ${
                    openDropdown === item.key ? "bg-gray-100 border border-[#D32F2F]" : ""
                  }`}
                  style={{ minHeight: 36 }}
                  onClick={() => handleDropdown(item.key)}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-md transition-all duration-200 ${
                      openDropdown === item.key ? "bg-[#D32F2F] text-white" : "bg-gray-100 text-gray-600 group-hover:bg-[#FBE9E7] group-hover:text-[#D32F2F]"
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`font-medium transition-colors duration-200 ${
                      openDropdown === item.key ? "text-[#D32F2F]" : "text-gray-700"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  <div className={`transition-transform duration-200 ${
                    openDropdown === item.key ? "rotate-180" : ""
                  }`}>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openDropdown === item.key ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}>
                  <ul className="pl-3 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <li key={child.key}>
                        <button
                          className={`group flex items-center space-x-2 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-gray-100 text-sm ${
                            selectedKey === child.key ? "bg-gray-200 border border-[#D32F2F] text-[#D32F2F] font-semibold" : "text-gray-600 hover:text-[#D32F2F]"
                          }`}
                          style={{ minHeight: 32 }}
                          onClick={() => onSelect(child.key)}
                        >
                          <div className={`p-1 rounded transition-all duration-200 ${
                            selectedKey === child.key ? "bg-white bg-opacity-60" : "bg-gray-100 group-hover:bg-[#FBE9E7]"
                          }`}>
                            {child.icon}
                          </div>
                          <span className="text-xs font-medium">{child.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ) : (
              <li key={item.key} className="mb-0.5">
                <button
                  className={`group flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 text-sm ${
                    selectedKey === item.key ? "bg-gray-200 border border-[#D32F2F] text-[#D32F2F] font-semibold" : "text-gray-700 hover:text-[#D32F2F]"
                  }`}
                  style={{ minHeight: 36 }}
                  onClick={() => onSelect(item.key)}
                >
                  <div className={`p-1.5 rounded-md transition-all duration-200 ${
                    selectedKey === item.key ? "bg-white bg-opacity-60" : "bg-gray-100 group-hover:bg-[#FBE9E7]"
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </nav>

      {/* Bouton de déconnexion bien visible, compact, en bas */}
      <div className="mt-auto pt-3">
        <button
          onClick={() => {
            apiService.logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-[#FBE9E7] hover:text-[#D32F2F] rounded-lg transition-all duration-200 shadow-sm border border-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 
