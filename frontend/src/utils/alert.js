import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

// Configured SweetAlert instance matching the theme
export const themeAlert = Swal.mixin({
  customClass: {
    popup: 'bg-[#faf8f5] rounded-xl shadow-diffused border border-[#e8e2d8]',
    title: 'text-[#1a2f4b] font-heading text-2xl',
    htmlContainer: 'text-[#504538] font-sans',
    confirmButton: 'bg-[#1e3a5f] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#152640] transition-colors',
    cancelButton: 'bg-transparent text-[#504538] border border-[#d4cbbf] px-6 py-2 rounded-lg font-medium hover:bg-[#f3efe8] transition-colors ml-3'
  },
  buttonsStyling: false,
  confirmButtonColor: '#1e3a5f',
  cancelButtonColor: 'transparent',
  background: '#faf8f5'
});

// Toast configuration matching the theme
export const themeToast = {
  success: (message) => toast.success(message, {
    style: {
      border: '1px solid #d4cbbf',
      padding: '12px 16px',
      color: '#1a2f4b',
      background: '#faf8f5',
      fontFamily: '"Inter", sans-serif',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px'
    },
    iconTheme: {
      primary: '#2c5282',
      secondary: '#faf8f5',
    },
  }),
  error: (message) => toast.error(message, {
    style: {
      border: '1px solid #fecaca',
      padding: '12px 16px',
      color: '#991b1b',
      background: '#fef2f2',
      fontFamily: '"Inter", sans-serif',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px'
    },
    iconTheme: {
      primary: '#dc2626',
      secondary: '#fef2f2',
    },
  }),
  loading: (message) => toast.loading(message, {
    style: {
      border: '1px solid #d4cbbf',
      padding: '12px 16px',
      color: '#504538',
      background: '#faf8f5',
      fontFamily: '"Inter", sans-serif',
      borderRadius: '8px'
    }
  })
};

// Also export the standard toast to allow custom usage if needed
export { toast };
