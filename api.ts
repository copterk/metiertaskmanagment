/**
 * API client — all calls go to the Express backend via Vite proxy.
 * All methods throw on HTTP error (message from server `{ error: "..." }`).
 */

const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// ── Generic entity helpers ──────────────────────────────────────

export const api = {
    getAll: <T>(entity: string) =>
        request<T[]>('GET', `/${entity}`),

    create: <T>(entity: string, item: T) =>
        request<T>('POST', `/${entity}`, item),

    update: <T>(entity: string, id: string, item: T) =>
        request<T>('PUT', `/${entity}/${id}`, item),

    delete: (entity: string, id: string) =>
        request<{ success: boolean }>('DELETE', `/${entity}/${id}`),
};
