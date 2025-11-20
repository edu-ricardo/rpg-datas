// src/main.ts
import { initializeAuth } from "./auth";
import { initializeTheme } from "./theme";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App starting...");
    initializeAuth();
    initializeTheme();
});
