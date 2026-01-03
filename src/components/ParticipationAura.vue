<template>
  <div class="stage" ref="stageEl">
    <canvas ref="bgCanvas" class="bg"></canvas>

    <div class="center">
      <div class="aura" :style="auraStyle" />
      <div class="ring" :style="ringStyle">
        <span v-for="i in orbitDots" :key="i" class="orbit-dot" :style="dotStyle(i)" />
      </div>

      <div class="emblem" aria-label="emblem">
        <svg viewBox="0 0 64 64" class="emblem-icon">
          <path d="M14 16c8-4 14-4 18-2v34c-4-2-10-2-18 2V16z" fill="currentColor" opacity="0.95"/>
          <path d="M50 16c-8-4-14-4-18-2v34c4-2 10-2 18 2V16z" fill="currentColor" opacity="0.75"/>
          <path d="M32 16v34" stroke="currentColor" stroke-width="3" opacity="0.6"/>
        </svg>
      </div>

      <div class="labels">
        <button
          v-for="(p, idx) in safeNames"
          :key="p + idx"
          class="label"
          :style="labelStyle(idx)"
          type="button"
          @click="activeName = p"
        >
          {{ p }}
        </button>
      </div>

      <div v-if="activeName" class="toast" @click="activeName = ''">
        {{ activeName }} 님이 함께하고 있어요 ✨
        <span class="toast-hint">(탭하면 닫힘)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ names: string[] }>();

const activeName = ref("");

const safeNames = computed(() =>
  (props.names || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 45)
);

const count = computed(() => Math.max(1, safeNames.value.length));
const maxCount = 45;

const intensity = computed(() => {
  const t = (count.value - 1) / (maxCount - 1);
  return 0.25 + t * 0.75; // 0.25..1
});

const ringSize = computed(() => 260 + Math.round(intensity.value * 50)); // 260..310
const ringThickness = computed(() => 6 + Math.round(intensity.value * 8)); // 6..14

const auraStyle = computed(() => {
  const glow = Math.round(20 + intensity.value * 40);
  const blur = Math.round(18 + intensity.value * 30);
  return {
    width: `${ringSize.value - 40}px`,
    height: `${ringSize.value - 40}px`,
    filter: `blur(${blur}px)`,
    opacity: `${0.45 + intensity.value * 0.35}`,
    boxShadow: `0 0 ${glow}px rgba(255, 200, 80, ${0.35 + intensity.value * 0.25})`,
  } as Record<string, string>;
});

const ringStyle = computed(() => {
  const shadow = Math.round(18 + intensity.value * 26);
  return {
    width: `${ringSize.value}px`,
    height: `${ringSize.value}px`,
    borderWidth: `${ringThickness.value}px`,
    boxShadow: `0 0 ${shadow}px rgba(255, 190, 90, ${0.35 + intensity.value * 0.35})`,
  } as Record<string, string>;
});

const orbitDots = computed(() => {
  const base = 10;
  const extra = Math.round(intensity.value * 18);
  return Array.from({ length: base + extra }, (_, i) => i);
});

const dotStyle = (i: number) => {
  const n = orbitDots.value.length;
  const angle = (i / n) * Math.PI * 2;
  const r = ringSize.value / 2;
  const x = Math.cos(angle) * r;
  const y = Math.sin(angle) * r;
  const size = 4 + (i % 3);
  const op = 0.35 + (i % 5) * 0.08;
  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: `${op}`,
  } as Record<string, string>;
};

const labelStyle = (i: number) => {
  const n = safeNames.value.length || 1;
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  const r = ringSize.value / 2 + 18;
  const wobble = (i % 2 === 0 ? 10 : 0) + (n <= 5 ? 12 : 0);
  const x = Math.cos(angle) * (r + wobble);
  const y = Math.sin(angle) * (r + wobble);
  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
    fontSize: n <= 5 ? "14px" : "13px",
  } as Record<string, string>;
};

/** particles canvas **/
const stageEl = ref<HTMLElement | null>(null);
const bgCanvas = ref<HTMLCanvasElement | null>(null);

type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number };
let raf = 0;
let particles: Particle[] = [];

