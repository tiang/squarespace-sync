// Simple cn helper — concatenates class strings, no merging needed for now.
// Upgrade to clsx + tailwind-merge if class conflicts arise.
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
