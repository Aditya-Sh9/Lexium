import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface-50 pt-32 pb-20 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[800px] mx-auto bg-white rounded-3xl p-10 md:p-16 border border-surface-200 shadow-diffused relative overflow-hidden">
        <div className="absolute inset-0 bg-arch-pattern opacity-5 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl text-surface-900 mb-8">Privacy Policy</h1>
          <p className="font-sans text-surface-500 text-sm tracking-widest uppercase mb-12">Last Updated: October 2026</p>
          
          <div className="space-y-8 font-sans text-surface-700 leading-relaxed">
            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">1. Data Collection</h2>
              <p>We collect information necessary to provide our matchmaking services, including but not limited to identity documents (for providers), contact details, and platform usage metrics. All data is encrypted at rest and in transit.</p>
            </section>
            
            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">2. Use of Information</h2>
              <p>Your information is used strictly to facilitate legal appointments, verify credentials, and ensure the security of the Lexium platform. We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-surface-900 mb-4">3. Client-Attorney Privilege</h2>
              <p>Communications made through the platform prior to the formal establishment of an attorney-client relationship may not be protected by privilege. We advise users to share sensitive information only during secure, formal consultations.</p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
