// Path: /public/js/main.js

// Organization Management System - Main JavaScript

// Global namespace
window.OrgStructure = window.OrgStructure || {};

// Utility functions
OrgStructure.utils = {
    // Format date to Thai locale
    formatDate: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Format datetime to Thai locale
    formatDateTime: function(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('th-TH');
    },
    
    // Copy to clipboard
    copyToClipboard: function(text, button) {
        navigator.clipboard.writeText(text).then(function() {
            const originalHtml = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
            button.classList.add('bg-green-600', 'hover:bg-green-700');
            
            setTimeout(function() {
                button.innerHTML = originalHtml;
                button.classList.remove('bg-green-600', 'hover:bg-green-700');
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    },
    
    // Show loading state
    showLoading: function(element) {
        element.disabled = true;
        element.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    },
    
    // Hide loading state
    hideLoading: function(element, originalText) {
        element.disabled = false;
        element.innerHTML = originalText;
    },
    
    // Debounce function
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
    
    // Format number with commas
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Get CSRF token
    getCSRFToken: function() {
        return document.querySelector('meta[name="csrf-token"]')?.content || '';
    }
};

// API helper functions
OrgStructure.api = {
    // Base API URL
    baseURL: '/api/v1',
    
    // Make API request
    request: async function(method, endpoint, data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        // Add CSRF token for non-GET requests
        if (method !== 'GET') {
            const csrfToken = OrgStructure.utils.getCSRFToken();
            if (csrfToken) {
                options.headers['X-CSRF-Token'] = csrfToken;
            }
        }
        
        // Add data to request
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(this.baseURL + endpoint, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error?.message || 'API request failed');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // GET request
    get: function(endpoint) {
        return this.request('GET', endpoint);
    },
    
    // POST request
    post: function(endpoint, data) {
        return this.request('POST', endpoint, data);
    },
    
    // PUT request
    put: function(endpoint, data) {
        return this.request('PUT', endpoint, data);
    },
    
    // DELETE request
    delete: function(endpoint) {
        return this.request('DELETE', endpoint);
    },
    
    // PATCH request
    patch: function(endpoint, data) {
        return this.request('PATCH', endpoint, data);
    }
};

// Form helpers
OrgStructure.forms = {
    // Validate form
    validate: function(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });
        
        return isValid;
    },
    
    // Serialize form data
    serialize: function(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    },
    
    // Reset form
    reset: function(formElement) {
        formElement.reset();
        const errorFields = formElement.querySelectorAll('.border-red-500');
        errorFields.forEach(field => {
            field.classList.remove('border-red-500');
        });
    }
};

// Table helpers
OrgStructure.tables = {
    // Sort table
    sort: function(tableId, column, order = 'asc') {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        // Implementation for client-side sorting
        console.log('Sorting table by', column, order);
    },
    
    // Filter table
    filter: function(tableId, searchTerm) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide alerts
    const alerts = document.querySelectorAll('.alert');
    if (alerts.length > 0) {
        setTimeout(() => {
            alerts.forEach(alert => {
                if (!alert.classList.contains('no-auto-hide')) {
                    alert.style.opacity = '0';
                    alert.style.transition = 'opacity 0.5s ease-in-out';
                    setTimeout(() => alert.remove(), 500);
                }
            });
        }, 5000);
    }
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    });
    
    // Add relative time function
    Date.prototype.toRelativeTime = function() {
        const seconds = Math.floor((new Date() - this) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }
        
        return 'just now';
    };
    
    // Auto-submit forms on select change
    const autoSubmitSelects = document.querySelectorAll('.auto-submit');
    autoSubmitSelects.forEach(select => {
        select.addEventListener('change', function() {
            this.form.submit();
        });
    });
    
    // Confirm delete actions
    const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm-delete') || 'Are you sure you want to delete this item?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
    
    // Handle dynamic form fields
    const dynamicForms = document.querySelectorAll('[data-dynamic-form]');
    dynamicForms.forEach(form => {
        // Implementation for dynamic form field addition/removal
        console.log('Dynamic form initialized');
    });
    
    // Initialize tooltips (if using a tooltip library)
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        // Simple tooltip implementation
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.bottom = '100%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%) translateY(-0.5rem)';
            
            this.style.position = 'relative';
            this.appendChild(tooltip);
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = this.querySelector('.absolute');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
    
    // Handle file uploads
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'No file selected';
            const label = this.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.textContent = fileName;
            }
        });
    });
    
    // Search functionality with debounce
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        const debouncedSearch = OrgStructure.utils.debounce(function(value) {
            // Implement search logic
            console.log('Searching for:', value);
        }, 300);
        
        input.addEventListener('input', function() {
            debouncedSearch(this.value);
        });
    });
    
    // Handle print functionality
    const printButtons = document.querySelectorAll('[data-print]');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.print();
        });
    });
    
    // Handle export functionality
    const exportButtons = document.querySelectorAll('[data-export]');
    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const format = this.getAttribute('data-export');
            const url = window.location.href;
            const separator = url.includes('?') ? '&' : '?';
            window.location.href = `${url}${separator}export=${format}`;
        });
    });
    
    // Initialize any charts (if Chart.js is loaded)
    if (typeof Chart !== 'undefined') {
        const chartElements = document.querySelectorAll('[data-chart]');
        chartElements.forEach(element => {
            const chartType = element.getAttribute('data-chart');
            const chartData = JSON.parse(element.getAttribute('data-chart-data') || '{}');
            
            new Chart(element, {
                type: chartType,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        });
    }
});

// Expose to global scope
window.OrgStructure = OrgStructure;