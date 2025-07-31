import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <header className="header">
      <LanguageSwitcher />
      <img src="/images/quickzonelogo.png" alt="QuickZone Logo" className="logo" />
      
      {/* Platform Access - Prominent */}
      <div className="platform-access-section">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="platform-btn"
        >
          🚀 Platform
        </button>
      </div>
      
      {/* Admin Dashboard Access - Prominent */}
      <div className="admin-access-section">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="admin-dashboard-btn"
        >
          🔐 لوحة التحكم الإدارية
        </button>
        <button 
          onClick={() => navigate('/test')} 
          className="admin-dashboard-btn"
          style={{marginLeft: '10px', background: 'blue'}}
        >
          🧪 Test Route
        </button>
      </div>
      
      <nav>
        <ul>
          <li><a href="#home">{t('navHome')}</a></li>
          <li><a href="#features">{t('navFeatures')}</a></li>
          <li><a href="#how-it-works">{t('navHowItWorks')}</a></li>
          <li><a href="#testimonials">{t('navTestimonials')}</a></li>
          <li><a href="#contact">{t('navContact')}</a></li>
          <li><a href="#complaints">{t('navComplaints')}</a></li>
          <li><a href="#partner">{t('navPartner')}</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="platform-link">Platform</a></li>
        </ul>
      </nav>
      <p>{t('subtitle')}</p>
    </header>
  );
}

export default Header; 
