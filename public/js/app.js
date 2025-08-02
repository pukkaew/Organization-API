// Global JavaScript for Organization Management System
// Using event delegation to avoid duplicate function definitions

document.addEventListener('DOMContentLoaded', function() {
    // Confirm Delete Handler using Event Delegation
    document.addEventListener('click', function(e) {
        // Check if clicked element is a delete button
        const deleteBtn = e.target.closest('button[onclick*="confirmDelete"]');
        if (deleteBtn) {
            e.preventDefault();
            
            const form = deleteBtn.closest('form');
            const onclick = deleteBtn.getAttribute('onclick');
            
            // Extract parameters from onclick attribute
            const match = onclick.match(/confirmDelete\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                const code = match[1];
                const entityType = match[2];
                const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
                
                const userInput = prompt(`คำเตือน: ลบ ${entityName} ${code}?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!\n\nจะทำการลบข้อมูลที่เกี่ยวข้องทั้งหมด:\n• ข้อมูลทั้งหมดภายใต้ ${entityType} นี้\n• ข้อมูลและความสัมพันธ์ที่เชื่อมโยง\n\nพิมพ์ "DELETE" เพื่อยืนยันว่าเข้าใจผลที่ตามมา`);
                
                if (userInput === 'DELETE') {
                    form.submit();
                }
            }
        }
    });
    
    // Toggle Status Handler using Event Delegation
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        // Check if it's a toggle status form
        if (form.action && form.action.includes('/toggle-status')) {
            const button = form.querySelector('button[type="submit"]');
            if (button) {
                const confirmMessage = button.getAttribute('onclick');
                if (confirmMessage && confirmMessage.includes('confirm')) {
                    e.preventDefault();
                    
                    // Extract the confirmation message
                    const match = confirmMessage.match(/confirm\('([^']+)'\)/);
                    if (match && confirm(match[1])) {
                        form.submit();
                    }
                }
            }
        }
    });
    
    // Universal Form Submit Handler with Loading States
    const forms = document.querySelectorAll('form[method="post"], form[method="POST"]');
    forms.forEach(form => {
        // Skip forms that already have submit handlers
        if (form.dataset.hasSubmitHandler) return;
        
        form.addEventListener('submit', function(e) {
            // Don't apply to delete or toggle forms (they have their own handlers)
            if (form.action && (form.action.includes('/delete') || form.action.includes('/toggle-status'))) {
                return;
            }
            
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (!submitBtn) return;
            
            // Prevent double submission
            if (submitBtn.disabled) {
                e.preventDefault();
                return;
            }
            
            // Add loading state
            submitBtn.disabled = true;
            
            // Handle different button structures
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                btnText.classList.add('hidden');
                btnLoading.classList.remove('hidden');
            } else {
                // Fallback for simple buttons
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="spinner mr-2"></span> กำลังโหลด...';
                submitBtn.dataset.originalText = originalText;
            }
        });
        
        form.dataset.hasSubmitHandler = 'true';
    });
    
    // Mobile Menu Toggle Handler
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            
            // Update icon
            const icon = mobileMenuButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
    
    // Table Responsive Scroll Indicator
    const tables = document.querySelectorAll('.table-responsive');
    tables.forEach(table => {
        const wrapper = table.closest('.overflow-x-auto');
        if (wrapper) {
            wrapper.addEventListener('scroll', function() {
                const scrollLeft = wrapper.scrollLeft;
                const scrollWidth = wrapper.scrollWidth;
                const clientWidth = wrapper.clientWidth;
                
                // Add/remove scroll indicators
                wrapper.classList.toggle('scroll-left', scrollLeft > 0);
                wrapper.classList.toggle('scroll-right', scrollLeft < scrollWidth - clientWidth - 1);
            });
            
            // Check initial state
            wrapper.dispatchEvent(new Event('scroll'));
        }
    });
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert, .flash-message');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s ease-out';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });
    
    // Enhance form validation feedback
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('invalid', function(e) {
            e.preventDefault();
            input.classList.add('border-red-500');
            
            // Add error message if not exists
            let errorMsg = input.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                errorMsg = document.createElement('p');
                errorMsg.className = 'error-message text-red-500 text-sm mt-1';
                errorMsg.textContent = input.validationMessage || 'This field is required';
                input.parentNode.insertBefore(errorMsg, input.nextSibling);
            }
        });
        
        input.addEventListener('input', function() {
            if (input.validity.valid) {
                input.classList.remove('border-red-500');
                const errorMsg = input.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.remove();
                }
            }
        });
    });
});

// Utility Functions
window.OrganizationApp = {
    // Format number with thousand separators
    formatNumber: function(num) {
        return new Intl.NumberFormat('th-TH').format(num);
    },
    
    // Format date to Thai locale
    formatDate: function(date) {
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    // Show toast notification
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            type === 'warning' ? 'bg-amber-600' : 
            'bg-blue-600'
        }`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 
                    'info-circle'
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transition = 'opacity 0.5s ease-out';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
};