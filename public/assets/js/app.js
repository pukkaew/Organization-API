/* Organization Management System - Local JavaScript */
/* Based on Organization Structure Service Requirements v2.pdf */
/* Section: Frontend Dependencies (Offline) */

// Global utilities
window.OrgSystem = {
  // Initialize system
  init: function() {
    this.setupMobileMenu();
    this.setupAnimations();
    this.setupFormValidation();
    this.setupNotifications();
    console.log('Organization Management System initialized');
  },

  // Mobile menu toggle
  setupMobileMenu: function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', function(e) {
        e.preventDefault();
        const isHidden = mobileMenu.classList.contains('hidden');
        
        if (isHidden) {
          mobileMenu.classList.remove('hidden');
          mobileMenu.classList.remove('mobile-menu-hidden');
          mobileMenu.classList.add('mobile-menu-visible');
          mobileMenu.classList.add('animate-fade-in');
        } else {
          mobileMenu.classList.add('hidden');
          mobileMenu.classList.add('mobile-menu-hidden');
          mobileMenu.classList.remove('mobile-menu-visible');
          mobileMenu.classList.remove('animate-fade-in');
        }
      });
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', function(e) {
        if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
          mobileMenu.classList.add('hidden');
          mobileMenu.classList.add('mobile-menu-hidden');
          mobileMenu.classList.remove('mobile-menu-visible');
        }
      });
    }
  },

  // Setup animations and transitions
  setupAnimations: function() {
    // Enhanced page load animations with staggered effect
    this.animateCardsOnLoad();
    this.setupInteractiveHovers();
    this.setupScrollAnimations();
    this.setupCounters();
    this.setupGlowEffects();
  },

  // Animate cards on page load
  animateCardsOnLoad: function() {
    const cards = document.querySelectorAll('.bg-white, .card, [class*="rounded-"]');
    cards.forEach((card, index) => {
      if (card.closest('nav') || card.closest('footer')) return; // Skip nav and footer elements
      
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.classList.add('animate-slideUp');
      }, index * 100 + 200); // Start after 200ms
    });
  },

  // Enhanced interactive hover effects
  setupInteractiveHovers: function() {
    // Buttons and links
    const interactiveElements = document.querySelectorAll('button, a[href], .btn, .nav-link');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', function() {
        if (!this.classList.contains('no-hover')) {
          this.style.transform = 'translateY(-2px)';
          this.style.transition = 'all 0.2s ease';
        }
      });
      
      element.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });

    // Cards with special hover effects
    const hoverCards = document.querySelectorAll('.card, .bg-white');
    hoverCards.forEach(card => {
      if (card.closest('nav') || card.closest('footer')) return;
      
      card.addEventListener('mouseenter', function() {
        if (!this.classList.contains('no-hover')) {
          this.style.transform = 'translateY(-5px)';
          this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
          this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '';
      });
    });
  },

  // Scroll-triggered animations
  setupScrollAnimations: function() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeIn');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements that should animate on scroll
    const animateOnScroll = document.querySelectorAll('.stats-card, .quick-action, .api-stat');
    animateOnScroll.forEach(el => observer.observe(el));
  },

  // Animated counters for numbers
  setupCounters: function() {
    const counters = document.querySelectorAll('[data-counter]');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-counter') || counter.textContent);
      const duration = 2000;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const updateCounter = () => {
        current += increment;
        if (current >= target) {
          counter.textContent = target;
          counter.classList.add('animate-countUp');
        } else {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        }
      };

      // Start counter when element comes into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      });
      observer.observe(counter);
    });
  },

  // Glow effects for important elements
  setupGlowEffects: function() {
    const glowElements = document.querySelectorAll('.btn-primary, .nav-link.active');
    glowElements.forEach(element => {
      element.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 0 20px rgba(0, 144, 211, 0.5)';
        this.style.transition = 'all 0.3s ease';
      });
      
      element.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
      });
    });
  },

  // Form validation
  setupFormValidation: function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const requiredFields = this.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            OrgSystem.showFieldError(field, 'This field is required');
          } else {
            OrgSystem.clearFieldError(field);
          }
        });
        
        if (!isValid) {
          e.preventDefault();
          OrgSystem.showNotification('Please fill in all required fields', 'error');
        }
      });
    });
  },

  // Show field error
  showFieldError: function(field, message) {
    this.clearFieldError(field);
    
    field.style.borderColor = '#DC3545';
    field.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-600 text-sm mt-1';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
  },

  // Clear field error
  clearFieldError: function(field) {
    field.style.borderColor = '';
    field.style.backgroundColor = '';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  },

  // Notification system
  setupNotifications: function() {
    // Flash messages removed - no longer needed
    
    // Manual close button
    document.querySelectorAll('[role="alert"] button').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        const alert = e.target.closest('[role="alert"]');
        alert.classList.add('animate-fade-out');
        setTimeout(function() {
          alert.remove();
        }, 300);
      });
    });
  },

  // Show notification
  showNotification: function(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    notification.className = `fixed top-4 right-4 p-4 rounded-lg border ${colors[type]} z-50 shadow-lg`;
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'all 0.3s ease';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 50);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  },

  // AJAX utilities
  ajax: function(options) {
    const defaults = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    
    const config = Object.assign(defaults, options);
    
    return fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : null
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .catch(error => {
      this.showNotification(`Error: ${error.message}`, 'error');
      throw error;
    });
  },

  // Copy to clipboard utility
  copyToClipboard: function(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification(successMessage, 'success');
      }).catch(err => {
        this.fallbackCopyTextToClipboard(text, successMessage);
      });
    } else {
      this.fallbackCopyTextToClipboard(text, successMessage);
    }
  },

  // Fallback copy method for older browsers
  fallbackCopyTextToClipboard: function(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showNotification(successMessage, 'success');
    } catch (err) {
      this.showNotification('Failed to copy text', 'error');
    }
    
    document.body.removeChild(textArea);
  },

  // Loading spinner
  showLoading: function(element, message = 'Loading...') {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner mb-2"></div>
        <div class="text-sm text-gray-600">${message}</div>
      </div>
    `;
    
    element.style.position = 'relative';
    element.appendChild(loader);
  },

  // Show skeleton loader for tables
  showTableSkeleton: function(tableElement, rows = 5) {
    const thead = tableElement.querySelector('thead');
    const tbody = tableElement.querySelector('tbody');
    
    if (!tbody) return;
    
    const headerCells = thead ? thead.querySelectorAll('th').length : 3;
    
    tbody.innerHTML = '';
    
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('tr');
      row.className = 'skeleton-table';
      
      for (let j = 0; j < headerCells; j++) {
        const cell = document.createElement('td');
        cell.className = 'px-6 py-4';
        
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton-line ${j === 0 ? 'w-32' : j === headerCells - 1 ? 'w-16' : 'w-24'}`;
        
        cell.appendChild(skeleton);
        row.appendChild(cell);
      }
      
      tbody.appendChild(row);
    }
  },

  // Show skeleton for cards
  showCardSkeleton: function(cardElement) {
    cardElement.innerHTML = `
      <div class="p-6 space-y-4">
        <div class="flex items-center space-x-3">
          <div class="skeleton-circle w-12 h-12"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton-line w-3/4"></div>
            <div class="skeleton-line--sm w-1/2"></div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="skeleton-line w-full"></div>
          <div class="skeleton-line w-4/5"></div>
          <div class="skeleton-line w-3/5"></div>
        </div>
      </div>
    `;
  },

  hideLoading: function(element) {
    const loader = element.querySelector('.loading-overlay');
    if (loader) {
      loader.remove();
    }
  },

  // Table utilities
  setupTableFeatures: function() {
    // Add sorting to tables
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', function() {
        const table = this.closest('table');
        const column = this.dataset.sort;
        OrgSystem.sortTable(table, column);
      });
    });
  },

  sortTable: function(table, column) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const header = table.querySelector(`th[data-sort="${column}"]`);
    const isAscending = !header.classList.contains('sort-asc');
    
    // Remove existing sort classes
    table.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add current sort class
    header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    
    rows.sort((a, b) => {
      const aText = a.cells[header.cellIndex].textContent.trim();
      const bText = b.cells[header.cellIndex].textContent.trim();
      
      if (isAscending) {
        return aText.localeCompare(bText);
      } else {
        return bText.localeCompare(aText);
      }
    });
    
    rows.forEach(row => tbody.appendChild(row));
  },

  // Responsive table wrapper
  makeTablesResponsive: function() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.parentElement.classList.contains('overflow-x-auto')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'overflow-x-auto';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }
};

// Utility functions for common tasks
function confirmDelete(message = 'Are you sure you want to delete this item?') {
  return confirm(message);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatNumber(number) {
  return new Intl.NumberFormat('th-TH').format(number);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  OrgSystem.init();
  OrgSystem.makeTablesResponsive();
  OrgSystem.setupTableFeatures();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrgSystem;
}