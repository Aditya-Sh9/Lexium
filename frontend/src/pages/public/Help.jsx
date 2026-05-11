import { motion } from 'framer-motion';
import { HelpCircle, FileText, MessageSquare } from 'lucide-react';

export default function Help() {
  return (
    <div className="min-h-screen bg-surface-50 pt-32 pb-20 px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-heading text-5xl md:text-6xl text-surface-900 mb-6">Help Center</h1>
          <p className="font-sans text-lg text-surface-600 max-w-2xl mx-auto">
            How can we assist you today? Find answers to common questions or get in touch with our support team.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-8 border border-surface-200 shadow-sm text-center">
            <HelpCircle size={32} className="mx-auto text-primary-600 mb-4" />
            <h3 className="font-heading text-xl text-surface-900 mb-2">FAQ</h3>
            <p className="font-sans text-sm text-surface-600">Quick answers to common questions about booking and services.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-8 border border-surface-200 shadow-sm text-center">
            <FileText size={32} className="mx-auto text-primary-600 mb-4" />
            <h3 className="font-heading text-xl text-surface-900 mb-2">Documentation</h3>
            <p className="font-sans text-sm text-surface-600">Detailed guides on using the Lexium platform features.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-8 border border-surface-200 shadow-sm text-center">
            <MessageSquare size={32} className="mx-auto text-primary-600 mb-4" />
            <h3 className="font-heading text-xl text-surface-900 mb-2">Support Ticket</h3>
            <p className="font-sans text-sm text-surface-600">Need specific help? Submit a ticket to our resolution center.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
