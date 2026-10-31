import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type AvaMood = "idle" | "wave" | "think" | "explain" | "cheer";

type Props = {
  mood?: AvaMood;
  talking?: boolean;
  /** Canvas width in px; height is 1.15x */
  size?: number;
  className?: string;
};

const SKIN = 0xf2c4a2;
const HAIR = 0x3a2418;
const BLAZER = 0x5b5fe0;
const INK = 0x1e2240;

/**
 * "Ava" — a stylised, cel-shaded 3D study guide built from primitives.
 * Head and eyes follow the cursor, she blinks and breathes, and moods drive
 * body language (wave, think, explain, cheer). Mouth animates while talking.
 * Rendering pauses while off-screen; reduced-motion users get a still pose.
 */
export default function Mascot3D({ mood = "idle", talking = false, size = 140, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ mood, talking, moodChangedAt: 0 });
  const renderOnceRef = useRef<() => void>(() => undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    stateRef.current = { mood, talking, moodChangedAt: performance.now() / 1000 };
    renderOnceRef.current();
  }, [mood, talking]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const height = Math.round(size * 1.15);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, size / height, 0.1, 100);
    camera.position.set(0, 1.15, 6.4);
    camera.lookAt(0, 1.0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa6e0, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb0ff, 1.1);
    rim.position.set(-3, 2.5, -3);
    scene.add(rim);

    // Three-step gradient gives the flat, friendly cartoon shading
    const gradient = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
    const toon = (color: number, extra: Partial<THREE.MeshToonMaterialParameters> = {}) =>
      new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
    const flat = (color: number, extra: Partial<THREE.MeshBasicMaterialParameters> = {}) => new THREE.MeshBasicMaterial({ color, ...extra });

    const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number] = [0, 0, 0], scale?: [number, number, number]) => {
      const m = new THREE.Mesh(geometry, material);
      m.position.set(...position);
      if (scale) m.scale.set(...scale);
      return m;
    };

    const ava = new THREE.Group();
    scene.add(ava);

    // Soft contact shadow
    const shadow = mesh(new THREE.CircleGeometry(0.75, 32), flat(0x000000, { transparent: true, opacity: 0.12 }), [0, -0.38, 0]);
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);

    // Torso + outfit
    const torso = new THREE.Group();
    ava.add(torso);
    torso.add(mesh(new THREE.CapsuleGeometry(0.56, 0.5, 8, 28), toon(BLAZER), [0, 0.5, 0], [1, 1, 0.78]));
    torso.add(mesh(new THREE.SphereGeometry(0.24, 24, 16), toon(0xffffff), [0, 1.0, 0.24], [1, 0.75, 0.6])); // collar
    const lapelMat = toon(0x4347c4);
    const lapelL = mesh(new THREE.BoxGeometry(0.1, 0.5, 0.05), lapelMat, [-0.15, 0.78, 0.43]);
    lapelL.rotation.z = -0.35;
    const lapelR = mesh(new THREE.BoxGeometry(0.1, 0.5, 0.05), lapelMat, [0.15, 0.78, 0.43]);
    lapelR.rotation.z = 0.35;
    torso.add(lapelL, lapelR);
    const badge = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24), toon(0x10b981), [0.3, 0.68, 0.43]);
    badge.rotation.x = Math.PI / 2;
    torso.add(badge);
    torso.add(mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 20), toon(SKIN), [0, 1.08, 0])); // neck

    // Head
    const head = new THREE.Group();
    head.position.set(0, 1.62, 0);
    ava.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.55, 40, 32), toon(SKIN), [0, 0, 0], [1, 1.04, 0.98]));

    const hairMat = toon(HAIR);
    const hairCap = mesh(new THREE.SphereGeometry(0.585, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat, [0, 0.02, -0.02]);
    hairCap.rotation.x = -0.32;
    head.add(hairCap);
    const fringe = mesh(new THREE.SphereGeometry(0.3, 24, 16), hairMat, [-0.18, 0.36, 0.3], [1.3, 0.55, 0.7]);
    fringe.rotation.z = 0.5;
    head.add(fringe);
    head.add(mesh(new THREE.SphereGeometry(0.24, 24, 16), hairMat, [0, 0.42, -0.42])); // bun
    head.add(mesh(new THREE.CapsuleGeometry(0.13, 0.42, 6, 12), hairMat, [-0.5, -0.12, -0.12]));
    head.add(mesh(new THREE.CapsuleGeometry(0.13, 0.42, 6, 12), hairMat, [0.5, -0.12, -0.12]));
    head.add(mesh(new THREE.SphereGeometry(0.1, 16, 12), toon(SKIN), [-0.55, -0.03, 0.02], [0.55, 1, 0.6]));
    head.add(mesh(new THREE.SphereGeometry(0.1, 16, 12), toon(SKIN), [0.55, -0.03, 0.02], [0.55, 1, 0.6]));

    // Eyes (white + pupil + highlight), tracked together for blinking
    const eyes: THREE.Group[] = [];
    const pupils: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.2, 0.04, 0.46);
      eye.add(mesh(new THREE.SphereGeometry(0.12, 24, 16), toon(0xffffff), [0, 0, 0], [1, 1.1, 0.6]));
      const pupil = new THREE.Group();
      pupil.add(mesh(new THREE.SphereGeometry(0.075, 20, 16), flat(INK), [0, 0, 0.055]));
      pupil.add(mesh(new THREE.SphereGeometry(0.025, 12, 8), flat(0xffffff), [0.03, 0.035, 0.12]));
      eye.add(pupil);
      head.add(eye);
      eyes.push(eye);
      pupils.push(pupil);

      const rimGlass = mesh(new THREE.TorusGeometry(0.165, 0.02, 10, 32), flat(0x2b2f45), [side * 0.2, 0.04, 0.53]);
      head.add(rimGlass);
    }
    const bridge = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), flat(0x2b2f45), [0, 0.07, 0.56]);
    bridge.rotation.z = Math.PI / 2;
    head.add(bridge);

    const brows: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const brow = mesh(new THREE.BoxGeometry(0.17, 0.035, 0.04), flat(HAIR), [side * 0.2, 0.27, 0.5]);
      head.add(brow);
      brows.push(brow);
    }

    head.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), toon(0xe0a985), [0, -0.09, 0.55]));
    for (const side of [-1, 1]) {
      head.add(mesh(new THREE.SphereGeometry(0.075, 16, 12), flat(0xf59ab0, { transparent: true, opacity: 0.55 }), [side * 0.32, -0.13, 0.43], [1, 0.7, 0.35]));
    }

    const smile = mesh(new THREE.TorusGeometry(0.11, 0.024, 8, 24, Math.PI), flat(0x8a2d3b), [0, -0.2, 0.5]);
    smile.rotation.z = Math.PI;
    head.add(smile);
    const mouth = mesh(new THREE.SphereGeometry(0.085, 20, 14), flat(0x6b1f2c), [0, -0.23, 0.49], [1.1, 0.5, 0.4]);
    mouth.visible = false;
    head.add(mouth);

    // Arms pivot at the shoulders
    const arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.6, 0.92, 0);
      pivot.add(mesh(new THREE.CapsuleGeometry(0.13, 0.5, 6, 16), toon(BLAZER), [0, -0.34, 0]));
      pivot.add(mesh(new THREE.SphereGeometry(0.13, 16, 12), toon(SKIN), [0, -0.72, 0]));
      ava.add(pivot);
      return pivot;
    });
    const [leftArm, rightArm] = arms;

    // Pointer tracking (window-wide so she "watches" the page)
    const look = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.3;
      look.tx = Math.max(-1, Math.min(1, (event.clientX - cx) / (window.innerWidth / 2)));
      look.ty = Math.max(-1, Math.min(1, (event.clientY - cy) / (window.innerHeight / 2)));
    };
    window.addEventListener("pointermove", onPointer);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    let nextBlink = 2 + Math.random() * 3;
    let visible = true;
    let frame = 0;
    const clock = new THREE.Clock();

    const pose = (t: number) => {
      const { mood: currentMood, talking: isTalking, moodChangedAt } = stateRef.current;
      const since = performance.now() / 1000 - moodChangedAt;

      // Idle float + breathing
      ava.position.y = Math.sin(t * 1.6) * 0.04;
      torso.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
      shadow.scale.setScalar(1 - Math.sin(t * 1.6) * 0.04);

      // Head follows the pointer
      look.x = lerp(look.x, look.tx, 0.08);
      look.y = lerp(look.y, look.ty, 0.08);
      let tilt = Math.sin(t * 0.8) * 0.03;
      let browLift = 0;

      let leftZ = -0.16 + Math.sin(t * 1.3) * 0.03;
      let rightZ = 0.16 - Math.sin(t * 1.3 + 1) * 0.03;
      let rightX = 0;

      if (currentMood === "wave") {
        rightZ = 2.55 + Math.sin(t * 9) * 0.35;
        browLift = 0.03;
      } else if (currentMood === "cheer") {
        leftZ = -2.5 + Math.sin(t * 10) * 0.15;
        rightZ = 2.5 - Math.sin(t * 10) * 0.15;
        ava.position.y = Math.abs(Math.sin(t * 5.5)) * 0.22;
        browLift = 0.05;
      } else if (currentMood === "think") {
        rightZ = 2.25;
        rightX = -0.9;
        tilt = 0.18;
        browLift = 0.04;
      } else if (currentMood === "explain") {
        leftZ = -0.7 - Math.sin(t * 2.6) * 0.25;
        browLift = 0.02;
      }

      head.rotation.y = look.x * 0.45 + (currentMood === "think" ? 0.15 : 0);
      head.rotation.x = look.y * 0.25 + (currentMood === "think" ? -0.12 : 0);
      head.rotation.z = lerp(head.rotation.z, tilt, 0.1);

      leftArm.rotation.z = lerp(leftArm.rotation.z, leftZ, Math.min(1, 0.12 + since * 0.05));
      rightArm.rotation.z = lerp(rightArm.rotation.z, rightZ, Math.min(1, 0.12 + since * 0.05));
      rightArm.rotation.x = lerp(rightArm.rotation.x, rightX, 0.12);

      for (const pupil of pupils) {
        pupil.position.x = look.x * 0.035;
        pupil.position.y = -look.y * 0.03;
      }
      brows.forEach((brow, index) => {
        brow.position.y = lerp(brow.position.y, 0.27 + browLift, 0.15);
        brow.rotation.z = (index === 0 ? 1 : -1) * (currentMood === "think" ? 0.15 : 0.05);
      });

      // Blink
      if (t > nextBlink) {
        const phase = (t - nextBlink) / 0.14;
        const open = phase < 1 ? Math.abs(1 - phase * 2) : 1;
        eyes.forEach((eye) => (eye.scale.y = Math.max(0.08, open)));
        if (phase >= 1) nextBlink = t + 2.5 + Math.random() * 3.5;
      }

      // Mouth
      smile.visible = !isTalking;
      mouth.visible = isTalking;
      if (isTalking) mouth.scale.y = 0.25 + Math.abs(Math.sin(t * 13)) * 0.75;
    };

    const render = () => renderer.render(scene, camera);
    // ~30fps is plenty for a mascot and halves GPU work next to the rest of the UI
    let lastDraw = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - lastDraw < 32) return;
      lastDraw = now;
      pose(clock.getElapsedTime());
      render();
    };

    renderOnceRef.current = () => {
      if (reducedMotion) {
        pose(0);
        render();
      }
    };

    if (reducedMotion) {
      pose(0);
      render();
    } else {
      frame = requestAnimationFrame(loop);
    }

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      renderOnceRef.current = () => undefined;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
        }
      });
      gradient.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [size]);

  if (failed) {
    // WebGL unavailable: a simple illustrated fallback keeps the assistant usable
    return (
      <div className={className} style={{ width: size, height: Math.round(size * 1.15) }}>
        <div className="grid h-full place-items-center">
          <div className="grid h-3/5 aspect-square place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-3xl font-bold text-white shadow-lg">
            A
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className={className} style={{ width: size, height: Math.round(size * 1.15) }} aria-hidden="true" />;
}
