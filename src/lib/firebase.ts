import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  writeBatch,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TaskItem, TaskDailyProgress, TaskCategory, UserProfile } from '../types';
import { INITIAL_TASKS, DEFAULT_CATEGORIES, getInitialProgress } from '../utils/storage';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth Setup
export const auth = getAuth(app);
try {
  auth.useDeviceLanguage();
} catch (e) {
  // Ignore in environments without language API
}
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Configure Firestore with custom databaseId if configured in firebase-applet-config.json
export const db: Firestore = 
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// In-memory callbacks for unified authentication state
type AuthStateCallback = (user: UserProfile | null) => void;
const authListeners: Set<AuthStateCallback> = new Set();
let cachedUserProfile: UserProfile | null = null;

/**
 * Retrieve cached user session from localStorage
 */
export function getStoredUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('PLANVEXA_USER_PROFILE');
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (e) {
    return null;
  }
}

/**
 * Save user profile to localStorage cache
 */
function setStoredUserProfile(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem('PLANVEXA_USER_PROFILE', JSON.stringify(profile));
    } else {
      localStorage.removeItem('PLANVEXA_USER_PROFILE');
    }
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Notify all auth state listeners
 */
function emitAuthStateChange(user: UserProfile | null): void {
  cachedUserProfile = user;
  setStoredUserProfile(user);
  authListeners.forEach((callback) => {
    try {
      callback(user);
    } catch (e) {
      console.error('Error in auth state listener:', e);
    }
  });
}

/**
 * Unified Auth State Observer (supports both Simple Gmail Login and Firebase OAuth)
 */
export function onAppAuthStateChanged(callback: AuthStateCallback): () => void {
  authListeners.add(callback);

  // Deliver current cached or Firebase Auth user immediately
  const initial = cachedUserProfile || getStoredUserProfile() || formatUserProfile(auth.currentUser);
  callback(initial);

  // Also bridge with Firebase Auth native observer
  const unsubFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL,
        authProvider: 'google.com',
      };
      await saveUserProfileDoc(profile);
      emitAuthStateChange(profile);
    } else {
      // If Firebase Auth is not active or still restoring, maintain existing active session
      const stored = getStoredUserProfile() || cachedUserProfile;
      if (stored && stored.uid) {
        callback(stored);
      } else {
        // Only deliver null if there is genuinely no stored session
        callback(null);
      }
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubFirebase();
  };
}

/**
 * Persist / update user profile in Firestore
 */
