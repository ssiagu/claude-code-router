// LRU cache for session usage

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Session model state interface
 * Stores the active model for a specific session
 */
export interface SessionModelState {
  model: string;  // Format: "provider,model_name"
  timestamp: number;
  setBy: 'command' | 'default';  // How the model was set
}

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const value = this.cache.get(key) as V;
    // Move to end to mark as recently used
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      // If key exists, delete it to update its position
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // If cache is full, delete the least recently used item
      const leastRecentlyUsedKey = this.cache.keys().next().value;
      if (leastRecentlyUsedKey !== undefined) {
        this.cache.delete(leastRecentlyUsedKey);
      }
    }
    this.cache.set(key, value);
  }

  values(): V[] {
    return Array.from(this.cache.values());
  }
}

export const sessionUsageCache = new LRUCache<string, Usage>(100);

/**
 * Session-level model state cache
 * Stores active model for each session to persist across requests
 */
export const sessionModelCache = new LRUCache<string, SessionModelState>(100);

/**
 * Set session model state
 * @param sessionId - Session identifier
 * @param model - Model string in format "provider,model_name"
 * @param setBy - How the model was set ('command' or 'default')
 */
export function setSessionModel(sessionId: string, model: string, setBy: 'command' | 'default' = 'command'): void {
  sessionModelCache.put(sessionId, {
    model,
    timestamp: Date.now(),
    setBy
  });
}

/**
 * Get session model state
 * @param sessionId - Session identifier
 * @returns SessionModelState or undefined if not found
 */
export function getSessionModel(sessionId: string): SessionModelState | undefined {
  return sessionModelCache.get(sessionId);
}

/**
 * Clear session model state
 * @param sessionId - Session identifier
 */
export function clearSessionModel(sessionId: string): void {
  sessionModelCache.put(sessionId, {
    model: '',
    timestamp: Date.now(),
    setBy: 'default'
  });
}

/**
 * Check if session has an active model override
 * @param sessionId - Session identifier
 * @returns boolean indicating if session has active model
 */
export function hasSessionModel(sessionId: string): boolean {
  const state = getSessionModel(sessionId);
  return state !== undefined && state.model !== '' && state.setBy === 'command';
}
