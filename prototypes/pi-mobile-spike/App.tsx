import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { isSignedIn, signInWithBrowser, signOut } from './src/ai/piClient';
import { PrimaryButton } from './src/components/controls';
import {
  createMeal,
  deleteMeal,
  finalizeExpiredClarifications,
  getDailyGoals,
  initializeMeals,
  listMeals,
  queueMealRetry,
  saveDailyGoals,
  updateMeal,
} from './src/data/mealRepository';
import { color, space } from './src/design/tokens';
import type { DailyGoals, Meal, MealAnalysis, MealPhoto } from './src/domain/meal';
import { CaptureReviewScreen } from './src/features/capture/CaptureReviewScreen';
import { CaptureScreen } from './src/features/capture/CaptureScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { MealDetailScreen } from './src/features/meal/MealDetailScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { t } from './src/i18n';
import { registerMealBackgroundTask } from './src/services/backgroundMeals';
import {
  answerMealClarification,
  correctSavedMeal,
  prepareMealNotifications,
  processMeal,
  processPendingMeals,
} from './src/services/mealProcessor';

type Screen = 'home' | 'camera' | 'review' | 'settings' | 'detail';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<DailyGoals>({});
  const [selectedDay, setSelectedDay] = useState(startOfDay(Date.now()));
  const [selectedMealId, setSelectedMealId] = useState<string>();
  const [photos, setPhotos] = useState<MealPhoto[]>([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [captureError, setCaptureError] = useState('');

  const refresh = useCallback(async () => {
    await finalizeExpiredClarifications();
    const [nextMeals, nextGoals] = await Promise.all([listMeals(), getDailyGoals()]);
    setMeals(nextMeals);
    setGoals(nextGoals);
  }, []);

  const openMeal = useCallback((mealId: string) => {
    setSelectedMealId(mealId);
    setScreen('detail');
  }, []);

  useEffect(() => {
    const routeUrl = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'calodone:' && parsed.hostname === 'capture') setScreen('camera');
      } catch {
        // Ignore unrelated or malformed deep links.
      }
    };
    void Linking.getInitialURL().then(routeUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => routeUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const routeNotification = async (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const mealId = response.notification.request.content.data?.mealId;
      if (typeof mealId !== 'string') return;
      if (response.actionIdentifier === 'answer' && response.userText?.trim()) {
        try {
          await answerMealClarification(mealId, response.userText.trim());
          await refresh();
        } catch {
          // The relevant meal opens below so the user can retry in context.
        }
      }
      openMeal(mealId);
    };
    void Notifications.getLastNotificationResponseAsync().then(async (response) => {
      await routeNotification(response);
      if (response) await Notifications.clearLastNotificationResponseAsync();
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(routeNotification);
    return () => subscription.remove();
  }, [openMeal, refresh]);

  useEffect(() => {
    void (async () => {
      await initializeMeals();
      const signedIn = await isSignedIn();
      setAuthenticated(signedIn);
      await refresh();
      setReady(true);
      try {
        await registerMealBackgroundTask();
      } catch {
        // Foreground processing still works when a platform refuses background registration.
      }
      if (signedIn) await processPendingMeals();
      await refresh();
    })().catch(() => setReady(true));
  }, [refresh]);

  const dayMeals = useMemo(() => {
    const end = nextDay(selectedDay);
    return meals.filter((meal) => meal.capturedAt >= selectedDay && meal.capturedAt < end);
  }, [meals, selectedDay]);
  const selectedMeal = meals.find((meal) => meal.id === selectedMealId);
  const canGoNext = selectedDay < startOfDay(Date.now());

  const connect = async () => {
    setConnecting(true);
    setConnectionError('');
    try {
      await signInWithBrowser({ onEvent: () => undefined });
      setAuthenticated(true);
      await processPendingMeals();
      await refresh();
    } catch {
      setConnectionError(t('connectionError'));
    } finally {
      setConnecting(false);
    }
  };

  const openCapture = () => {
    setCaptureError('');
    setScreen('camera');
  };

  const captured = (photo: MealPhoto) => {
    setPhotos((current) => [...current, photo]);
    setScreen('review');
  };

  const deletePhoto = (photo: MealPhoto) => {
    try {
      const file = new File(photo.uri);
      if (file.exists) file.delete();
    } catch {
      // Camera cache cleanup is best effort.
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const removed = current[index];
      if (removed) deletePhoto(removed);
      return current.filter((_, photoIndex) => photoIndex !== index);
    });
  };

  const discardCapture = () => {
    photos.forEach(deletePhoto);
    setPhotos([]);
    setNote('');
    setCaptureError('');
    setScreen('home');
  };

  const sendMeal = async () => {
    if (photos.length === 0 || sending) return;
    setSending(true);
    setCaptureError('');
    try {
      const meal = await createMeal({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        capturedAt: Date.now(),
        note: note.trim(),
        photos,
      });
      setPhotos([]);
      setNote('');
      setSelectedDay(startOfDay(Date.now()));
      setScreen('home');
      await refresh();
      void prepareMealNotifications();
      void processMeal(meal.id).finally(refresh);
    } catch {
      setCaptureError(t('saveError'));
    } finally {
      setSending(false);
    }
  };

  const retry = async (meal: Meal) => {
    await queueMealRetry(meal.id);
    await refresh();
    void processMeal(meal.id).finally(refresh);
  };

  const answer = async (meal: Meal, value: string) => {
    await answerMealClarification(meal.id, value);
    await refresh();
  };

  const correct = async (value: string) => {
    if (!selectedMeal) return;
    setCorrecting(true);
    try {
      await correctSavedMeal(selectedMeal.id, value);
      await refresh();
    } finally {
      setCorrecting(false);
    }
  };

  const saveMeal = async (capturedAt: number, analysis: MealAnalysis) => {
    if (!selectedMeal) return;
    await updateMeal(selectedMeal.id, { capturedAt, analysis });
    await refresh();
  };

  const removeMeal = async () => {
    if (!selectedMeal) return;
    selectedMeal.photos.forEach(deletePhoto);
    await deleteMeal(selectedMeal.id);
    setSelectedMealId(undefined);
    setScreen('home');
    await refresh();
  };

  const persistGoals = async (nextGoals: DailyGoals) => {
    setSavingGoals(true);
    try {
      await saveDailyGoals(nextGoals);
      await refresh();
    } finally {
      setSavingGoals(false);
    }
  };

  const disconnect = async () => {
    await signOut();
    setAuthenticated(false);
    setScreen('home');
  };

  if (!ready) {
    return <View style={styles.loading}><StatusBar style="dark" /><ActivityIndicator color={color.action} /></View>;
  }

  if (!authenticated) {
    return <ConnectScreen busy={connecting} error={connectionError} onConnect={connect} />;
  }

  if (screen === 'camera') {
    return <><StatusBar style="light" /><CaptureScreen onCancel={() => setScreen(photos.length ? 'review' : 'home')} onCaptured={captured} /></>;
  }

  if (screen === 'review') {
    return (
      <>
        <StatusBar style="dark" />
        <CaptureReviewScreen
          error={captureError}
          note={note}
          photos={photos}
          sending={sending}
          onAddPhoto={openCapture}
          onCancel={discardCapture}
          onNoteChange={setNote}
          onRemovePhoto={removePhoto}
          onSend={sendMeal}
        />
      </>
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        goals={goals}
        saving={savingGoals}
        onBack={() => setScreen('home')}
        onSaveGoals={persistGoals}
        onSignOut={disconnect}
      />
    );
  }

  if (screen === 'detail' && selectedMeal) {
    return (
      <>
        <StatusBar style="dark" />
        <MealDetailScreen
          correcting={correcting}
          meal={selectedMeal}
          onBack={() => setScreen('home')}
          onCorrect={correct}
          onDelete={removeMeal}
          onSave={saveMeal}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <HomeScreen
        canGoNext={canGoNext}
        day={selectedDay}
        goals={goals}
        meals={dayMeals}
        onAnswer={answer}
        onCapture={openCapture}
        onNextDay={() => canGoNext && setSelectedDay(nextDay(selectedDay))}
        onOpen={(meal) => openMeal(meal.id)}
        onPreviousDay={() => setSelectedDay(previousDay(selectedDay))}
        onRetry={retry}
        onSettings={() => setScreen('settings')}
      />
    </>
  );
}

function ConnectScreen(props: { busy: boolean; error: string; onConnect: () => void }) {
  return (
    <SafeAreaView style={styles.connect}>
      <StatusBar style="dark" />
      <View style={styles.connectMark}><Ionicons name="restaurant" size={29} color={color.surface} /></View>
      <Text style={styles.brand}>{t('appName')}</Text>
      <View style={styles.connectCopy}>
        <Text style={styles.connectTitle}>{t('connectTitle')}</Text>
        <Text style={styles.connectBody}>{t('connectBody')}</Text>
      </View>
      <View style={styles.connectAction}>
        {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
        <PrimaryButton busy={props.busy} label={props.busy ? t('connecting') : t('connectAction')} onPress={props.onConnect} />
      </View>
    </SafeAreaView>
  );
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function nextDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + 1);
  return startOfDay(date.getTime());
}

function previousDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() - 1);
  return startOfDay(date.getTime());
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: color.canvas, flex: 1, justifyContent: 'center' },
  connect: { backgroundColor: color.canvas, flex: 1, paddingHorizontal: space.lg, paddingTop: space.xl },
  connectMark: { alignItems: 'center', backgroundColor: color.action, borderRadius: 18, height: 58, justifyContent: 'center', width: 58 },
  brand: { color: color.action, fontSize: 14, fontWeight: '700', marginTop: space.md },
  connectCopy: { marginTop: 'auto', maxWidth: 350 },
  connectTitle: { color: color.ink, fontSize: 34, fontWeight: '700', letterSpacing: -1.2, lineHeight: 39 },
  connectBody: { color: color.muted, fontSize: 16, lineHeight: 23, marginTop: space.md },
  connectAction: { gap: space.sm, marginBottom: space.xl, marginTop: space.xl },
  error: { color: color.error, fontSize: 13, textAlign: 'center' },
});
