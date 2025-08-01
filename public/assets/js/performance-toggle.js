// Performance Mode Toggle for Ruxchai Cold Storage
// ===============================================

class PerformanceManager {
    constructor() {
        this.isPerformanceMode = localStorage.getItem('performanceMode') === 'true';
        this.init();
    }

    init() {
        // Apply performance mode on page load
        if (this.isPerformanceMode) {
            this.enablePerformanceMode();
        }
        
        // Add toggle button to navigation (if needed)
        this.addToggleButton();
        
        // Auto-detect slow performance
        this.detectSlowPerformance();
    }

    enablePerformanceMode() {
        document.body.classList.add('critical-performance');
        localStorage.setItem('performanceMode', 'true');
        this.isPerformanceMode = true;
        console.log('🚀 Ultra-fast performance mode enabled');
    }

    disablePerformanceMode() {
        document.body.classList.remove('critical-performance');
        localStorage.setItem('performanceMode', 'false');
        this.isPerformanceMode = false;
        console.log('🎨 Normal visual mode restored');
    }

    toggle() {
        if (this.isPerformanceMode) {
            this.disablePerformanceMode();
        } else {
            this.enablePerformanceMode();
        }
        this.updateToggleButton();
    }

    addToggleButton() {
        // Add a small performance toggle in the footer or navigation
        const toggleHtml = `
            <button id="performance-toggle" 
                    class="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
                    title="Toggle Performance Mode"
                    style="width: 48px; height: 48px; display: none;">
                <span class="text-lg">${this.isPerformanceMode ? '⚡' : '🎨'}</span>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', toggleHtml);
        
        const button = document.getElementById('performance-toggle');
        if (button) {
            button.addEventListener('click', () => this.toggle());
        }
    }

    updateToggleButton() {
        const button = document.getElementById('performance-toggle');
        if (button) {
            const span = button.querySelector('span');
            if (span) {
                span.textContent = this.isPerformanceMode ? '⚡' : '🎨';
            }
            button.title = this.isPerformanceMode ? 
                'Switch to Normal Mode' : 
                'Switch to Performance Mode';
        }
    }

    detectSlowPerformance() {
        // Measure page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
                
                console.log(`Page load time: ${loadTime}ms`);
                
                // Auto-enable performance mode if page loads slowly
                if (loadTime > 2000 && !this.isPerformanceMode) {
                    console.log('🐌 Slow page detected, suggesting performance mode');
                    this.showPerformanceSuggestion();
                }
            }, 1000);
        });
    }

    showPerformanceSuggestion() {
        // Show a subtle suggestion to enable performance mode
        const suggestion = document.createElement('div');
        suggestion.className = 'fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg';
        suggestion.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>⚡</span>
                <span class="text-sm">เว็บทำงานช้า? ลองโหมดประสิทธิภาพสูง</span>
                <button onclick="performanceManager.enablePerformanceMode(); this.parentElement.parentElement.remove();" 
                        class="ml-2 bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded text-xs">
                    เปิดใช้
                </button>
                <button onclick="this.parentElement.parentElement.remove();" 
                        class="text-yellow-600 hover:text-yellow-800">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(suggestion);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (suggestion.parentElement) {
                suggestion.remove();
            }
        }, 10000);
    }

    // Utility method to check current performance
    checkPerformance() {
        const startTime = performance.now();
        
        // Trigger a reflow/repaint to measure performance
        document.body.offsetHeight;
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        console.log(`Render time: ${renderTime}ms`);
        return renderTime;
    }
}

// Initialize performance manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.performanceManager = new PerformanceManager();
});

// Keyboard shortcut: Ctrl+Shift+P to toggle performance mode
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (window.performanceManager) {
            window.performanceManager.toggle();
        }
    }
});

// Debug commands for console
if (typeof window !== 'undefined') {
    window.enablePerformanceMode = () => window.performanceManager?.enablePerformanceMode();
    window.disablePerformanceMode = () => window.performanceManager?.disablePerformanceMode();
    window.checkPerformance = () => window.performanceManager?.checkPerformance();
}