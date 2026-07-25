import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import auth from '@react-native-firebase/auth';

import { colors, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';
import { isEmulatorMode } from '../services/emulator';

/**
 * Connexion par e-mail/mot de passe. Les comptes ouvriers sont provisionnés
 * par l'administrateur — pas d'inscription libre côté terrain.
 */
export function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            setError('Saisissez votre e-mail et votre mot de passe');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await auth().signInWithEmailAndPassword(email.trim(), password);
            // onAuthStateChanged in the root layout takes over from here.
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code ?? '';
            if (code === 'auth/invalid-email') {
                setError('Adresse e-mail invalide');
            } else if (
                code === 'auth/user-not-found' ||
                code === 'auth/wrong-password' ||
                code === 'auth/invalid-credential'
            ) {
                setError('E-mail ou mot de passe incorrect');
            } else if (code === 'auth/too-many-requests') {
                setError('Trop de tentatives — réessayez dans quelques minutes');
            } else if (code === 'auth/network-request-failed') {
                setError('Pas de connexion — vérifiez votre réseau');
            } else {
                setError(t('common.error'));
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.content}>
                    <View style={styles.brandBadge}>
                        <Text style={styles.brandBadgeText}>FT</Text>
                    </View>
                    <Text style={styles.title}>{t('common.appName')}</Text>
                    <Text style={styles.subtitle}>Application de terrain — ferme & chantier</Text>

                    <View style={styles.form}>
                        <Text style={styles.label}>{t('auth.email')}</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="prenom@exemple.cd"
                            placeholderTextColor={colors.textFaint}
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                            editable={!busy}
                        />

                        <Text style={styles.label}>{t('auth.password')}</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textFaint}
                            secureTextEntry
                            editable={!busy}
                            onSubmitEditing={handleSignIn}
                        />

                        {error && <Text style={styles.error}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.button, busy && styles.buttonDisabled]}
                            onPress={handleSignIn}
                            disabled={busy}
                        >
                            {busy ? (
                                <ActivityIndicator color={colors.onPrimary} />
                            ) : (
                                <Text style={styles.buttonText}>{t('common.signIn')}</Text>
                            )}
                        </TouchableOpacity>

                        {isEmulatorMode && (
                            <Text style={styles.devHint}>
                                Mode émulateur — compte démo : operateur@ferme.local / demo-ferme-2026
                            </Text>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    brandBadge: {
        width: 64,
        height: 64,
        borderRadius: radius.lg,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    brandBadgeText: {
        color: colors.onPrimary,
        fontSize: typeScale.title,
        fontWeight: 'bold',
    },
    title: {
        fontSize: typeScale.display,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typeScale.label,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.xxl,
    },
    form: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.xl,
        gap: spacing.sm,
    },
    label: {
        fontSize: typeScale.label,
        fontWeight: '600',
        color: colors.textMuted,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        minHeight: MIN_TOUCH_TARGET,
        fontSize: typeScale.body,
        color: colors.text,
        backgroundColor: colors.background,
        marginBottom: spacing.sm,
    },
    error: {
        color: colors.danger,
        fontSize: typeScale.label,
        marginBottom: spacing.xs,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        minHeight: MIN_TOUCH_TARGET,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: colors.onPrimary,
        fontSize: typeScale.body,
        fontWeight: 'bold',
    },
    devHint: {
        fontSize: typeScale.caption,
        color: colors.textFaint,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
