import { useState, useEffect } from 'react';
import { getConfig, onConfigChange, type ConfigKey } from '../lib/configService';

export function useConfig<T>(key: ConfigKey, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    // Initial fetch
    getConfig<T>(key)
      .then(setValue)
      .catch(() => setValue(fallback));

    // Subscribe to changes
    const unsubscribe = onConfigChange(key, (newValue) => {
      setValue(newValue as T);
    });

    return unsubscribe;
  }, [key, fallback]);

  return value;
}