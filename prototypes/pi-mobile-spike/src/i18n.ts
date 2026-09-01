const messages = {
  en: {
    title: 'CaloDone · Pi mobile spike',
    subtitle: 'Tests native Codex login, secure tokens, camera input, and streaming.',
    runChecks: 'Run compatibility checks',
    signIn: 'Sign in with ChatGPT',
    signOut: 'Sign out',
    takePhoto: 'Take and analyze a meal photo',
    choosePhoto: 'Choose a test photo (simulator)',
    notePlaceholder: 'Optional note, e.g. “the sauce is yogurt”',
    signedIn: 'Signed in',
    signedOut: 'Signed out',
    checking: 'Checking…',
    working: 'Working…',
    deviceCode: 'Enter code {{code}} at {{url}}',
    openLogin: 'Open ChatGPT login',
    result: 'Model response',
    diagnostics: 'Runtime diagnostics',
    events: 'Event log',
    cameraDenied: 'Camera permission was denied.',
    noBase64: 'The camera did not return image data.',
    tempDeleted: 'Temporary camera file deleted.',
    cancelled: 'Camera cancelled.',
    error: 'Error',
  },
  ru: {
    title: 'CaloDone · мобильный тест Pi',
    subtitle: 'Проверяет вход Codex, безопасное хранение, камеру и стриминг.',
    runChecks: 'Проверить совместимость',
    signIn: 'Войти через ChatGPT',
    signOut: 'Выйти',
    takePhoto: 'Снять и распознать еду',
    choosePhoto: 'Выбрать тестовое фото (симулятор)',
    notePlaceholder: 'Необязательно: например, «соус из йогурта»',
    signedIn: 'Вход выполнен',
    signedOut: 'Вход не выполнен',
    checking: 'Проверяем…',
    working: 'Работаем…',
    deviceCode: 'Введите код {{code}} на {{url}}',
    openLogin: 'Открыть вход ChatGPT',
    result: 'Ответ модели',
    diagnostics: 'Диагностика среды',
    events: 'Журнал событий',
    cameraDenied: 'Нет разрешения на камеру.',
    noBase64: 'Камера не вернула изображение.',
    tempDeleted: 'Временный файл камеры удалён.',
    cancelled: 'Съёмка отменена.',
    error: 'Ошибка',
  },
} as const;

type MessageKey = keyof typeof messages.en;
const language = Intl.DateTimeFormat().resolvedOptions().locale.startsWith('ru')
  ? 'ru'
  : 'en';

export function t(key: MessageKey, values?: Record<string, string>): string {
  let text: string = messages[language][key];
  for (const [name, value] of Object.entries(values ?? {})) {
    text = text.replace(`{{${name}}}`, value);
  }
  return text;
}
