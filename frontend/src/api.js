const BASE_URL = "/api";

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path} respondió ${res.status}`);
  return res.json();
}

export const api = {
  getEvents: () => get("/events"),
  getPayments: () => get("/payments"),
  getClients: () => get("/clients"),
};
