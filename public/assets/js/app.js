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
    // Add fade-in animation to cards on page load
    const cards = document.querySelectorAll('.bg-gradient-to-br, .bg-white');
    cards.forEach((card, index) => {
      if (card.classList.contains('rounded-xl') || card.classList.contains('rounded-lg')) {
        setTimeout(() => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          card.style.transition = 'all 0.6s ease';
          
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        }, index * 100);
      }
    });

    // Enhanced hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('button, a[href], .cursor-pointer');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', function() {
        if (!this.style.transform.includes('scale')) {
          this.style.transform = 'translateY(-2px) scale(1.02)';
        }
      });
      
      element.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
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
    // Auto-hide flash messages after 5 seconds
    const alerts = document.querySelectorAll('.alert, .flash-message');
    alerts.forEach(alert => {
      setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }, 5000);
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
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-ruxchai-blue mr-3"></div>
        <span class="text-gray-600">${message}</span>
      </div>
    `;
    loader.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.appendChild(loader);
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