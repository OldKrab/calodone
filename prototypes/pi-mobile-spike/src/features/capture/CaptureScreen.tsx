import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconButton } from '../../components/controls';
import { color, radius, space } from '../../design/tokens';
import type { MealPhoto } from '../../domain/meal';
import { t } from '../../i18n';

export function CaptureScreen(props: {
  onCancel: () => void;
  onCaptured: (photo: MealPhoto) => void;
}) {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [error, setError] = useState('');

  const capture = async () => {
    if (!ready || taking) return;
    setTaking(true);
    setError('');
    try {
      const result = await camera.current?.takePictureAsync({ quality: 0.72 });
      if (!result?.uri) throw new Error('Camera returned no image');
      props.onCaptured({ uri: result.uri, mimeType: 'image/jpeg' });
    } catch {
      setError(t('captureError'));
      setTaking(false);
    }
  };

  if (!permission) {
    return <View style={styles.permission}><ActivityIndicator color={color.action} /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={30} color={color.ink} />
        </View>
        <Text style={styles.permissionTitle}>{t('cameraPermissionTitle')}</Text>
        <Text style={styles.permissionBody}>{t('cameraPermissionBody')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestPermission}
          style={({ pressed }) => [styles.permissionAction, pressed && styles.pressed]}
        >
          <Text style={styles.permissionActionText}>{t('allowCamera')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onCancel} hitSlop={12}>
          <Text style={styles.cancel}>{t('close')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={camera}
        facing="back"
        flash={flash}
        onCameraReady={() => setReady(true)}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.chrome} pointerEvents="box-none">
        <View style={styles.topBar}>
          <IconButton icon="close" label={t('close')} inverted onPress={props.onCancel} />
          <IconButton
            icon={flash === 'on' ? 'flash' : 'flash-off'}
            label={flash === 'on' ? t('flashOn') : t('flashOff')}
            inverted
            selected={flash === 'on'}
            onPress={() => setFlash((current) => current === 'on' ? 'off' : 'on')}
          />
        </View>
        <View style={styles.bottomBar}>
          {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpace} />}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('takePhoto')}
            disabled={!ready || taking}
            onPress={capture}
            style={({ pressed }) => [
              styles.shutterOuter,
              (!ready || taking) && styles.shutterDisabled,
              pressed && styles.shutterPressed,
            ]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.errorSpace} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.camera, flex: 1 },
  chrome: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, paddingTop: space.sm },
  bottomBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 30, paddingHorizontal: space.xl },
  shutterOuter: { alignItems: 'center', borderColor: color.cameraText, borderRadius: 42, borderWidth: 4, height: 82, justifyContent: 'center', width: 82 },
  shutterInner: { backgroundColor: color.cameraText, borderRadius: 34, height: 64, width: 64 },
  shutterDisabled: { opacity: 0.45 },
  shutterPressed: { transform: [{ scale: 0.92 }] },
  error: { color: color.cameraText, fontSize: 12, textAlign: 'center', width: 96 },
  errorSpace: { width: 96 },
  permission: { alignItems: 'center', backgroundColor: color.canvas, flex: 1, justifyContent: 'center', padding: space.xl },
  permissionIcon: { alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.round, height: 68, justifyContent: 'center', width: 68 },
  permissionTitle: { color: color.ink, fontSize: 22, fontWeight: '700', marginTop: space.lg },
  permissionBody: { color: color.muted, fontSize: 15, lineHeight: 22, marginTop: space.sm, maxWidth: 310, textAlign: 'center' },
  permissionAction: { backgroundColor: color.action, borderRadius: radius.round, marginTop: space.xl, paddingHorizontal: 24, paddingVertical: 15 },
  permissionActionText: { color: color.surface, fontSize: 16, fontWeight: '700' },
  cancel: { color: color.muted, fontSize: 15, marginTop: space.lg },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
