import Constants from 'expo-constants';

export const GITHUB_REPO = 'aarsvoldnathan/Tight-Ship';
/** Page with the newest Android app file. */
export const ANDROID_DOWNLOAD = `https://github.com/${GITHUB_REPO}/releases/latest`;

/** Android build number, stamped into app.json by the GitHub Android build. 0 when running from a computer. */
export const ANDROID_BUILD: number = Number(
  (Constants.expoConfig?.extra as { androidBuild?: number } | undefined)?.androidBuild ?? 0,
);

/** Online database (Supabase). The publishable key is safe to ship in the app: what each
 *  person can see is enforced by the database's row-level security rules.
 *  Never put the secret / service_role key here. */
export const SUPABASE_URL = 'https://aedkyctvcplftzwwimif.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_DJ7jbWx0GRSGsk7ES5GxFA_zF_D-Nbj';
