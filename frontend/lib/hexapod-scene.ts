/**
 * 六足机器人 3D 场景 + 手柄驱动 + 三角步态
 * ------------------------------------------------------------
 * 命令式模块：React 只提供容器和静态结构，这里负责每帧更新。
 * 高频（60fps）改动不走 React state，直接改 DOM / three 对象。
 *
 * 尺寸参数集中在 CFG —— 硬件到货量出真腿长后只改这里。
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export const CFG = {
  bodyR: 62,
  bodyThick: 6,
  standH: 75,
  coxa: 25,
  femur: 55,
  tibia: 90,
  femurBaseDeg: 15, // 站立时股段仰角
  tibiaRelDeg: -105, // 胫段相对股段的角度（让脚落地）
  legAngles: [0, 45, 135, 180, 225, 315],
  legNames: ["右中", "右前", "左前", "左中", "左后", "右后"],
  swingDeg: 16, // 水平摆幅
  liftDeg: 20, // 抬腿角度
};

const DEAD = 0.12;
const D2R = THREE.MathUtils.degToRad;

type Joint = "coxa" | "femur" | "tibia";
const JOINTS: Joint[] = ["coxa", "femur", "tibia"];

export type Input = {
  vx: number;
  vy: number;
  turn: number;
  height: number;
  stop: boolean;
  gait: number; // 0 三角 / 1 波纹
  speed: number; // 0..1
  lift: number; // 0..1
  padConnected: boolean;
  autoDemo: boolean;
};

export type LegAngle = { coxa: number; femur: number; tibia: number };

export type SceneAPI = {
  input: Input;
  legs: { name: string }[];
  gaitPhase: number;
  setGait: (g: number) => void;
  toggleStop: () => void;
  toggleAuto: () => void;
  setSpeed: (v: number) => void;
  setLift: (v: number) => void;
  dispose: () => void;
};

export function initHexapod(root: HTMLElement): SceneAPI {
  const stage = root.querySelector<HTMLElement>("[data-stage]")!;
  const servosEl = root.querySelector<HTMLElement>("[data-servos]")!;
  const padEl = root.querySelector<HTMLElement>("[data-padstate]")!;
  const fpsEl = root.querySelector<HTMLElement>("[data-fps]")!;

  /* ───────── 场景 ───────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d12);
  scene.fog = new THREE.Fog(0x0b0d12, 700, 1500);

  const camera = new THREE.PerspectiveCamera(42, 1, 1, 4000);
  camera.position.set(300, 300, 480);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  stage.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 55, 0);
  controls.minDistance = 180;
  controls.maxDistance = 1200;

  scene.add(new THREE.HemisphereLight(0x9db8ff, 0x0a0c11, 1.0));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(240, 420, 280);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  const dl = 420;
  Object.assign(keyLight.shadow.camera, {
    left: -dl, right: dl, top: dl, bottom: -dl, near: 1, far: 1500,
  });
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xc084fc, 1.1);
  rim.position.set(-280, 160, -260);
  scene.add(rim);

  const grid = new THREE.GridHelper(1000, 40, 0x1d2534, 0x141a24);
  grid.position.y = -0.5;
  scene.add(grid);

  /* ───────── 材质 ───────── */
  const MAT = {
    body: new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.35, roughness: 0.42 }),
    top: new THREE.MeshStandardMaterial({ color: 0x1c6f9c, metalness: 0.3, roughness: 0.6 }),
    link: new THREE.MeshStandardMaterial({ color: 0xc084fc, metalness: 0.25, roughness: 0.5 }),
    servo: new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.5, roughness: 0.35 }),
    horn: new THREE.MeshStandardMaterial({ color: 0xe8eaf0, metalness: 0.7, roughness: 0.3 }),
    foot: new THREE.MeshStandardMaterial({ color: 0x2bd6a0, metalness: 0.1, roughness: 0.8 }),
  };
  const ALL_MATS = Object.values(MAT);

  /* ───────── 机体 ───────── */
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const bodyPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(CFG.bodyR, CFG.bodyR, CFG.bodyThick, 6),
    MAT.body,
  );
  bodyPlate.position.y = CFG.standH;
  bodyPlate.rotation.y = Math.PI / 6;
  bodyPlate.castShadow = bodyPlate.receiveShadow = true;
  rootGroup.add(bodyPlate);

  const boardPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(CFG.bodyR * 0.72, CFG.bodyR * 0.72, 2.4, 6),
    MAT.top,
  );
  boardPlate.position.y = CFG.standH + 9;
  boardPlate.rotation.y = Math.PI / 6;
  boardPlate.castShadow = true;
  rootGroup.add(boardPlate);

  /* ───────── 六条腿（三层关节） ───────── */
  const SHOULDER_R = CFG.bodyR * Math.cos(Math.PI / 6);

  type Leg = {
    legRoot: THREE.Group;
    coxaPivot: THREE.Group;
    femurPivot: THREE.Group;
    tibiaPivot: THREE.Group;
    name: string;
    idx: number;
    phaseOffset: number;
    a: LegAngle;
  };

  const legs: Leg[] = [];

  CFG.legAngles.forEach((deg, idx) => {
    const rad = D2R(deg);
    const legRoot = new THREE.Group();
    legRoot.position.set(Math.sin(rad) * SHOULDER_R, CFG.standH, Math.cos(rad) * SHOULDER_R);
    legRoot.rotation.y = rad - Math.PI / 2;
    rootGroup.add(legRoot);

    const coxaPivot = new THREE.Group();
    legRoot.add(coxaPivot);

    const coxaLink = new THREE.Mesh(new THREE.BoxGeometry(CFG.coxa, 7, 7), MAT.link);
    coxaLink.position.x = CFG.coxa / 2;
    coxaLink.castShadow = true;
    coxaPivot.add(coxaLink);

    const s1 = new THREE.Mesh(new THREE.BoxGeometry(12.5, 20, 22.5), MAT.servo);
    s1.position.set(6, 1, 0);
    s1.rotation.y = Math.PI / 2;
    s1.castShadow = true;
    coxaPivot.add(s1);

    const femurPivot = new THREE.Group();
    femurPivot.position.x = CFG.coxa;
    coxaPivot.add(femurPivot);

    const femurLink = new THREE.Mesh(new THREE.BoxGeometry(CFG.femur, 6.4, 6.4), MAT.link);
    femurLink.position.x = CFG.femur / 2;
    femurLink.castShadow = true;
    femurPivot.add(femurLink);

    const s2 = new THREE.Mesh(new THREE.BoxGeometry(12.5, 20, 22.5), MAT.servo);
    s2.position.set(4, 0, 0);
    s2.rotation.y = Math.PI / 2;
    s2.castShadow = true;
    femurPivot.add(s2);

    const horn = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 1.6, 16), MAT.horn);
    horn.position.set(9, 0, 0);
    horn.rotation.z = Math.PI / 2;
    horn.castShadow = true;
    femurPivot.add(horn);

    const tibiaPivot = new THREE.Group();
    tibiaPivot.position.x = CFG.femur;
    femurPivot.add(tibiaPivot);

    const tibiaLink = new THREE.Mesh(new THREE.BoxGeometry(CFG.tibia, 5.6, 5.6), MAT.link);
    tibiaLink.position.x = CFG.tibia / 2;
    tibiaLink.castShadow = true;
    tibiaPivot.add(tibiaLink);

    const s3 = new THREE.Mesh(new THREE.BoxGeometry(12.5, 20, 22.5), MAT.servo);
    s3.position.set(0, -3, 0);
    s3.rotation.y = Math.PI / 2;
    s3.castShadow = true;
    tibiaPivot.add(s3);

    const foot = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 10), MAT.foot);
    foot.position.x = CFG.tibia - 2;
    foot.castShadow = true;
    tibiaPivot.add(foot);

    const leg: Leg = {
      legRoot, coxaPivot, femurPivot, tibiaPivot,
      name: CFG.legNames[idx], idx,
      phaseOffset: idx % 2 === 0 ? 0 : Math.PI, // 三角步态：相邻相位差 180°
      a: { coxa: 0, femur: CFG.femurBaseDeg, tibia: CFG.tibiaRelDeg },
    };

    // 站立初始姿态，避免第一帧从 0 抖过去
    femurPivot.rotation.z = D2R(CFG.femurBaseDeg);
    tibiaPivot.rotation.z = D2R(CFG.tibiaRelDeg);

    legs.push(leg);
  });

  /* ───────── 输入 ───────── */
  const input: Input = {
    vx: 0, vy: 0, turn: 0, height: 0,
    stop: false, gait: 0, speed: 0.45, lift: 0.5,
    padConnected: false, autoDemo: false,
  };
  const keys: Record<string, boolean> = {};
  const onKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
  const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const curve = (v: number) => {
    const a = Math.abs(v);
    if (a < DEAD) return 0;
    const m = (a - DEAD) / (1 - DEAD);
    return Math.sign(v) * m * m;
  };

  let prevLB = false;

  const applyKeyboard = () => {
    if (input.stop) return;
    let x = 0, y = 0;
    if (keys["w"]) y += 1;
    if (keys["s"]) y -= 1;
    if (keys["a"]) x -= 1;
    if (keys["d"]) x += 1;
    if (keys["q"]) input.turn = -0.8;
    else if (keys["e"]) input.turn = 0.8;
    else if (!input.padConnected) input.turn = 0;
    input.vx = y;
    input.vy = x;
    if (keys["r"]) input.height = Math.min(1, input.height + 0.01);
    if (keys["f"]) input.height = Math.max(-1, input.height - 0.01);
  };

  const readPad = () => {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad: Gamepad | null = null;
    for (const p of pads) {
      if (p && p.connected) { pad = p; break; }
    }

    if (!pad) {
      input.padConnected = false;
      if (!input.autoDemo) applyKeyboard();
      return;
    }

    input.padConnected = true;
    if (input.autoDemo) return;

    const ax = pad.axes;
    const bt = pad.buttons;
    input.vx = -curve(ax[1] ?? 0);
    input.vy = curve(ax[0] ?? 0);
    input.turn = curve(ax[2] ?? 0);
    input.height = -curve(ax[3] ?? 0);

    const lb = !!bt[4]?.pressed;
    if (lb && !prevLB) input.gait = (input.gait + 1) % 2;
    if (bt[8]?.pressed) input.height = 0;
    input.stop = !!bt[0]?.pressed;
    prevLB = lb;
  };

  /* ───────── 步态 ───────── */
  const DUTY = 0.5;
  let gaitPhase = 0;

  const gaitAt = (p: number) => {
    if (p < DUTY) {
      const s = p / DUTY;
      return { swing: 1 - 2 * s, lift: 0 }; // 支撑相：前 → 后
    }
    const s = (p - DUTY) / (1 - DUTY);
    return { swing: -1 + 2 * s, lift: Math.sin(s * Math.PI) }; // 摆动相：后 → 前 + 抬
  };

  const updateGait = (dt: number) => {
    const dragging = Math.abs(input.vx) + Math.abs(input.vy) + Math.abs(input.turn);
    const moving = !input.stop && dragging > 0.02;
    const spd = input.speed * (0.4 + 0.9 * Math.min(1, dragging));
    if (moving) gaitPhase += dt * (0.9 + 2.6 * spd);

    const legPhaseSpread = input.gait === 0 ? 0 : Math.PI / 3;

    legs.forEach((leg, i) => {
      const ph =
        (gaitPhase + leg.phaseOffset + (input.gait ? i * legPhaseSpread : 0)) %
        (Math.PI * 2);
      const p = (ph / (Math.PI * 2)) % 1;
      const g = gaitAt(p);

      const amp = moving ? 1 : 0;
      const swingAmp = CFG.swingDeg * input.speed * amp;
      const liftAmp = CFG.liftDeg * input.lift * amp;

      let femurDeg = CFG.femurBaseDeg + g.lift * liftAmp;
      let tibiaDeg = CFG.tibiaRelDeg - g.lift * liftAmp * 1.15;

      femurDeg += input.height * 14;
      tibiaDeg += input.height * -8;

      let coxaDeg = g.swing * swingAmp;
      coxaDeg += input.vy * 12; // 横移
      coxaDeg += input.turn * 14; // 转向

      leg.a.coxa = coxaDeg;
      leg.a.femur = femurDeg;
      leg.a.tibia = tibiaDeg;

      // 平滑过渡：跟真舵机的缓动一致，避免硬跳
      const k = 1 - Math.pow(0.001, dt);
      leg.coxaPivot.rotation.y += (D2R(coxaDeg) - leg.coxaPivot.rotation.y) * k;
      leg.femurPivot.rotation.z += (D2R(femurDeg) - leg.femurPivot.rotation.z) * k;
      leg.tibiaPivot.rotation.z += (D2R(tibiaDeg) - leg.tibiaPivot.rotation.z) * k;
    });

    // 机体随速度轻微俯仰
    rootGroup.rotation.x = THREE.MathUtils.lerp(
      rootGroup.rotation.x, input.vx * 0.045, 1 - Math.pow(0.002, dt));
    rootGroup.rotation.z = THREE.MathUtils.lerp(
      rootGroup.rotation.z, -input.vy * 0.045, 1 - Math.pow(0.002, dt));
  };

  /* ───────── 读数面板（直接改 DOM） ───────── */
  const cellRefs: Record<string, { bar: HTMLElement; val: HTMLElement }> = {};
  legs.forEach((leg) => {
    JOINTS.forEach((j) => {
      const bar = servosEl.querySelector<HTMLElement>(
        `[data-bar="leg${leg.idx}-${j}"]`);
      const val = servosEl.querySelector<HTMLElement>(
        `[data-val="leg${leg.idx}-${j}"]`);
      if (bar && val) cellRefs[`${leg.idx}-${j}`] = { bar, val };
    });
  });

  const updateReadout = () => {
    legs.forEach((leg) => {
      JOINTS.forEach((j) => {
        const deg = leg.a[j];
        const servo = 90 + deg;
        const r = cellRefs[`${leg.idx}-${j}`];
        if (!r) return;
        const off = Math.max(-1, Math.min(1, deg / 60));
        r.bar.style.width = `${Math.abs(off) * 50}%`;
        r.bar.style.left = off < 0 ? "auto" : "50%";
        r.bar.style.right = off < 0 ? "50%" : "auto";
        r.val.textContent = `${servo.toFixed(1)}°`;
        r.val.classList.toggle("text-[rgb(var(--color-accent))]", Math.abs(deg) > 12);
      });
    });
  };

  /* ───────── 尺寸自适应 ───────── */
  const resize = () => {
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  /* ───────── 主循环 ───────── */
  let raf = 0;
  let last = performance.now();
  let frames = 0;
  let fpsT = last;
  let alive = true;

  const tick = (now: number) => {
    if (!alive) return;
    raf = requestAnimationFrame(tick);

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    readPad();
    updateGait(dt);
    updateReadout();
    controls.update();
    renderer.render(scene, camera);

    frames++;
    if (now - fpsT > 600) {
      const fps = Math.round((frames * 1000) / (now - fpsT));
      frames = 0;
      fpsT = now;
      fpsEl.textContent = `${fps} fps · 18 舵机`;
      padEl.innerHTML = input.padConnected
        ? `<b class="text-[rgb(var(--color-accent))]">手柄已连接</b><br>${
            input.stop ? "急停中" : "运行中"
          }`
        : `<span class="opacity-70">未检测到手柄</span><br>键盘 WASD / QE 也能控`;
    }
  };
  raf = requestAnimationFrame(tick);

  /* ───────── 对外 API + 清理 ───────── */
  return {
    input,
    legs: legs.map((l) => ({ name: l.name })),
    get gaitPhase() { return gaitPhase; },
    setGait: (g: number) => { input.gait = g % 2; },
    toggleStop: () => { input.stop = !input.stop; },
    toggleAuto: () => {
      input.autoDemo = !input.autoDemo;
      if (input.autoDemo) { input.vx = 0.7; input.vy = 0; input.turn = 0; }
      else { input.vx = 0; }
    },
    setSpeed: (v: number) => { input.speed = v; },
    setLift: (v: number) => { input.lift = v; },
    dispose: () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      controls.dispose();
      ALL_MATS.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === stage) {
        stage.removeChild(renderer.domElement);
      }
    },
  };
}
