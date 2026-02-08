/**
 * Format Date to ISO 8601 string (Bacen format).
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Create date range for list operations.
 * @param startDaysAgo Number of days in the past for the start date (default: 30)
 */
export function createDateRange(startDaysAgo = 30): {
  inicio: string;
  fim: string;
} {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - startDaysAgo);

  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
  };
}

/**
 * Parse ISO date string to Date.
 * Throws if the string is not a valid date.
 */
export function parseDate(isoString: string): Date {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${isoString}`);
  }
  return date;
}

/**
 * Format date as YYYY-MM-DD (for cobv vencimento).
 */
export function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0]!;
}
