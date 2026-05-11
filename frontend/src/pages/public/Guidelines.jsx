import { motion } from 'framer-motion';

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-surface-50 pt-32 pb-20 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[800px] mx-auto bg-white rounded-3xl p-10 md:p-16 border border-surface-200 shadow-diffused relative overflow-hidden">
        <div className="absolute inset-0 bg-arch-pattern opacity-5 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl text-surface-900 mb-8">Community Guidelines</h1>
          
          <div className="space-y-8 font-sans text-surface-700 leading-relaxed">
            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">Respect and Professionalism</h2>
              <p>All interactions on Lexium must remain professional, respectful, and strictly related to the legal matters at hand. Harassment, discrimination, or abusive language will result in immediate suspension.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">Honesty in Reviews</h2>
              <p>Citizens are encouraged to leave honest, constructive reviews for providers. Fraudulent reviews or malicious ratings designed to harm a professional's reputation are strictly prohibited.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">Provider Obligations</h2>
              <p>Providers must honor their commitments, communicate clearly about fees upfront, and maintain the highest standards of the legal profession.</p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
