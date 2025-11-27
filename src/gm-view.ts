// src/gm-view.ts
import { collection, getDocs, query, where, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { formatDate, formatDisplayDate } from "./utils";

// --- DOM Elements ---
const gmView = document.getElementById('gm-view');
const gmDashboard = document.getElementById('gm-dashboard');
const findBestDayButton = document.getElementById('find-best-day-button');
const calcFromTodayButton = document.getElementById('calc-from-today-button');
const calcFromMonthButton = document.getElementById('calc-from-month-button');
const bestDayResult = document.getElementById('best-day-result');
const playerAvailabilityResult = document.getElementById('player-availability-result');
const tablesList = document.getElementById('tables-list');
const createTableButton = document.getElementById('create-table-button');
const tableNameInput = document.getElementById('table-name-input') as HTMLInputElement | null;
const tablePlayersCheckboxes = document.getElementById('table-players-checkboxes');
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

// --- Tables (mesas) management ---
async function loadTablesAndUsers() {
    if (!tablesList || !tablePlayersCheckboxes) return;
    tablesList.innerHTML = 'Carregando...';
    tablePlayersCheckboxes.innerHTML = 'Carregando...';

    // Fetch users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: { uid: string; name: string; isGM?: boolean }[] = [];
    usersSnapshot.forEach(d => users.push({ uid: d.id, ...d.data() as any }));

    // Render checkboxes for creating table
    tablePlayersCheckboxes.innerHTML = '';
    users.forEach(u => {
        const id = u.uid;
        const label = document.createElement('label');
        label.style.marginBottom = '4px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = id;
        cb.style.marginRight = '6px';
        label.appendChild(cb);
        label.appendChild(document.createTextNode(u.name));
        tablePlayersCheckboxes.appendChild(label);
    });

    // Fetch tables
    const tablesSnapshot = await getDocs(collection(db, "tables"));
    const tbls: any[] = [];
    tablesSnapshot.forEach(d => tbls.push({ id: d.id, ...d.data() }));

    // Map users for quick lookup
    const usersById: { [id: string]: string } = {};
    users.forEach(u => usersById[u.uid] = u.name);

    // Render tables list
    if (tbls.length === 0) {
        tablesList.innerHTML = '<p>Nenhuma mesa criada ainda.</p>';
    } else {
        const ul = document.createElement('div');
        ul.style.display = 'flex';
        ul.style.flexDirection = 'column';
        ul.style.gap = '0.5rem';
        tbls.forEach(t => {
            const card = document.createElement('div');
            card.style.padding = '0.5rem';
            card.style.border = '1px solid #eee';
            card.style.borderRadius = '6px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            

            const left = document.createElement('div');
            // render players as mini-cards with role badges (DM or Player)
            const playersArr: string[] = t.players || [];
            const playersHtml = playersArr.map((p: string) => {
                const name = usersById[p] || p;
                const role = (p === t.masterId) ? 'DM' : 'Player';
                const roleClass = (role === 'DM') ? 'dm' : 'player';
                return `<div class="player-mini-card"><div class="player-name">${name}</div><div class="player-role-badge ${roleClass}">${role}</div></div>`;
            }).join('');
            left.innerHTML = `<strong>${t.name}</strong><div class="table-players-cards">${playersHtml}</div>`;

            const right = document.createElement('div');
            const calcBtn = document.createElement('button');
            calcBtn.textContent = 'Calcular (por mesa)';
            calcBtn.addEventListener('click', () => calculateForTable(t));
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Excluir';
            delBtn.className = 'danger';
            delBtn.addEventListener('click', async () => {
                if (!confirm(`Excluir mesa "${t.name}"?`)) return;
                await deleteDoc(doc(db, 'tables', t.id));
                loadTablesAndUsers();
            });
            right.appendChild(calcBtn);
            right.appendChild(delBtn);

            card.appendChild(left);
            card.appendChild(right);
            ul.appendChild(card);
        });
        tablesList.innerHTML = '';
        tablesList.appendChild(ul);
    }
}

async function createTable() {
    if (!tableNameInput || !tablePlayersCheckboxes) return;
    const name = tableNameInput.value.trim();
    if (!name) { alert('Digite um nome para a mesa'); return; }
    const checkboxes = Array.from(tablePlayersCheckboxes.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    const selected = checkboxes.filter(c => c.checked).map(c => c.value);
    const masterId = auth.currentUser?.uid;
    if (!masterId) { alert('Usuário não identificado'); return; }
    const players = Array.from(new Set([...selected, masterId]));
    await addDoc(collection(db, 'tables'), { name, players, masterId });
    tableNameInput.value = '';
    // uncheck
    checkboxes.forEach(c => c.checked = false);
    loadTablesAndUsers();
}

// Calculate availability for a specific table (only players in that table)
async function calculateForTable(tableDoc: any) {
    if (!playerAvailabilityResult) return;
    playerAvailabilityResult.innerHTML = 'Calculando para mesa...';

    const players: string[] = tableDoc.players || [];
    if (players.length === 0) {
        playerAvailabilityResult.innerHTML = '<p>Nenhum jogador nesta mesa.</p>';
        return;
    }

    const year = gmCurrentDate.getFullYear();
    const month = gmCurrentDate.getMonth();
    const daysInCurrentMonth = getDaysInMonth(year, month);
    const startDate = formatDate(daysInCurrentMonth[0]);
    const endDate = formatDate(daysInCurrentMonth[daysInCurrentMonth.length - 1]);

    // Fetch availability for the current month for those players
    const availabilityQuery = query(
        collection(db, "availability"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
    );
    const availabilitySnapshot = await getDocs(availabilityQuery);
    const allAvailability: { [userId: string]: { [date: string]: string } } = {};
    availabilitySnapshot.forEach(d => {
        const data = d.data();
        if (!players.includes(data.userId)) return; // ignore others
        if (!allAvailability[data.userId]) allAvailability[data.userId] = {};
        allAvailability[data.userId][data.date] = data.status;
    });

    // Compute day scores among table players
    const dayScores: { [date: string]: number } = {};
    const dayDetails: { [date: string]: { available: number, maybe: number, unavailable: number } } = {};
    daysInCurrentMonth.forEach(day => {
        const formattedDate = formatDate(day);
        dayScores[formattedDate] = 0;
        dayDetails[formattedDate] = { available: 0, maybe: 0, unavailable: 0 };
        players.forEach(userId => {
            const status = allAvailability[userId]?.[formattedDate];
            if (status === 'available') { dayScores[formattedDate] += 2; dayDetails[formattedDate].available++; }
            else if (status === 'maybe') { dayScores[formattedDate] += 1; dayDetails[formattedDate].maybe++; }
            else { dayDetails[formattedDate].unavailable++; }
        });
    });

    const sortedDays = Object.keys(dayScores).sort((a,b) => dayScores[b] - dayScores[a]);

    let html = `<h4>Melhores dias para mesa "${tableDoc.name}"</h4>`;
    html += '<ul>';
    sortedDays.slice(0, 15).forEach(date => {
        const d = dayDetails[date];
        const displayDate = formatDisplayDate(new Date(date+'T00:00:00'));
        
        html += `<li><strong>${displayDate}</strong>: ${d.available} ✅, ${d.maybe} ❓, ${d.unavailable} ❌ (Score: ${dayScores[date]})</li>`;
    });
    html += '</ul>';

    // Also show per-player totals inside this table for the month
    const usersTotals: { id: string; available: number; maybe: number }[] = [];
    players.forEach(pid => {
        let a = 0, m = 0;
        daysInCurrentMonth.forEach(day => {
            const f = formatDate(day);
            const s = allAvailability[pid]?.[f];
            if (s === 'available') a++; else if (s === 'maybe') m++;
        });
        usersTotals.push({ id: pid, available: a, maybe: m });
    });
    // fetch user names
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersById: { [id: string]: string } = {};
    usersSnapshot.forEach(d => usersById[d.id] = (d.data() as any).name);

    html += '<h5>Disponibilidade por jogador (mês atual)</h5><ul>';
    usersTotals.sort((x,y) => y.available - x.available || y.maybe - x.maybe).forEach(u => {
        html += `<li><strong>${usersById[u.id] || u.id}</strong>: ${u.available} ✅, ${u.maybe} ❓</li>`;
    });
    html += '</ul>';

    playerAvailabilityResult.innerHTML = html;
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
            } else if (status === 'unavailable' || status === 'unknown' || !status) {
                dayDetails[formattedDate].unavailable++;
            }else {
                dayDetails[formattedDate].unavailable++;
            }
        }
    });

    const sortedDays = Object.keys(dayScores).sort((a, b) => dayScores[b] - dayScores[a]);

    let resultHTML = '<h4>Melhores Dias Sugeridos (Este Mês):</h4><ul>';
    sortedDays.slice(0, 15).forEach(date => { // Show top 5
        const displayDate = formatDisplayDate(new Date(date+'T00:00:00'));
        const details = dayDetails[date];
        resultHTML += `<li><strong>${displayDate}</strong>: ${details.available} ✅, ${details.maybe} ❓, ${details.unavailable} ❌ (Score: ${dayScores[date]})</li>`;
    });
    resultHTML += '</ul>';
    bestDayResult.innerHTML = resultHTML;
}

