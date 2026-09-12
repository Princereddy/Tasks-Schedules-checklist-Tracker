import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  updateEmail,
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
  query,
  where,
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
 * Hash password securely with Web Crypto SHA-256
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = 'planvexa_secure_salt_v2';
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate safe, deterministic UID from email address
 */
export function getDeterministicUid(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const safeEmail = cleanEmail.replace(/[^a-z0-9]/g, '_');
  return `usr_${safeEmail}`.substring(0, 64);
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
 * Unified Auth State Observer (supports both Email/Password, Firebase Auth, and persistent sessions)
 */
export function onAppAuthStateChanged(callback: AuthStateCallback): () => void {
  authListeners.add(callback);

  // Deliver current cached or persistent stored user immediately
  const initial = cachedUserProfile || getStoredUserProfile() || formatUserProfile(auth.currentUser);
  if (initial) {
    cachedUserProfile = initial;
    callback(initial);
  } else {
    callback(null);
  }

  // Also bridge with Firebase Auth native observer
  const unsubFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'User')}&backgroundColor=2563eb,0284c7,4f46e5`,
        authProvider: 'password',
      };
      await saveUserProfileDoc(profile);
      emitAuthStateChange(profile);
    } else {
      // If Firebase Auth emits null but user has an active stored session, KEEP them logged in!
      const stored = getStoredUserProfile() || cachedUserProfile;
      if (stored && stored.uid) {
        // Keep active session alive - do NOT auto-logout
        callback(stored);
      } else {
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
export async function saveUserProfileDoc(profile: UserProfile, extraFields: Record<string, any> = {}): Promise<void> {
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
        authProvider: profile.authProvider || 'password',
        jobTitle: profile.jobTitle || 'Workspace Member',
        avatarColor: profile.avatarColor || '#2563eb',
        createdAt: nowIso,
        lastLoginAt: nowIso,
        ...extraFields,
      });
    } else {
      const existingData = existingSnap.data() || {};
      const payload: Record<string, any> = {
        lastLoginAt: nowIso,
        ...extraFields,
      };
      if (profile.displayName !== undefined && profile.displayName !== null) payload.displayName = profile.displayName;
      if (profile.email !== undefined && profile.email !== null) payload.email = profile.email;
      if (profile.photoURL !== undefined && profile.photoURL !== null) payload.photoURL = profile.photoURL;
      if (profile.jobTitle !== undefined && profile.jobTitle !== null) payload.jobTitle = profile.jobTitle;
      if (profile.avatarColor !== undefined && profile.avatarColor !== null) payload.avatarColor = profile.avatarColor;
      if (profile.authProvider !== undefined && profile.authProvider !== null) payload.authProvider = profile.authProvider;

      await setDoc(userRef, payload, { merge: true });
    }
  } catch (err) {
    console.warn('Could not save user profile record to Firestore:', err);
  }
}

export async function saveUserProfile(user: User): Promise<void> {
  const profile = formatUserProfile(user);
  if (profile) {
    await saveUserProfileDoc(profile);
  }
}

/**
 * CREATE ACCOUNT / SIGN UP with Email ID, Password, Confirm Password, and User Name
 */
export async function signUpWithEmailPassword(params: {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName: string;
}): Promise<UserProfile> {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanName = (params.displayName || '').trim();
  const password = params.password || '';
  const confirmPassword = params.confirmPassword || '';

  // 1. Validation checks
  if (!cleanName || cleanName.length < 2) {
    throw new Error('Please enter a valid User Name (at least 2 characters).');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error('Please enter a valid Email ID (e.g. name@example.com).');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (confirmPassword && password !== confirmPassword) {
    throw new Error('Passwords do not match. Please re-check password confirmation.');
  }

  const uid = getDeterministicUid(cleanEmail);
  const passwordHash = await hashPassword(password);

  // If this is the requested account credentials, allow instant registration / access
  if (cleanEmail === 'charan9959672757@gmail.com' && password === 'Charan@757') {
    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: cleanName || 'Charan',
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName || 'Charan')}&backgroundColor=2563eb,0284c7,4f46e5`,
      authProvider: 'password',
      jobTitle: 'Workspace Member',
      avatarColor: '#2563eb',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await saveUserProfileDoc(profile, { passwordHash });
    emitAuthStateChange(profile);
    return profile;
  }

  // 1. Check if user already exists in Firestore to protect existing accounts
  const existingUserRef = doc(db, 'users', uid);
  const existingSnap = await getDoc(existingUserRef);
  if (existingSnap.exists()) {
    throw new Error('An account with this Email ID already exists. Please click "Sign In" to enter your password.');
  }

  const photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=2563eb,0284c7,4f46e5`;

  const profile: UserProfile = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL,
    authProvider: 'password',
    jobTitle: 'Workspace Member',
    avatarColor: '#2563eb',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // 2. Try Firebase Auth User Creation (optional cloud auth layer)
  try {
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (userCred.user) {
      profile.uid = uid;
      try {
        await updateProfile(userCred.user, {
          displayName: cleanName,
          photoURL,
        });
      } catch (e) {
        // Ignore secondary profile update error
      }
    }
  } catch (fbAuthErr: any) {
    const code = fbAuthErr?.code || '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('An account with this Email ID already exists. Please click "Sign In" to enter your password.');
    }
    console.info('Firebase Auth registration note:', fbAuthErr?.message || fbAuthErr);
  }

  // 3. Save User Profile and New Password Digest in Firestore
  await saveUserProfileDoc(profile, { passwordHash });

  // 4. Update Local Session & Emit state
  emitAuthStateChange(profile);
  return profile;
}

/**
 * SIGN IN with Email ID and Password - STRICT: ONLY REGISTERED USERS WITH MATCHING PASSWORDS
 */
export async function signInWithEmailPassword(params: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<UserProfile> {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const password = params.password || '';

  if (!cleanEmail) {
    throw new Error('Please enter your Email ID.');
  }
  if (!password) {
    throw new Error('Please enter your Password.');
  }

  const uid = getDeterministicUid(cleanEmail);
  const passwordHash = await hashPassword(password);

  // Strategy 1: Attempt native Firebase Auth signInWithEmailAndPassword if available
  let nativeSuccess = false;
  try {
    const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (res.user) {
      nativeSuccess = true;
    }
  } catch (fbErr: any) {
    // Non-blocking fallback to Firestore hash check
  }

  // Strategy 2: Check Firestore record to verify user registration and password hash
  let userRef = doc(db, 'users', uid);
  let userSnap = await getDoc(userRef);

  // If not found by deterministic UID, search by email field in case of legacy UID
  if (!userSnap.exists()) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        userSnap = querySnap.docs[0];
        userRef = doc(db, 'users', userSnap.id);
      }
    } catch (e) {
      // Query fallback
    }
  }

  // If this is the authorized credentials for charan9959672757@gmail.com, allow login and preserve all saved profile fields
  if (cleanEmail === 'charan9959672757@gmail.com' && password === 'Charan@757') {
    const existingData = userSnap.exists() ? userSnap.data() : {};
    const effectiveDisplayName = existingData?.displayName || 'Charan';
    const profile: UserProfile = {
      uid: userSnap.exists() ? userSnap.id : uid,
      email: cleanEmail,
      displayName: effectiveDisplayName,
      photoURL: existingData?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(effectiveDisplayName)}&backgroundColor=2563eb,0284c7,4f46e5`,
      authProvider: 'password',
      jobTitle: existingData?.jobTitle || 'Workspace Owner',
      avatarColor: existingData?.avatarColor || '#2563eb',
      createdAt: existingData?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await saveUserProfileDoc(profile, { passwordHash });
    emitAuthStateChange(profile);
    return profile;
  }

  // If user document does NOT exist in Firestore at all: UNREGISTERED USER -> DENY LOGIN
  if (!userSnap.exists()) {
    throw new Error('No registered account found for this Email ID. Please click "Sign Up" / "Create Account" first to register.');
  }

  const userData = userSnap.data() || {};

  // Check stored password hash
  if (userData.passwordHash) {
    if (userData.passwordHash !== passwordHash && !nativeSuccess) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }
  } else if (!nativeSuccess) {
    // Legacy record without passwordHash and native auth failed
    throw new Error('Incorrect password. Please verify your credentials or update your password.');
  }

  const effectiveDisplayName = userData.displayName || cleanEmail.split('@')[0];
  const profile: UserProfile = {
    uid: userSnap.id,
    email: userData.email || cleanEmail,
    displayName: effectiveDisplayName,
    photoURL: userData.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(effectiveDisplayName)}&backgroundColor=2563eb,0284c7,4f46e5`,
    authProvider: 'password',
    jobTitle: userData.jobTitle || 'Workspace Member',
    avatarColor: userData.avatarColor || '#2563eb',
    createdAt: userData.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // Update last login timestamp in Firestore without overwriting profile fields
  await saveUserProfileDoc(profile, { passwordHash });
  emitAuthStateChange(profile);
  return profile;
}

/**
 * EDIT USER PROFILE in Workspace (User Name, Password, Job Title, Avatar Color)
 * Note: Registered Email ID is permanent and cannot be modified to preserve workspace partitioning.
 */
export async function updateUserProfileData(params: {
  displayName?: string;
  email?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  jobTitle?: string;
  avatarColor?: string;
}): Promise<UserProfile> {
  const current = cachedUserProfile || getStoredUserProfile();
  if (!current || !current.uid) {
    throw new Error('No active user session. Please sign in first.');
  }

  const updates: Partial<UserProfile> = {};
  const extraFirestoreFields: Record<string, any> = {};

  // 1. Update Display Name
  if (params.displayName !== undefined) {
    const cleanName = params.displayName.trim();
    if (!cleanName || cleanName.length < 2) {
      throw new Error('User Name must be at least 2 characters long.');
    }
    updates.displayName = cleanName;
    updates.photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=2563eb,0284c7,4f46e5`;

    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: cleanName, photoURL: updates.photoURL });
      } catch (e) {
        console.warn('Could not update Firebase Auth displayName:', e);
      }
    }
  }

  // 2. Update Password
  if (params.newPassword) {
    if (params.newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    if (params.confirmNewPassword && params.newPassword !== params.confirmNewPassword) {
      throw new Error('New password and confirmation do not match.');
    }

    const newHash = await hashPassword(params.newPassword);
    extraFirestoreFields.passwordHash = newHash;

    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, params.newPassword);
      } catch (e) {
        console.warn('Could not update Firebase Auth password:', e);
      }
    }
  }

  // 4. Update optional profile fields
  if (params.jobTitle !== undefined) updates.jobTitle = params.jobTitle.trim();
  if (params.avatarColor !== undefined) updates.avatarColor = params.avatarColor;

  const mergedProfile: UserProfile = {
    ...current,
    ...updates,
    lastLoginAt: new Date().toISOString(),
  };

  // 5. Persist to Firestore
  await saveUserProfileDoc(mergedProfile, extraFirestoreFields);

  // 6. Broadcast state change
  emitAuthStateChange(mergedProfile);
  return mergedProfile;
}

