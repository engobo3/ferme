import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, t as translate, type Locale, type StringKey } from './strings';

export interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: StringKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Locale provider for React (Native and DOM). French is the default;
 * investor-facing surfaces may offer an English toggle.
 */
export function I18nProvider({
    children,
    initialLocale = DEFAULT_LOCALE,
}: {
    children: ReactNode;
    initialLocale?: Locale;
}) {
    const [locale, setLocale] = useState<Locale>(initialLocale);
    const value = useMemo<I18nContextValue>(
        () => ({
            locale,
            setLocale,
            t: (key, params) => translate(key, locale, params),
        }),
        [locale],
    );
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const FALLBACK: I18nContextValue = {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key, params) => translate(key, DEFAULT_LOCALE, params),
};

/** Works outside a provider too (falls back to French) — copy never crashes a screen. */
export function useI18n(): I18nContextValue {
    return useContext(I18nContext) ?? FALLBACK;
}
