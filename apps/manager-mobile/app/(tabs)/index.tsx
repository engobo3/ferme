import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

import { Task, formatMoney, getRegion, isOverdue, formatDateShort, CurrencyCode } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';
import { StatusBadge } from '@diaspora-trust/shared-ui/src/components/StatusBadge';
import { mediaQueue } from '../../services/MediaQueueService';

export default function HomeScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('operator');
  const [isConnected, setIsConnected] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const currentUser = auth().currentUser;
  const userId = currentUser?.uid;

  // Network status for the offline banner
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });
    return () => unsub();
  }, []);

  // Pending media uploads (outbox)
  useEffect(() => {
    const unsub = mediaQueue.subscribe((queue) => {
      setPendingCount(queue.filter((j) => j.status !== 'completed').length);
    });
    return () => unsub();
  }, []);

  // Fetch user role
  useEffect(() => {
    if (!userId) return;
    const unsub = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot((snap) => {
        if (snap.exists()) setUserRole(snap.data()?.role || 'operator');
      });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Admin/funder sees all tasks; operator sees only assigned tasks
    let q = firestore().collection('tasks').where('assignedTo', '==', userId);
    if (userRole === 'admin' || userRole === 'funder') {
      q = firestore().collection('tasks');
    }

    const unsubscribe = q.onSnapshot(
      (snapshot) => {
        if (snapshot) {
          const taskList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Task[];
          setTasks(taskList);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erreur de chargement des tâches :', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId, userRole]);

  const renderTaskItem = ({ item }: { item: Task }) => {
    const overdue = item.status !== 'completed' && !!item.dueDate && isOverdue(item.dueDate);
    const currency = ((item.payoutCurrency as CurrencyCode) ?? getRegion(undefined).currency);

    return (
      <TouchableOpacity
        style={[styles.taskCard, overdue && styles.taskCardOverdue]}
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.taskDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.taskFooter}>
          <View style={styles.rewardContainer}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={styles.rewardText}>{formatMoney(item.payoutAmount, currency)}</Text>
          </View>
          {overdue ? (
            <View style={styles.overdueChip}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <Text style={styles.overdueText}>{t('task.overdue')}</Text>
            </View>
          ) : (
            <Text style={styles.dateText}>
              {t('task.due')} : {item.dueDate ? formatDateShort(item.dueDate) : '—'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const showSyncBanner = !isConnected || pendingCount > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerGreeting}>
          Bonjour{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}
        </Text>
        <Text style={styles.headerTitle}>
          {userRole === 'admin' || userRole === 'funder' ? 'Toutes les tâches' : t('task.myTasks')}
        </Text>
      </View>

      {showSyncBanner && (
        <View style={[styles.syncBanner, !isConnected ? styles.syncBannerOffline : styles.syncBannerPending]}>
          <Ionicons
            name={!isConnected ? 'cloud-offline' : 'cloud-upload'}
            size={18}
            color={!isConnected ? colors.danger : colors.warning}
          />
          <Text style={[styles.syncBannerText, { color: !isConnected ? colors.danger : palette.amber700 }]}>
            {!isConnected ? t('common.offline') : t('common.pendingSync', undefined, { count: pendingCount })}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="leaf-outline" size={64} color={colors.textFaint} />
          <Text style={styles.emptyText}>{t('task.noTasks')}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerGreeting: {
    fontSize: typeScale.body,
    color: colors.textMuted,
  },
  headerTitle: {
    fontSize: typeScale.display,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  syncBannerOffline: {
    backgroundColor: palette.red100,
  },
  syncBannerPending: {
    backgroundColor: palette.amber100,
  },
  syncBannerText: {
    flex: 1,
    fontSize: typeScale.label,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  listContent: {
    padding: spacing.lg,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  taskCardOverdue: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  taskTitle: {
    fontSize: typeScale.heading,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  taskDesc: {
    color: colors.textMuted,
    fontSize: typeScale.label,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    paddingTop: spacing.md,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rewardText: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: typeScale.body,
  },
  dateText: {
    fontSize: typeScale.caption,
    color: colors.textFaint,
  },
  overdueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  overdueText: {
    fontSize: typeScale.caption,
    fontWeight: 'bold',
    color: colors.danger,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typeScale.body,
    color: colors.textFaint,
  },
});
