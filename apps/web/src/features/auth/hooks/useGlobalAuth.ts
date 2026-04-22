import { useEffect, useState } from 'react';

export interface AuthProfile {
    id: string | number;
    username: string;
    role: 'farmer' | 'admin';
}

export function useGlobalAuth() {
    const [session, setSession] = useState<AuthProfile | null>(null);
    const [profile, setProfile] = useState<AuthProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAndParseSession = (storedData: string): AuthProfile | null => {
        try {
            const parsed = JSON.parse(storedData) as AuthProfile & { expiresAt?: number };
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                localStorage.removeItem('tanim_user_session');
                // Trigger storage event so other tabs sync the removal
                window.dispatchEvent(new Event('storage'));
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        // Initialize session from local storage since we aren't using Supabase built-in auth
        try {
            const storedSession = localStorage.getItem('tanim_user_session');
            if (storedSession) {
                const validSession = checkAndParseSession(storedSession);
                if (validSession) {
                    setSession(validSession);
                    setProfile(validSession);
                } else {
                    setSession(null);
                    setProfile(null);
                }
            }
        } catch (error) {
            console.error('Failed to parse stored session', error);
        } finally {
            setLoading(false);
        }

        const handleStorageChange = () => {
            const storedSession = localStorage.getItem('tanim_user_session');
            if (storedSession) {
                const validSession = checkAndParseSession(storedSession);
                setSession(validSession);
                setProfile(validSession);
            } else {
                setSession(null);
                setProfile(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (userData: AuthProfile) => {
        const sessionPayload = {
            ...userData,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // Tokens expire in 24 hours
        };
        localStorage.setItem('tanim_user_session', JSON.stringify(sessionPayload));
        setSession(userData);
        setProfile(userData);
        window.dispatchEvent(new Event('storage'));
    };

    const logout = () => {
        localStorage.removeItem('tanim_user_session');
        setSession(null);
        setProfile(null);
        window.dispatchEvent(new Event('storage'));
    };

    return { session, profile, loading, login, logout };
}
