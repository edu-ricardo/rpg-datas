// src/auth.ts
import { 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { initializePlayerView } from "./player-view";
import { initializeGMView, renderGMView } from "./gm-view";

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authButton = document.getElementById('auth-button');
const toggleAuth = document.getElementById('toggle-auth');
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const userDisplayName = document.getElementById('user-display-name');
const logoutButton = document.getElementById('logout-button');
const playerView = document.getElementById('player-view');
const gmView = document.getElementById('gm-view');

let isLoginMode = true;

function setupAuthForms() {
    if (!authForm || !toggleAuth || !authTitle || !authButton) return;

    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Login' : 'Registrar';
        authButton.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
        toggleAuth.innerHTML = isLoginMode 
            ? 'Não tem uma conta? <a href="#">Registre-se</a>' 
            : 'Já tem uma conta? <a href="#">Faça Login</a>';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const email = `${username.replace(/\s+/g, '_')}@rpgscheduler.app`;
        const password = passwordInput.value;

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: username,
                    isGM: false
                });
            }
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    });
}

function setupLogout() {
    if (!logoutButton) return;
    logoutButton.addEventListener('click', () => signOut(auth));
}

function observeAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (!authContainer || !mainContent || !userDisplayName || !playerView || !gmView) return;

        if (user) {
            authContainer.style.display = 'none';
            mainContent.style.display = 'block';
            
            const userEmail = user.email || '';
            const username = userEmail.split('@')[0].replace(/_/g, ' ');
            userDisplayName.textContent = `Bem-vindo, ${username}!`;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data()?.isGM) {
                initializePlayerView(user);
                initializeGMView();
            } else {
                gmView.style.display = 'none';
                initializePlayerView(user);
            }
        } else {
            authContainer.style.display = 'block';
            mainContent.style.display = 'none';
            userDisplayName.textContent = '';
            playerView.style.display = 'none';
            gmView.style.display = 'none';
        }
    });
}

export function initializeAuth() {
    setupAuthForms();
    setupLogout();
    observeAuthState();
}
