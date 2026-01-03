import { defineStore } from "pinia";
import { apiLogin } from "@/api/client";

type AuthState = {
  token: string;
  expiresAt: number; // epoch ms
};

const LS_KEY = "hds_admin_auth_v1";

function load(): AuthState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { token: "", expiresAt: 0 };
    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed.token === "string" ? parsed.token : "",
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : 0,
    };
  } catch {
    return { token: "", expiresAt: 0 };
  }
}

function save(state: AuthState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => load(),
  getters: {
    isAuthed(state) {
      return !!state.token && Date.now() < state.expiresAt;
    },
  },
  actions: {
    logout() {
      this.token = "";
      this.expiresAt = 0;
      save(this.$state);
    },
    async login(id: string, password: string) {
      const res = await apiLogin({ id, password });
      const expiresAt = Date.now() + res.ttlSec * 1000;
      this.token = res.token;
      this.expiresAt = expiresAt;
      save(this.$state);
    },
    getValidTokenOrThrow(): string {
      if (!this.isAuthed) throw new Error("로그인이 필요합니다.");
      return this.token;
    },
  },
});
