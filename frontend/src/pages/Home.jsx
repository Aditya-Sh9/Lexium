import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Scale,
  Briefcase,
  FileCheck,
  Award,
  Star,
  Gavel,
  BookOpen,
  Globe,
  TrendingUp,
  Clock,
  Heart,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: '500+', label: 'Verified Professionals', icon: Shield },
  { value: '10,000+', label: 'Cases Handled', icon: Briefcase },
  { value: '25+', label: 'Cities Covered', icon: Globe },
  { value: '4.8', label: 'Average Rating', icon: Star },
];

const howItWorks = [
  {
    icon: BookOpen,
    title: 'Create Your Account',
    description: 'Sign up as a citizen or legal professional. Get verified and gain access to our trusted network.',
  },
  {
    icon: Scale,
    title: 'Book a Consultation',
    description: 'Browse verified providers in your dashboard. Select a convenient date and describe your case.',
  },
  {
    icon: Shield,
    title: 'Get Expert Help',
    description: 'Connect with your legal professional securely. Get the guidance you need with full confidentiality.',
  },
];

const serviceCategories = [
  { icon: Gavel, title: 'Advocates', desc: 'Expert legal representation in court', color: 'from-blue-500/10 to-blue-600/5' },
  { icon: Scale, title: 'Mediators', desc: 'Resolve disputes without going to court', color: 'from-amber-500/10 to-amber-600/5' },
  { icon: FileCheck, title: 'Notary Public', desc: 'Authenticate and certify documents', color: 'from-green-500/10 to-green-600/5' },
  { icon: BookOpen, title: 'Document Writers', desc: 'Professional legal drafting services', color: 'from-purple-500/10 to-purple-600/5' },
  { icon: TrendingUp, title: 'Tax Consultants', desc: 'Expert advice on tax compliance', color: 'from-rose-500/10 to-rose-600/5' },
  { icon: Shield, title: 'Arbitrators', desc: 'Binding dispute resolution services', color: 'from-cyan-500/10 to-cyan-600/5' },
];

const testimonials = [
  { name: 'Rahul M.', role: 'Business Owner', text: 'Lexium made it incredibly easy to find a corporate lawyer who understood our startup needs. Highly recommended!', rating: 5 },
  { name: 'Sneha K.', role: 'Homeowner', text: 'I needed a notary urgently for my property documents. Found one within 30 minutes of signing up. Amazing service.', rating: 5 },
  { name: 'Vikram S.', role: 'IT Professional', text: 'The mediation service helped resolve a long-standing dispute with my landlord. Saved us both time and money.', rating: 4 },
];

// Floating icon component for hero animation
function FloatingIcon({ icon: Icon, delay, x, y, size = 20, color = 'text-primary-300/30' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 1, 1, 0], y: [20, 0, -10, -20], x: [0, 5, -5, 0] }}
      transition={{ duration: 6, delay, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
      className={`absolute ${color} pointer-events-none`}
      style={{ left: x, top: y }}
    >
      <Icon size={size} />
    </motion.div>
  );
}

// Counter animation
function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, numericValue]);

  return <span ref={ref}>{isInView ? `${count.toLocaleString()}${suffix}` : '0'}</span>;
}

