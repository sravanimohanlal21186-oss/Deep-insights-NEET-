/**
 * IndexedDB wrapper for offline data storage
 * Stores questions, results, and user progress
 */

const DB_NAME = 'NEETInsights';
const DB_VERSION = 1;

const STORES = {
  QUESTIONS: 'questions',
  EXAMS: 'exams',
  RESULTS: 'results',
  PENDING_RESULTS: 'pendingResults',
  USER: 'user',
  CACHE: 'cache',
};

class OfflineDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Questions store
        if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
          const qStore = db.createObjectStore(STORES.QUESTIONS, { keyPath: 'id' });
          qStore.createIndex('subject', 'subject', { unique: false });
          qStore.createIndex('difficulty', 'difficulty', { unique: false });
        }

        // Exams store
        if (!db.objectStoreNames.contains(STORES.EXAMS)) {
          db.createObjectStore(STORES.EXAMS, { keyPath: 'id' });
        }

        // Results store
        if (!db.objectStoreNames.contains(STORES.RESULTS)) {
          const rStore = db.createObjectStore(STORES.RESULTS, { keyPath: 'id' });
          rStore.createIndex('userId', 'userId', { unique: false });
          rStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Pending results (for offline submission)
        if (!db.objectStoreNames.contains(STORES.PENDING_RESULTS)) {
          db.createObjectStore(STORES.PENDING_RESULTS, { keyPath: 'id', autoIncrement: true });
        }

        // User profile
        if (!db.objectStoreNames.contains(STORES.USER)) {
          db.createObjectStore(STORES.USER, { keyPath: 'id' });
        }

        // Generic cache
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
          cStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  async save(storeName, data) {
    const store = this.db.transaction(storeName, 'readwrite').objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const store = this.db.transaction(storeName, 'readonly').objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, query = null) {
    const store = this.db.transaction(storeName, 'readonly').objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = query ? store.index(query.index).getAll(query.value) : store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const store = this.db.transaction(storeName, 'readwrite').objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const store = this.db.transaction(storeName, 'readwrite').objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheData(key, data, ttl = 3600) {
    return this.save(STORES.CACHE, {
      key,
      data,
      expiry: Date.now() + ttl * 1000,
      createdAt: new Date(),
    });
  }

  async getCachedData(key) {
    const cached = await this.get(STORES.CACHE, key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      await this.delete(STORES.CACHE, key);
    }
    return null;
  }

  async savePendingResult(result) {
    return this.save(STORES.PENDING_RESULTS, {
      ...result,
      savedAt: new Date(),
      synced: false,
    });
  }

  async getPendingResults() {
    return this.getAll(STORES.PENDING_RESULTS);
  }

  async markResultSynced(id) {
    const result = await this.get(STORES.PENDING_RESULTS, id);
    if (result) {
      result.synced = true;
      return this.save(STORES.PENDING_RESULTS, result);
    }
  }
}

export default new OfflineDB();
