import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';

const STORAGE_KEY = 'lexium_user';
const TOKEN_KEY = 'auth_token';
const ADMIN_TOKEN_KEY = 'admin_token';

/**
 * Registration is two steps (Firebase account, then Lexium record). If the
 * second fails, remove the Firebase account so the person can simply retry
 * with the same email instead of being stuck with a half-created login.
 */
async function rollbackFirebaseUser(firebaseUser) {
  try {
    await deleteUser(firebaseUser);
  } catch {
    await signOut(auth).catch(() => {});
  }
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Login via Firebase → then fetch real role/status from MongoDB.
 * Returns { user, token, status } where status is the provider approval status.
 */
export async function login(email, password, { remember = true } = {}) {
  if (!email || !password) throw new Error('Email and password are required');

  // "Keep me signed in": survive browser restarts, or end with the tab session.
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

  // 1. Authenticate with Firebase
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = cred.user;
  const token = await firebaseUser.getIdToken();

  // 2. Store token for API calls
  localStorage.setItem(TOKEN_KEY, token);

  // 3. Sync with backend (creates user if needed) and get MongoDB status
  // Role and approval status only exist in MongoDB, so a login can't complete
  // without them — guessing "citizen" would misroute providers and admins.
  let mongoUser;
  try {
    await api.post('/auth/sync', { email: firebaseUser.email });
    mongoUser = await api.get('/auth/status');
  } catch (e) {
    await signOut(auth).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    throw new Error(e.message || 'We could not load your account. Please try again.', { cause: e });
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
      name,
      email: firebaseUser.email,
      phone: phone || '',
      role: 'citizen',
    });
  } catch (e) {
    await rollbackFirebaseUser(firebaseUser);
    throw new Error(`We couldn't finish creating your account: ${e.message}`, { cause: e });
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
    await rollbackFirebaseUser(firebaseUser);
    throw new Error(`Your application wasn't submitted: ${e.message}`, { cause: e });
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
  // Make sure no Firebase session lingers, or its token would be sent instead.
  await signOut(auth).catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(ADMIN_TOKEN_KEY, response.token);

  return { user, token: response.token };
}

/**
 * Logout — clears Firebase + localStorage.
 */
export async function logout({ revoke = true } = {}) {
  // Revoke the admin token server-side so it can't be reused after sign-out.
  if (revoke && localStorage.getItem(ADMIN_TOKEN_KEY)) {
    await api.post('/admin/logout').catch(() => {});
  }
  try {
    await signOut(auth);
  } catch {
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
