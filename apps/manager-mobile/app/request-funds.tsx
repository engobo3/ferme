import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import type { RegionId } from '@diaspora-trust/core-logic';
import { DEFAULT_REGION_ID } from '@diaspora-trust/core-logic';
import { colors, spacing, typeScale, t } from '@diaspora-trust/shared-ui';
import { VoucherForm } from '../features/request-funds/components/VoucherForm';
import { useVoucherRequest } from '../features/request-funds/hooks/useVoucherRequest';

export default function RequestFundsScreen() {
  const router = useRouter();
  const currentUser = auth().currentUser;
  const operatorId = currentUser?.uid ?? '';

  const [farmId, setFarmId] = useState<string>('');
  const [region, setRegion] = useState<RegionId>(DEFAULT_REGION_ID);
  const [profileLoading, setProfileLoading] = useState(true);

  const { isSubmitting, error, success, requestVoucher } = useVoucherRequest(farmId, operatorId);

  // Resolve the operator's farm and home market from their profile
  useEffect(() => {
    if (!operatorId) {
      setProfileLoading(false);
      return;
    }
    firestore()
      .collection('users')
      .doc(operatorId)
      .get()
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.farmIds?.length) setFarmId(data.farmIds[0]);
          if (data?.region === 'kinshasa' || data?.region === 'cotonou') {
            setRegion(data.region);
          }
        }
      })
      .catch((err) => console.error('Erreur de chargement du profil :', err))
      .finally(() => setProfileLoading(false));
  }, [operatorId]);

  useEffect(() => {
    if (success) {
      Alert.alert(t('voucher.title'), t('voucher.submitted'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    if (error) {
      Alert.alert(t('common.error'), error);
    }
  }, [success, error]);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.introText}>
          Le bon d’achat sera envoyé à l’investisseur pour validation avant utilisation chez un
          fournisseur agréé.
        </Text>
      </View>
      <VoucherForm onSubmit={requestVoucher} isSubmitting={isSubmitting} region={region} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  intro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  introText: {
    fontSize: typeScale.label,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
