import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';

const STORAGE_KEY = 'lexium_user';
const TOKEN_KEY = 'auth_token';
const ADMIN_TOKEN_KEY = 'admin_token';

/**
 * Login via Firebase → then fetch real role/status from MongoDB.
 * Returns { user, token, status } where status is the provider approval status.
 */
export async function login(email, password) {
  if (!email || !password) throw new Error('Email and password are required');

  // 1. Authenticate with Firebase
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = cred.user;
  const token = await firebaseUser.getIdToken();

  // 2. Store token for API calls
  localStorage.setItem(TOKEN_KEY, token);

  // 3. Sync with backend (creates user if needed) and get MongoDB status
  let mongoUser;
  try {
    // First sync
    await api.post('/auth/sync', { firebase_uid: firebaseUser.uid, email: firebaseUser.email });
    // Then get status
    mongoUser = await api.get('/auth/status');
  } catch (e) {
    // Fallback if backend is down — use basic firebase info
    mongoUser = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || email.split('@')[0],
      email: firebaseUser.email,
      role: 'citizen',
      status: 'active',
    };
  }

  const user = {
    id: mongoUser.id || firebaseUser.uid,
    firebase_uid: firebaseUser.uid,
    name: mongoUser.name || firebaseUser.displayName || email.split('@')[0],
    email: mongoUser.email || firebaseUser.email,
    role: mongoUser.role || 'citizen',
    status: mongoUser.status || 'active',
    phone: mongoUser.phone || '',
    avatar_url: mongoUser.avatar_url || firebaseUser.photoURL,
    rejection_reason: mongoUser.rejection_reason || null,
    provider: mongoUser.provider || null,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { user, token };
}

/**
 * Register a citizen — creates Firebase account + syncs to MongoDB.
 * Citizen accounts are immediately active.
 */
export async function registerCitizen({ name, email, password, phone }) {
  if (!name || !email || !password) throw new Error('All fields are required');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = cred.user;
  const token = await firebaseUser.getIdToken();
  localStorage.setItem(TOKEN_KEY, token);

  // Sync with backend
  try {
    await api.post('/auth/sync', {
      firebase_uid: firebaseUser.uid,
      name,
      email: firebaseUser.email,
      phone: phone || '',
      role: 'citizen',
    });
  } catch (e) {
    console.error('Backend sync failed:', e);
  }

  const user = {
    id: firebaseUser.uid,
    firebase_uid: firebaseUser.uid,
    name,
    email: firebaseUser.email,
    role: 'citizen',
    status: 'active',
    phone: phone || '',
    avatar_url: null,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { user, token };
}

/**
 * Register a provider — creates Firebase account + submits full onboarding data.
 * Provider accounts start as 'pending' — NOT immediately active.
 */
export async function registerProvider(onboardingData) {
  const { name, email, password, phone } = onboardingData;
  if (!name || !email || !password) throw new Error('All fields are required');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = cred.user;
  const token = await firebaseUser.getIdToken();
  localStorage.setItem(TOKEN_KEY, token);

  // Sync with backend — send all onboarding fields
  try {
    await api.post('/auth/sync', {
      firebase_uid: firebaseUser.uid,
      name,
      email: firebaseUser.email,
      phone: phone || '',
      role: 'provider',
      service_type: onboardingData.serviceType || onboardingData.service_type || 'advocate',
      specialization: onboardingData.specialization || '',
      bar_council_id: onboardingData.barCouncilId || onboardingData.bar_council_id || '',
      location: onboardingData.location || '',
      experience: onboardingData.experience || '0',
      bio: onboardingData.bio || '',
      price_range: onboardingData.priceRange || onboardingData.price_range || '',
      consultation_fee: onboardingData.consultationFee || onboardingData.consultation_fee || 0,
      languages: onboardingData.languages || [],
      availability: onboardingData.availability || '',
      verification_documents: onboardingData.verificationDocuments || [],
      government_id: onboardingData.governmentId || null,
      profile_photo: onboardingData.profilePhoto || null,
    });
  } catch (e) {
    console.error('Backend sync failed:', e);
  }

  const user = {
    id: firebaseUser.uid,
    firebase_uid: firebaseUser.uid,
    name,
    email: firebaseUser.email,
    role: 'provider',
    status: 'pending',  // Provider starts as pending
    phone: phone || '',
    avatar_url: null,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { user, token };
}

/**
 * Admin login — bypasses Firebase, goes directly to MongoDB.
 */
export async function adminLogin(email, password) {
  if (!email || !password) throw new Error('Email and password are required');

  const response = await api.post('/admin/login', { email, password });

  const user = response.user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(ADMIN_TOKEN_KEY, response.token);

  return { user, token: response.token };
}

/**
 * Logout — clears Firebase + localStorage.
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    // Admin accounts don't have Firebase sessions — that's fine
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Returns the currently stored user, or null.
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch fresh user status from MongoDB.
 */
export async function fetchUserStatus() {
  try {
    return await api.get('/auth/status');
  } catch {
    return null;
  }
}
