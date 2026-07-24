"use client";
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useI18n } from '@diaspora-trust/shared-ui';
import { auth, db } from '../lib/firebase';
import { useAppT, type AppStringKey } from '../lib/i18n';

export default function LoginPage() {
    const { t, locale, setLocale } = useI18n();
    const { ta } = useAppT();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [errorKey, setErrorKey] = useState<AppStringKey | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorKey(null);

        if (mode === 'signup' && password !== confirmPassword) {
            setErrorKey('login.errPasswordMatch');
            return;
        }
        if (mode === 'signup' && password.length < 6) {
            setErrorKey('login.errPasswordShort');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'signin') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                if (displayName.trim()) {
                    await updateProfile(cred.user, { displayName: displayName.trim() });
                }
                await setDoc(doc(db, 'users', cred.user.uid), {
                    uid: cred.user.uid,
                    displayName: displayName.trim() || email.split('@')[0],
                    email,
                    role: 'funder',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        } catch (err: any) {
            const code = err?.code;
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                setErrorKey('login.errInvalid');
            } else if (code === 'auth/email-already-in-use') {
                setErrorKey('login.errEmailInUse');
            } else if (code === 'auth/weak-password') {
                setErrorKey('login.errWeakPassword');
            } else if (code === 'auth/too-many-requests') {
                setErrorKey('login.errTooMany');
            } else {
                setErrorKey(mode === 'signin' ? 'login.errSignIn' : 'login.errSignUp');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Locale toggle */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-800 text-xs font-bold hover:border-primary-bright transition-colors"
                        aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
                    >
                        <span className={locale === 'fr' ? 'text-primary-bright' : 'text-slate-500'}>FR</span>
                        <span className="text-slate-600 font-normal">|</span>
                        <span className={locale === 'en' ? 'text-primary-bright' : 'text-slate-500'}>EN</span>
                    </button>
                </div>

                {/* Brand */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-bright to-primary-dark rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary/30 mx-auto mb-4">
                        D
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">DIASPORA TRUST</h1>
                    <p className="text-sm text-primary-bright font-medium mt-1">{ta('login.subtitle')}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
                    <div className="space-y-5">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {ta('login.fullName')}
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    autoComplete="name"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright transition-colors"
                                    placeholder="Michel Kambou"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {t('auth.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright transition-colors"
                                placeholder="michel@diaspora-trust.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {t('auth.password')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright transition-colors"
                                placeholder={mode === 'signin' ? ta('login.passwordPlaceholderSignin') : ta('login.passwordPlaceholderSignup')}
                            />
                        </div>
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {ta('login.confirmPassword')}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright transition-colors"
                                    placeholder={ta('login.confirmPlaceholder')}
                                />
                            </div>
                        )}
                    </div>

                    {errorKey && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {ta(errorKey)}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-primary hover:bg-primary-dark disabled:bg-primary-dark/70 disabled:cursor-wait text-white font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
                    >
                        {loading
                            ? (mode === 'signin' ? ta('login.signingIn') : ta('login.creatingAccount'))
                            : (mode === 'signin' ? t('common.signIn') : t('common.signUp'))
                        }
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                    {mode === 'signin' ? (
                        <>
                            {ta('login.noAccount')}{' '}
                            <button
                                onClick={() => { setMode('signup'); setErrorKey(null); }}
                                className="text-primary-bright hover:text-primary-soft font-semibold"
                            >
                                {ta('login.createOne')}
                            </button>
                        </>
                    ) : (
                        <>
                            {ta('login.haveAccount')}{' '}
                            <button
                                onClick={() => { setMode('signin'); setErrorKey(null); }}
                                className="text-primary-bright hover:text-primary-soft font-semibold"
                            >
                                {t('common.signIn')}
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
