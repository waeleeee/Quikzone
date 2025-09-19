import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../App.css';

// Use real images from GitHub repository
const slides = [
  { 
    img: 'https://raw.githubusercontent.com/waeleeee/Quikzone/main/public/images/Hero/1.png', 
    fallback: 'QuickZone Delivery Service' 
  },
  { 
    img: 'https://raw.githubusercontent.com/waeleeee/Quikzone/main/public/images/Hero/2.png', 
    fallback: 'Fast & Reliable Delivery' 
  },
  { 
    img: 'https://raw.githubusercontent.com/waeleeee/Quikzone/main/public/images/Hero/3.png', 
    fallback: 'Professional Service' 
  },
  { 
    img: 'https://raw.githubusercontent.com/waeleeee/Quikzone/main/public/images/Hero/4.png', 
    fallback: 'QuickZone Excellence' 
  },
  { 
    img: 'https://raw.githubusercontent.com/waeleeee/Quikzone/main/public/images/Hero/5.png', 
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
