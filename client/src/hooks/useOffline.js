import React, { useEffect, useState, useCallback } from 'react';
import offlineDB from './offlineDB';

/**
 * Hook to register service worker and manage offline functionality
 */
export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initialize offline database
    offlineDB.init().catch(err => console.error('Failed to init offline DB:', err));

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('✓ Service Worker registered');
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });

          // Check for updates every hour
          setInterval(() => reg.update(), 3600000);
        })
        .catch(err => console.error('Service Worker registration failed:', err));
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingData = useCallback(async () => {
    try {
      const pendingResults = await offlineDB.getPendingResults();
      for (const result of pendingResults) {
        if (!result.synced) {
          // Try to sync
          console.log('Syncing pending result:', result.id);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, []);

  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    isOnline,
    updateAvailable,
    skipWaiting,
    registration,
    syncPendingData,
  };
};

/**
 * Hook for managing offline data
 */
export const useOfflineData = (storeName, key) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await offlineDB.get(storeName, key);
        setData(result);
      } catch (error) {
        console.error('Failed to load offline data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeName, key]);

  const save = useCallback(async (newData) => {
    try {
      await offlineDB.save(storeName, { ...newData, id: key });
      setData(newData);
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }, [storeName, key]);

  return { data, loading, save };
};

/**
 * Hook for caching API data
 */
export const useCachedData = (key, ttl = 3600) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const cache = useCallback(async (value) => {
    try {
      await offlineDB.cacheData(key, value, ttl);
      setData(value);
    } catch (error) {
      console.error('Cache failed:', error);
    }
  }, [key, ttl]);

  const get = useCallback(async () => {
    try {
      setLoading(true);
      const cached = await offlineDB.getCachedData(key);
      if (cached) {
        setData(cached);
      }
      return cached;
    } catch (error) {
      console.error('Get cached failed:', error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  return { data, loading, cache, get };
};
