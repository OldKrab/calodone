const copy = {
  en: {
    appName: 'CaloDone', today: 'Today', settings: 'Settings', calories: 'Calories', kcal: 'kcal', grams: 'g',
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
    previousDay: 'Previous day', nextDay: 'Next day', emptyPastTitle: 'Nothing logged',
    emptyPastBody: 'No meals were logged on this day.', goal: 'goal', noGoal: 'No goal set',
    dailyGoals: 'Daily goals', goalsBody: 'Optional targets for your daily review.',
    saveGoals: 'Save goals', goalsSaved: 'Goals saved', optional: 'Optional',
    mealDetails: 'Meal details', items: 'Items', fixWithAI: 'Fix with AI',
    fixPlaceholder: 'Two eggs, not three…', applying: 'Updating meal…', editManually: 'Edit manually',
    editMeal: 'Edit meal', saveChanges: 'Save changes', cancel: 'Cancel', addItem: 'Add item',
    itemName: 'Food', quantity: 'Amount', caloriesField: 'Calories', proteinShort: 'P',
    carbsShort: 'C', fatShort: 'F', time: 'Time', mealType: 'Meal type', total: 'Total',
    deleteMeal: 'Delete meal', deleteConfirmTitle: 'Delete this meal?',
    deleteConfirmBody: 'This cannot be undone.', delete: 'Delete', correctionError: 'Couldn’t update the meal. Try again.',
    saveChangesError: 'Check the values and try again.', notificationAnswerError: 'Your answer was not applied. Open the meal and try again.',
    addGoal: 'Set goals', goalsError: 'Couldn’t save goals. Try again.', widgetName: 'Quick capture',
  },
  ru: {
    appName: 'CaloDone', today: 'Сегодня', settings: 'Настройки', calories: 'Калории', kcal: 'ккал', grams: 'г',
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
    previousDay: 'Предыдущий день', nextDay: 'Следующий день', emptyPastTitle: 'Ничего не записано',
    emptyPastBody: 'В этот день приёмов пищи не было.', goal: 'цель', noGoal: 'Цель не задана',
    dailyGoals: 'Дневные цели', goalsBody: 'Необязательные ориентиры на день.',
    saveGoals: 'Сохранить цели', goalsSaved: 'Цели сохранены', optional: 'Необязательно',
    mealDetails: 'Приём пищи', items: 'Состав', fixWithAI: 'Исправить с ИИ',
    fixPlaceholder: 'Было два яйца, не три…', applying: 'Обновляю…', editManually: 'Изменить вручную',
    editMeal: 'Редактирование', saveChanges: 'Сохранить', cancel: 'Отмена', addItem: 'Добавить продукт',
    itemName: 'Продукт', quantity: 'Количество', caloriesField: 'Калории', proteinShort: 'Б',
    carbsShort: 'У', fatShort: 'Ж', time: 'Время', mealType: 'Тип приёма', total: 'Итого',
    deleteMeal: 'Удалить приём пищи', deleteConfirmTitle: 'Удалить этот приём пищи?',
    deleteConfirmBody: 'Отменить это действие нельзя.', delete: 'Удалить',
    correctionError: 'Не удалось обновить. Попробуйте ещё раз.',
    saveChangesError: 'Проверьте значения и попробуйте ещё раз.',
    notificationAnswerError: 'Ответ не применился. Откройте приём пищи и попробуйте ещё раз.',
    addGoal: 'Задать цели', goalsError: 'Не удалось сохранить цели. Попробуйте ещё раз.', widgetName: 'Быстрое фото',
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

export function formatDay(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) return t('today');
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);
}

export function formatPhotoCount(count: number): string {
  if (locale === 'ru') return `${formatNumber(count)} фото`;
  return `${formatNumber(count)} ${count === 1 ? 'photo' : 'photos'}`;
}