// Section fade-in wrapper
function FadeInSection({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <div>
      {/* ───── Hero Section ───── */}
      <header className="relative pt-40 pb-32 px-4 sm:px-6 lg:px-8 min-h-[95vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Floating legal icons */}
        <FloatingIcon icon={Scale} delay={0} x="10%" y="20%" size={32} color="text-primary-300/20" />
        <FloatingIcon icon={Gavel} delay={1} x="85%" y="15%" size={28} color="text-accent-300/20" />
        <FloatingIcon icon={BookOpen} delay={2} x="15%" y="70%" size={24} color="text-accent-300/15" />
        <FloatingIcon icon={Shield} delay={0.5} x="80%" y="65%" size={30} color="text-primary-300/15" />
        <FloatingIcon icon={FileCheck} delay={1.5} x="70%" y="35%" size={22} color="text-accent-300/20" />
        <FloatingIcon icon={Star} delay={3} x="25%" y="40%" size={18} color="text-accent-300/25" />

        <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col items-center">
          {/* Animated trust pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-primary-900 text-sm mb-8 font-sans"
          >
            <Shield size={14} className="text-primary-900" />
            India's Trusted Legal Services Marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-heading text-4xl sm:text-5xl lg:text-7xl text-primary-900 max-w-5xl mb-6 leading-tight"
          >
            Justice Made{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text brass-gradient">Accessible</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent origin-left"
              />
            </span>
            {' '}for All
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-sans text-lg sm:text-xl text-surface-700 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Connect with verified advocates, mediators, notaries, and legal experts. Sign up to book appointments, compare services, and get the legal help you need — all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary-800 text-white font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-primary-900 transition-all shadow-lg hover:shadow-xl border border-accent-300/30 overflow-hidden"
            >
              <span className="relative z-10">Get Started Free</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-primary-800 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/70 backdrop-blur-sm text-primary-800 font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-white transition-all border border-surface-200 shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="text-center group"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon size={18} className="text-accent-300 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-heading font-bold text-primary-900">
                      {stat.value.includes('.') ? stat.value : (
                        <AnimatedCounter value={stat.value} suffix={stat.value.includes('+') ? '+' : ''} />
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-sans text-surface-600 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-surface-300 rounded-full flex items-start justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 bg-surface-400 rounded-full" />
          </motion.div>
        </motion.div>
      </header>

      {/* ───── Service Categories ───── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-50/60 backdrop-blur-sm relative z-10">
        <div className="max-w-[1280px] mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-accent-400 mb-4 block">Our Services</span>
              <h2 className="font-heading text-4xl text-primary-900 mb-4">
                Legal Services for Every Need
              </h2>
              <p className="font-sans text-lg text-surface-700 max-w-2xl mx-auto">
                From courtroom representation to document authentication — find the right professional for your legal needs.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <FadeInSection key={cat.title} delay={i * 0.08}>
                  <div className="group bg-white/80 backdrop-blur-md rounded-2xl p-7 border border-surface-200/80 shadow-sm hover:shadow-lg hover:border-accent-300/50 transition-all duration-300 cursor-default">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                      <Icon size={26} className="text-primary-800" />
                    </div>
                    <h3 className="font-heading text-xl text-primary-900 mb-2">{cat.title}</h3>
                    <p className="font-sans text-surface-600 text-sm leading-relaxed">{cat.desc}</p>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="bg-white/80 backdrop-blur-md border-y border-surface-200/50 py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1280px] mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-accent-400 mb-4 block">Simple Process</span>
              <h2 className="font-heading text-4xl text-primary-900 mb-4">
                How It Works
              </h2>
              <p className="font-sans text-lg text-surface-700 max-w-2xl mx-auto">
                Getting legal help has never been easier. Three simple steps to connect with the right professional.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent z-0" />

            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeInSection key={step.title} delay={i * 0.15}>
                  <div className="text-center group relative z-10">
                    <div className="relative inline-flex mb-8">
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 3 }}
                        className="w-28 h-28 rounded-2xl bg-white border border-[#D4AF37]/20 shadow-[0_20px_40px_-5px_rgba(0,35,102,0.06)] flex items-center justify-center"
                      >
                        <Icon size={36} className="text-primary-900" />
                      </motion.div>
                      <span className="absolute -top-3 -right-3 w-9 h-9 bg-[#D4AF37] text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-2xl text-primary-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="font-sans text-surface-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-50/60 backdrop-blur-sm relative z-10">
        <div className="max-w-[1280px] mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-accent-400 mb-4 block">Testimonials</span>
              <h2 className="font-heading text-4xl text-primary-900 mb-4">
                What Our Users Say
              </h2>
              <p className="font-sans text-lg text-surface-700 max-w-2xl mx-auto">
                Real experiences from citizens and professionals who trust Lexium.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <FadeInSection key={t.name} delay={i * 0.1}>
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-surface-200/80 shadow-sm hover:shadow-md transition-all relative">
                  <div className="absolute top-6 right-6 text-accent-300/20">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                  </div>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={16} className="text-accent-300 fill-accent-300" />
                    ))}
                  </div>
                  <p className="font-sans text-surface-700 leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-surface-100">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-heading text-sm font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-semibold text-surface-900">{t.name}</p>
                      <p className="font-sans text-xs text-surface-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Platform Benefits ───── */}
      <section className="bg-white/80 backdrop-blur-md border-y border-surface-200/50 py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1280px] mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-accent-400 mb-4 block">Why Lexium</span>
              <h2 className="font-heading text-4xl text-primary-900 mb-4">Built on Trust & Transparency</h2>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Verified Providers', desc: 'Every professional goes through a rigorous verification process' },
              { icon: Clock, title: 'Quick Booking', desc: 'Book appointments in minutes, not days. Get help when you need it' },
              { icon: Heart, title: 'Transparent Pricing', desc: 'Clear pricing upfront. No hidden charges or surprises' },
              { icon: Award, title: 'Incentive-Based', desc: 'Providers earn badges and rewards for exceptional service' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <FadeInSection key={b.title} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="text-center p-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-800 flex items-center justify-center mx-auto mb-5">
                      <Icon size={28} />
                    </div>
                    <h3 className="font-heading text-lg text-primary-900 mb-2">{b.title}</h3>
                    <p className="font-sans text-sm text-surface-600 leading-relaxed">{b.desc}</p>
                  </motion.div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── CTA — Join as Provider ───── */}
      <section className="bg-primary-900 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-arch-pattern opacity-10" />
        
        {/* Floating decorative elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 right-10 w-40 h-40 border border-white/5 rounded-full" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-10 left-10 w-60 h-60 border border-white/5 rounded-full" />
        
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <FadeInSection>
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-2xl shadow-2xl">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="font-heading text-4xl text-white mb-6">
                  Are You a Legal Professional?
                </h2>
                <p className="font-sans text-xl text-surface-200 mb-8 max-w-2xl">
                  Join India's fastest-growing legal marketplace. Get more clients, earn rewards, and grow your practice with our incentive-based platform.
                </p>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-surface-200 text-sm font-sans">
                  <span className="flex items-center gap-2"><CheckCircle size={18} className="text-[#D4AF37]" /> Free Registration</span>
                  <span className="flex items-center gap-2"><Award size={18} className="text-[#D4AF37]" /> Earn Badges & Rewards</span>
                  <span className="flex items-center gap-2"><Users size={18} className="text-[#D4AF37]" /> Access to 10,000+ Clients</span>
                </div>
              </div>
              <div className="shrink-0">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-primary-900 font-bold font-sans text-lg rounded-xl hover:bg-white transition-colors shadow-lg uppercase tracking-wider"
                >
                  Register as Provider
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
