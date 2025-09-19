import React, { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-top">
        <LanguageSwitcher />
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
      
      <div className="header-main">
        <img src="images/quickzonelogo.png" alt="QuickZone Logo" className="logo" />
        <p className="header-subtitle">{t('subtitle')}</p>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="desktop-nav">
        <ul>
          <li><a href="#home">{t('navHome')}</a></li>
          <li><a href="#features">{t('navFeatures')}</a></li>
          <li><a href="#how-it-works">{t('navHowItWorks')}</a></li>
          <li><a href="#testimonials">{t('navTestimonials')}</a></li>
          <li><a href="#contact">{t('navContact')}</a></li>
          <li><a href="#complaints">{t('navComplaints')}</a></li>
          <li><a href="#partner">{t('navPartner')}</a></li>
        </ul>
      </nav>

      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
        <ul>
          <li><a href="#home" onClick={() => setIsMobileMenuOpen(false)}>{t('navHome')}</a></li>
          <li><a href="#features" onClick={() => setIsMobileMenuOpen(false)}>{t('navFeatures')}</a></li>
          <li><a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>{t('navHowItWorks')}</a></li>
          <li><a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>{t('navTestimonials')}</a></li>
          <li><a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>{t('navContact')}</a></li>
          <li><a href="#complaints" onClick={() => setIsMobileMenuOpen(false)}>{t('navComplaints')}</a></li>
          <li><a href="#partner" onClick={() => setIsMobileMenuOpen(false)}>{t('navPartner')}</a></li>
        </ul>
      </nav>
      
      {/* Action Buttons */}
      <div className="header-actions">
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="platform-btn"
          >
            🚀 Platform
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="admin-dashboard-btn"
          >
            🔐 لوحة التحكم الإدارية
          </button>
          <button 
            onClick={() => navigate('/test')} 
            className="test-btn"
          >
            🧪 Test Route
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header; 
