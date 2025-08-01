// API Keys Page JavaScript
(function() {
    'use strict';
    
    console.log('API Keys JavaScript loading...');
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        console.log('Initializing API Keys functionality...');
        setupDeleteButtons();
        setupToggleButtons();
    }
    
    function setupDeleteButtons() {
        // Use event delegation on document body
        document.body.addEventListener('click', function(e) {
            // Check if clicked element is delete button or its child
            const deleteButton = e.target.closest('.delete-button');
            if (!deleteButton) return;
            
            // Prevent default button action
            e.preventDefault();
            e.stopPropagation();
            
            // Find parent form
            const form = deleteButton.closest('form');
            if (!form) {
                console.error('Delete form not found');
                return;
            }
            
            const apiKeyId = form.getAttribute('data-api-key-id');
            console.log('Delete button clicked for API Key:', apiKeyId);
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to delete this API key?')) {
                console.log('Delete confirmed, submitting form...');
                form.submit();
            } else {
                console.log('Delete cancelled');
            }
        });
    }
    
    function setupToggleButtons() {
        // Use event delegation on document body
        document.body.addEventListener('click', function(e) {
            // Check if clicked element is toggle button or its child
            const toggleButton = e.target.closest('.toggle-button');
            if (!toggleButton) return;
            
            // Prevent default button action
            e.preventDefault();
            e.stopPropagation();
            
            // Find parent form
            const form = toggleButton.closest('form');
            if (!form) {
                console.error('Toggle form not found');
                return;
            }
            
            const apiKeyId = form.getAttribute('data-api-key-id');
            const action = form.getAttribute('data-action');
            console.log('Toggle button clicked:', apiKeyId, action);
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to ' + action + ' this API key?')) {
                console.log('Toggle confirmed, submitting form...');
                form.submit();
            } else {
                console.log('Toggle cancelled');
            }
        });
    }
    
    console.log('API Keys JavaScript loaded successfully');
})();