import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to QuickZone!',
      subtitle: 'Your productivity command center',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      navHome: 'Home',
      navFeatures: 'Features',
      navHowItWorks: 'How It Works',
      navTestimonials: 'Testimonials',
      navContact: 'Contact',
      navComplaints: 'Complaints',
      navPartner: 'Become a Partner',
      addTaskPlaceholder: 'What needs to be done?',
      addTask: 'Add Task',
      all: 'All',
      active: 'Active',
      completedBtn: 'Completed',
      noTasks: 'No tasks yet. Add your first task to get started!',
      timerRunning: 'Timer running for',
      statsTitle: 'hello',
      statsSubtitle: 'Join thousands of satisfied customers who trust QuickZone for their delivery needs',
      totalTasks: 'Total Tasks',
      completed: 'Completed',
      totalTime: 'Total Time',
    },
  },
  fr: {
    translation: {
      welcome: 'Bienvenue sur QuickZone !',
      subtitle: 'Votre centre de productivité',
      getStarted: 'Commencer',
      learnMore: 'En savoir plus',
      navHome: 'Accueil',
      navFeatures: 'Fonctionnalités',
      navHowItWorks: 'Comment ça marche',
      navTestimonials: 'Témoignages',
      navContact: 'Contact',
      navComplaints: 'Réclamations',
      navPartner: 'Devenir partenaire',
      addTaskPlaceholder: 'Que faut-il faire ?',
      addTask: 'Ajouter une tâche',
      all: 'Toutes',
      active: 'Actives',
      completedBtn: 'Terminées',
      noTasks: 'Aucune tâche. Ajoutez votre première tâche pour commencer !',
      timerRunning: 'Minuteur en cours pour',
      statsTitle: 'Nos chiffres impressionnants',
      statsSubtitle: 'Rejoignez des milliers de clients satisfaits qui font confiance à QuickZone pour leurs besoins de livraison',
      totalTasks: 'Tâches totales',
      completed: 'Terminées',
      totalTime: 'Temps total',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 