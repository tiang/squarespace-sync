export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(isoString) {
  const d = new Date(isoString);
  return (
    d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' • ' +
    d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  );
}

// Accepts an ISO string or a Date object (unlike formatTime/formatDateTime which require ISO strings)
export function formatDate(isoStringOrDate) {
  return new Date(isoStringOrDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
