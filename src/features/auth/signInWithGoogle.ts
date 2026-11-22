import { supabase } from '@/core/supabase/client';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Devuelve false si la persona cerró la ventana de Google sin terminar.
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = Linking.createURL('auth/callback'); // mibilletera://auth/callback

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Supabase no devolvió la dirección de Google.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('Google no devolvió el código de acceso.');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}