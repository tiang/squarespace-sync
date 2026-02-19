export const QUERY_KEYS = {
  family:     () => ['parent', 'family'],
  attendance: (studentId) => ['parent', 'attendance', studentId],
  invoices:   () => ['parent', 'invoices'],
  messages:   () => ['parent', 'messages'],
};
