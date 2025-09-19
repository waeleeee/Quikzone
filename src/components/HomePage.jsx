import React from 'react';
import { useTranslation } from 'react-i18next';
import ComplaintsForm from './ComplaintsForm';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="font-sans bg-white text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-lg border-b border-white/30 shadow-lg transition-all duration-500">
        <div className="container mx-auto flex justify-between items-center py-3 px-6">
          <div className="flex items-center gap-3">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0ibG9nbyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2RjMjYyNiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNjY2NiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjbG9nbykiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmU8L3RleHQ+PC9zdmc+" alt="QuickZone Logo" className="h-8" />
          </div>
          <ul className="flex space-x-4 text-sm font-semibold ml-auto">
            <li><a href="#home" className="hover:text-red-600 transition">Accueil</a></li>
            <li><a href="#features" className="hover:text-red-600 transition">Fonctionnalités</a></li>
            <li><a href="#how-it-works" className="hover:text-red-600 transition">Comment ça marche</a></li>
            <li><a href="#testimonials" className="hover:text-red-600 transition">Témoignages</a></li>
            <li><a href="#contact" className="hover:text-red-600 transition">Contact</a></li>
            <li><a href="#complaints" className="hover:text-red-600 transition">Réclamations</a></li>
            <li><a href="#partner" className="hover:text-red-600 transition">Devenir partenaire</a></li>
            <li><a href="/login" className="bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition text-xs">Dashboard</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-[50vh] flex flex-col items-center justify-center text-center fade-in bg-white pt-20 overflow-hidden">
        <svg className="absolute -top-24 -left-24 w-[400px] h-[400px] opacity-20 z-0" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="300" cy="300" rx="300" ry="300" fill="url(#paint0_radial)"/>
          <defs>
            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(300 300) scale(300)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#dc2626"/>
              <stop offset="1" stopColor="#fff" stopOpacity="0"/>
            </radialGradient>
          </defs>
        </svg>
        <div className="container mx-auto z-10 relative flex flex-col items-center justify-center py-12">
          <div className="w-full mx-auto mb-6 relative h-[40vh]">
            <div className="relative overflow-hidden rounded-xl shadow-xl bg-white w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40 z-10 pointer-events-none"></div>
              <div className="flex items-center justify-center p-0 absolute inset-0">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjY2NjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZjMzMzMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmUgU2xpZGUgMTwvdGV4dD48L3N2Zz4=" alt="QuickZone Slide 1" className="w-full h-full object-cover mb-4 drop-shadow-lg" />
                <div className="absolute bottom-6 left-6 z-20 text-white text-2xl font-extrabold drop-shadow-lg">
                  Rapide. Fiable. Fièrement Tunisien !
                </div>
                <a href="/login" className="absolute bottom-6 right-6 z-20 bg-red-600 text-white px-6 py-3 rounded-full text-base font-bold shadow-lg hover:bg-red-700 transition">
                  Commencer
                </a>
              </div>
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0ibG9nbyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2RjMjYyNiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNjY2NiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjbG9nbykiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmU8L3RleHQ+PC9zdmc+" alt="QuickZone Watermark" className="absolute bottom-3 right-3 w-24 opacity-30 z-30 pointer-events-none select-none" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900 relative z-20">Livraison Ultra-Rapide, Redéfinie</h1>
          <p className="text-base md:text-lg mb-6 text-gray-700 max-w-2xl mx-auto relative z-20 font-semibold">Nourriture, courses ou colis—livrés en minutes avec style et rapidité.</p>
          <div className="space-x-4 flex justify-center mb-4 relative z-20">
            <a href="/login" className="bg-red-600 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-red-700 hover:shadow-xl transition">Commencer</a>
            <a href="#learn-more" className="bg-gray-200 text-black px-8 py-3 rounded-full text-base font-semibold hover:bg-gray-300 transition">En savoir plus</a>
          </div>
        </div>
      </section>

      {/* Slider Section */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto relative">
          <div className="overflow-hidden rounded-lg shadow-xl">
            <div className="flex transition-transform duration-700 ease-in-out">
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-600 flex items-center justify-center text-2xl font-bold text-white">Livraison de Fast-Food</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Commander maintenant !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-500 flex items-center justify-center text-2xl font-bold text-white">Courses en Minutes</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Acheter maintenant !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-400 flex items-center justify-center text-2xl font-bold text-white">Suivi de Colis</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Suivre maintenant !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-300 flex items-center justify-center text-2xl font-bold text-white">Devenir Partenaire</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Rejoindre maintenant !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-600 flex items-center justify-center text-2xl font-bold text-white">Paiements Sécurisés</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Payer en sécurité !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-500 flex items-center justify-center text-2xl font-bold text-white">Mises à Jour en Temps Réel</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Rester informé !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-400 flex items-center justify-center text-2xl font-bold text-white">Large Sélection</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Explorer maintenant !</div>
              </div>
              <div className="min-w-full relative slider-item">
                <div className="h-64 bg-red-300 flex items-center justify-center text-2xl font-bold text-white">Amour des Clients</div>
                <div className="slider-overlay absolute inset-0 flex items-center justify-center text-white">Rejoindre l'amour !</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-br from-gray-50 via-white to-red-50 slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-green-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Avantages</span>
              <div className="w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Pourquoi QuickZone Brille
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Découvrez les fonctionnalités qui font de QuickZone la plateforme de livraison la plus avancée de Tunisie
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Livraison Ultra-Rapide */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <i className="fas fa-rocket text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      <i className="fas fa-bolt"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
                    Livraison Ultra-Rapide
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Vos commandes livrées en seulement 30 minutes, peu importe quoi.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-clock text-red-500"></i>
                    <span>30 min garanties</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Suivi en Temps Réel */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <i className="fas fa-map-marker-alt text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      <i className="fas fa-eye"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    Suivi en Temps Réel
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Suivez votre livraison en direct et sachez exactement quand elle arrive.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-satellite text-blue-500"></i>
                    <span>GPS en direct</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Large Sélection */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <i className="fas fa-store text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                    Large Sélection
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Restaurants, courses, boutiques—tout en un seul endroit.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-th-large text-green-500"></i>
                    <span>1000+ partenaires</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Livraisons Programmées */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <i className="fas fa-calendar-alt text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      <i className="fas fa-clock"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">
                    Livraisons Programmées
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Planifiez vos livraisons pour quand vous en avez le plus besoin.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-calendar-check text-purple-500"></i>
                    <span>24h à l'avance</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Commandes Multiples */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <i className="fas fa-shopping-cart text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      <i className="fas fa-plus"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                    Commandes Multiples
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Commandez de plusieurs magasins en une seule livraison et économisez.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-percentage text-orange-500"></i>
                    <span>Économies garanties</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Facile à Utiliser */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <i className="fas fa-mobile-alt text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      <i className="fas fa-heart"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors duration-300">
                    Facile à Utiliser
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Interface intuitive pour commander et suivre sans effort.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-magic text-pink-500"></i>
                    <span>3 clics max</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-sparkles text-2xl text-white"></i>
                </div>
                <div className="">
                  <h3 className="text-xl font-bold text-white mb-1">Prêt à briller avec nous ?</h3>
                  <p className="text-red-100 text-sm">Rejoignez la révolution de la livraison ultra-rapide</p>
                </div>
              </div>
              <a href="/login" className="bg-white text-red-600 px-6 py-3 rounded-full text-base font-bold hover:bg-gray-50 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <i className="fas fa-rocket mr-2"></i>
                Commencer maintenant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gradient-to-br from-blue-50 via-white to-red-50 slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Processus</span>
              <div className="w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Comment ça marche
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Un processus simple en 3 étapes pour recevoir vos commandes rapidement et en toute sécurité
            </p>
          </div>
          
          <div className="relative">
            {/* Connecting lines for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-red-200 via-red-300 to-red-200 transform -translate-y-1/2 z-0"></div>
            <div className="hidden lg:block absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full z-10"></div>
            <div className="hidden lg:block absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full z-10"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Step 1 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <i className="fas fa-shopping-cart text-2xl text-white"></i>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        01
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      Passez votre commande
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Parcourez les restaurants, courses ou magasins et ajoutez des articles à votre panier.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <i className="fas fa-clock text-blue-500"></i>
                      <span>2 minutes</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <i className="fas fa-map-marker-alt text-2xl text-white"></i>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        02
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                      Suivez en temps réel
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Regardez votre commande être préparée et livrée en direct.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <i className="fas fa-eye text-green-500"></i>
                      <span>Suivi live</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <i className="fas fa-home text-2xl text-white"></i>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        03
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
                      Recevez votre livraison
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Recevez vos articles livrés à votre porte avec soin.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <i className="fas fa-check-circle text-red-500"></i>
                      <span>Livré !</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-rocket text-2xl text-white"></i>
                </div>
                <div className="">
                  <h3 className="text-xl font-bold text-white mb-1">Prêt à commencer ?</h3>
                  <p className="text-red-100 text-sm">Rejoignez des milliers de clients satisfaits</p>
                </div>
              </div>
              <a href="/login" className="bg-white text-red-600 px-6 py-3 rounded-full text-base font-bold hover:bg-gray-50 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <i className="fas fa-play mr-2"></i>
                Commencer maintenant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-red-50 via-white to-red-50 slide-up relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-red-400 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-red-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-red-200 rounded-full animate-pulse"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-red-600 mb-4">Nos chiffres impressionnants</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Rejoignez des milliers de clients satisfaits qui font confiance à QuickZone pour leurs besoins de livraison</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="stat-card group">
              <div className="stat-icon">
                <i className="fas fa-users text-5xl text-red-500 group-hover:text-red-600 transition-colors"></i>
              </div>
              <div className="stat-number">5000</div>
              <div className="stat-label">Clients Satisfaits</div>
              <div className="stat-description">Clients heureux qui aiment notre service</div>
              <div className="stat-badge">
                <i className="fas fa-star text-yellow-400"></i>
                <span>Fiable</span>
              </div>
            </div>

            <div className="stat-card group">
              <div className="stat-icon">
                <i className="fas fa-map-marked-alt text-5xl text-blue-500 group-hover:text-blue-600 transition-colors"></i>
              </div>
              <div className="stat-number">120</div>
              <div className="stat-label">Villes Couvertes</div>
              <div className="stat-description">Couverture nationale à travers la Tunisie</div>
              <div className="stat-badge">
                <i className="fas fa-globe text-green-400"></i>
                <span>En expansion</span>
              </div>
            </div>

            <div className="stat-card group">
              <div className="stat-icon">
                <i className="fas fa-shipping-fast text-5xl text-green-500 group-hover:text-green-600 transition-colors"></i>
              </div>
              <div className="stat-number">50000</div>
              <div className="stat-label">Livraisons Terminées</div>
              <div className="stat-description">Livraisons réussies avec soin</div>
              <div className="stat-badge">
                <i className="fas fa-check-circle text-green-400"></i>
                <span>Fiable</span>
              </div>
            </div>

            <div className="stat-card group">
              <div className="stat-icon">
                <i className="fas fa-heart text-5xl text-pink-500 group-hover:text-pink-600 transition-colors"></i>
              </div>
              <div className="stat-number">98</div>
              <div className="stat-label">Taux de Satisfaction</div>
              <div className="stat-description">Clients qui nous recommandent</div>
              <div className="stat-badge">
                <i className="fas fa-thumbs-up text-blue-400"></i>
                <span>Adoré</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-4 bg-white rounded-full px-8 py-4 shadow-lg">
              <i className="fas fa-rocket text-2xl text-red-500 animate-bounce"></i>
              <span className="text-lg font-semibold text-gray-800">Prêt à rejoindre notre histoire de succès ?</span>
              <a href="/login" className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors font-semibold">
                Commencer maintenant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-16 bg-gradient-to-br from-gray-50 via-white to-red-50 slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-24 h-24 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Partenariat</span>
              <div className="w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Nos Partenaires Stellaires
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Nous nous associons aux meilleures marques pour livrer des produits de qualité à la vitesse de l'éclair.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Mon Jardin */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">MJ</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">Mon Jardin</h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">Services de pépinière et d'aménagement paysager</p>
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-leaf text-green-500"></i>
                    <span>Partenaire de confiance</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Roura Ever Shop */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">RE</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors duration-300">Roura Ever Shop</h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">Produits cosmétiques</p>
                  <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-spa text-pink-500"></i>
                    <span>Partenaire de confiance</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Viaponit */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">VP</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">Viaponit</h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">Multimédia</p>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-laptop text-blue-500"></i>
                    <span>Partenaire de confiance</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Ooredoo */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">OO</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">Ooredoo</h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">Opérateur de télécommunications</p>
                  <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-signal text-orange-500"></i>
                    <span>Partenaire de confiance</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-handshake text-2xl text-white"></i>
                </div>
                <div className="">
                  <h3 className="text-xl font-bold text-white mb-1">Rejoignez notre réseau</h3>
                  <p className="text-red-100 text-sm">Devenez partenaire et développez votre activité</p>
                </div>
              </div>
              <a href="#partner" className="bg-white text-red-600 px-6 py-3 rounded-full text-base font-bold hover:bg-gray-50 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <i className="fas fa-rocket mr-2"></i>
                Devenir un partenaire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-gradient-to-br from-pink-50 via-white to-red-50 slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-24 h-24 bg-pink-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Témoignages</span>
              <div className="w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Nos Clients Nous Aiment
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Découvrez pourquoi des milliers de clients font confiance à QuickZone pour leurs besoins de livraison
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Sophie Martin */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col h-full">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                      <i className="fas fa-quote-left text-xl text-pink-600"></i>
                    </div>
                  </div>
                  
                  {/* Testimonial Text */}
                  <div className="flex-grow">
                    <p className="text-gray-700 leading-relaxed text-base italic mb-4">
                      "QuickZone a révolutionné mes courses. J'économise des heures chaque semaine !"
                    </p>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex justify-center mb-4">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-yellow-400 text-base"></i>
                      ))}
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg mr-3">
                      SM
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900 text-base">Sophie Martin</h4>
                      <p className="text-gray-600 text-xs">Paris, France</p>
                      <div className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold mt-1">
                        <i className="fas fa-shopping-bag text-pink-500"></i>
                        <span>Cliente régulière</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Michel Dubois */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col h-full">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <i className="fas fa-quote-left text-2xl text-blue-600"></i>
                    </div>
                  </div>
                  
                  {/* Testimonial Text */}
                  <div className="flex-grow">
                    <p className="text-gray-700 leading-relaxed text-lg italic mb-6">
                      "Le suivi en temps réel est révolutionnaire. Je sais toujours quand ma commande arrive !"
                    </p>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex justify-center mb-6">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-yellow-400 text-lg"></i>
                      ))}
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg mr-4">
                      MD
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900 text-lg">Michel Dubois</h4>
                      <p className="text-gray-600 text-sm">Lyon, France</p>
                      <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mt-1">
                        <i className="fas fa-map-marker-alt text-blue-500"></i>
                        <span>Suivi fan</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Émilie Rousseau */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col h-full">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <i className="fas fa-quote-left text-2xl text-green-600"></i>
                    </div>
                  </div>
                  
                  {/* Testimonial Text */}
                  <div className="flex-grow">
                    <p className="text-gray-700 leading-relaxed text-lg italic mb-6">
                      "J'utilise QuickZone 3x par semaine. La variété et la vitesse sont inégalées !"
                    </p>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex justify-center mb-6">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-yellow-400 text-lg"></i>
                      ))}
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg mr-4">
                      ÉR
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900 text-lg">Émilie Rousseau</h4>
                      <p className="text-gray-600 text-sm">Marseille, France</p>
                      <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mt-1">
                        <i className="fas fa-heart text-green-500"></i>
                        <span>Cliente fidèle</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-6 bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-heart text-3xl text-white"></i>
                </div>
                <div className="">
                  <h3 className="text-2xl font-bold text-white mb-2">Rejoignez notre communauté</h3>
                  <p className="text-red-100">Devenez l'un de nos clients satisfaits</p>
                </div>
              </div>
              <a href="/login" className="bg-white text-red-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <i className="fas fa-user-plus mr-2"></i>
                Rejoindre maintenant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50 slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Contact</span>
              <div className="w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Contactez-nous
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Agence Grand Tunis */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <i className="fas fa-building text-xl text-white"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    Dépôt Grand Tunis
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <i className="fas fa-map-marker-alt text-blue-500 mt-1"></i>
                      <p className="text-gray-600 text-right">نهج جمال برج الوزير 2036 سكرة اريانة</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-phone text-blue-500"></i>
                      <p className="text-gray-600">+216 24 581 115</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-envelope text-blue-500"></i>
                      <p className="text-gray-600">grandTunis@quickzone.tn</p>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <i className="fas fa-clock text-blue-500"></i>
                    <span>Lun-Ven: 8h-18h</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Agence Sahel */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <i className="fas fa-store text-2xl text-white"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                    Dépôt Sahel
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-map-marker-alt text-green-500 mt-1"></i>
                      <p className="text-gray-600 text-right">قصيبة الميدوني المنستير</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-phone text-green-500"></i>
                      <p className="text-gray-600">+216 28 649 115</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-envelope text-green-500"></i>
                      <p className="text-gray-600">sahel@quickzone.tn</p>
                    </div>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <i className="fas fa-clock text-green-500"></i>
                    <span>Lun-Ven: 8h-18h</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Agence Centrale */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <i className="fas fa-industry text-2xl text-white"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                    Dépôt Centrale
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-map-marker-alt text-purple-500 mt-1"></i>
                      <p className="text-gray-600 text-right">طريق المهدية قصاص بوعلي صفاقس</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-phone text-purple-500"></i>
                      <p className="text-gray-600">+216 28 839 115</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-headset text-purple-500"></i>
                      <p className="text-gray-600">+216 28 634 115</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-envelope text-purple-500"></i>
                      <p className="text-gray-600">sfax@quickzone.tn</p>
                    </div>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <i className="fas fa-clock text-purple-500"></i>
                    <span>Lun-Ven: 8h-18h</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Direction Générale */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <i className="fas fa-crown text-2xl text-white"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">
                    Direction Générale
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-phone text-red-500"></i>
                      <p className="text-gray-600">+216 28 681 115</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-phone text-red-500"></i>
                      <p className="text-gray-600">+216 28 391 115</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-envelope text-red-500"></i>
                      <p className="text-gray-600">pdg@quickzone.tn</p>
                    </div>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <i className="fas fa-star text-red-500"></i>
                    <span>Direction</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-2xl p-8 shadow-xl border border-gray-100 overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 right-10 w-24 h-24 bg-red-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-6 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Message</span>
                    <div className="w-6 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
                  </div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <i className="fas fa-envelope-open text-2xl text-white"></i>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Envoyez-nous un message</h3>
                  <p className="text-base text-gray-600 max-w-xl mx-auto">Notre équipe dédiée vous répondra dans les plus brefs délais avec une solution personnalisée</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <i className="fas fa-user text-red-500"></i>
                        Prénom
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Votre prénom" 
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-base shadow-sm hover:shadow-md" 
                          defaultValue="Jean" 
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <i className="fas fa-user text-gray-400"></i>
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <i className="fas fa-envelope text-red-500"></i>
                        Email
                      </label>
                      <div className="relative">
                        <input 
                          type="email" 
                          placeholder="votre.email@exemple.com" 
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-base shadow-sm hover:shadow-md" 
                          defaultValue="jean.dupont@exemple.com" 
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <i className="fas fa-envelope text-gray-400"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <i className="fas fa-id-card text-red-500"></i>
                        Nom
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Votre nom" 
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-base shadow-sm hover:shadow-md" 
                          defaultValue="Dupont" 
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <i className="fas fa-id-card text-gray-400"></i>
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <i className="fas fa-phone text-red-500"></i>
                        Téléphone
                      </label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          placeholder="+216 XX XXX XXX" 
                          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-base shadow-sm hover:shadow-md" 
                          defaultValue="+216 28 567 003" 
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <i className="fas fa-phone text-gray-400"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="fas fa-comment-alt text-red-500"></i>
                    Message
                  </label>
                  <div className="relative">
                    <textarea 
                      placeholder="Écrivez votre message ici..." 
                      rows="4" 
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-gray-900 text-base shadow-sm hover:shadow-md resize-none" 
                    ></textarea>
                    <div className="absolute top-4 right-4 pointer-events-none">
                      <i className="fas fa-comment-alt text-gray-400"></i>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <button className="group relative bg-gradient-to-r from-red-600 to-red-700 text-white px-12 py-4 rounded-xl text-lg font-bold hover:from-red-700 hover:to-red-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <i className="fas fa-paper-plane text-2xl group-hover:animate-bounce"></i>
                      <span>Envoyer le message</span>
                      <i className="fas fa-arrow-right text-lg group-hover:translate-x-1 transition-transform duration-300"></i>
                    </div>
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    <i className="fas fa-clock text-red-500 mr-1"></i>
                    Réponse garantie sous 24h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complaints Section */}
      <section id="complaints" className="py-20 bg-gradient-to-br from-gray-50 via-white to-red-50 slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-red-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              <span className="text-lg font-semibold text-red-600 uppercase tracking-wider">Support</span>
              <div className="w-12 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Réclamations et Retours
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Votre satisfaction est notre mission. Dites-nous comment nous pouvons nous améliorer et nous traiterons votre demande avec la plus grande attention.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-white via-red-50 to-red-50 rounded-3xl p-10 shadow-2xl border border-red-100 overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 right-10 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-red-400 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <ComplaintsForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-24 h-24 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0ibG9nbyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2RjMjYyNiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNjY2NiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjbG9nbykiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmU8L3RleHQ+PC9zdmc+" alt="Quick Zone Logo" className="h-8" />
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Zone</h3>
                  <div className="w-6 h-0.5 bg-gradient-to-r from-red-500 to-red-400 rounded-full mt-1"></div>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Le service de livraison ultime pour la nourriture, les courses et les colis dans votre région. 
                Nous connectons les commerces locaux aux clients avec rapidité et fiabilité.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="fas fa-star text-yellow-400"></i>
                  <span>4.8/5</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="fas fa-users text-blue-400"></i>
                  <span>50K+ clients</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="fas fa-truck text-green-400"></i>
                  <span>24h/7j</span>
                </div>
              </div>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-building text-red-500"></i>
                Entreprise
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-red-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-red-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>À propos</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-red-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-red-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Carrières</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-red-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-red-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Presse</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-red-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-red-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Blog</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-cogs text-blue-500"></i>
                Services
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-blue-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Livraison de nourriture</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-blue-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Livraison de courses</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-blue-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Livraison de colis</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-blue-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Solutions d'entreprise</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-headset text-green-500"></i>
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-green-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Centre d'aide</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-green-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Contactez-nous</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-green-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>FAQ</span>
                  </a>
                </li>
                <li>
                  <a href="#partner" className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group text-sm">
                    <i className="fas fa-chevron-right text-xs text-green-500 group-hover:translate-x-1 transition-transform duration-300"></i>
                    <span>Devenir partenaire</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="border-t border-gray-700 pt-8 mb-8">
            <div className="max-w-xl mx-auto text-center">
              <h4 className="text-lg font-bold text-white mb-2">Restez informé</h4>
              <p className="text-gray-300 mb-4 text-sm">Recevez nos dernières actualités et offres exclusives</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Votre adresse email" 
                  className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 text-sm" 
                />
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm">
                  <i className="fas fa-paper-plane mr-2"></i>
                  S'abonner
                </button>
              </div>
            </div>
          </div>

          {/* Social Media & Copyright */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Social Media */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-semibold text-sm">Suivez-nous :</span>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:scale-110">
                    <i className="fab fa-twitter text-sm"></i>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110">
                    <i className="fab fa-facebook text-sm"></i>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300 transform hover:scale-110">
                    <i className="fab fa-instagram text-sm"></i>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-700 hover:text-white transition-all duration-300 transform hover:scale-110">
                    <i className="fab fa-linkedin text-sm"></i>
                  </a>
                </div>
              </div>

              {/* Copyright & Legal */}
              <div className="text-center lg:text-right">
                <p className="text-gray-400 mb-2 text-sm">© 2025 Quick Zone. Tous droits réservés.</p>
                <div className="flex flex-wrap justify-center lg:justify-end gap-4 text-xs">
                  <a href="#" className="text-gray-400 hover:text-red-400 transition-colors duration-300">Conditions d'utilisation</a>
                  <a href="#" className="text-gray-400 hover:text-red-400 transition-colors duration-300">Politique de confidentialité</a>
                  <a href="#" className="text-gray-400 hover:text-red-400 transition-colors duration-300">Politique des cookies</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .fade-in { animation: fadeIn 1.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .slide-up { animation: slideUp 1s ease-out; }
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .card-3d {
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .card-3d:hover {
          transform: translateY(-10px) rotateX(5deg) rotateY(5deg);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        }
        .slider-item:hover .slider-overlay {
          opacity: 1;
        }
        .slider-overlay {
          opacity: 0;
          transition: opacity 0.3s;
          background: rgba(0, 0, 0, 0.5);
        }
        .stat-card {
          @apply bg-white p-8 rounded-2xl shadow-lg text-center relative overflow-hidden;
        }
        .stat-icon {
          @apply mb-4;
        }
        .stat-number {
          @apply text-4xl font-bold text-gray-900 mb-2;
        }
        .stat-label {
          @apply text-lg font-semibold text-gray-700 mb-2;
        }
        .stat-description {
          @apply text-gray-600 mb-4;
        }
        .stat-badge {
          @apply inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium;
        }
      `}</style>
    </div>
  );
};

export default HomePage; 