function resizeCanvas() {
  const canvas = bgCanvas.value;
  const stage = stageEl.value;
  if (!canvas || !stage) return;

  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const target = Math.round(40 + intensity.value * 90); // 40..130
  particles = Array.from({ length: target }, () => ({
    x: Math.random() * rect.width,
    y: Math.random() * rect.height,
    r: 0.7 + Math.random() * 1.8,
    vx: (-0.15 + Math.random() * 0.3),
    vy: (-0.1 + Math.random() * 0.2),
    a: 0.25 + Math.random() * 0.55,
    tw: Math.random() * Math.PI * 2,
  }));
}

function tick() {
  const canvas = bgCanvas.value;
  const stage = stageEl.value;
  if (!canvas || !stage) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = stage.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const g = ctx.createRadialGradient(
    rect.width / 2, rect.height / 2, 10,
    rect.width / 2, rect.height / 2,
    Math.max(rect.width, rect.height) / 1.2
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, rect.width, rect.height);

  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < -10) p.x = rect.width + 10;
    if (p.x > rect.width + 10) p.x = -10;
    if (p.y < -10) p.y = rect.height + 10;
    if (p.y > rect.height + 10) p.y = -10;

    p.tw += 0.02 + intensity.value * 0.02;
    const twinkle = 0.6 + Math.sin(p.tw) * 0.4;
    const alpha = p.a * twinkle * (0.75 + intensity.value * 0.45);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 210, 120, ${alpha})`;
    ctx.fill();
  }

  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  raf = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas);
  cancelAnimationFrame(raf);
});

watch(count, () => resizeCanvas());
</script>

<style scoped>
.stage {
  position: relative;
  flex: 1;
  display: grid;
  place-items: center;
  padding: 16px 14px 8px;
  min-height: 62dvh;
}
.bg { position:absolute; inset:0; width:100%; height:100%; }
.center {
  position: relative;
  width: min(92vw, 420px);
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
}
.aura {
  position: absolute;
  border-radius: 999px;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 210, 120, 0.55) 0%,
    rgba(255, 190, 90, 0.25) 35%,
    rgba(255, 170, 70, 0.06) 60%,
    rgba(0, 0, 0, 0) 72%
  );
  animation: breathe 2.8s ease-in-out infinite;
}
.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 999px;
  border-style: solid;
  border-color: rgba(255, 200, 110, 0.65);
  background: radial-gradient(circle, rgba(0,0,0,0) 55%, rgba(255,200,110,0.06) 100%);
  animation: rotateSlow 16s linear infinite;
}
.orbit-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 999px;
  background: rgba(255, 215, 140, 0.95);
  box-shadow: 0 0 14px rgba(255, 200, 110, 0.55);
}
.emblem {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 200, 110, 0.09);
  border: 1px solid rgba(255, 200, 110, 0.22);
  display: grid;
  place-items: center;
  box-shadow: 0 0 40px rgba(255, 190, 90, 0.18), 0 0 90px rgba(255, 190, 90, 0.10);
  backdrop-filter: blur(8px);
}
.emblem-icon {
  width: 44px;
  height: 44px;
  color: rgba(255, 220, 150, 0.95);
  filter: drop-shadow(0 0 16px rgba(255, 200, 110, 0.35));
}
.labels { position:absolute; left:50%; top:50%; width:0; height:0; }
.label {
  position:absolute;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 210, 140, 0.25);
  background: rgba(10, 12, 20, 0.55);
  color: rgba(255, 235, 190, 0.95);
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 0 16px rgba(255, 200, 110, 0.14), 0 0 40px rgba(255, 200, 110, 0.08);
  backdrop-filter: blur(8px);
  cursor:pointer;
}
.toast {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 210, 140, 0.12);
  border: 1px solid rgba(255, 210, 140, 0.22);
  color: rgba(255, 235, 190, 0.95);
  font-size: 13px;
  box-shadow: 0 0 24px rgba(255, 200, 110, 0.12);
  backdrop-filter: blur(8px);
  max-width: 92%;
  text-align: center;
}
.toast-hint { display:block; margin-top:4px; font-size:11px; opacity:0.7; }

@keyframes rotateSlow {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes breathe {
  0%, 100% { transform: scale(0.98); }
  50%      { transform: scale(1.03); }
}
</style>
