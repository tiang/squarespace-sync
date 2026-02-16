export async function fetchOrders() {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
}

export async function refreshOrders() {
  const res = await fetch("/api/orders/refresh", { method: "POST" });
  if (!res.ok) throw new Error(`Failed to refresh orders: ${res.status}`);
  return res.json();
}
