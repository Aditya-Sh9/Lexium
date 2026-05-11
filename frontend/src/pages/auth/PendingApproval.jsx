import { Link } from 'react-router';
import { Clock, Scale, CheckCircle, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[520px] text-center">
        {/* Animated clock icon */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center animate-pulse">
            <Clock size={40} className="text-amber-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-800 border-2 border-white flex items-center justify-center">
            <Scale size={14} className="text-white" />
          </div>
        </div>

        <h1 className="font-heading text-3xl text-surface-900 mb-3">Application Under Review</h1>
        
        <p className="font-sans text-surface-600 leading-relaxed mb-8 max-w-md mx-auto">
          Your account request has been submitted successfully and is currently under review by the admin team. You will be able to access the provider dashboard once your account is approved.
        </p>

        {/* Status card */}
        <div className="bg-white/90 backdrop-blur-[20px] rounded-2xl p-6 border border-white/60 shadow-[0_20px_40px_-15px_rgba(15,27,45,0.08)] text-left mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-100">
              <CheckCircle size={18} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-sans font-medium text-surface-800">Account Created</p>
                <p className="text-xs text-surface-500">Your credentials have been securely registered</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b border-surface-100">
              <CheckCircle size={18} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-sans font-medium text-surface-800">Application Submitted</p>
                <p className="text-xs text-surface-500">All professional details have been recorded</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[18px] h-[18px] rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-sans font-medium text-amber-700">Admin Review Pending</p>
                <p className="text-xs text-surface-500">Typically takes 1-2 business days</p>
              </div>
            </div>
          </div>
        </div>

        {user && (
          <p className="text-sm text-surface-500 font-sans mb-6">
            Signed in as <strong className="text-surface-700">{user.email}</strong>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="mailto:support@lexium.in" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-surface-200 text-surface-700 font-sans text-sm rounded-xl hover:bg-surface-50 transition-colors">
            <Mail size={16} /> Contact Support
          </Link>
          <button onClick={logout} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-100 text-surface-600 font-sans text-sm rounded-xl hover:bg-surface-200 transition-colors cursor-pointer">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