// --- Per-player availability from a given start (today or month start) ---
async function calculateAvailabilityByPlayer(startMode: 'today' | 'month') {
    if (!playerAvailabilityResult) return;
    playerAvailabilityResult.innerHTML = 'Calculando...';

    const year = gmCurrentDate.getFullYear();
    const month = gmCurrentDate.getMonth();
    const daysInCurrentMonth = getDaysInMonth(year, month);

    const firstDay = daysInCurrentMonth[0];
    const lastDay = daysInCurrentMonth[daysInCurrentMonth.length - 1];

    let startDateObj = startMode === 'today' ? new Date() : new Date(firstDay);
    // Clamp to this month
    if (startDateObj < firstDay) startDateObj = new Date(firstDay);
    if (startDateObj > lastDay) startDateObj = new Date(lastDay);

    const consideredDays = daysInCurrentMonth.filter(d => d >= startDateObj);
    const startDate = formatDate(consideredDays[0]);
    const endDate = formatDate(consideredDays[consideredDays.length - 1]);

    // Fetch users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: { uid: string; name: string }[] = [];
    usersSnapshot.forEach(d => users.push({ uid: d.id, ...d.data() as any }));

    // Fetch availability for the considered range
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

    const results: { uid: string; name: string; available: number; maybe: number; totalConsidered: number }[] = [];

    users.forEach(u => {
        let avail = 0;
        let maybe = 0;
        consideredDays.forEach(day => {
            const f = formatDate(day);
            const s = allAvailability[u.uid]?.[f];
            if (s === 'available') avail++;
            else if (s === 'maybe') maybe++;
        });
        results.push({ uid: u.uid, name: u.name, available: avail, maybe, totalConsidered: consideredDays.length });
    });

    results.sort((a, b) => b.available - a.available || b.maybe - a.maybe);

    let html = `<h4>Disponibilidade por Jogador (a partir de ${formatDisplayDate(new Date(startDate))})</h4>`;
    html += `<p>Dias considerados: ${consideredDays.length}</p>`;
    html += '<ul>';
    results.forEach(r => {
        html += `<li><strong>${r.name}</strong>: ${r.available} ✅, ${r.maybe} ❓ (de ${r.totalConsidered} dias)</li>`;
    });
    html += '</ul>';

    playerAvailabilityResult.innerHTML = html;
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
    if (calcFromTodayButton) calcFromTodayButton.addEventListener('click', () => calculateAvailabilityByPlayer('today'));
    if (calcFromMonthButton) calcFromMonthButton.addEventListener('click', () => calculateAvailabilityByPlayer('month'));
    if (createTableButton) createTableButton.addEventListener('click', createTable);
    // load tables and users
    loadTablesAndUsers();

    // Initial render
    renderGMView();
}
