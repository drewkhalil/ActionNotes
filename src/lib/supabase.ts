import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get the current environment
const isDevelopment = import.meta.env.DEV;

// Use the appropriate URL based on environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  db: {
    schema: 'public'
  }
});

export type User = Database['public']['Tables']['users']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export async function updateUsageCount(userId: string) {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('usage_count, last_reset, is_premium')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ id: userId, usage_count: 1 }]);
      
      if (insertError) throw insertError;
      return { success: true, remaining: 2 };
    }

    const now = new Date();
    const lastReset = new Date(user.last_reset);
    const shouldReset = now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000;

    const newCount = shouldReset ? 1 : user.usage_count + 1;
    const remaining = user.is_premium ? 'unlimited' : 3 - newCount;

    if (!user.is_premium && newCount > 3) {
      return { success: false, remaining: 0 };
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        usage_count: shouldReset ? 1 : newCount,
        last_reset: shouldReset ? now.toISOString() : user.last_reset
      })
      .eq('id', userId);

    if (updateError) throw updateError;
    return { success: true, remaining };
  } catch (error) {
    console.error('Error updating usage count:', error);
    throw error;
  }
}