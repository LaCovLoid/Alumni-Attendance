<template>
  <div class="panel">
    <div v-if="!auth.isAuthed" class="card">
      <h2 class="h2">로그인</h2>

      <label class="label">아이디</label>
      <input class="input" v-model.trim="id" placeholder="" autocomplete="username" />

      <label class="label">비밀번호</label>
      <input
        class="input"
        v-model="pw"
        type="password"
        placeholder="비밀번호"
        autocomplete="current-password"
      />

      <button class="btn" :disabled="busy" @click="onLogin">
        {{ busy ? "로그인 중…" : "로그인" }}
      </button>

      <p v-if="msg" class="msg">{{ msg }}</p>
      <p class="hint">
        * 운영 전에는 비밀번호를 더 강하게 변경하는 것을 권장합니다.
      </p>
    </div>

    <div v-else class="card">
      <div class="topRow">
        <h2 class="h2">참여자 관리</h2>
        <button class="btnGhost" @click="logout">로그아웃</button>
      </div>

      <div class="addRow">
        <input class="input" v-model.trim="newName" placeholder="추가할 이름" />
        <button class="btn" :disabled="busy || !newName" @click="addOne">
          추가
        </button>
      </div>

      <div class="actions">
        <button class="btnDanger" :disabled="busy || rows.length === 0" @click="clearAll">
          전체삭제
        </button>
        <button class="btnGhost" :disabled="busy" @click="refresh">
          새로고침
        </button>
      </div>

      <p v-if="msg" class="msg">{{ msg }}</p>

      <div class="list">
        <div v-if="loading" class="muted">불러오는 중…</div>
        <div v-else-if="error" class="err">{{ error }}</div>

        <div v-else-if="rows.length === 0" class="muted">참여자가 아직 없습니다.</div>

        <ul v-else class="ul">
          <li v-for="r in rows" :key="r.name + String(r.createdAt || '')" class="li">
            <span class="name">{{ r.name }}</span>
            <button class="miniDanger" :disabled="busy" @click="delOne(r.name)">삭제</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { apiAdd, apiClear, apiDelete } from "@/api/client";
import { useParticipants } from "@/composables/useParticipants";

const auth = useAuthStore();
const { rows, loading, error, refresh } = useParticipants();

const id = ref("");
const pw = ref("");
const newName = ref("");

const busy = ref(false);
const msg = ref("");

const safeRows = computed(() =>
  rows.value
    .map((r) => ({ ...r, name: String(r.name || "").trim() }))
    .filter((r) => r.name.length > 0)
    .slice(0, 45)
);

onMounted(async () => {
  if (auth.isAuthed) await refresh();
});

async function onLogin() {
  msg.value = "";
  busy.value = true;
  try {
    await auth.login(id.value, pw.value);
    pw.value = "";
    await refresh();
    msg.value = "로그인 완료";
  } catch (e: any) {
    msg.value = e?.message ? String(e.message) : "로그인 실패";
  } finally {
    busy.value = false;
  }
}

function logout() {
  auth.logout();
  msg.value = "로그아웃 됨";
}

async function addOne() {
  msg.value = "";
  busy.value = true;
  try {
    const token = auth.getValidTokenOrThrow();
    await apiAdd({ token, name: newName.value });
    newName.value = "";
    await refresh();
    msg.value = "추가 완료";
  } catch (e: any) {
    msg.value = e?.message ? String(e.message) : "추가 실패";
    // 토큰 만료 시 안내
    if (String(msg.value).toLowerCase().includes("unauthorized")) auth.logout();
  } finally {
    busy.value = false;
  }
}

async function delOne(name: string) {
  const ok = confirm(`"${name}" 을(를) 삭제할까요?`);
  if (!ok) return;

  msg.value = "";
  busy.value = true;
  try {
    const token = auth.getValidTokenOrThrow();
    const res = await apiDelete({ token, name });
    await refresh();
    msg.value = res.deleted ? "삭제 완료" : "일치하는 이름이 없습니다.";
  } catch (e: any) {
    msg.value = e?.message ? String(e.message) : "삭제 실패";
    if (String(msg.value).toLowerCase().includes("unauthorized")) auth.logout();
  } finally {
    busy.value = false;
  }
}

async function clearAll() {
  const ok = confirm("정말 전체삭제 할까요? 되돌릴 수 없습니다.");
  if (!ok) return;

  msg.value = "";
  busy.value = true;
  try {
    const token = auth.getValidTokenOrThrow();
    await apiClear({ token });
    await refresh();
    msg.value = "전체삭제 완료";
  } catch (e: any) {
    msg.value = e?.message ? String(e.message) : "전체삭제 실패";
    if (String(msg.value).toLowerCase().includes("unauthorized")) auth.logout();
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.panel { max-width: 520px; margin: 0 auto; }
.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255, 210, 140, 0.12);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 0 40px rgba(0,0,0,0.25);
  backdrop-filter: blur(10px);
}
.h2 { margin: 0 0 10px; font-size: 16px; font-weight: 800; color: rgba(255,235,190,0.95); }
.label { display:block; margin-top: 10px; font-size: 12px; opacity: 0.75; }
.input {
  width:100%;
  margin-top: 6px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 210, 140, 0.14);
  background: rgba(10, 12, 20, 0.55);
  color: rgba(242,242,242,0.92);
  outline: none;
}
.btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 210, 140, 0.22);
  background: rgba(255, 210, 140, 0.10);
  color: rgba(255, 235, 190, 0.95);
  font-weight: 800;
  cursor: pointer;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btnGhost {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 210, 140, 0.14);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 235, 190, 0.9);
  font-weight: 700;
  cursor: pointer;
}
.btnDanger {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 120, 120, 0.22);
  background: rgba(255, 120, 120, 0.10);
  color: rgba(255, 210, 210, 0.98);
  font-weight: 800;
  cursor: pointer;
}

.msg { margin: 10px 0 0; font-size: 12px; opacity: 0.85; }
.hint { margin: 10px 0 0; font-size: 12px; opacity: 0.6; }
.err { color: rgba(255, 180, 160, 0.95); font-size: 12px; }
.muted { font-size: 12px; opacity: 0.7; }

.topRow { display:flex; align-items:center; justify-content:space-between; gap: 10px; }
.addRow { display:flex; gap: 10px; margin-top: 12px; }
.addRow .input { margin-top: 0; flex:1; }
.addRow .btn { width: auto; margin-top: 0; padding: 12px 14px; }

.actions { display:flex; gap: 10px; margin-top: 12px; }
.actions .btnGhost, .actions .btnDanger { flex: 1; }

.list { margin-top: 14px; }
.ul { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap: 8px; }
.li {
  display:flex; align-items:center; justify-content:space-between; gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 210, 140, 0.10);
  background: rgba(0,0,0,0.18);
}
.name { font-weight: 750; font-size: 13px; }
.miniDanger {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 120, 120, 0.22);
  background: rgba(255, 120, 120, 0.08);
  color: rgba(255, 210, 210, 0.98);
  font-weight: 800;
  cursor: pointer;
}
</style>
