import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IconButton, PrimaryButton } from '../../components/controls';
import { color, motion, radius, space } from '../../design/tokens';
import type { MealPhoto } from '../../domain/meal';
import { t } from '../../i18n';

export function CaptureReviewScreen(props: {
  photos: MealPhoto[];
  note: string;
  sending: boolean;
  error?: string;
  onNoteChange: (note: string) => void;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onCancel: () => void;
  onSend: () => void;
}) {
  const [selected, setSelected] = useState(props.photos.length - 1);
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelected((current) => Math.min(current, props.photos.length - 1));
  }, [props.photos.length]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return reveal.setValue(1);
      Animated.timing(reveal, {
        duration: motion.screen,
        easing: motion.easeOut,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  }, [reveal]);

  const photo = props.photos[selected] ?? props.photos[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <Animated.View style={[
          styles.screen,
          { opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}>
          <View style={styles.header}>
            <IconButton icon="close" label={t('close')} onPress={props.onCancel} />
            <Text style={styles.photoCount}>{t('photoCount', { count: props.photos.length })}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.previewFrame}>
            {photo && <Image source={{ uri: photo.uri }} resizeMode="cover" style={styles.preview} />}
          </View>

          <View style={styles.thumbnailsRow}>
            <ScrollView
              horizontal
              contentContainerStyle={styles.thumbnails}
              showsHorizontalScrollIndicator={false}
            >
              {props.photos.map((item, index) => (
                <Pressable
                  key={`${item.uri}-${index}`}
                  accessibilityRole="button"
                  onPress={() => setSelected(index)}
                  style={[styles.thumbnailFrame, selected === index && styles.thumbnailSelected]}
                >
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('addPhoto')}
                onPress={props.onAddPhoto}
                style={({ pressed }) => [styles.addThumbnail, pressed && styles.pressed]}
              >
                <Ionicons name="camera-outline" size={23} color={color.ink} />
                <Text style={styles.addThumbnailText}>{t('addPhoto')}</Text>
              </Pressable>
            </ScrollView>
            {props.photos.length > 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('removePhoto')}
                hitSlop={10}
                onPress={() => props.onRemovePhoto(selected)}
                style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={19} color={color.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.composer}>
            <TextInput
              maxLength={300}
              onChangeText={props.onNoteChange}
              placeholder={t('notePlaceholder')}
              placeholderTextColor={color.muted}
              style={styles.input}
              value={props.note}
            />
            {props.error && <Text style={styles.error}>{props.error}</Text>}
            <PrimaryButton
              busy={props.sending}
              disabled={props.photos.length === 0}
              icon="arrow-up"
              label={t('send')}
              onPress={props.onSend}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: color.canvas, flex: 1 },
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: space.sm },
  headerSpacer: { width: 48 },
  photoCount: { color: color.ink, fontSize: 14, fontWeight: '600' },
  previewFrame: { backgroundColor: color.camera, borderRadius: radius.image, flex: 1, marginHorizontal: space.lg, overflow: 'hidden' },
  preview: { height: '100%', width: '100%' },
  thumbnailsRow: { alignItems: 'center', flexDirection: 'row', marginTop: space.md, minHeight: 62, paddingHorizontal: space.lg },
  thumbnails: { alignItems: 'center', gap: space.sm, paddingRight: space.sm },
  thumbnailFrame: { borderColor: 'transparent', borderRadius: 12, borderWidth: 2, height: 58, overflow: 'hidden', width: 58 },
  thumbnailSelected: { borderColor: color.action },
  thumbnail: { height: '100%', width: '100%' },
  addThumbnail: { alignItems: 'center', backgroundColor: color.surface, borderRadius: 12, flexDirection: 'row', gap: 7, height: 56, paddingHorizontal: 14 },
  addThumbnailText: { color: color.ink, fontSize: 13, fontWeight: '600' },
  remove: { alignItems: 'center', height: 44, justifyContent: 'center', marginLeft: 'auto', width: 42 },
  composer: { gap: space.sm, paddingHorizontal: space.lg, paddingBottom: 20, paddingTop: space.md },
  input: { backgroundColor: color.surface, borderRadius: radius.control, color: color.ink, fontSize: 15, height: 50, paddingHorizontal: 16 },
  error: { color: color.error, fontSize: 13 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.96 }] },
});
