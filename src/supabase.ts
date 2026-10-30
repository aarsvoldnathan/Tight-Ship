import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || SUPABASE_KEY;

export const supabaseConfigured = url.length > 0 && key.length > 0;

// Only the publishable key belongs in the app. Never use the secret / service_role key here.
export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
