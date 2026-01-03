import { ref } from "vue";
import { apiList, type ParticipantRow } from "@/api/client";

export function useParticipants() {
  const rows = ref<ParticipantRow[]>([]);
  const loading = ref(false);
  const error = ref<string>("");

  async function refresh() {
    loading.value = true;
    error.value = "";
    try {
      const res = await apiList();
      rows.value = res.participants || [];
    } catch (e: any) {
      error.value = e?.message ? String(e.message) : "목록을 불러오지 못했습니다.";
    } finally {
      loading.value = false;
    }
  }

  return { rows, loading, error, refresh };
}
