// Mailsfinder Homepage - Enhanced JavaScript
(function() {
    'use strict';

    // Performance monitoring
    const perfStart = performance.now();

    // Utility functions
    const utils = {
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        isInViewport: function(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        preloadImage: function(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = src;
            });
        }
    };

    // Enhanced Intersection Observer for animations
    class AnimationObserver {
        constructor() {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                }
            );
            this.animatedElements = new Set();
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animateElement(entry.target);
                    this.animatedElements.add(entry.target);
                }
            });
        }

        animateElement(element) {
            const animationType = element.getAttribute('data-animate') || 'fade-in';
            const delay = element.getAttribute('data-delay') || 0;
            
            setTimeout(() => {
                element.classList.add('animate-' + animationType);
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, delay);
        }

        observe(element) {
            this.observer.observe(element);
        }
    }

    // Enhanced Mobile Menu
    class MobileMenu {
        constructor() {
            this.menu = document.getElementById('mobile-menu');
            this.toggle = document.querySelector('[onclick="toggleMobileMenu()"]');
            this.isOpen = false;
            this.init();
        }

        init() {
            if (this.toggle) {
                this.toggle.removeAttribute('onclick');
                this.toggle.addEventListener('click', this.toggleMenu.bind(this));
            }

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.menu.contains(e.target) && !this.toggle.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });
        }

        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            this.menu.classList.remove('hidden');
            this.menu.setAttribute('aria-hidden', 'false');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.isOpen = true;
            
            // Animate menu items
            const menuItems = this.menu.querySelectorAll('a, button');
            menuItems.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }

        closeMenu() {
            this.menu.classList.add('hidden');
            this.menu.setAttribute('aria-hidden', 'true');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.isOpen = false;
        }
    }

    // Enhanced Testimonials Carousel
    class TestimonialCarousel {
        constructor() {
            this.track = document.getElementById('testimonials-track');
            this.prevBtn = document.getElementById('prev-btn');
            this.nextBtn = document.getElementById('next-btn');
            this.dotsContainer = document.getElementById('testimonial-dots');
            
            if (!this.track) return;
            
            this.testimonials = Array.from(this.track.children);
            this.currentIndex = 0;
            this.itemsPerView = this.getItemsPerView();
            this.totalPages = Math.ceil(this.testimonials.length / this.itemsPerView);
            this.autoplayInterval = null;
            this.isPlaying = true;
            
            this.init();
            this.createDots();
            this.updateCarousel();
            this.startAutoplay();
            
            // Handle resize with debouncing
            window.addEventListener('resize', utils.debounce(() => {
                this.handleResize();
            }, 250));
            
            // Pause autoplay on hover
            this.track.addEventListener('mouseenter', () => this.pauseAutoplay());
            this.track.addEventListener('mouseleave', () => this.startAutoplay());
        }
        
        getItemsPerView() {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 768) return 2;
            return 1;
        }
        
        init() {
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => {
                    this.prev();
                    this.pauseAutoplay();
                });
            }
            
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => {
                    this.next();
                    this.pauseAutoplay();
                });
            }
            
            // Add keyboard navigation
            this.track.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') this.prev();
                if (e.key === 'ArrowRight') this.next();
            });
        }
        
        createDots() {
            if (!this.dotsContainer) return;
            
            this.dotsContainer.innerHTML = '';
            for (let i = 0; i < this.totalPages; i++) {
                const dot = document.createElement('button');
                dot.className = `w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                    i === this.currentIndex ? 'bg-primary' : 'bg-gray-300'
                }`;
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    this.goToSlide(i);
                    this.pauseAutoplay();
                });
                this.dotsContainer.appendChild(dot);
            }
        }
        
        updateCarousel() {
            const translateX = -this.currentIndex * (100 / this.itemsPerView);
            this.track.style.transform = `translateX(${translateX}%)`;
            
            // Update dots
            if (this.dotsContainer) {
                const dots = this.dotsContainer.children;
                for (let i = 0; i < dots.length; i++) {
                    dots[i].className = `w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                        i === this.currentIndex ? 'bg-primary' : 'bg-gray-300'
                    }`;
                }
            }
            
            // Update button states
            if (this.prevBtn) {
                this.prevBtn.disabled = this.currentIndex === 0;
                this.prevBtn.classList.toggle('opacity-50', this.currentIndex === 0);
            }
            
            if (this.nextBtn) {
                this.nextBtn.disabled = this.currentIndex === this.totalPages - 1;
                this.nextBtn.classList.toggle('opacity-50', this.currentIndex === this.totalPages - 1);
            }
        }
        
        next() {
            this.currentIndex = (this.currentIndex + 1) % this.totalPages;
            this.updateCarousel();
        }
        
        prev() {
            this.currentIndex = (this.currentIndex - 1 + this.totalPages) % this.totalPages;
            this.updateCarousel();
        }
        
        goToSlide(index) {
            this.currentIndex = index;
            this.updateCarousel();
        }
        
        startAutoplay() {
            if (!this.isPlaying) return;
            this.autoplayInterval = setInterval(() => {
                this.next();
            }, 5000);
        }
        
        pauseAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }
        
        handleResize() {
            const newItemsPerView = this.getItemsPerView();
            if (newItemsPerView !== this.itemsPerView) {
                this.itemsPerView = newItemsPerView;
                this.totalPages = Math.ceil(this.testimonials.length / this.itemsPerView);
                this.currentIndex = Math.min(this.currentIndex, this.totalPages - 1);
                this.createDots();
                this.updateCarousel();
            }
        }
    }

    // Smooth Scrolling Enhancement
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    if (target) {
                        this.scrollToElement(target);
                    }
                });
            });
        }

        scrollToElement(element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Performance Monitoring
    class PerformanceMonitor {
        constructor() {
            this.init();
        }

        init() {
            // Monitor page load performance
            window.addEventListener('load', () => {
                const perfEnd = performance.now();
                const loadTime = perfEnd - perfStart;
                
                console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
                
                // Report to analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'timing_complete', {
                        name: 'page_load',
                        value: Math.round(loadTime)
                    });
                }
            });

            // Monitor Core Web Vitals
            if ('web-vital' in window) {
                this.measureWebVitals();
            }
        }

        measureWebVitals() {
            // This would integrate with a Web Vitals library
            // For now, we'll just log basic metrics
            
            if ('PerformanceObserver' in window) {
                // Measure LCP
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // Measure FID
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            }
        }
    }

    // Error Handling
    class ErrorHandler {
        constructor() {
            this.init();
        }

        init() {
            window.addEventListener('error', (e) => {
                console.error('JavaScript error:', e.error);
                // Report to error tracking service
                this.reportError(e.error);
            });

            window.addEventListener('unhandledrejection', (e) => {
                console.error('Unhandled promise rejection:', e.reason);
                this.reportError(e.reason);
            });
        }

        reportError(error) {
            // This would integrate with an error reporting service
            console.log('Error reported:', error);
        }
    }

    // Initialize everything when DOM is ready
    function initialize() {
        const animationObserver = new AnimationObserver();
        const mobileMenu = new MobileMenu();
        const testimonialCarousel = new TestimonialCarousel();
        const smoothScroll = new SmoothScroll();
        const performanceMonitor = new PerformanceMonitor();
        const errorHandler = new ErrorHandler();

        // Observe elements for animations
        document.querySelectorAll('section, .card-shadow, .btn-primary, .btn-secondary').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease-in-out';
            animationObserver.observe(element);
        });

        // Add loading states to buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                if (!this.disabled) {
                    this.classList.add('loading');
                    setTimeout(() => {
                        this.classList.remove('loading');
                    }, 1000);
                }
            });
        });

        console.log('Mailsfinder homepage initialized successfully!');
    }

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();