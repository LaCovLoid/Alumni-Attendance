<template>
  <div class="page">
    <header class="header">
      <h1 class="title">참여 현황</h1>
      <span class="">IBK 119-174778-01-015 용은희</span>
      <p class="subtitle">
        현재 참여 인원 <b>{{ names.length }}</b>명
      </p>
    </header>

    <main class="main">
      <ParticipationAura :names="names" />
      <div class="status">
        <span v-if="loading">불러오는 중…</span>
        <span v-else-if="error" class="err">{{ error }}</span>
      </div>
    </main>

    <footer class="footer">
      <a class="adminLink" href="/admin">관리자</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import ParticipationAura from "@/components/ParticipationAura.vue";
import { useParticipants } from "@/composables/useParticipants";

const { rows, loading, error, refresh } = useParticipants();

onMounted(refresh);

const names = computed(() =>
  rows.value
    .map((r) => String(r.name || "").trim())
    .filter(Boolean)
    .slice(0, 45)
);
</script>

<style scoped>
.page { min-height: 100dvh; background:#0b0d14; color:#f2f2f2; display:flex; flex-direction:column; }
.header { padding: 18px 18px 8px; }
.title { margin:0; margin-bottom:8px; font-size:22px; font-weight:800; letter-spacing:-0.02em; }
.subtitle { margin-top:2px; color:rgba(242,242,242,0.75); font-size:14px; }
.main { flex:1; display:flex; flex-direction:column; }
.status { padding: 8px 18px 14px; font-size:12px; color:rgba(242,242,242,0.65); }
.err { color: rgba(255, 180, 160, 0.95); }
.footer { padding: 10px 18px 18px; }
.adminLink { color: rgba(255, 235, 190, 0.9); text-decoration: none; font-size: 12px; opacity: 0.75; }
</style>
