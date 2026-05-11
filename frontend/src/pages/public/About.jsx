import { motion } from 'framer-motion';
import { Scale, Users, ShieldCheck, ChevronRight } from 'lucide-react';

export default function About() {
  const steps = [
    { icon: Users, title: 'Connect', description: 'Find certified legal professionals across the nation using our intelligent matching system.' },
    { icon: Scale, title: 'Consult', description: 'Book secure consultations and resolve legal matters efficiently with expert guidance.' },
    { icon: ShieldCheck, title: 'Resolve', description: 'Experience transparent, secure, and legally binding resolutions through the digital framework.' }
  ];

  return (
    <div className="min-h-screen bg-surface-50 pt-32 pb-20 px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-heading text-5xl md:text-6xl text-surface-900 mb-6">How It Works</h1>
          <p className="font-sans text-lg text-surface-600 max-w-2xl mx-auto">
            Lexium bridges the gap between citizens and legal experts. Our platform streamlines the journey from finding the right professional to resolving your legal matters.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
              className="bg-white rounded-2xl p-8 border border-surface-200 shadow-diffused relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-50 rounded-full opacity-50 blur-xl"></div>
              <div className="w-14 h-14 bg-primary-100 text-primary-800 rounded-xl flex items-center justify-center mb-6">
                <step.icon size={28} />
              </div>
              <h3 className="font-heading text-2xl text-surface-900 mb-3">{step.title}</h3>
              <p className="font-sans text-surface-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-primary-900 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-arch-pattern opacity-10"></div>
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-6 relative z-10">Ready to seek legal guidance?</h2>
          <a href="/providers" className="inline-flex items-center gap-2 bg-brass-gradient text-primary-950 px-8 py-4 rounded-xl font-sans font-bold uppercase tracking-wider hover:opacity-90 transition-opacity relative z-10">
            Browse Providers <ChevronRight size={18} />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
