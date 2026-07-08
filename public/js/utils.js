/**
 * Utility Functions for OES Frontend
 * Includes toast notifications, loading states, timer, etc.
 */

// Toast Notification System
class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(message, type = 'info', duration = 5000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    static success(message, duration) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Loading Spinner
class LoadingSpinner {
    static overlay = null;

    static show(message = 'Loading...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'spinner-overlay';
            this.overlay.innerHTML = `
                <div style="text-align: center;">
                    <div class="spinner"></div>
                    <p style="margin-top: 16px; color: var(--text-light);">${message}</p>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
    }

    static hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// Exam Timer
class ExamTimer {
    constructor(durationMinutes, onTick, onExpire) {
        this.totalSeconds = durationMinutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.onTick = onTick;
        this.onExpire = onExpire;
        this.interval = null;
        this.isPaused = false;
    }

    start() {
        this.interval = setInterval(() => {
            if (!this.isPaused) {
                this.remainingSeconds--;
                
                if (this.onTick) {
                    this.onTick(this.getRemainingTime(), this.getProgress());
                }

                if (this.remainingSeconds <= 0) {
                    this.stop();
                    if (this.onExpire) {
                        this.onExpire();
                    }
                }
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    getRemainingTime() {
        const hours = Math.floor(this.remainingSeconds / 3600);
        const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
        const seconds = this.remainingSeconds % 60;

        return {
            hours,
            minutes,
            seconds,
            formatted: this.formatTime(hours, minutes, seconds),
            totalSeconds: this.remainingSeconds
        };
    }

    getProgress() {
        return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
    }

    getStatus() {
        const percentRemaining = (this.remainingSeconds / this.totalSeconds) * 100;
        
        if (percentRemaining <= 10) return 'danger';
        if (percentRemaining <= 25) return 'warning';
        return 'normal';
    }

    formatTime(hours, minutes, seconds) {
        const pad = (num) => String(num).padStart(2, '0');
        
        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
        return `${pad(minutes)}:${pad(seconds)}`;
    }

    addTime(seconds) {
        this.remainingSeconds += seconds;
        this.totalSeconds += seconds;
    }
}

// Confirmation Dialog
function confirmDialog(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        resolve(confirmed);
    });
}

// Format Date/Time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debounce Function
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

// Local Storage Helper
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
};

// Validate Form
function validateForm(formData, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];

        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${field} is required`);
        }

        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && value && value.length > rule.maxLength) {
            errors.push(`${field} must not exceed ${rule.maxLength} characters`);
        }

        if (rule.pattern && value && !rule.pattern.test(value)) {
            errors.push(rule.message || `${field} is invalid`);
        }

        if (rule.custom && value) {
            const customError = rule.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Copy to Clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.success('Copied to clipboard');
        return true;
    } catch (err) {
        Toast.error('Failed to copy');
        return false;
    }
}

// Download as JSON
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Export as CSV
function downloadCSV(data, filename) {
    if (!data || data.length === 0) {
        Toast.error('No data to export');
        return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => 
                JSON.stringify(row[header] || '')
            ).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Scroll to Element
function scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Generate Random ID
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse Query String
function parseQueryString(query = window.location.search) {
    const params = new URLSearchParams(query);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Build Query String
function buildQueryString(params) {
    return new URLSearchParams(params).toString();
}

// Export utilities
window.Toast = Toast;
window.LoadingSpinner = LoadingSpinner;
window.ExamTimer = ExamTimer;
window.confirmDialog = confirmDialog;
window.formatDateTime = formatDateTime;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.debounce = debounce;
window.Storage = Storage;
window.validateForm = validateForm;
window.copyToClipboard = copyToClipboard;
window.downloadJSON = downloadJSON;
window.downloadCSV = downloadCSV;
window.scrollToElement = scrollToElement;
window.isInViewport = isInViewport;
window.generateId = generateId;
window.escapeHtml = escapeHtml;
window.parseQueryString = parseQueryString;
window.buildQueryString = buildQueryString;
