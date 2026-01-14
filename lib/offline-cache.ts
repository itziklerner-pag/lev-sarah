/**
 * Offline cache utility using IndexedDB for schedule data
 * Provides fallback data when the user is offline
 */

const DB_NAME = 'lev-sarah-cache';
const DB_VERSION = 1;
const SCHEDULE_STORE = 'schedule';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedScheduleData {
  key: string;
  data: unknown;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(SCHEDULE_STORE)) {
        db.createObjectStore(SCHEDULE_STORE, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

export async function cacheScheduleData(weekStart: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SCHEDULE_STORE, 'readwrite');
    const store = tx.objectStore(SCHEDULE_STORE);

    const cacheEntry: CachedScheduleData = {
      key: `schedule-${weekStart}`,
      data,
      timestamp: Date.now(),
    };

    store.put(cacheEntry);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Failed to cache schedule data:', error);
  }
}

export async function getCachedScheduleData(weekStart: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(SCHEDULE_STORE, 'readonly');
    const store = tx.objectStore(SCHEDULE_STORE);

    const request = store.get(`schedule-${weekStart}`);

    const result = await new Promise<CachedScheduleData | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!result) return null;

    // Check if cache is expired
    if (Date.now() - result.timestamp > CACHE_EXPIRY_MS) {
      // Cache expired, but still return data as fallback (better than nothing)
      console.log('Schedule cache expired but returning as fallback');
    }

    return result.data;
  } catch (error) {
    console.warn('Failed to get cached schedule data:', error);
    return null;
  }
}

export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SCHEDULE_STORE, 'readwrite');
    const store = tx.objectStore(SCHEDULE_STORE);

    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const entry = cursor.value as CachedScheduleData;
        if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS * 7) {
          // Delete entries older than 7 days
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn('Failed to clear expired cache:', error);
  }
}

// Hook for schedule with offline fallback
export function useOfflineScheduleCache() {
  return {
    cacheSchedule: cacheScheduleData,
    getCachedSchedule: getCachedScheduleData,
    clearExpired: clearExpiredCache,
  };
}
