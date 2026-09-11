import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
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

/**
 * Sign in with Google (Gmail)
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Persist / update user profile in Firestore
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);
    const nowIso = new Date().toISOString();

    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL || '',
        createdAt: nowIso,
        lastLoginAt: nowIso,
      });
    } else {
      await setDoc(userRef, {
        lastLoginAt: nowIso,
        displayName: user.displayName || existingSnap.data()?.displayName,
        photoURL: user.photoURL || existingSnap.data()?.photoURL,
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Could not save user profile record:', err);
  }

  return user;
}

/**
 * Sign out user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
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
  };
}

/**
 * Update user display name in Firebase Auth and Firestore user profile
 */
export async function updateUserDisplayName(newName: string): Promise<string> {
  const current = auth.currentUser;
  if (!current) {
    throw new Error('No user is currently signed in.');
  }
  const cleanName = newName.trim();
  if (!cleanName) {
    throw new Error('Name cannot be empty.');
  }

  // 1. Update Firebase Auth display name on auth object
  await updateProfile(current, {
    displayName: cleanName,
  });

  // 2. Persist updated name to Firestore user profile document
  const userRef = doc(db, 'users', current.uid);
  await setDoc(userRef, {
    displayName: cleanName,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

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
