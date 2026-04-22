// Environment configuration
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    MODEL_BASE_URL: import.meta.env.VITE_MODEL_BASE_URL as string,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    // Service role key — admin REST writes (POST/PATCH/DELETE) use this to bypass RLS.
    // If unset, the anon key is used and Supabase RLS will usually block inserts/updates.
    // Never expose this build-time value to end users or ship it in farmer-facing bundles you do not trust.
    SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY as string,
};
