import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase';
import { Session } from '@supabase/supabase-js';

// Get the current environment
const isDevelopment = import.meta.env.DEV;
console.log('isDevelopment', isDevelopment);

// Use the appropriate URL based on environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
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

export default supabase;

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

// Subscribing to auth state changes
const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
  console.log(`Auth event: ${event}`);

  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out.');
    window.location.href = '/login';
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed:', session);
  } else if (event === 'USER_UPDATED') {
    console.log('User profile updated:', session?.user);
  }
});

// Fetching the current session when the application initializes
supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
  if (session) {
    console.log('Existing session detected:', session);
  } else {
    console.log('No active session found. User is logged out.');
    window.location.href = '/login';
  }
}).catch((error) => {
  console.error('Error fetching session:', error);
});