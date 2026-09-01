import * as THREE from "three";

export type Team = "red" | "blue";

export const TEAM_LABEL: Record<Team, string> = { red: "الصقور", blue: "الذئاب" };
export const TEAM_COLOR: Record<Team, string> = { red: "#c0392b", blue: "#2471a3" };

export const ARENA = 30; // نصف طول الساحة
export const WALK_SPEED = 6;
export const EYE = 1.65;
export const HP_MAX = 100;
export const MAG = 30;
export const RELOAD_MS = 1800;
export const FIRE_MS = 95;
export const DMG = 26;
export const RESPAWN_MS = 4000;
export const MATCH_SECONDS = 180;
export const SCORE_LIMIT = 25;

export interface Obstacle {
  x: number;
  z: number;
  hx: number; // نصف العرض
  hz: number; // نصف العمق
  h: number; // الارتفاع
}

export interface Fighter {
  id: string;
  name: string;
  team: Team;
  pos: THREE.Vector3;
  yaw: number;
  hp: number;
  alive: boolean;
  respawnAt: number; // ms timestamp
  moving: boolean;
  isBot: boolean;
  isRemote: boolean;
  kills: number;
  deaths: number;
}

/** عوائق الساحة (صناديق AABB) — معبد شرقي: أعمدة، صناديق، أسوار */
export const OBSTACLES: Obstacle[] = (() => {
  const list: Obstacle[] = [];
  // أسوار الساحة
  list.push({ x: 0, z: -ARENA - 1, hx: ARENA + 2, hz: 1, h: 5 });
  list.push({ x: 0, z: ARENA + 1, hx: ARENA + 2, hz: 1, h: 5 });
  list.push({ x: -ARENA - 1, z: 0, hx: 1, hz: ARENA + 2, h: 5 });
  list.push({ x: ARENA + 1, z: 0, hx: 1, hz: ARENA + 2, h: 5 });
  // أعمدة المعبد الكبرى (صفّان)
  for (const sx of [-12, 12]) {
    for (const sz of [-14, 0, 14]) {
      list.push({ x: sx, z: sz, hx: 1.4, hz: 1.4, h: 7 });
    }
  }
  // صناديق ذخيرة (غطاء منخفض)
  const crates: [number, number][] = [
    [-5, -8], [5, -8], [-5, 8], [5, 8], [0, -16], [0, 16], [-18, -6], [18, 6],
  ];
  for (const [x, z] of crates) list.push({ x, z, hx: 1.1, hz: 1.1, h: 1.2 });
  // أنصاف أعمدة مكسورة
  for (const [x, z] of [[-20, 16], [20, -16], [0, 0]] as [number, number][]) {
    list.push({ x, z, hx: 1.2, hz: 1.2, h: 2.6 });
  }
  return list;
})();

export const SPAWNS: Record<Team, [number, number][]> = {
  red: [[-8, 24], [0, 26], [8, 24], [-14, 22], [14, 22]],
  blue: [[-8, -24], [0, -26], [8, -24], [-14, -22], [14, -22]],
};

export function spawnPoint(team: Team, index: number): THREE.Vector3 {
  const s = SPAWNS[team][index % SPAWNS[team].length];
  return new THREE.Vector3(s[0], 0, s[1]);
}

/** تصادم دائرة (اللاعب) مع صناديق العوائق — يعيد الموضع المصحح */
export function collideCircle(x: number, z: number, r: number): [number, number] {
  let nx = x;
  let nz = z;
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x - o.hx, Math.min(nx, o.x + o.hx));
    const cz = Math.max(o.z - o.hz, Math.min(nz, o.z + o.hz));
    const dx = nx - cx;
    const dz = nz - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 < 1e-8) {
        // داخل الصندوق: ادفع للخارج نحو أقرب وجه
        const pushL = nx - (o.x - o.hx) + r;
        const pushR = o.x + o.hx - nx + r;
        const pushB = nz - (o.z - o.hz) + r;
        const pushF = o.z + o.hz - nz + r;
        const m = Math.min(pushL, pushR, pushB, pushF);
        if (m === pushL) nx = o.x - o.hx - r;
        else if (m === pushR) nx = o.x + o.hx + r;
        else if (m === pushB) nz = o.z - o.hz - r;
        else nz = o.z + o.hz + r;
      } else {
        const d = Math.sqrt(d2);
        nx = cx + (dx / d) * r;
        nz = cz + (dz / d) * r;
      }
    }
  }
  nx = Math.max(-ARENA + 0.5, Math.min(ARENA - 0.5, nx));
  nz = Math.max(-ARENA + 0.5, Math.min(ARENA - 0.5, nz));
  return [nx, nz];
}

/** اختبار أشعة: أقرب عائق بين نقطتين — للرؤية وإصابة الجدران */
export function rayObstacleDist(o: THREE.Vector3, d: THREE.Vector3, maxDist: number): number {
  let best = maxDist;
  for (const b of OBSTACLES) {
    const min = { x: b.x - b.hx, y: 0, z: b.z - b.hz };
    const max = { x: b.x + b.hx, y: b.h, z: b.z + b.hz };
    let tmin = 0;
    let tmax = best;
    let ok = true;
    for (const ax of ["x", "y", "z"] as const) {
      const ov = o[ax];
      const dv = d[ax];
      if (Math.abs(dv) < 1e-9) {
        if (ov < min[ax] || ov > max[ax]) { ok = false; break; }
      } else {
        let t1 = (min[ax] - ov) / dv;
        let t2 = (max[ax] - ov) / dv;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) { ok = false; break; }
      }
    }
    if (ok && tmin < best) best = tmin;
  }
  return best;
}

/** هل الرؤية مفتوحة بين نقطتين (بدون عائق)؟ */
export function lineOfSight(a: THREE.Vector3, b: THREE.Vector3): boolean {
  const dir = b.clone().sub(a);
  const dist = dir.length();
  if (dist < 0.001) return true;
  dir.divideScalar(dist);
  return rayObstacleDist(a, dir, dist) >= dist - 0.01;
}

/** حالة قابلة للتغيير مشتركة بين المكوّنات (ليست React state) */
export interface WorldState {
  fighters: Map<string, Fighter>;
  /** طابور تأثيرات: خطوط طلقات وإصابات */
  fx: FxEvent[];
  now: number;
}

export interface FxEvent {
  kind: "tracer" | "hit" | "blood";
  from: [number, number, number];
  to: [number, number, number];
}

export const world: WorldState = {
  fighters: new Map(),
  fx: [],
  now: 0,
};

export function pushFx(e: FxEvent) {
  world.fx.push(e);
  if (world.fx.length > 60) world.fx.splice(0, world.fx.length - 60);
}

let seq = 0;
export function botId() {
  return `bot-${seq++}`;
}
