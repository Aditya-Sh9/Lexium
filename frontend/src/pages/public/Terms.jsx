import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="min-h-screen bg-surface-50 pt-32 pb-20 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[800px] mx-auto bg-white rounded-3xl p-10 md:p-16 border border-surface-200 shadow-diffused relative overflow-hidden">
        <div className="absolute inset-0 bg-arch-pattern opacity-5 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl text-surface-900 mb-8">Terms of Service</h1>
          <p className="font-sans text-surface-500 text-sm tracking-widest uppercase mb-12">Last Updated: October 2026</p>
          
          <div className="space-y-8 font-sans text-surface-700 leading-relaxed">
            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using the Lexium platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">2. Professional Conduct</h2>
              <p>All legal professionals registered on the platform must hold valid credentials from their respective Bar Councils or regulatory bodies. Any misrepresentation will lead to immediate account termination.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">3. User Responsibilities</h2>
              <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. The platform is not liable for unauthorized access resulting from user negligence.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">4. Limitation of Liability</h2>
              <p>Lexium serves solely as an intermediary matching platform. We do not provide legal advice, and no attorney-client relationship is formed through the use of the platform itself.</p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
