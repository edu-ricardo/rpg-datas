// src/player-view.ts
import { User } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { formatDate } from "./utils";

// --- DOM Elements ---
const playerView = document.getElementById('player-view');
const monthYearHeader = document.getElementById('month-year-header');
const prevMonthButton = document.getElementById('prev-month-button');
const nextMonthButton = document.getElementById('next-month-button');
const calendarWeekdays = document.getElementById('calendar-weekdays');
const calendarGrid = document.getElementById('calendar-grid');

// --- State ---
let currentDate = new Date();
let userAvailability: { [date: string]: string } = {};

type AvailabilityStatus = 'unknown' | 'available' | 'maybe' | 'unavailable';

const availabilityCycle: Record<AvailabilityStatus, AvailabilityStatus> = {
    'unknown': 'available',
    'available': 'maybe',
    'maybe': 'unavailable',
    'unavailable': 'unknown'
};

function getStatusLabel(status: AvailabilityStatus): string {
    switch (status) {
        case 'available': return 'Disponível';
        case 'maybe': return 'Talvez';
        case 'unavailable': return 'Indisponível';
        default: return 'n/a';
    }
}

// --- Firestore Data Interaction ---
async function getMonthlyAvailability(userId: string, year: number, month: number): Promise<{[date: string]: string}> {
    const availability: {[date: string]: string} = {};
    const startDate = formatDate(new Date(year, month, 1));
    const endDate = formatDate(new Date(year, month + 1, 0));
    
    const q = query(
        collection(db, "availability"), 
        where("userId", "==", userId),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
    );
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        availability[data.date] = data.status;
    });
    return availability;
}

async function saveAvailability(userId: string, date: string, status: string) {
    const docRef = doc(db, "availability", `${userId}_${date}`);
    if (status === 'unknown') {
        // In a real app, you might want to delete the document instead.
        // For simplicity, we'll save it as 'unknown'.
        await setDoc(docRef, { userId, date, status }, { merge: true });
    } else {
        await setDoc(docRef, { userId, date, status }, { merge: true });
    }
    console.log(`Availability saved for ${date}: ${status}`);
}

// --- Calendar Rendering ---
async function renderCalendar(user: User) {
    if (!calendarGrid || !monthYearHeader || !calendarWeekdays) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Fetch this month's data
    userAvailability = await getMonthlyAvailability(user.uid, year, month);

    // --- Header ---
    monthYearHeader.textContent = new Date(year, month).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });
    calendarGrid.innerHTML = '';
    calendarWeekdays.innerHTML = '';

    // --- Weekdays ---
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    weekdays.forEach(day => {
        const weekdayEl = document.createElement('div');
        weekdayEl.textContent = day;
        calendarWeekdays.appendChild(weekdayEl);
    });

    // --- Days ---
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }

    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i.toString();
        dayCell.appendChild(dayNumber);

        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        const formattedDate = formatDate(new Date(year, month, i));
        const status = (userAvailability[formattedDate] || 'unknown') as AvailabilityStatus;

        // status container with dot and label
        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-container';

        const statusDot = document.createElement('div');
        statusDot.className = `status-dot status-${status}`;

        const statusLabel = document.createElement('div');
        statusLabel.className = 'status-label';
        const statusText = getStatusLabel(status);
        statusLabel.textContent = statusText;

        statusContainer.appendChild(statusDot);
        statusContainer.appendChild(statusLabel);
        dayCell.appendChild(statusContainer);
        dayCell.dataset.date = formattedDate;

        dayCell.addEventListener('click', async () => {
            const currentStatus = (userAvailability[formattedDate] || 'unknown') as AvailabilityStatus;
            const newStatus = availabilityCycle[currentStatus];
            userAvailability[formattedDate] = newStatus; // Update local state
            statusDot.className = `status-dot status-${newStatus}`; // Update UI immediately
            statusLabel.textContent = getStatusLabel(newStatus);
            await saveAvailability(user.uid, formattedDate, newStatus); // Save to Firestore
        });

        calendarGrid.appendChild(dayCell);
    }
}

// --- Initialization ---
export async function initializePlayerView(user: User) {
    if (!playerView || !prevMonthButton || !nextMonthButton) {
        console.error("Player view or navigation elements not found!");
        return;
    }
    playerView.style.display = 'block';

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(user);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(user);
    });

    await renderCalendar(user);
}
