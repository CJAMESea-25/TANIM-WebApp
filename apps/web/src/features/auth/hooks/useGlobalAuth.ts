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

    useEffect(() => {
        // Initialize session from local storage since we aren't using Supabase built-in auth
        try {
            const storedSession = localStorage.getItem('tanim_user_session');
            if (storedSession) {
                const parsedSession = JSON.parse(storedSession) as AuthProfile;
                setSession(parsedSession);
                setProfile(parsedSession);
            }
        } catch (error) {
            console.error('Failed to parse stored session', error);
        } finally {
            setLoading(false);
        }

        const handleStorageChange = () => {
            const storedSession = localStorage.getItem('tanim_user_session');
            if (storedSession) {
                const parsedSession = JSON.parse(storedSession) as AuthProfile;
                setSession(parsedSession);
                setProfile(parsedSession);
            } else {
                setSession(null);
                setProfile(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (userData: AuthProfile) => {
        localStorage.setItem('tanim_user_session', JSON.stringify(userData));
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
