import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Get the current environment
const isDevelopment = import.meta.env.DEV;
console.log('isDevelopment', isDevelopment);

// Use the appropriate URL based on environment
const supabaseUrl = 'https://bmuvsbafvrvsgdplhvgp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdXZzYmFmdnJ2c2dkcGxodmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0OTY1ODIsImV4cCI6MjA1ODA3MjU4Mn0.rn_nhW2ongqXl2BoGY1wDGN7c0ojmd1iNX_xBQs3PBo'

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey) {
  throw new Error('Missing Supabase Key');
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

// Named export for supabase
export { supabase };

// Use the correct Supabase Auth User type
export type { User as SupabaseUser } from '@supabase/supabase-js';
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export async function updateUsageCount(userId: string) {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('usage_count, last_reset, plan')
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
    const lastReset = user.last_reset ? new Date(user.last_reset) : new Date();
    const shouldReset = now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000;

    const newCount = shouldReset ? 1 : user.usage_count + 1;
    const remaining = user.plan === 'premium' ? 'unlimited' : 3 - newCount;

    if (user.plan !== 'premium' && newCount > 3) {
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

// Named export for useAuth
export const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`);

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out.');
        navigate('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Auth token refreshed:', session);
      } else if (event === 'USER_UPDATED') {
        console.log('User profile updated:', session?.user);
      }
    });

    // Fetching the current session when the application initializes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Existing session detected:', session);
      } else {
        console.log('No active session found. User is logged out.');
        navigate('/login');
      }
    }).catch((error) => {
      console.error('Error fetching session:', error);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
};