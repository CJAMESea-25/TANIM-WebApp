// Environment configuration
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    MODEL_BASE_URL: import.meta.env.VITE_MODEL_BASE_URL as string,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    // Service role key — used only for admin cascade deletes (bypasses RLS).
    // Never use this key for farmer-facing operations.
    SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY as string,
};
