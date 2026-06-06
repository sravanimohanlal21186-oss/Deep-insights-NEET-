import React, { useState, useEffect } from 'react';
import { useServiceWorker } from '../hooks/useOffline';
import './OfflineIndicator.css';

/**
 * Offline indicator component with sync status
 */
export const OfflineIndicator = () => {
  const { isOnline, updateAvailable, skipWaiting, syncPendingData } = useServiceWorker();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncPendingData();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="indicator-content">
        <span className="indicator-status">
          <span className={`indicator-dot ${isOnline ? 'online' : 'offline'}`}></span>
          {isOnline ? 'Online' : 'Offline Mode'}
        </span>

        {!isOnline && (
          <button className="sync-button" onClick={handleSync} disabled={syncing}>
            {syncing ? '⏳ Syncing...' : '🔄 Sync'}
          </button>
        )}

        {updateAvailable && (
          <button className="update-button" onClick={skipWaiting}>
            📦 Update Available
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
