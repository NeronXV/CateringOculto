/**
 * Utility functions for formatting currency, dates, and numbers in Spanish (Mexico).
 */

export function formatMXNCents(cents: number): string {
  const pesos = cents / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(pesos);
}

export function formatEventDate(dateString: string): string {
  if (!dateString) return 'Fecha sin definir';
  
  try {
    // Parse "YYYY-MM-DD" safely avoiding timezone shift
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getTodayMinDateString(): string {
  const today = new Date();
  // Minimum next day to be realistic for bespoke chef booking
  today.setDate(today.getDate() + 1);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
