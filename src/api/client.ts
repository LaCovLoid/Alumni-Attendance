type Json = Record<string, unknown>;

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE) {
  // 빌드/런타임에서 빠르게 문제를 드러내기 위한 가드
  // (배포 시 환경변수 미설정 방지)
  console.warn("VITE_API_BASE_URL is not set.");
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();

  const headers =
    method === "GET" || method === "HEAD"
      ? { ...(init?.headers || {}) }
      : { "Content-Type": "application/json", ...(init?.headers || {}) };

  const res = await fetch(url, {
    ...init,
    headers,
  });

  // Apps Script는 status를 200으로 주는 경우도 있어 payload를 같이 확인
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("서버 응답이 JSON이 아닙니다.");
  }

  if (!res.ok) {
    const msg = data?.error ? String(data.error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // payload ok 검사(우리 스크립트는 ok: false를 줄 수 있음)
  if (data && typeof data === "object" && "ok" in data && data.ok === false) {
    throw new Error(String(data.error || "요청 실패"));
  }

  return data as T;
}

export type ParticipantRow = { name: string; createdAt?: string };

export async function apiList(
  force = false
): Promise<{ ok: true; participants: ParticipantRow[] }> {
  const ts = force ? `&ts=${Date.now()}` : "";
  const url = `${API_BASE}?path=list${ts}`;
  return request(url, { method: "GET" });
}

export async function apiLogin(input: {
  id: string;
  password: string;
}): Promise<{ ok: true; token: string; ttlSec: number }> {
  const url = `${API_BASE}?path=login`;
  return request(url, { method: "POST", body: JSON.stringify(input as Json) });
}

export async function apiAdd(input: {
  token: string;
  name: string;
}): Promise<{ ok: true }> {
  const url = `${API_BASE}?path=add`;
  return request(url, { method: "POST", body: JSON.stringify(input as Json) });
}

export async function apiDelete(input: {
  token: string;
  name: string;
}): Promise<{ ok: true; deleted: number }> {
  const url = `${API_BASE}?path=delete`;
  return request(url, { method: "POST", body: JSON.stringify(input as Json) });
}

export async function apiClear(input: { token: string }): Promise<{ ok: true }> {
  const url = `${API_BASE}?path=clear`;
  return request(url, { method: "POST", body: JSON.stringify(input as Json) });
}
