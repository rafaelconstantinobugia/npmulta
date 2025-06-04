import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// In-memory cache
const configCache = new Map<string, unknown>();

export type ConfigKey = 'default_arguments' | 'signature_block' | 'features';

export async function getConfig<T = unknown>(key: ConfigKey): Promise<T> {
  // Check cache first
  if (configCache.has(key)) {
    return configCache.get(key) as T;
  }

  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('id', key)
      .single();

    if (error) throw error;

    // Update cache
    configCache.set(key, data.value);
    return data.value as T;
  } catch (error) {
    console.error(`Error fetching config ${key}:`, error);
    throw error;
  }
}

export async function setConfig<T>(key: ConfigKey, value: T): Promise<void> {
  try {
    // Validate JSON size (16KB limit)
    const size = new TextEncoder().encode(JSON.stringify(value)).length;
    if (size > 16 * 1024) {
      throw new Error('Configuration value exceeds 16KB limit');
    }

    const { error } = await supabase
      .from('app_config')
      .upsert({ id: key, value, updated_at: new Date().toISOString() });

    if (error) throw error;

    // Update cache
    configCache.set(key, value);
  } catch (error) {
    console.error(`Error setting config ${key}:`, error);
    throw error;
  }
}

export function onConfigChange(
  key: ConfigKey,
  callback: (value: unknown) => void
): () => void {
  const channel = supabase.channel(`config:${key}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_config',
        filter: `id=eq.${key}`
      },
      (payload) => callback(payload.new.value)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}