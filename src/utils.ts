// src/utils.ts

export function getNextDays(numDays: number): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < numDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        days.push(date);
    }
    return days;
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function formatDisplayDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
}