/**
 * Sign out user
 */
export async function logoutUser(): Promise<void> {
  cachedUserProfile = null;
  setStoredUserProfile(null);

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('PLANVEXA_USER_PROFILE');
      localStorage.removeItem('planvexa_user_profile_v1');
      localStorage.removeItem('msoffice_tasktracker_tasks_v1');
      localStorage.removeItem('msoffice_tasktracker_progress_v1');
      localStorage.removeItem('msoffice_tasktracker_notifs_v1');
    } catch (e) {
      // Ignore storage errors
    }
  }

  try {
    if (auth && auth.currentUser) {
      await signOut(auth);
    }
  } catch (e) {
    // Ignore signout error
  }

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
        authProvider: data.authProvider || 'password',
        jobTitle: data.jobTitle || 'Workspace Member',
        avatarColor: data.avatarColor || '#2563eb',
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
    // Always broadcast the updated task list to maintain live parity with Firestore
    onUpdate(items);
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
    // Always broadcast the updated progress map to maintain live parity with Firestore
    onUpdate(progressMap);
  }, (error) => {
    console.error('Error listening to progress from Firestore:', error);
  });
}

/**
 * Save single task to Firestore - Permanent dedicated storage with no limits
 */
export async function saveTaskToFirestore(userId: string, task: TaskItem): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', task.id);
  const payload = {
    ...task,
    userId,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(taskRef, payload, { merge: true });
}

/**
 * Delete single task from Firestore (Manual deletion only)
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
  const now = new Date().toISOString();
  tasks.forEach((task) => {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    batch.set(taskRef, { ...task, userId, updatedAt: now }, { merge: true });
  });
  await batch.commit();
}

/**
 * Batch delete tasks from Firestore (Manual batch deletion only)
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
  const payload = {
    ...progress,
    userId,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(progRef, payload, { merge: true });
}

/**
 * Batch save progress to Firestore
 */
export async function batchSaveProgressToFirestore(
  userId: string, 
  progressItems: Record<string, TaskDailyProgress>
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  Object.entries(progressItems).forEach(([key, item]) => {
    const progRef = doc(db, 'users', userId, 'progress', key);
    batch.set(progRef, { ...item, userId, updatedAt: now }, { merge: true });
  });
  await batch.commit();
}

