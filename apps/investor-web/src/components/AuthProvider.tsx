"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserRole } from '@diaspora-trust/core-logic';

interface AuthContext {
    user: User | null;
    role: UserRole | null;
    loading: boolean;
}

const AuthCtx = createContext<AuthContext>({ user: null, role: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubProfile: (() => void) | null = null;

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            // Clean up previous profile listener
            if (unsubProfile) { unsubProfile(); unsubProfile = null; }

            if (firebaseUser) {
                // Use onSnapshot instead of getDoc so we pick up the user doc
                // even if it's created after auth (e.g. during sign-up race)
                unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
                    const r = snap.data()?.role as UserRole | undefined;
                    setRole(r ?? null);
                    setLoading(false);
                });
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => {
            unsubAuth();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    return <AuthCtx.Provider value={{ user, role, loading }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    return useContext(AuthCtx);
}
