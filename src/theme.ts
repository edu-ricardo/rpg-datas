// src/theme.ts

const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const THEME_KEY = 'rpg_scheduler_theme';

function applyTheme(theme: string) {
    if (theme === 'dark') {
        document.body.dataset.theme = 'dark';
    } else if (theme === 'light') {
        document.body.dataset.theme = 'light';
    } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.dataset.theme = prefersDark ? 'dark' : 'light';
    }
}

function saveTheme(theme: string) {
    localStorage.setItem(THEME_KEY, theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
}

export function initializeTheme() {
    if (!themeSelect) return;

    // Load saved theme on startup
    loadTheme();

    // Listen for changes on the select dropdown
    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        saveTheme(selectedTheme);
        applyTheme(selectedTheme);
    });

    // Listen for changes in system preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only apply if the current setting is 'system'
        if (themeSelect.value === 'system') {
            applyTheme('system');
        }
    });
}
