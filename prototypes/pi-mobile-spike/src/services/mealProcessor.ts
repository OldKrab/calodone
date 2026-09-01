import { File } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { analyzeMealPhotos, refineMealAnalysis } from '../ai/piClient';
import { getMeal, saveMealAnalysis, setMealStatus } from '../data/mealRepository';
import { parseMealAnalysis } from '../domain/meal';
import { locale, t } from '../i18n';

const processing = new Set<string>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function prepareMealNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meal-results', {
      name: t('notificationChannel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted && current.canAskAgain) {
    await Notifications.requestPermissionsAsync();
  }
}

async function notifyResult(needsInput: boolean): Promise<void> {
  if (AppState.currentState === 'active') return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: needsInput ? t('notificationQuestionTitle') : t('notificationReadyTitle'),
      body: needsInput ? t('notificationQuestionBody') : t('notificationReadyBody'),
    },
    trigger: null,
  });
}

function removePrivatePhotos(uris: string[]): void {
  for (const uri of uris) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Cleanup is best effort. Expo may already have evicted a cache file.
    }
  }
}

export async function processMeal(id: string): Promise<void> {
  if (processing.has(id)) return;
  processing.add(id);
  try {
    const meal = await getMeal(id);
    if (!meal || meal.photos.length === 0) throw new Error('Meal photos are unavailable');
    await setMealStatus(id, 'analyzing');
    const photos = await Promise.all(meal.photos.map(async (photo) => ({
      base64: await new File(photo.uri).base64(),
      mimeType: photo.mimeType,
    })));
    const result = await analyzeMealPhotos({
      photos,
      note: meal.note,
      language: locale === 'ru' ? 'Russian' : 'English',
    });
    const analysis = parseMealAnalysis(result.text);
    await saveMealAnalysis(id, analysis);
    removePrivatePhotos(meal.photos.map((photo) => photo.uri));
    await notifyResult(Boolean(analysis.clarification));
  } catch (error) {
    await setMealStatus(id, 'failed', error instanceof Error ? error.message : String(error));
  } finally {
    processing.delete(id);
  }
}

export async function answerMealClarification(id: string, answer: string): Promise<void> {
  const meal = await getMeal(id);
  const clarification = meal?.analysis?.clarification;
  if (!meal?.analysis || !clarification) return;

  await setMealStatus(id, 'analyzing');
  try {
    const result = await refineMealAnalysis({
      previousJson: JSON.stringify(meal.analysis),
      question: clarification.question,
      answer,
      language: locale === 'ru' ? 'Russian' : 'English',
    });
    const analysis = parseMealAnalysis(result.text);
    delete analysis.clarification;
    await saveMealAnalysis(id, analysis);
  } catch (error) {
    await setMealStatus(
      id,
      'needs_input',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}
