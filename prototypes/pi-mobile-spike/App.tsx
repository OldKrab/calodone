import { StatusBar } from 'expo-status-bar';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { analyzeMealPhoto, isSignedIn, signInWithDeviceCode, signOut } from './src/ai/piClient';
import { checkPiMobileRuntime, type RuntimeCheck } from './src/ai/mobileRuntime';
import { t } from './src/i18n';

type DeviceCode = { code: string; url: string };

export default function App() {
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [checks, setChecks] = useState<RuntimeCheck[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [deviceCode, setDeviceCode] = useState<DeviceCode | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ model: string; text: string } | null>(null);

  const log = (message: string) => {
    setEvents((current) => [message, ...current].slice(0, 20));
  };

  useEffect(() => {
    void isSignedIn()
      .then(setSignedIn)
      .catch((error) => {
        setSignedIn(false);
        log(`${t('error')}: ${String(error)}`);
      });
  }, []);

  const runChecks = async () => {
    setBusy(true);
    try {
      const nextChecks = await checkPiMobileRuntime();
      setChecks(nextChecks);
      log(`${nextChecks.filter((check) => check.ok).length}/${nextChecks.length} runtime checks passed`);
    } finally {
      setBusy(false);
    }
  };

  const login = async () => {
    setBusy(true);
    setDeviceCode(null);
    try {
      await signInWithDeviceCode({
        onEvent: (event) => {
          if (event.type === 'device_code') {
            const next = { code: event.userCode, url: event.verificationUri };
            setDeviceCode(next);
            log(t('deviceCode', next));
            void Linking.openURL(event.verificationUri);
          } else if (event.type === 'progress' || event.type === 'info') {
            log(event.message);
          } else {
            log(`OAuth event: ${event.type}`);
          }
        },
      });
      setSignedIn(true);
      setDeviceCode(null);
      log(t('signedIn'));
    } catch (error) {
      log(`${t('error')}: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      await signOut();
      setSignedIn(false);
      setResult(null);
      log(t('signedOut'));
    } catch (error) {
      log(`${t('error')}: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      log(t('cameraDenied'));
      return;
    }

    const capture = await ImagePicker.launchCameraAsync({
      base64: true,
      exif: false,
      mediaTypes: ['images'],
      quality: 0.6,
    });

    if (capture.canceled) {
      log(t('cancelled'));
      return;
    }

    const asset = capture.assets[0];
    if (!asset?.base64) {
      log(t('noBase64'));
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const response = await analyzeMealPhoto({
        base64: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
        note,
      });
      setResult(response);
      log(`Image request completed with ${response.model}`);
    } catch (error) {
      log(`${t('error')}: ${String(error)}`);
    } finally {
      // ImagePicker camera captures are temporary app files. Delete immediately
      // after the request so this spike does not accumulate meal photos.
      try {
        new File(asset.uri).delete();
        log(t('tempDeleted'));
      } catch (error) {
        log(`${t('error')}: temporary photo cleanup failed: ${String(error)}`);
      }
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('subtitle')}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, signedIn ? styles.ok : styles.muted]} />
          <Text style={styles.statusText}>
            {signedIn === null ? t('checking') : signedIn ? t('signedIn') : t('signedOut')}
          </Text>
          {busy && <ActivityIndicator size="small" color="#1d6b45" />}
        </View>

        <ActionButton label={t('runChecks')} onPress={runChecks} disabled={busy} />
        <ActionButton
          label={signedIn ? t('signOut') : t('signIn')}
          onPress={signedIn ? logout : login}
          disabled={busy || signedIn === null}
        />

        {deviceCode && (
          <Pressable style={styles.codePanel} onPress={() => Linking.openURL(deviceCode.url)}>
            <Text style={styles.code}>{deviceCode.code}</Text>
            <Text style={styles.link}>{t('openLogin')}</Text>
          </Pressable>
        )}

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('notePlaceholder')}
          placeholderTextColor="#798079"
          style={styles.input}
        />
        <ActionButton
          label={t('takePhoto')}
          onPress={takePhoto}
          disabled={busy || !signedIn}
          primary
        />

        {result && (
          <Section title={`${t('result')} · ${result.model}`}>
            <Text style={styles.body}>{result.text}</Text>
          </Section>
        )}

        <Section title={t('diagnostics')}>
          {checks.length === 0 ? (
            <Text style={styles.quiet}>—</Text>
          ) : (
            checks.map((check) => (
              <Text key={check.name} style={check.ok ? styles.pass : styles.fail}>
                {check.ok ? '✓' : '✕'} {check.name}: {check.detail}
              </Text>
            ))
          )}
        </Section>

        <Section title={t('events')}>
          {events.length === 0 ? (
            <Text style={styles.quiet}>—</Text>
          ) : (
            events.map((event, index) => (
              <Text key={`${index}-${event}`} style={styles.event}>
                {event}
              </Text>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton(props: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        props.primary && styles.primaryButton,
        props.disabled && styles.disabledButton,
        pressed && styles.pressedButton,
      ]}
    >
      <Text style={[styles.buttonText, props.primary && styles.primaryButtonText]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f1e8' },
  container: { padding: 24, paddingBottom: 64, gap: 12 },
  title: { color: '#17251d', fontSize: 29, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#526158', fontSize: 15, lineHeight: 21, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  ok: { backgroundColor: '#2e8b57' },
  muted: { backgroundColor: '#a6aaa6' },
  statusText: { color: '#26382d', flex: 1, fontWeight: '600' },
  button: {
    minHeight: 48,
    borderColor: '#708078',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: { backgroundColor: '#1d6b45', borderColor: '#1d6b45' },
  disabledButton: { opacity: 0.4 },
  pressedButton: { opacity: 0.72 },
  buttonText: { color: '#26382d', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  primaryButtonText: { color: '#fffdf7' },
  codePanel: { backgroundColor: '#fff8d8', borderRadius: 12, padding: 16, alignItems: 'center' },
  code: { color: '#342d12', fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  link: { color: '#315e9b', marginTop: 4, textDecorationLine: 'underline' },
  input: {
    minHeight: 48,
    borderColor: '#b5b7ae',
    borderRadius: 12,
    borderWidth: 1,
    color: '#17251d',
    backgroundColor: '#fffdf7',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  section: { borderTopColor: '#c8c7bd', borderTopWidth: 1, marginTop: 10, paddingTop: 14, gap: 7 },
  sectionTitle: { color: '#17251d', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  body: { color: '#26382d', fontSize: 15, lineHeight: 22 },
  quiet: { color: '#8a8e89' },
  pass: { color: '#226840', fontFamily: 'monospace', fontSize: 12 },
  fail: { color: '#a33d35', fontFamily: 'monospace', fontSize: 12 },
  event: { color: '#4e5751', fontFamily: 'monospace', fontSize: 12, lineHeight: 17 },
});
