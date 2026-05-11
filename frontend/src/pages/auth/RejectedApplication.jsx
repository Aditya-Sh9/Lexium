import { useAuth } from '../../context/AuthContext';
import { Scale, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function RejectedApplication() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-[20px] rounded-2xl p-10 border border-white/60 shadow-[0_30px_60px_-15px_rgba(15,27,45,0.08)] text-center animate-slide-up">
        <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100 mb-6">
          <XCircle size={32} className="text-red-600" />
        </div>
        
        <h1 className="font-heading text-3xl text-surface-900 mb-3">Application Rejected</h1>
        
        <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 mb-8 text-left">
          <p className="font-sans text-sm text-surface-600 mb-2">
            Dear {user?.name || 'Applicant'},
          </p>
          <p className="font-sans text-sm text-surface-600 leading-relaxed mb-4">
            After careful review of your professional details and verification documents, we regret to inform you that your application to join the Lexium marketplace has been rejected.
          </p>
          
          <div className="bg-white border border-red-100 rounded-lg p-4">
            <span className="block text-xs font-bold uppercase tracking-widest text-red-800 mb-1">Reason for Rejection:</span>
            <p className="text-sm text-surface-700 italic">
              "{user?.rejection_reason || 'Application does not meet platform requirements at this time.'}"
            </p>
          </div>
          
          <p className="font-sans text-xs text-surface-500 mt-4">
            Please note that this decision is final and you cannot re-apply at this time.
          </p>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-surface-100 text-surface-700 font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-surface-200 active:scale-[0.98] transition-all cursor-pointer border border-surface-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
