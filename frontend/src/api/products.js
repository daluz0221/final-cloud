const BASE = import.meta.env.VITE_API_URL;
if (!BASE) {
  console.warn("Falta VITE_API_URL en .env.local");
}
async function request(path, options = {}) {
    const headers = { ...options.headers };
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
    });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || res.statusText || "Error de red";
    throw new Error(msg);
  }
  return data;
}
export function listar() {
  return request("/productos");
}
export function crear(body) {
  return request("/productos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function actualizar(id, body) {
  return request(`/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
export function eliminar(id) {
  return request(`/productos/${id}`, { method: "DELETE" });
}