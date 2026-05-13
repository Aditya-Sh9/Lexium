import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { useLocation } from 'react-router';
import {
  Scale, Gavel, Landmark, Shield, BookOpen, FileText, Award,
  Briefcase, Scroll, Building2, ShieldCheck, Feather,
} from 'lucide-react';

// Law-themed icon set — gavel, scales, courthouse, briefcase, scrolls…
const ICONS = [
  Scale, Gavel, Landmark, Shield, BookOpen, FileText,
  Award, Briefcase, Scroll, Building2, ShieldCheck, Feather,
];

// Courtroom palette — muted navy, walnut, brass tones
const THEME_COLORS = [
  '#1e3a5f', // deep navy
  '#2c5282', // navy blue
  '#4e729e', // steel blue
  '#8b5e34', // walnut brown
  '#6b4423', // dark walnut
  '#c8a84e', // brass gold
  '#d4a85a', // warm gold
  '#504538', // dark parchment
];

// Fisher-Yates shuffle so icon/color sequences aren't visually repeating
function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/*
 * Grid-based distribution with jitter:
 * Splits the viewport into cols × rows cells and places one shape inside
 * each cell at a randomized position. Guarantees coverage of every region
 * of the screen (no left-side dead zones) while still looking organic.
 */
const generateShapes = (count, isLanding) => {
  const baseSize = isLanding ? 120 : 90;

  // Choose a grid that roughly matches a 16:9 viewport
  const cols = isLanding ? 6 : 5;
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  // Build a list of cell coordinates (col, row) and shuffle so consecutive
  // shapes don't fall in adjacent cells — keeps the field reading as random
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push([c, r]);
  }
  const shuffledCells = shuffle(cells).slice(0, count);

  return shuffledCells.map(([col, row], i) => {
    // ~25% of shapes are noticeably larger and slower → adds depth
    const isBigLayer = i % 4 === 0;
    const sizeMultiplier = isBigLayer ? 1.35 : 1;

    // Center of the cell, then jitter by ±40% of cell size inside the cell
    const centerX = col * cellW + cellW / 2;
    const centerY = row * cellH + cellH / 2;
    const x = centerX + (Math.random() - 0.5) * cellW * 0.8;
    const y = centerY + (Math.random() - 0.5) * cellH * 0.8;

    return {
      id: i,
      Icon: ICONS[i % ICONS.length],
      color: THEME_COLORS[i % THEME_COLORS.length],
      size: (Math.random() * (baseSize * 0.5) + (baseSize * 0.6)) * sizeMultiplier,
      x,
      y,
      duration: (Math.random() * 18 + 24) * (isBigLayer ? 1.4 : 1),
      delay: Math.random() * -26,
      parallaxFactor: (Math.random() * 0.45 + 0.15) * (Math.random() > 0.5 ? 1 : -1),
      driftY: 50 + Math.random() * 55,
      driftX: 22 + Math.random() * 32,
      tiltDeg: 7 + Math.random() * 9,
      isBigLayer,
    };
  });
};

function FloatingShape({ shape, isLanding, springX, springY, opacity }) {
  const Icon = shape.Icon;
  // Parallax only on the landing page — keeps dashboards calm
  const moveX = useTransform(springX, (val) => isLanding ? val * shape.parallaxFactor : 0);
  const moveY = useTransform(springY, (val) => isLanding ? val * shape.parallaxFactor : 0);

  // The "big-layer" shapes sit slightly more visible to anchor the depth
  const finalOpacity = shape.isBigLayer ? opacity * 1.15 : opacity * 0.85;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${shape.x}vw`,
        top: `${shape.y}vh`,
        color: shape.color,
        opacity: finalOpacity,
        x: moveX,
        y: moveY,
      }}
      animate={{
        y: [0, -shape.driftY, 0],
        x: [0, shape.driftX, 0],
        rotate: [0, shape.tiltDeg, -shape.tiltDeg / 2, 0],
      }}
      transition={{
        duration: shape.duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: shape.delay,
      }}
    >
      <Icon size={shape.size} strokeWidth={1} />
    </motion.div>
  );
}

function GlowingOrb({ isLanding, springX, springY, className, animate, transition, parallaxFactor }) {
  const moveX = useTransform(springX, (v) => isLanding ? v * parallaxFactor : 0);
  const moveY = useTransform(springY, (v) => isLanding ? v * parallaxFactor : 0);

  if (!isLanding) return null;

  return (
    <motion.div
      className={className}
      animate={animate}
      transition={transition}
      style={{ x: moveX, y: moveY }}
    />
  );
}

export default function AnimatedBackground() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  // Skip the heavy background on auth-style routes that already have their own
  // brand panel (login/register are outside MainLayout, but keep this just in case).
  const isAuth = location.pathname === '/login' || location.pathname === '/register';

  const [shapes, setShapes] = useState([]);

  useEffect(() => {
    if (isAuth) return;
    // Field density — chosen to populate every grid cell so no part of the
    // viewport ever feels empty. Landing uses a 6×4 grid (24 cells),
    // other pages use a 5×4 grid (20 cells).
    const count = isLanding ? 24 : 20;
    setShapes(generateShapes(count, isLanding));
  }, [isLanding, isAuth]);

  // Parallax tracking — only used on the landing page
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 35, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 35, damping: 25 });

  useEffect(() => {
    if (!isLanding) return;
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(nx * 40);
      mouseY.set(ny * 40);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLanding, mouseX, mouseY]);

  if (isAuth) return null;

  // Visible enough to give the page real character, still restrained enough
  // that text & UI never have to fight it for attention
  const iconOpacity = isLanding ? 0.11 : 0.09;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-surface-50">
      {/* Warm parchment gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-[#f5f0e8] to-surface-100" />

      {/* Floating courtroom icons */}
      {shapes.map((shape) => (
        <FloatingShape
          key={shape.id}
          shape={shape}
          isLanding={isLanding}
          springX={springX}
          springY={springY}
          opacity={iconOpacity}
        />
      ))}

      {/* Deep navy glow — top left (landing only) */}
      <GlowingOrb
        isLanding={isLanding}
        springX={springX}
        springY={springY}
        parallaxFactor={-0.7}
        className="absolute top-[10%] left-[15%] w-[35vw] h-[35vw] bg-[#1e3a5f] rounded-full blur-[120px] opacity-[0.08] mix-blend-multiply"
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Warm brass glow — bottom right (landing only) */}
      <GlowingOrb
        isLanding={isLanding}
        springX={springX}
        springY={springY}
        parallaxFactor={0.6}
        className="absolute bottom-[15%] right-[20%] w-[28vw] h-[28vw] bg-[#c8a84e] rounded-full blur-[130px] opacity-[0.06] mix-blend-multiply"
        animate={{ scale: [1, 1.25, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Walnut wood glow — center (landing only) */}
      <GlowingOrb
        isLanding={isLanding}
        springX={springX}
        springY={springY}
        parallaxFactor={0.3}
        className="absolute top-[45%] right-[35%] w-[22vw] h-[22vw] bg-[#8b5e34] rounded-full blur-[100px] opacity-[0.05] mix-blend-multiply"
        animate={{ scale: [1, 1.3, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />

      {/* Subtle architectural arch pattern on inner pages */}
      {!isLanding && (
        <div className="absolute inset-0 bg-arch-pattern opacity-25 mix-blend-multiply" />
      )}
    </div>
  );
}
