// Environment configuration
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    MODEL_BASE_URL: import.meta.env.VITE_MODEL_BASE_URL as string,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
};
