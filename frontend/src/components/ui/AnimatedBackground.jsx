import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { useLocation } from 'react-router';
import { Scale, Landmark, Shield, BookOpen, FileText, Award } from 'lucide-react';

const ICONS = [Scale, Landmark, Shield, BookOpen, FileText, Award];

// Courtroom theme palette — muted navy, parchment, walnut, brass tones
const THEME_COLORS = [
  '#2c5282', // navy blue
  '#1e3a5f', // deep navy
  '#8b5e34', // walnut brown
  '#c8a84e', // brass gold
  '#6b4423', // dark walnut
  '#4e729e', // steel blue
  '#d4a85a', // warm gold
  '#504538', // dark parchment
];

const generateShapes = (count, isLanding) => {
  return Array.from({ length: count }).map((_, i) => {
    const baseSize = isLanding ? 90 : 45;
    
    return {
      id: i,
      Icon: ICONS[i % ICONS.length],
      color: THEME_COLORS[i % THEME_COLORS.length],
      size: Math.random() * (baseSize * 0.7) + (baseSize * 0.4),
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      duration: Math.random() * 20 + 28,
      delay: Math.random() * -20,
      parallaxFactor: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
    };
  });
};

function FloatingShape({ shape, isLanding, springX, springY }) {
  const Icon = shape.Icon;
  const moveX = useTransform(springX, (val) => isLanding ? val * shape.parallaxFactor : 0);
  const moveY = useTransform(springY, (val) => isLanding ? val * shape.parallaxFactor : 0);

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${shape.x}vw`,
        top: `${shape.y}vh`,
        color: shape.color,
        opacity: isLanding ? 0.045 : 0.02,
        x: moveX,
        y: moveY,
      }}
      animate={{
        y: [0, -35, 0],
        x: [0, 15, 0],
        rotate: [0, 8, -4, 0],
      }}
      transition={{
        duration: shape.duration,
        repeat: Infinity,
        ease: "linear",
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
  const isDashboard = location.pathname.includes('/dashboard') || location.pathname.includes('/provider') || location.pathname.includes('/citizen');
  
  const [shapes, setShapes] = useState([]);

  useEffect(() => {
    const count = isLanding ? 12 : isDashboard ? 4 : 7;
    setShapes(generateShapes(count, isLanding));
  }, [isLanding, isDashboard]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 35, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 35, damping: 25 });

  useEffect(() => {
    if (!isLanding) return;

    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(nx * 35);
      mouseY.set(ny * 35);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLanding, mouseX, mouseY]);

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
        />
      ))}

      {/* Deep navy glow — top left */}
      <GlowingOrb
        isLanding={isLanding}
        springX={springX}
        springY={springY}
        parallaxFactor={-0.7}
        className="absolute top-[10%] left-[15%] w-[35vw] h-[35vw] bg-[#1e3a5f] rounded-full blur-[120px] opacity-[0.08] mix-blend-multiply"
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Warm brass glow — bottom right */}
      <GlowingOrb
        isLanding={isLanding}
        springX={springX}
        springY={springY}
        parallaxFactor={0.6}
        className="absolute bottom-[15%] right-[20%] w-[28vw] h-[28vw] bg-[#c8a84e] rounded-full blur-[130px] opacity-[0.06] mix-blend-multiply"
        animate={{ scale: [1, 1.25, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Walnut wood glow — center */}
      <GlowingOrb
        isLanding={isLanding}
        springX={springX}
        springY={springY}
        parallaxFactor={0.3}
        className="absolute top-[45%] right-[35%] w-[22vw] h-[22vw] bg-[#8b5e34] rounded-full blur-[100px] opacity-[0.05] mix-blend-multiply"
        animate={{ scale: [1, 1.3, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />

      {/* Subtle arch pattern overlay on inner pages */}
      {!isLanding && (
        <div className="absolute inset-0 bg-arch-pattern opacity-25 mix-blend-multiply" />
      )}
    </div>
  );
}
