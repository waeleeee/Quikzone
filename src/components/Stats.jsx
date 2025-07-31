import { useTranslation } from 'react-i18next';

function Stats({ totalTasks, completedTasks, totalTime }) {
  const { t } = useTranslation();

  return (
    <div className="stats">
      <h2 className="section-title">{t('statsTitle')}</h2>
      <p className="section-subtitle">{t('statsSubtitle')}</p>
      <div className="stat">
        <span className="stat-label">{t('totalTasks')}</span>
        <span className="stat-value">{totalTasks}</span>
      </div>
      <div className="stat">
        <span className="stat-label">{t('completed')}</span>
        <span className="stat-value">{completedTasks}</span>
      </div>
      <div className="stat">
        <span className="stat-label">{t('totalTime')}</span>
        <span className="stat-value">{totalTime}</span>
      </div>
    </div>
  );
}

export default Stats; 
