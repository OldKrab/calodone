const copy = {
  en: {
    appName: 'CaloDone', today: 'Today', settings: 'Settings', calories: 'Calories', kcal: 'kcal',
    ofGoal: '{{current}} of {{goal}} kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
    macroValue: '{{name}} {{value}} g', meals: 'Meals', addMeal: 'Add meal',
    emptyTitle: 'Nothing logged yet', emptyBody: 'Your next meal is one tap away.',
    analyzing: 'Analyzing', queued: 'Queued', needsInput: 'Needs input', failed: 'Couldn’t analyze',
    retry: 'Try again', estimated: 'Estimated', breakfast: 'Breakfast', lunch: 'Lunch',
    dinner: 'Dinner', snack: 'Snack', meal: 'Meal', clarificationTitle: 'One quick detail',
    answerPlaceholder: 'Type your answer', answer: 'Answer', connectTitle: 'Connect your AI',
    connectBody: 'CaloDone uses your ChatGPT subscription to recognize meals.',
    connectAction: 'Continue with ChatGPT', connecting: 'Opening ChatGPT…',
    connectionError: 'Couldn’t connect. Try again.', cameraPermissionTitle: 'Camera access needed',
    cameraPermissionBody: 'CaloDone photographs meals without saving them to your gallery.',
    allowCamera: 'Allow camera', close: 'Close', flashOn: 'Flash on', flashOff: 'Flash off',
    takePhoto: 'Take photo', photoCount: '{{count}} photos', addPhoto: 'Add photo',
    removePhoto: 'Remove photo', notePlaceholder: 'Add a detail, if useful', send: 'Send',
    captureError: 'Couldn’t take the photo. Try again.',
    saveError: 'Couldn’t save this meal. Your photos are still here.', sent: 'Meal sent',
    notificationChannel: 'Meal results', notificationReadyTitle: 'Meal ready',
    notificationReadyBody: 'Your meal has been added.', notificationQuestionTitle: 'One quick detail',
    notificationQuestionBody: 'Answer one question to improve your meal estimate.',
    signOut: 'Sign out', signedInAs: 'Connected to ChatGPT', back: 'Back',
    settingsBody: 'Your photos stay private and are removed after analysis.',
  },
  ru: {
    appName: 'CaloDone', today: 'Сегодня', settings: 'Настройки', calories: 'Калории', kcal: 'ккал',
    ofGoal: '{{current}} из {{goal}} ккал', protein: 'Белки', carbs: 'Углеводы', fat: 'Жиры',
    macroValue: '{{name}} {{value}} г', meals: 'Приёмы пищи', addMeal: 'Добавить еду',
    emptyTitle: 'Пока ничего', emptyBody: 'Следующий приём пищи — в одно касание.',
    analyzing: 'Распознаю', queued: 'В очереди', needsInput: 'Нужно уточнение',
    failed: 'Не удалось распознать', retry: 'Повторить', estimated: 'Оценка', breakfast: 'Завтрак',
    lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус', meal: 'Приём пищи',
    clarificationTitle: 'Одно уточнение', answerPlaceholder: 'Напишите ответ', answer: 'Ответить',
    connectTitle: 'Подключите ИИ',
    connectBody: 'CaloDone использует вашу подписку ChatGPT для распознавания еды.',
    connectAction: 'Войти через ChatGPT', connecting: 'Открываю ChatGPT…',
    connectionError: 'Не удалось подключиться. Попробуйте ещё раз.',
    cameraPermissionTitle: 'Нужен доступ к камере',
    cameraPermissionBody: 'CaloDone фотографирует еду, не сохраняя снимки в галерею.',
    allowCamera: 'Разрешить камеру', close: 'Закрыть', flashOn: 'Вспышка включена',
    flashOff: 'Вспышка выключена', takePhoto: 'Сфотографировать', photoCount: '{{count}} фото',
    addPhoto: 'Ещё фото', removePhoto: 'Удалить фото',
    notePlaceholder: 'Добавьте деталь, если нужно', send: 'Отправить',
    captureError: 'Не удалось сделать фото. Попробуйте ещё раз.',
    saveError: 'Не удалось сохранить. Ваши фото остались на месте.', sent: 'Еда отправлена',
    notificationChannel: 'Результаты распознавания', notificationReadyTitle: 'Готово',
    notificationReadyBody: 'Приём пищи добавлен.', notificationQuestionTitle: 'Одно уточнение',
    notificationQuestionBody: 'Ответьте на один вопрос, чтобы улучшить оценку.',
    signOut: 'Выйти', signedInAs: 'Подключено к ChatGPT', back: 'Назад',
    settingsBody: 'Фото остаются приватными и удаляются после распознавания.',
  },
} as const;

export type CopyKey = keyof typeof copy.en;
export type Locale = keyof typeof copy;

export const locale: Locale = Intl.DateTimeFormat().resolvedOptions().locale.startsWith('ru')
  ? 'ru'
  : 'en';

export function t(key: CopyKey, values?: Record<string, string | number>): string {
  let value: string = copy[locale][key];
  for (const [name, replacement] of Object.entries(values ?? {})) {
    value = value.replace(`{{${name}}}`, String(replacement));
  }
  return value;
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(timestamp);
}
