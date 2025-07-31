import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
    console.log('Language changed to:', e.target.value);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
      <select
        value={i18n.language}
        onChange={handleChange}
        style={{
          border: '2px solid #dc2626',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          color: '#dc2626',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
      >
        <option value="en">EN</option>
        <option value="fr">FR</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher; 
