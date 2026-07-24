"use client";
/**
 * Client-side provider stack: shared I18nProvider (French default) wrapping
 * the Firebase AuthProvider. Kept in its own file so the server layout can
 * compose providers without pulling client code into the RSC graph directly.
 */
import { I18nProvider } from '@diaspora-trust/shared-ui';
import { AuthProvider } from './AuthProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider initialLocale="fr">
            <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
    );
}
