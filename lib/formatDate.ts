/**
 * Format a contentlayer frontmatter date for display.
 *
 * MDX dates like `date: '2026-08-01'` are authored as Eastern calendar days.
 * Contentlayer stores them as UTC midnight (`2026-08-01T00:00:00.000Z`).
 * Formatting in the local timezone would show the previous day (e.g. Jul 31 in EDT).
 * Using `timeZone: 'UTC'` keeps the displayed calendar day equal to the MDX date.
 */
export function formatDate(
  date: string,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
) {
  return new Date(date).toLocaleDateString(locale, {
    ...options,
    timeZone: 'UTC',
  })
}
