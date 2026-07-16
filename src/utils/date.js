import { formatDistanceToNow, format } from 'date-fns';

// Parse an ISO datetime string from the backend — stored in server local time.
export function parseUTC(isoStr) {
  if (!isoStr) return null;
  return new Date(isoStr);
}

// "3 minutes ago", "2 days ago", etc. — displayed in user's local time.
export function timeAgo(isoStr) {
  const d = parseUTC(isoStr);
  if (!d) return 'Never';
  return formatDistanceToNow(d, { addSuffix: true });
}

// "Jul 16, 2026" — in user's local time.
export function formatDate(isoStr, fmt = 'MMM d, yyyy') {
  const d = parseUTC(isoStr);
  if (!d) return '—';
  return format(d, fmt);
}

// "Jul 16, 2026 at 10:42 AM" — full local datetime.
export function formatDateTime(isoStr) {
  return formatDate(isoStr, "MMM d, yyyy 'at' h:mm a");
}
