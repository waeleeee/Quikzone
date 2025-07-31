// QuickZone - Enhanced JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeSlider();
    initializeSmoothScrolling();
    initializeFormHandling();
    initializeAnimations();
    initializeLanguageToggle();
    initializeMobileMenu();
});

// Slider functionality
function initializeSlider() {
    let currentSlide = 0;
    const slider = document.querySelector('#slider');
    const slides = slider.children;
    const totalSlides = slides.length;
    const prevBtn = document.querySelector('#prevSlide');
    const nextBtn = document.querySelector('#nextSlide');

    function updateSlider() {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Auto-slide
    setInterval(nextSlide, 5000);

    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;

    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    slider.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }
}

// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form handling
function initializeFormHandling() {
    // Contact form
    const contactForm = document.querySelector('#contact .card-3d form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Complaints form
    const complaintsForm = document.querySelector('#complaints .card-3d');
    if (complaintsForm) {
        const submitBtn = complaintsForm.querySelector('button');
        const clearBtn = complaintsForm.querySelector('.form-btn.secondary');
        
        if (submitBtn) submitBtn.addEventListener('click', handleComplaintSubmit);
        if (clearBtn) clearBtn.addEventListener('click', clearComplaintForm);
    }

    // Form validation
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Simulate form submission
    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
    e.target.reset();
}

function handleComplaintSubmit(e) {
    e.preventDefault();
    const form = e.target.closest('.card-3d');
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            showFieldError(input, 'This field is required');
        }
    });

    if (isValid) {
        showNotification('Complaint submitted successfully! We\'ll investigate and get back to you.', 'success');
        clearComplaintForm();
    } else {
        showNotification('Please fill in all required fields.', 'error');
    }
}

function clearComplaintForm() {
    const form = document.querySelector('#complaints .card-3d');
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.value = '';
        clearFieldError(input);
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }

    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }

    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, 'Please enter a valid phone number');
            return false;
        }
    }

    clearFieldError(field);
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Animation initialization
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Trigger counter animation for stats
                if (entry.target.classList.contains('stat-card')) {
                    const statNumber = entry.target.querySelector('.stat-number');
                    if (statNumber && !statNumber.classList.contains('counted')) {
                        animateCounter(statNumber);
                        statNumber.classList.add('counted');
                    }
                }
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.slide-up, .card-3d, .stat-card');
    animatedElements.forEach(el => observer.observe(el));

    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('#home');
        if (hero) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
}

// Animated counter function
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const step = target / (duration / 16); // 60fps
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Add plus sign for numbers that should have it
        const displayValue = element.getAttribute('data-target') === '98' ? 
            Math.floor(current) + '%' : 
            Math.floor(current) + '+';
            
        element.textContent = displayValue;
    }, 16);
}

// Language toggle functionality
function initializeLanguageToggle() {
    const languageSelect = document.querySelector('#language');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            const selectedLanguage = e.target.value;
            changeLanguage(selectedLanguage);
        });
    }
}

function changeLanguage(language) {
    // This is a placeholder for language switching functionality
    // In a real implementation, you would load different language files
    const messages = {
        en: 'Language changed to English',
        fr: 'Langue changée en Français',
        ar: 'تم تغيير اللغة إلى العربية'
    };
    
    showNotification(messages[language] || 'Language changed', 'info');
}

// Mobile menu functionality
function initializeMobileMenu() {
    // Create mobile menu button
    const nav = document.querySelector('nav');
    const navList = nav.querySelector('ul');
    
    // Add mobile menu button for small screens
    if (window.innerWidth <= 768) {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.style.display = 'block';
        mobileMenuBtn.style.background = 'none';
        mobileMenuBtn.style.border = 'none';
        mobileMenuBtn.style.fontSize = '1.5rem';
        mobileMenuBtn.style.color = '#dc2626';
        mobileMenuBtn.style.cursor = 'pointer';
        
        navList.style.display = 'none';
        navList.style.position = 'absolute';
        navList.style.top = '100%';
        navList.style.left = '0';
        navList.style.right = '0';
        navList.style.background = 'white';
        navList.style.flexDirection = 'column';
        navList.style.padding = '1rem';
        navList.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        navList.style.zIndex = '1000';
        
        mobileMenuBtn.addEventListener('click', () => {
            navList.style.display = navList.style.display === 'none' ? 'flex' : 'none';
        });
        
        nav.appendChild(mobileMenuBtn);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 1.5rem';
    notification.style.borderRadius = '0.5rem';
    notification.style.color = 'white';
    notification.style.fontWeight = '600';
    notification.style.zIndex = '10000';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#dc2626',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize
window.addEventListener('resize', debounce(() => {
    // Reinitialize mobile menu on resize
    initializeMobileMenu();
}, 250));

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Export functions for global access
window.QuickZone = {
    showNotification,
    changeLanguage,
    validateField
}; 