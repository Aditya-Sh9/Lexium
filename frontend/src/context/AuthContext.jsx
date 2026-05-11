import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages auth state globally.
 *
 * Auth architecture:
 * - Firebase handles ONLY email/password authentication
 * - MongoDB is the single source of truth for roles, status, and profiles
 * - Admin accounts bypass Firebase entirely
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();

    if (storedUser?.role === 'admin') {
      // Admin sessions don't use Firebase — just restore from localStorage
      setUser(storedUser);
      setLoading(false);
      return;
    }

    // Firebase session listener for citizen/provider
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      import('../config/firebase').then(({ auth }) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Firebase is logged in — get the real profile from MongoDB
            try {
              const mongoUser = await authService.fetchUserStatus();
              if (mongoUser && !mongoUser.error) {
                const fullUser = {
                  id: mongoUser.id || firebaseUser.uid,
                  firebase_uid: firebaseUser.uid,
                  name: mongoUser.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
                  email: mongoUser.email || firebaseUser.email,
                  role: mongoUser.role || 'citizen',
                  status: mongoUser.status || 'active',
                  phone: mongoUser.phone || '',
                  avatar_url: mongoUser.avatar_url || firebaseUser.photoURL,
                  rejection_reason: mongoUser.rejection_reason || null,
                  provider: mongoUser.provider || null,
                };
                setUser(fullUser);
                localStorage.setItem('lexium_user', JSON.stringify(fullUser));
              } else {
                // Fallback to stored user
                if (storedUser && storedUser.email === firebaseUser.email) {
                  setUser(storedUser);
                } else {
                  setUser({
                    id: firebaseUser.uid,
                    firebase_uid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    email: firebaseUser.email,
                    role: 'citizen',
                    status: 'active',
                  });
                }
              }
            } catch {
              // Backend unreachable — use stored user
              if (storedUser) {
                setUser(storedUser);
              }
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      });
    });
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    return result;
  };

  const registerCitizen = async (data) => {
    const result = await authService.registerCitizen(data);
    setUser(result.user);
    return result;
  };

  const registerProvider = async (data) => {
    const result = await authService.registerProvider(data);
    setUser(result.user);
    return result;
  };

  const adminLogin = async (email, password) => {
    const result = await authService.adminLogin(email, password);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // Refresh user status from MongoDB (useful after admin approves)
  const refreshStatus = async () => {
    try {
      const status = await authService.fetchUserStatus();
      if (status && !status.error) {
        const updated = { ...user, ...status };
        setUser(updated);
        localStorage.setItem('lexium_user', JSON.stringify(updated));
      }
    } catch {}
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPendingProvider: user?.role === 'provider' && user?.status === 'pending',
    isRejectedProvider: user?.role === 'provider' && user?.status === 'rejected',
    isApprovedProvider: user?.role === 'provider' && (user?.status === 'approved' || user?.status === 'active'),
    login,
    registerCitizen,
    registerProvider,
    adminLogin,
    logout,
    refreshStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
