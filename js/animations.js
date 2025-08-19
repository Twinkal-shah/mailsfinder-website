/**
 * Mailsfinder Website Animations
 * This file contains all animation-related functionality for the website
 */

class Animations {
  constructor() {
    // Initialize animation libraries
    this.initAOS();
    this.initGSAP();
    
    // Initialize animation features
    this.setupScrollAnimations();
    this.setupHeroAnimations();
    this.setupMicroInteractions();
    this.setupEmailVerificationAnimation(); // Add this line
    this.setupDarkMode();
  }

  /**
   * Initialize AOS (Animate On Scroll) library
   */
  initAOS() {
    // Initialize AOS with custom settings
    AOS.init({
      duration: 800,
      easing: 'ease-out',
      once: false,
      mirror: true,
      offset: 50
    });

    // Refresh AOS on window resize
    window.addEventListener('resize', () => {
      AOS.refresh();
    });
  }

  /**
   * Initialize GSAP and ScrollTrigger
   */
  initGSAP() {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Set default ease for all animations
    gsap.defaults({
      ease: 'power2.out',
      duration: 0.8
    });
  }

  /**
   * Set up scroll-triggered animations for page sections
   */
  setupScrollAnimations() {
    // Staggered entrance for feature cards
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-section',
        start: 'top 70%',
        toggleActions: 'play none none none'
      },
      y: 50,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6
    });

    // Animate pricing table rows
    gsap.from('tbody tr', {
      scrollTrigger: {
        trigger: '.pricing-table',
        start: 'top 80%'
      },
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.5
    });

    // Animate the "BEST VALUE" label with a bounce effect
    gsap.from('.pricing-table .bg-accent', {
      scrollTrigger: {
        trigger: '.pricing-table',
        start: 'top 80%'
      },
      scale: 0,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      delay: 0.5
    });

    // Testimonial section parallax effect
    ScrollTrigger.create({
      trigger: '.testimonials-section',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        gsap.to('.testimonials-section', {
          backgroundPositionY: `${self.progress * 30}%`,
          duration: 0.1,
          ease: 'none'
        });
      }
    });
  }

  /**
   * Set up hero section animations
   */
  setupHeroAnimations() {
    // Animate hero section elements on page load
    const heroTimeline = gsap.timeline();
    
    heroTimeline
      .from('.hero-title', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2
      })
      .from('.hero-subtitle', {
        y: 20,
        opacity: 0,
        duration: 0.6
      }, '-=0.4')
      .from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.6
      }, '-=0.3')
      .from('.hero-image', {
        scale: 0.9,
        opacity: 0,
        duration: 0.8
      }, '-=0.5');

    // Floating animation for hero image
    gsap.to('.hero-image', {
      y: 15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  /**
   * Set up micro-interactions for UI elements
   */
  setupMicroInteractions() {
    // Button hover effects
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.2
        });
      });
      
      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.2
        });
      });
    });

    // Card hover effects
    const cards = document.querySelectorAll('.feature-card, .pricing-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -5,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          duration: 0.3
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          duration: 0.3
        });
      });
    });

    // Animate the "BEST VALUE" label
    const bestValueLabels = document.querySelectorAll('.bg-accent');
    bestValueLabels.forEach(label => {
      gsap.to(label, {
        scale: 1.05,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });
  }

  /**
   * Set up dark mode toggle functionality
   */
  setupDarkMode() {
    const darkModeToggle = document.querySelector('#darkModeToggle');
    const darkModeToggleMobile = document.querySelector('#darkModeToggleMobile');
    const toggles = [darkModeToggle, darkModeToggleMobile].filter(toggle => toggle);
    
    if (toggles.length) {
      // Check for saved user preference or system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem('theme');
      
      // Apply initial theme
      if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
        document.documentElement.classList.add('dark');
        toggles.forEach(toggle => toggle.checked = true);
      }
      
      // Handle toggle changes
      toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
          const isDark = toggle.checked;
          
          // Sync other toggle
          toggles.forEach(t => {
            if (t !== toggle) t.checked = isDark;
          });
          
          if (isDark) {
            // Enable dark mode
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            
            // Animate transition
            gsap.to('body', {
              backgroundColor: 'var(--dark-bg-primary)',
              color: 'var(--dark-text-primary)',
              duration: 0.5
            });
            
            // Animate cards and other elements
            gsap.to('.bg-white', {
              backgroundColor: 'var(--dark-card-bg)',
              duration: 0.5
            });
            
            gsap.to('.text-text-dark', {
              color: 'var(--dark-text-primary)',
              duration: 0.5
            });
            
            gsap.to('.text-text-gray', {
              color: 'var(--dark-text-secondary)',
              duration: 0.5
            });
            
            gsap.to('.border-gray-200', {
              borderColor: 'var(--dark-border)',
              duration: 0.5
            });
          } else {
            // Disable dark mode
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            
            // Animate transition back to light mode
            gsap.to('body', {
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              duration: 0.5
            });
            
            // Animate cards and other elements
            gsap.to('.bg-white', {
              backgroundColor: 'var(--bg-secondary)',
              duration: 0.5
            });
            
            gsap.to('.text-text-dark', {
              color: 'var(--text-primary)',
              duration: 0.5
            });
            
            gsap.to('.text-text-gray', {
              color: 'var(--text-secondary)',
              duration: 0.5
            });
            
            gsap.to('.border-gray-200', {
              borderColor: 'var(--border)',
              duration: 0.5
            });
          }
        });
      });
    }
  }
  /**
   * Set up email verification animation
   */
  setupEmailVerificationAnimation() {
    // Add a container for the particles background
    const verifySection = document.querySelector('.how-it-works .text-center:nth-child(2)');
    
    if (verifySection) {
      // Create a container for the particles
      const particleContainer = document.createElement('div');
      particleContainer.id = 'email-verification-bg';
      particleContainer.classList.add('absolute', 'inset-0', 'z-0', 'opacity-50');
      verifySection.classList.add('relative');
      verifySection.prepend(particleContainer);
      
      // Create a scanning line element
      const iconContainer = verifySection.querySelector('.w-20');
      const scanLine = document.createElement('div');
      scanLine.classList.add('scan-line', 'absolute', 'w-full', 'h-1', 'bg-accent', 'opacity-0');
      iconContainer.classList.add('relative', 'overflow-hidden');
      iconContainer.appendChild(scanLine);
      
      // Initialize particles.js with optimized settings
      if (window.particlesJS) {
        particlesJS('email-verification-bg', {
          particles: {
            number: { value: 20, density: { enable: true, value_area: 800 } }, // Reduced particle count
            color: { value: '#10B981' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#10B981', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 1, direction: 'none', random: true, out_mode: 'out' } // Reduced speed
          },
          interactivity: {
            detect_on: 'canvas',
            events: { 
              onhover: { enable: true, mode: 'grab' }, 
              onclick: { enable: false } // Disabled click interaction for performance
            },
            modes: { grab: { distance: 140, line_linked: { opacity: 1 } } }
          },
          retina_detect: false // Disabled retina detection for performance
        });
      }
      
      // Use ScrollTrigger to only animate when in view
      const animationTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: verifySection,
          start: 'top 70%',
          end: 'bottom 30%',
          toggleActions: 'play pause resume reset'
        }
      });
      
      // Scanning animation - only runs when in viewport
      animationTimeline.fromTo(scanLine, 
        { y: -40, opacity: 0 },
        { 
          y: 40, 
          opacity: 0.8, 
          duration: 1.5, 
          repeat: -1, 
          yoyo: true,
          ease: 'power2.inOut'
        }
      );
      
      // Pulsing glow effect for the icon - only runs when in viewport
      animationTimeline.to(iconContainer, {
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.7)',
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: 'sine.inOut'
      }, '<');
      
      // Add checkmarks with staggered animation when scrolled into view
      animationTimeline.add(() => {
        // Add verification checkmarks with staggered animation
        const checkmarks = [];
        for (let i = 0; i < 3; i++) {
          const checkmark = document.createElement('div');
          checkmark.innerHTML = '<i class="fas fa-check-circle text-accent text-xs"></i>';
          checkmark.classList.add('absolute', 'opacity-0');
          checkmark.style.top = `${Math.random() * 80}%`;
          checkmark.style.left = `${Math.random() * 80}%`;
          iconContainer.appendChild(checkmark);
          checkmarks.push(checkmark);
        }
        
        gsap.to(checkmarks, {
          opacity: 1,
          stagger: 0.3,
          duration: 0.5,
          ease: 'back.out(1.7)'
        });
      });
    }
  }
}

// Initialize animations when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new Animations();
});