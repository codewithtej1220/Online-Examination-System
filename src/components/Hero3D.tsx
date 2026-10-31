import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Login hero: floating glass exam panels in a 3D scene that tilts with the
 * mouse. Rotation is written to the stage's style directly (no re-renders),
 * and is skipped entirely for reduced-motion users.
 */
export default function Hero3D() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.style.transform = `rotateX(${12 - y * 14}deg) rotateY(${-16 + x * 22}deg)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      stage.style.transform = "";
    };

    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={sceneRef} className="hero-scene relative h-[380px] w-full select-none" aria-hidden="true">
      <div
        ref={stageRef}
        className="hero-stage absolute inset-0"
        style={{ transform: "rotateX(12deg) rotateY(-16deg)" }}
      >
        <div className="hero-floor" />

        {/* Orbit rings */}
        <div className="hero-orbit left-1/2 top-1/2 h-[380px] w-[380px]" style={{ transform: "translate(-50%, -50%) rotateX(70deg) translateZ(-40px)" }}>
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,0.6)]" />
        </div>
        <div className="hero-orbit left-1/2 top-1/2 h-[300px] w-[300px]" style={{ transform: "translate(-50%, -50%) rotateX(70deg) rotateY(20deg) translateZ(-20px)", animationDuration: "18s", animationDirection: "reverse" }}>
          <span className="absolute -bottom-1 left-1/3 h-2 w-2 rounded-full bg-indigo-300 shadow-[0_0_12px_3px_rgba(165,180,252,0.6)]" />
        </div>

        {/* Main exam paper panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hero-panel hero-float left-[16%] top-[18%] w-[300px] p-5"
          style={{ z: 30 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">DBMS Midterm</span>
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">
              <Clock className="h-3 w-3" /> 24:18
            </span>
          </div>
          <p className="mb-3 text-sm font-medium text-white">Q4. Which normal form removes transitive dependencies?</p>
          {["1NF", "2NF", "3NF", "BCNF"].map((option, index) => (
            <div
              key={option}
              className={`mb-2 rounded-lg border px-3 py-2 text-xs ${
                index === 2 ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {String.fromCharCode(65 + index)}. {option}
            </div>
          ))}
        </motion.div>

        {/* Score panel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="hero-panel hero-float-delayed right-[6%] top-[14%] w-[190px] p-4"
          style={{ z: 60 }}
        >
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <BarChart3 className="h-4 w-4 text-emerald-300" /> Auto-graded
          </div>
          <p className="mt-2 text-3xl font-bold text-white">92%</p>
          <div className="mt-3 flex h-10 items-end gap-1">
            {[40, 65, 50, 80, 72, 92].map((height, index) => (
              <div key={index} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-emerald-400" style={{ height: `${height}%` }} />
            ))}
          </div>
        </motion.div>

        {/* Proctoring panel */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hero-panel hero-float right-[6%] bottom-[10%] w-[210px] p-4"
          style={{ z: 45 }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <ShieldCheck className="h-4 w-4 text-indigo-300" /> AI Proctoring
            <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <div className="mt-3 grid gap-1.5 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-300" /> Face verified</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-300" /> Gaze on screen</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-300" /> Single monitor</span>
          </div>
        </motion.div>

        {/* AI chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="hero-panel hero-float-delayed bottom-[18%] left-[8%] flex items-center gap-2 px-3 py-2 text-xs text-white"
          style={{ z: 75 }}
        >
          <Sparkles className="h-4 w-4 text-amber-300" /> 20 questions generated
        </motion.div>
      </div>
    </div>
  );
}
