import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface-50 pt-32 pb-20 px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-heading text-5xl md:text-6xl text-surface-900 mb-6">Contact Us</h1>
          <p className="font-sans text-lg text-surface-600 max-w-2xl mx-auto">
            Our support team is available to assist you with any inquiries regarding the platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-10 border border-surface-200 shadow-diffused">
            <h2 className="font-heading text-2xl text-surface-900 mb-6">Send a Message</h2>
            <form className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold text-surface-600 uppercase tracking-widest mb-1">Name</label>
                <input type="text" className="w-full bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 font-sans focus:outline-none focus:border-primary-500 transition-colors" placeholder="Your name" />
              </div>
              <div>
                <label className="block font-sans text-xs font-bold text-surface-600 uppercase tracking-widest mb-1">Email</label>
                <input type="email" className="w-full bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 font-sans focus:outline-none focus:border-primary-500 transition-colors" placeholder="Your email" />
              </div>
              <div>
                <label className="block font-sans text-xs font-bold text-surface-600 uppercase tracking-widest mb-1">Message</label>
                <textarea rows="4" className="w-full bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 font-sans focus:outline-none focus:border-primary-500 transition-colors" placeholder="How can we help?"></textarea>
              </div>
              <button type="button" className="w-full bg-primary-800 text-white font-sans font-bold uppercase tracking-wider py-4 rounded-lg hover:bg-primary-900 transition-colors">
                Submit Inquiry
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl text-surface-900 mb-1">Headquarters</h3>
                <p className="font-sans text-surface-600">Digital Chambers of Justice<br/>Sector 62, Noida<br/>Uttar Pradesh, India 201309</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl text-surface-900 mb-1">Email Support</h3>
                <p className="font-sans text-surface-600">support@lexium.in</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl text-surface-900 mb-1">Helpline</h3>
                <p className="font-sans text-surface-600">1800-LAW-CONNECT<br/>Mon-Fri, 9am - 6pm IST</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
