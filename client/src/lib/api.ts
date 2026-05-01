const apiBase =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export const api = {
  async get(path: string) {
    const res = await fetch(apiBase + path);
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  },

  async post(path: string, body?: any) {
    const res = await fetch(apiBase + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  },

  async put(path: string, body?: any) {
    const res = await fetch(apiBase + path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  },

  async delete(path: string) {
    const res = await fetch(apiBase + path, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  },
};
