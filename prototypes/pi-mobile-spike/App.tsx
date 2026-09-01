import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { isSignedIn, signInWithBrowser, signOut } from './src/ai/piClient';
import { IconButton, PrimaryButton } from './src/components/controls';
import {
  createMeal,
  finalizeExpiredClarifications,
  initializeMeals,
  listMeals,
} from './src/data/mealRepository';
import { color, radius, space } from './src/design/tokens';
import type { Meal, MealPhoto } from './src/domain/meal';
import { CaptureReviewScreen } from './src/features/capture/CaptureReviewScreen';
import { CaptureScreen } from './src/features/capture/CaptureScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { t } from './src/i18n';
import { answerMealClarification, prepareMealNotifications, processMeal } from './src/services/mealProcessor';

type Screen = 'home' | 'camera' | 'review' | 'settings';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [photos, setPhotos] = useState<MealPhoto[]>([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [captureError, setCaptureError] = useState('');

  const refresh = useCallback(async () => {
    await finalizeExpiredClarifications();
    setMeals(await listMeals());
  }, []);

  useEffect(() => {
    void (async () => {
      await initializeMeals();
      const signedIn = await isSignedIn();
      setAuthenticated(signedIn);
      await refresh();
      setReady(true);

      if (signedIn) {
        const pending = (await listMeals()).filter(
          (meal) => meal.status === 'queued' || meal.status === 'analyzing',
        );
        for (const meal of pending) void processMeal(meal.id).finally(refresh);
      }
    })().catch(() => setReady(true));
  }, [refresh]);

  const connect = async () => {
    setConnecting(true);
    setConnectionError('');
    try {
      await signInWithBrowser({ onEvent: () => undefined });
      setAuthenticated(true);
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

  const retry = (meal: Meal) => {
    void processMeal(meal.id).finally(refresh);
    void refresh();
  };

  const answer = (meal: Meal, value: string) => {
    void answerMealClarification(meal.id, value).finally(refresh);
    void refresh();
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
    return <SettingsScreen onBack={() => setScreen('home')} onSignOut={disconnect} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <HomeScreen
        meals={meals}
        onAnswer={answer}
        onCapture={openCapture}
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

function SettingsScreen(props: { onBack: () => void; onSignOut: () => void }) {
  return (
    <SafeAreaView style={styles.settings}>
      <StatusBar style="dark" />
      <View style={styles.settingsHeader}>
        <IconButton icon="arrow-back" label={t('back')} onPress={props.onBack} />
        <Text style={styles.settingsTitle}>{t('settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.settingsBody}>
        <View style={styles.connectionRow}>
          <View style={styles.connectionIcon}><Ionicons name="checkmark" size={18} color={color.success} /></View>
          <Text style={styles.connectionText}>{t('signedInAs')}</Text>
        </View>
        <Text style={styles.privacy}>{t('settingsBody')}</Text>
        <Pressable accessibilityRole="button" onPress={props.onSignOut} hitSlop={10}>
          <Text style={styles.signOut}>{t('signOut')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
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
  settings: { backgroundColor: color.canvas, flex: 1 },
  settingsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, paddingTop: space.sm },
  settingsTitle: { color: color.ink, fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 48 },
  settingsBody: { paddingHorizontal: space.lg, paddingTop: space.xl },
  connectionRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  connectionIcon: { alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.round, height: 38, justifyContent: 'center', width: 38 },
  connectionText: { color: color.ink, fontSize: 16, fontWeight: '600' },
  privacy: { color: color.muted, fontSize: 14, lineHeight: 21, marginTop: space.lg, maxWidth: 330 },
  signOut: { color: color.error, fontSize: 15, fontWeight: '600', marginTop: space.xl },
});
