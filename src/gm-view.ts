// src/gm-view.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { formatDate, formatDisplayDate } from "./utils";

// --- DOM Elements ---
const gmView = document.getElementById('gm-view');
const gmDashboard = document.getElementById('gm-dashboard');
const findBestDayButton = document.getElementById('find-best-day-button');
const bestDayResult = document.getElementById('best-day-result');
const gmMonthYearHeader = document.getElementById('gm-month-year-header');
const gmPrevMonthButton = document.getElementById('gm-prev-month-button');
const gmNextMonthButton = document.getElementById('gm-next-month-button');

// --- State ---
let gmCurrentDate = new Date();

// --- Helper to get all days in a month ---
function getDaysInMonth(year: number, month: number): Date[] {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

// --- Render GM View ---
export async function renderGMView() {
    if (!gmView || !gmDashboard || !gmMonthYearHeader) {
        console.error("GM view elements not found!");
        return;
    }
    gmView.style.display = 'block';
    gmDashboard.innerHTML = 'Carregando dados...';
    
    const year = gmCurrentDate.getFullYear();
    const month = gmCurrentDate.getMonth();

    gmMonthYearHeader.textContent = new Date(year, month).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });

    const daysInCurrentMonth = getDaysInMonth(year, month);
    const formattedDays = daysInCurrentMonth.map(formatDate);
    const displayDays = daysInCurrentMonth.map(formatDisplayDate);

    // Fetch all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: { uid: string; name: string; isGM: boolean }[] = [];
    usersSnapshot.forEach(d => users.push({ uid: d.id, ...d.data() as any }));

    // Fetch all availability for the current month
    const startDate = formattedDays[0];
    const endDate = formattedDays[formattedDays.length - 1];
    const availabilityQuery = query(
        collection(db, "availability"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
    );
    const availabilitySnapshot = await getDocs(availabilityQuery);
    const allAvailability: { [userId: string]: { [date: string]: string } } = {};

    availabilitySnapshot.forEach(d => {
        const data = d.data();
        if (!allAvailability[data.userId]) allAvailability[data.userId] = {};
        allAvailability[data.userId][data.date] = data.status;
    });

    let tableHTML = `
        <table class="gm-table">
            <thead>
                <tr>
                    <th>Jogador</th>
                    ${displayDays.map(day => `<th>${day.split(',')[1]}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        tableHTML += `<tr><td>${user.name}</td>`;
        daysInCurrentMonth.forEach(day => {
            const formattedDate = formatDate(day);
            const status = allAvailability[user.uid]?.[formattedDate] || 'unknown';
            let statusEmoji = '⚪';
            if (status === 'available') statusEmoji = '✅';
            else if (status === 'unavailable') statusEmoji = '❌';
            else if (status === 'maybe') statusEmoji = '❓';
            tableHTML += `<td class="status-${status}">${statusEmoji}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    gmDashboard.innerHTML = tableHTML;
}

// --- Find Best Day Logic ---
async function findBestDay() {
    if (!bestDayResult) return;
    bestDayResult.innerHTML = 'Calculando...';

    const year = gmCurrentDate.getFullYear();
    const month = gmCurrentDate.getMonth();
    const daysInCurrentMonth = getDaysInMonth(year, month);

    // Fetch availability for the current month
    const startDate = formatDate(daysInCurrentMonth[0]);
    const endDate = formatDate(daysInCurrentMonth[daysInCurrentMonth.length - 1]);
    const availabilityQuery = query(
        collection(db, "availability"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
    );
    const availabilitySnapshot = await getDocs(availabilityQuery);
    const allAvailability: { [userId: string]: { [date: string]: string } } = {};
    availabilitySnapshot.forEach(d => {
        const data = d.data();
        if (!allAvailability[data.userId]) allAvailability[data.userId] = {};
        allAvailability[data.userId][data.date] = data.status;
    });

    const dayScores: { [date: string]: number } = {};
    const dayDetails: { [date: string]: { available: number, maybe: number, unavailable: number } } = {};

    daysInCurrentMonth.forEach(day => {
        const formattedDate = formatDate(day);
        dayScores[formattedDate] = 0;
        dayDetails[formattedDate] = { available: 0, maybe: 0, unavailable: 0 };

        for (const userId in allAvailability) {
            const status = allAvailability[userId][formattedDate];
            if (status === 'available') {
                dayScores[formattedDate] += 2;
                dayDetails[formattedDate].available++;
            } else if (status === 'maybe') {
                dayScores[formattedDate] += 1;
                dayDetails[formattedDate].maybe++;
            } else if (status === 'unavailable') {
                dayDetails[formattedDate].unavailable++;
            }
        }
    });

    const sortedDays = Object.keys(dayScores).sort((a, b) => dayScores[b] - dayScores[a]);

    let resultHTML = '<h4>Melhores Dias Sugeridos (Este Mês):</h4><ul>';
    sortedDays.slice(0, 5).forEach(date => { // Show top 5
        const displayDate = formatDisplayDate(new Date(date));
        const details = dayDetails[date];
        resultHTML += `<li><strong>${displayDate}</strong>: ${details.available} ✅, ${details.maybe} ❓, ${details.unavailable} ❌ (Score: ${dayScores[date]})</li>`;
    });
    resultHTML += '</ul>';
    bestDayResult.innerHTML = resultHTML;
}

export function initializeGMView() {
    if (!findBestDayButton || !gmPrevMonthButton || !gmNextMonthButton) return;
    
    gmPrevMonthButton.addEventListener('click', () => {
        gmCurrentDate.setMonth(gmCurrentDate.getMonth() - 1);
        renderGMView();
        bestDayResult!.innerHTML = ''; // Clear results on month change
    });

    gmNextMonthButton.addEventListener('click', () => {
        gmCurrentDate.setMonth(gmCurrentDate.getMonth() + 1);
        renderGMView();
        bestDayResult!.innerHTML = ''; // Clear results on month change
    });

    findBestDayButton.addEventListener('click', findBestDay);

    // Initial render
    renderGMView();
}
