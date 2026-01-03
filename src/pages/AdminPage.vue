<template>
  <div class="page">
    <header class="header">
      <h1 class="title">관리자</h1>
      <p class="subtitle">참여자 목록을 추가/삭제/전체삭제할 수 있습니다.</p>
    </header>

    <main class="main">
      <AdminPanel />
    </main>

    <footer class="footer">
      <a class="back" href="/">← 메인으로</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import AdminPanel from "@/components/AdminPanel.vue";
</script>

<style scoped>
.page { min-height: 100dvh; background:#0b0d14; color:#f2f2f2; display:flex; flex-direction:column; }
.header { padding: 18px 18px 8px; }
.title { margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em; }
.subtitle { margin:8px 0 0; color:rgba(242,242,242,0.75); font-size:14px; }
.main { flex:1; padding: 10px 18px 18px; }
.footer { padding: 10px 18px 18px; }
.back { color: rgba(255, 235, 190, 0.9); text-decoration: none; font-size: 12px; opacity: 0.85; }
</style>
