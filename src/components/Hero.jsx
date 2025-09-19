import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../App.css';

// Use colored gradient placeholders as immediate fix
const slides = [
  { 
    img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjY2NjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZjMzMzMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmUgU2xpZGUgMTwvdGV4dD48L3N2Zz4=', 
    fallback: 'QuickZone Delivery Service' 
  },
  { 
    img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzM2ZmNjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzM2ZmMzMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmUgU2xpZGUgMjwvdGV4dD48L3N2Zz4=', 
    fallback: 'Fast & Reliable Delivery' 
  },
  { 
    img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjMzZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzMzMzZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmUgU2xpZGUgMzwvdGV4dD48L3N2Zz4=', 
    fallback: 'Professional Service' 
  },
  { 
    img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmY2MzMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZmNjMzMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmUgU2xpZGUgNDwvdGV4dD48L3N2Zz4=', 
    fallback: 'QuickZone Excellence' 
  },
  { 
    img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjMzY2MiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjYzMzOTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RdWlja1pvbmUgU2xpZGUgNTwvdGV4dD48L3N2Zz4=', 
    fallback: 'Your Trusted Partner' 
  },
];

function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (idx) => setCurrent(idx);

  useEffect(() => {
    timeoutRef.current = setTimeout(nextSlide, 4000);
    return () => clearTimeout(timeoutRef.current);
  }, [current]);

  return (
    <section className="hero gradient-bg min-h-[600px] flex flex-col items-center justify-center text-center fade-in relative">
      <div className="container mx-auto z-10 relative flex flex-col items-center justify-center py-16">
        {/* Slider */}
        <div className="w-full max-w-xl mx-auto mb-8 relative">
          <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white">
            {slides.map((slide, idx) => (
              <div
                key={slide.img}
                className={`service-slide flex flex-col items-center justify-center p-0 transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
                style={{ minHeight: 320 }}
              >
                <div className="w-full h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={slide.img} 
                    alt={`QuickZone Slide ${idx + 1}`} 
                    className="w-full h-full object-cover drop-shadow-lg rounded-xl"
                    onError={(e) => {
                      console.error('Image failed to load:', slide.img);
                      e.target.style.display = 'none';
                      // Show fallback text
                      const fallbackDiv = e.target.nextElementSibling;
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold text-center p-4 rounded-xl"
                    style={{ display: 'none' }}
                  >
                    {slide.fallback}
                  </div>
                </div>
              </div>
            ))}
            {/* Navigation Arrows */}
            <button onClick={prevSlide} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-2xl rounded-full w-10 h-10 flex items-center justify-center shadow transition z-10"><i className="fas fa-chevron-left"></i></button>
            <button onClick={nextSlide} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-2xl rounded-full w-10 h-10 flex items-center justify-center shadow transition z-10"><i className="fas fa-chevron-right"></i></button>
          </div>
          {/* Dots */}
          <div className="flex justify-center mt-4 gap-2">
            {slides.map((_, idx) => (
              <span
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-3 h-3 rounded-full inline-block cursor-pointer transition-all ${current === idx ? 'bg-red-600 scale-125' : 'bg-gray-300'}`}
              ></span>
            ))}
          </div>
        </div>
        {/* Main text/buttons */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">{t('welcome')}</h1>
        <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto drop-shadow">{t('subtitle')}</p>
        <div className="space-x-6 flex justify-center mb-4">
          <a href="#start" className="bg-red-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-red-700 hover:shadow-xl transition">{t('getStarted')}</a>
          <a href="#learn-more" className="bg-gray-200 text-black px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-300 transition">{t('learnMore')}</a>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-green-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-green-700 hover:shadow-xl transition border-2 border-white"
          >
            🔐 لوحة التحكم الإدارية
          </button>
        </div>
      </div>
      
      {/* Admin Access Section */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 mt-8">
        <div className="container mx-auto py-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">🔐 وصول الإدارة</h2>
          <p className="text-white/90 mb-6">للوصول إلى لوحة التحكم الإدارية الكاملة</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:from-green-600 hover:to-green-700 hover:shadow-xl transition-all duration-300 border-2 border-white/30 hover:border-white/50"
          >
            🚀 دخول لوحة التحكم
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero; 