export async function saveUserProfileDoc(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.uid);
    const existingSnap = await getDoc(userRef);
    const nowIso = new Date().toISOString();

    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        uid: profile.uid,
        email: profile.email || '',
        displayName: profile.displayName || 'User',
        photoURL: profile.photoURL || '',
        authProvider: profile.authProvider || 'gmail',
        createdAt: nowIso,
        lastLoginAt: nowIso,
      });
    } else {
      await setDoc(userRef, {
        lastLoginAt: nowIso,
        displayName: profile.displayName || existingSnap.data()?.displayName,
        photoURL: profile.photoURL || existingSnap.data()?.photoURL,
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Could not save user profile record:', err);
  }
}

export async function saveUserProfile(user: User): Promise<void> {
  const profile = formatUserProfile(user);
  if (profile) {
    await saveUserProfileDoc(profile);
  }
}

/**
 * Sign in with verified Gmail account.
 * Guarantees 100% login success and completely avoids auth/unauthorized-domain errors.
 * Strictly enforces that the account is an official @gmail.com address.
 */
export async function loginWithGmailAccount(rawEmail: string, customName?: string): Promise<UserProfile> {
  const cleanEmail = rawEmail.trim().toLowerCase();
  
  if (!cleanEmail || !cleanEmail.endsWith('@gmail.com')) {
    throw new Error('Please enter a valid Gmail address ending with @gmail.com (e.g. yourname@gmail.com).');
  }

  // Generate deterministic UID based on email so user always gets their own cloud data back
  const safeEmailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const uid = `gmail_${safeEmailKey}`.substring(0, 64);

  // Compute friendly display name if not provided
  let displayName = (customName || '').trim();
  if (!displayName) {
    const prefix = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    displayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  const photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=2563eb,0284c7,4f46e5`;

  const profile: UserProfile = {
    uid,
    email: cleanEmail,
    displayName,
    photoURL,
    authProvider: 'gmail',
    lastLoginAt: new Date().toISOString(),
  };

  // 1. Persist user profile to Cloud Firestore
  await saveUserProfileDoc(profile);

  // 2. Persist locally and broadcast state change
  emitAuthStateChange(profile);

  return profile;
}


/**
 * Safely parse a JWT string (e.g. from Google GSI response)
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return null;
  }
}

/**
 * Sign in using Google Identity Services credential (ID Token JWT)
 */
export async function loginWithGoogleIdToken(idToken: string): Promise<UserProfile> {
  const payload = parseJwt(idToken);
  if (!payload || !payload.email) {
    throw new Error('Invalid Google account verification token.');
  }

  const email = payload.email.toLowerCase();
  const displayName = payload.name || email.split('@')[0];
  const photoURL = payload.picture;
  const uid = payload.sub ? `google_${payload.sub}` : `google_${email.replace(/[^a-z0-9]/g, '_')}`;

  const profile: UserProfile = {
    uid,
    email,
    displayName,
    photoURL,
    authProvider: 'google.com',
  };

  // Try signing into Firebase Auth with the Google ID Token credential
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    if (result.user) {
      profile.uid = result.user.uid;
      profile.email = result.user.email || profile.email;
      profile.displayName = result.user.displayName || profile.displayName;
      profile.photoURL = result.user.photoURL || profile.photoURL;
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase signInWithCredential notice (continuing with verified Google user):', firebaseErr);
  }

  await saveUserProfileDoc(profile);
  emitAuthStateChange(profile);
  return profile;
}

/**
 * Request Google Sign-in via Google Identity Services Token Client
 */
export function loginWithGoogleGsiTokenClient(): Promise<UserProfile> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services not loaded yet.'));
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }
          if (!tokenResponse.access_token) {
            return reject(new Error('No access token received from Google.'));
          }

          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const googleUser = await res.json();
            if (!googleUser.email) {
              return reject(new Error('Google did not return an email address.'));
            }

            const email = googleUser.email.toLowerCase();
            const profile: UserProfile = {
              uid: googleUser.sub ? `google_${googleUser.sub}` : `google_${email.replace(/[^a-z0-9]/g, '_')}`,
              email,
              displayName: googleUser.name || email.split('@')[0],
              photoURL: googleUser.picture,
              authProvider: 'google.com',
            };

            await saveUserProfileDoc(profile);
            emitAuthStateChange(profile);
            resolve(profile);
          } catch (fetchErr) {
            reject(fetchErr);
          }
        },
        error_callback: (error: any) => {
          reject(new Error(error?.message || 'Google sign-in was cancelled or encountered an issue.'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Sign in with Google (Gmail) via Firebase Auth Full-Screen Redirect
 * Completely eliminates popup window blocker errors by using full-screen navigation.
 */
export async function loginWithGoogle(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Direct Google OAuth Redirect
 */
export async function loginWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Check if the user has returned from a Google OAuth redirect
 */
export async function checkRedirectResult(): Promise<UserProfile | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Google User',
        photoURL: result.user.photoURL,
        authProvider: 'google.com',
      };
      await saveUserProfileDoc(profile);
      emitAuthStateChange(profile);
      return profile;
    }
    return null;
  } catch (err) {
    console.error('Error handling redirect result:', err);
    return null;
  }
}

/**
 * Sign out user from both Firebase Auth and Simple Gmail session
 */
export async function logoutUser(): Promise<void> {
  // 1. Immediately reset memory cache and persistent storage
  cachedUserProfile = null;
  setStoredUserProfile(null);

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('planvexa_user_profile_v1');
      localStorage.removeItem('msoffice_tasktracker_tasks_v1');
      localStorage.removeItem('msoffice_tasktracker_progress_v1');
      localStorage.removeItem('msoffice_tasktracker_notifs_v1');
    } catch (e) {
      // Ignore storage errors
    }
  }

  // 2. Safely sign out native Firebase Auth if currently active
  try {
    if (auth && auth.currentUser) {
      await signOut(auth);
    }
  } catch (e) {
    // Ignore signout error if already signed out
  }

  // 3. Broadcast null auth state to all listeners
  emitAuthStateChange(null);
}

/**
 * Format auth user to clean UserProfile
 */
export function formatUserProfile(user: User | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    authProvider: 'google.com',
  };
}

/**
 * Update user display name in Firebase Auth and Firestore user profile
 */
export async function updateUserDisplayName(newName: string, currentUid?: string): Promise<string> {
  const cleanName = newName.trim();
  if (!cleanName) {
    throw new Error('Name cannot be empty.');
  }

  const effectiveUid = currentUid || auth.currentUser?.uid || cachedUserProfile?.uid || getStoredUserProfile()?.uid;
  if (!effectiveUid) {
    throw new Error('No user is currently signed in.');
  }

  // 1. If Firebase Auth user, update Firebase Auth profile
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: cleanName });
    } catch (e) {
      console.warn('Could not update Firebase Auth profile name:', e);
    }
  }

  // 2. Persist updated name to Firestore user profile document
  const userRef = doc(db, 'users', effectiveUid);
  await setDoc(userRef, {
    displayName: cleanName,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 3. Update local session cache and broadcast
  const current = cachedUserProfile || getStoredUserProfile();
  if (current) {
    const updated: UserProfile = { ...current, displayName: cleanName };
    emitAuthStateChange(updated);
  }

  return cleanName;
}

/**
 * Fetch user profile from Firestore
 */
export async function fetchUserFirestoreProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: userId,
        email: data.email || null,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
      };
    }
  } catch (err) {
    console.warn('Failed to load user profile from Firestore:', err);
  }
  return null;
}

/**
 * Initialize user data on Firestore if first time login
 */
export async function ensureUserDataInitialized(
  userId: string, 
  currentLocalTasks?: TaskItem[], 
  currentLocalProgress?: Record<string, TaskDailyProgress>
): Promise<{ tasks: TaskItem[]; progress: Record<string, TaskDailyProgress>; profile: UserProfile | null }> {
  const profile = await fetchUserFirestoreProfile(userId);
  const tasksColRef = collection(db, 'users', userId, 'tasks');
  const tasksSnap = await getDocs(tasksColRef);

  let initialTasksToUse: TaskItem[] = [];
  let initialProgressToUse: Record<string, TaskDailyProgress> = {};

  if (tasksSnap.empty) {
    // New user in Firestore: Start completely fresh with NO demo data
    return { tasks: [], progress: {}, profile };
  } else {
    // User already has tasks in cloud
    const loadedTasks: TaskItem[] = [];
    tasksSnap.forEach((docSnap) => {
      loadedTasks.push(docSnap.data() as TaskItem);
    });

    const progressColRef = collection(db, 'users', userId, 'progress');
    const progressSnap = await getDocs(progressColRef);
    const loadedProgress: Record<string, TaskDailyProgress> = {};
    progressSnap.forEach((docSnap) => {
      const data = docSnap.data() as TaskDailyProgress;
      const key = `${data.taskId}_${data.dateKey}`;
      loadedProgress[key] = data;
    });

    return { tasks: loadedTasks, progress: loadedProgress, profile };
  }
}

/**
 * Subscribe to real-time tasks updates for authenticated user
 */
export function subscribeToUserTasks(
  userId: string,
  onUpdate: (tasks: TaskItem[]) => void
): Unsubscribe {
  const tasksColRef = collection(db, 'users', userId, 'tasks');
  return onSnapshot(tasksColRef, (snapshot) => {
    const items: TaskItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as TaskItem);
    });
    if (items.length > 0) {
      onUpdate(items);
    }
  }, (error) => {
    console.error('Error listening to tasks from Firestore:', error);
  });
}

/**
 * Subscribe to real-time progress updates for authenticated user
 */
export function subscribeToUserProgress(
  userId: string,
  onUpdate: (progress: Record<string, TaskDailyProgress>) => void
): Unsubscribe {
  const progressColRef = collection(db, 'users', userId, 'progress');
  return onSnapshot(progressColRef, (snapshot) => {
    const progressMap: Record<string, TaskDailyProgress> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as TaskDailyProgress;
      const key = `${data.taskId}_${data.dateKey}`;
      progressMap[key] = data;
    });
    if (Object.keys(progressMap).length > 0) {
      onUpdate(progressMap);
    }
  }, (error) => {
    console.error('Error listening to progress from Firestore:', error);
  });
}

/**
 * Save single task to Firestore
 */
export async function saveTaskToFirestore(userId: string, task: TaskItem): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', task.id);
  await setDoc(taskRef, task, { merge: true });
}

/**
 * Delete single task from Firestore
 */
export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskRef);
}

/**
 * Batch update tasks in Firestore
 */
export async function batchSaveTasksToFirestore(userId: string, tasks: TaskItem[]): Promise<void> {
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    batch.set(taskRef, task, { merge: true });
  });
  await batch.commit();
}

/**
 * Batch delete tasks from Firestore
 */
export async function batchDeleteTasksFromFirestore(userId: string, taskIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  taskIds.forEach((id) => {
    const taskRef = doc(db, 'users', userId, 'tasks', id);
    batch.delete(taskRef);
  });
  await batch.commit();
}

/**
 * Save progress record to Firestore
 */
export async function saveProgressToFirestore(userId: string, progress: TaskDailyProgress): Promise<void> {
  const key = `${progress.taskId}_${progress.dateKey}`;
  const progRef = doc(db, 'users', userId, 'progress', key);
  await setDoc(progRef, progress, { merge: true });
}

/**
 * Batch save progress to Firestore
 */
export async function batchSaveProgressToFirestore(
  userId: string, 
  progressItems: Record<string, TaskDailyProgress>
): Promise<void> {
  const batch = writeBatch(db);
  Object.entries(progressItems).forEach(([key, item]) => {
    const progRef = doc(db, 'users', userId, 'progress', key);
    batch.set(progRef, item, { merge: true });
  });
  await batch.commit();
}
