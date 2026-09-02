const icon = (name) => {
  const paths = {
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    camera: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="4"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    fork: '<path d="M7 3v7m-3-7v4a3 3 0 0 0 6 0V3m-3 7v11M17 3v18m0-18c-2 2-3 5-3 8h3"/>',
    moon: '<path d="M20 15.2A8 8 0 1 1 8.8 4 6.2 6.2 0 0 0 20 15.2Z"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.fork}</svg>`;
};

const copy = {
  en: { today: 'Today', kcal: 'kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', meals: 'Meals', add: 'Add meal', question: 'Question about this meal', questionText: 'Was the white sauce sour cream or mayonnaise?', answer: 'Type an answer', breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', estimated: 'Estimated', needsInput: 'Needs input', settings: 'Settings', goals: 'Daily goals', goalsHelp: 'A quiet reference only. CaloDone never grades your food.', calories: 'Calories', language: 'Language', save: 'Save goals', details: 'Meal details', edit: 'Edit', fix: 'Fix with AI', fixPlaceholder: 'Two eggs, not three…', sent: 'Correction sent', cameraHint: 'Photograph the whole meal', review: '1 photo', note: 'Add a note (optional)', send: 'Send and leave', addPhoto: 'Add photo', queued: 'Meal sent, analyzing in background', accountAi: 'Account & AI', aiProvider: 'AI provider', connected: 'Codex · Connected', tracking: 'Tracking', units: 'Nutrition units', metricUnits: 'kcal · grams', notifications: 'Notifications', questionsFailures: 'Questions and failures', appSection: 'App', dataPrivacy: 'Data & privacy', savedPhotos: 'Photos kept with meals', about: 'About CaloDone', version: 'Version 1.2.0', notificationHelp: 'Choose when CaloDone is allowed to interrupt you.', clarificationNotifications: 'Meal questions', clarificationNotificationsHelp: 'When an answer could materially change the estimate', failedNotifications: 'Failed analysis', failedNotificationsHelp: 'When a meal could not be processed', readyNotifications: 'Meal ready', readyNotificationsHelp: 'After every successful analysis', reminderNotifications: 'Daily reminder', reminderNotificationsHelp: 'A quiet prompt if no meals were logged', on: 'On', off: 'Off', done: 'Done', mealPhotos: 'Meal photos', photoCount: '1 saved photo' },
  ru: { today: 'Сегодня', kcal: 'ккал', protein: 'Белки', carbs: 'Углеводы', fat: 'Жиры', meals: 'Приёмы пищи', add: 'Добавить еду', question: 'Вопрос об этой еде', questionText: 'Белый соус — сметана или майонез?', answer: 'Написать ответ', breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', estimated: 'Оценено', needsInput: 'Нужен ответ', settings: 'Настройки', goals: 'Дневные цели', goalsHelp: 'Только спокойный ориентир. CaloDone не оценивает вашу еду.', calories: 'Калории', language: 'Язык', save: 'Сохранить цели', details: 'Приём пищи', edit: 'Изменить', fix: 'Исправить с ИИ', fixPlaceholder: 'Два яйца, не три…', sent: 'Исправление отправлено', cameraHint: 'Снимите весь приём пищи', review: '1 фото', note: 'Добавить заметку (необязательно)', send: 'Отправить и уйти', addPhoto: 'Ещё фото', queued: 'Еда отправлена, анализируем в фоне', accountAi: 'Аккаунт и ИИ', aiProvider: 'ИИ-провайдер', connected: 'Codex · Подключён', tracking: 'Отслеживание', units: 'Единицы измерения', metricUnits: 'ккал · граммы', notifications: 'Уведомления', questionsFailures: 'Вопросы и ошибки', appSection: 'Приложение', dataPrivacy: 'Данные и приватность', savedPhotos: 'Фото хранятся вместе с едой', about: 'О CaloDone', version: 'Версия 1.2.0', notificationHelp: 'Выберите, когда CaloDone может вас отвлекать.', clarificationNotifications: 'Вопросы о еде', clarificationNotificationsHelp: 'Когда ответ может заметно изменить оценку', failedNotifications: 'Ошибка анализа', failedNotificationsHelp: 'Если еду не удалось обработать', readyNotifications: 'Еда готова', readyNotificationsHelp: 'После каждого успешного анализа', reminderNotifications: 'Ежедневное напоминание', reminderNotificationsHelp: 'Если за день ничего не добавлено', on: 'Вкл.', off: 'Выкл.', done: 'Готово', mealPhotos: 'Фотографии еды', photoCount: '1 сохранённое фото' },
};

const state = { screen: 'home', lang: 'en', toast: '', answered: false, notifications: { questions: true, failed: true, ready: false, reminder: false } };
const t = (key) => copy[state.lang][key];
const app = document.querySelector('#app');

function shell(content, extra = '') { return `<div class="device ${extra}">${content}${state.toast ? `<div class="toast">${state.toast}</div>` : ''}</div>`; }
function btnIcon(name, label, action) { return `<button class="icon-btn" aria-label="${label}" data-action="${action}">${icon(name)}</button>`; }

function home() {
  return shell(`<section class="screen">
    <header class="topbar">
      <div><p class="eyebrow">CaloDone</p><div class="day-nav">${btnIcon('back','Previous day','past')}<h1>${t('today')}</h1>${btnIcon('next','Next day','today')}</div></div>
      ${btnIcon('settings',t('settings'),'settings')}
    </header>
    <section class="summary"><p class="calories">1,326 / 2,000 <span class="unit">${t('kcal')}</span></p><div class="track"><span></span></div>
      <div class="macro-row"><div class="macro"><strong>74 / 120 g</strong><small>${t('protein')}</small></div><div class="macro"><strong>139 / 220 g</strong><small>${t('carbs')}</small></div><div class="macro"><strong>52 / 65 g</strong><small>${t('fat')}</small></div></div>
    </section>
    ${state.answered ? '' : `<section class="question"><button class="question-meal" data-action="detail"><span class="mini-photo">${foodPlate()}</span><span><strong>${t('lunch')}</strong><small>13:05 · 612 ${t('kcal')}</small></span><b aria-hidden="true">›</b></button><p class="question-label">✦ ${t('question')}</p><p class="question-text">${t('questionText')}</p><div class="composer"><input id="answer" placeholder="${t('answer')}"/><button class="send-circle" data-action="answer" aria-label="Send">↑</button></div></section>`}
    <div class="row section-title"><h2>${t('meals')}</h2><span class="count">3</span></div>
    <div class="meal-list">
      ${meal('sun',t('breakfast'),'08:20','Oatmeal, blueberries, yogurt','438')}
      ${meal('fork',t('lunch'),'13:05','Chicken, buckwheat, cucumber salad','612',true)}
      ${meal('moon',t('dinner'),'19:18','Toast, eggs, avocado','276')}
    </div>
    <div class="capture-dock"><button class="primary" data-action="camera">${icon('camera')} ${t('add')}</button></div>
  </section>`);
}

function meal(symbol, title, time, items, kcal, pending = false) {
  return `<button class="meal" data-action="detail"><span class="meal-icon">${icon(symbol)}</span><span class="meal-copy"><span class="meal-head"><span class="meal-title">${title}</span><span class="meal-kcal">${kcal} ${t('kcal')}</span></span><span class="meal-meta"><span>${time}</span><span class="status">${pending ? '<i class="dot"></i>' + t('needsInput') : t('estimated')}</span></span><span class="meal-items">${items}</span></span></button>`;
}

function foodPlate() { return '<i class="tiny-plate"><i class="tiny-food one"></i><i class="tiny-food two"></i><i class="tiny-food three"></i></i>'; }

function detail() {
  const items = state.lang === 'ru'
    ? [['Куриная грудка','170 г','280'],['Гречка','180 г','198'],['Салат из огурцов','150 г','74'],['Сметана','30 г','60']]
    : [['Chicken breast','170 g','280'],['Buckwheat','180 g','198'],['Cucumber salad','150 g','74'],['Sour cream','30 g','60']];
  return shell(`<section class="screen detail"><header class="header">${btnIcon('back','Back','home')}<h2>${t('details')}</h2><button class="header-action" data-action="edit">${t('edit')}</button></header>
    <p class="meal-type">${t('lunch')} · 13:05</p><h1 class="detail-title">${state.lang === 'ru' ? 'Курица с гречкой и салатом' : 'Chicken, buckwheat & salad'}</h1>
    <section class="saved-photos" aria-label="${t('mealPhotos')}"><div class="saved-photo">${foodPlate()}<span>${t('photoCount')}</span></div></section>
    <div class="detail-total"><strong>612 ${t('kcal')}</strong><span>P 48 · C 58 · F 21</span></div>
    <div>${items.map(i => `<div class="food-row"><div><strong>${i[0]}</strong><small>${i[1]}</small></div><div class="food-nutrition"><strong>${i[2]} ${t('kcal')}</strong><small>P 12 · C 8 · F 4</small></div></div>`).join('')}</div>
    <section class="ai-fix"><p class="ai-label">✦ ${t('fix')}</p><div class="composer"><input id="fix" placeholder="${t('fixPlaceholder')}"/><button class="send-circle" data-action="fix" aria-label="Send">↑</button></div></section>
  </section>`);
}

function settings() {
  return shell(`<section class="screen settings"><header class="header settings-header">${btnIcon('back','Back','home')}<h2>${t('settings')}</h2><span></span></header>
    ${settingsSection(t('accountAi'), settingsLink(t('aiProvider'), t('connected'), 'provider'))}
    ${settingsSection(t('tracking'), settingsLink(t('goals'), `2000 ${t('kcal')}`, 'goals') + settingsLink(t('units'), t('metricUnits'), 'units') + settingsLink(t('notifications'), t('questionsFailures'), 'notifications'))}
    ${settingsSection(t('appSection'), settingsLink(t('language'), state.lang === 'en' ? 'English' : 'Русский', 'language') + settingsLink(t('dataPrivacy'), t('savedPhotos'), 'privacy') + settingsLink(t('about'), t('version'), 'about'))}
  </section>`);
}
function settingsSection(title, content) { return `<section class="settings-section"><h3>${title}</h3><div class="settings-panel">${content}</div></section>`; }
function settingsLink(label, value, action) { return `<button class="settings-link" data-action="${action}"><span><strong>${label}</strong><small>${value}</small></span><b aria-hidden="true">›</b></button>`; }

function goals() {
  return shell(`<section class="screen settings"><header class="header">${btnIcon('back','Back','settings')}<h2>${t('goals')}</h2><span></span></header><p class="settings-copy detail-copy">${t('goalsHelp')}</p>
    <div class="settings-panel goal-panel">${setting(t('calories'),'2000 ' + t('kcal'))}${setting(t('protein'),'120 g')}${setting(t('carbs'),'220 g')}${setting(t('fat'),'65 g')}</div>
    <div class="settings-primary"><button class="primary" data-action="save">${t('save')}</button></div>
  </section>`);
}

function notifications() {
  return shell(`<section class="screen settings"><header class="header">${btnIcon('back','Back','settings')}<h2>${t('notifications')}</h2><span></span></header><p class="settings-copy detail-copy">${t('notificationHelp')}</p>
    <div class="settings-panel notification-panel">
      ${toggleSetting('questions', t('clarificationNotifications'), t('clarificationNotificationsHelp'))}
      ${toggleSetting('failed', t('failedNotifications'), t('failedNotificationsHelp'))}
      ${toggleSetting('ready', t('readyNotifications'), t('readyNotificationsHelp'))}
      ${toggleSetting('reminder', t('reminderNotifications'), t('reminderNotificationsHelp'))}
    </div>
    <button class="text-action" data-action="settings">${t('done')}</button>
  </section>`);
}

function setting(label, value) { return `<label class="setting-row"><span>${label}</span><input value="${value}" aria-label="${label}"/></label>`; }
function toggleSetting(key, label, help) {
  const checked = state.notifications[key];
  return `<div class="toggle-row"><span><strong>${label}</strong><small>${help}</small></span><button class="toggle ${checked ? 'checked' : ''}" role="switch" aria-checked="${checked}" aria-label="${label}" data-action="toggle-${key}"><i></i></button></div>`;
}

function camera() {
  return shell(`<section class="camera-screen"><header class="camera-top">${btnIcon('close','Close','home')}<span></span></header><div class="viewfinder"><div class="plate"><i class="food one"></i><i class="food two"></i><i class="food three"></i></div><span class="camera-hint">${t('cameraHint')}</span></div><div class="camera-actions"><span class="camera-side"></span><button class="shutter" data-action="capture" aria-label="Take photo"></button><span class="camera-side">1×</span></div></section>`, 'camera');
}

function review() {
  return shell(`<section class="screen detail"><header class="header">${btnIcon('close','Close','home')}<h2>${t('review')}</h2><span></span></header><div class="review-photo"><div class="plate"><i class="food one"></i><i class="food two"></i><i class="food three"></i></div></div><div class="thumbs"><span class="thumb"></span><button class="add-photo" data-action="camera">${t('addPhoto')}</button></div><input class="review-note" placeholder="${t('note')}"/><div style="margin-top:12px"><button class="primary" data-action="send">${t('send')} ↑</button></div></section>`);
}

function render() {
  app.innerHTML = ({ home, detail, settings, goals, notifications, camera, review }[state.screen] || home)();
  document.documentElement.lang = state.lang;
}

function showToast(message) { state.toast = message; render(); window.setTimeout(() => { state.toast = ''; render(); }, 1800); }

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (['home','detail','settings','goals','notifications','camera','review'].includes(action)) state.screen = action;
  if (action === 'capture') state.screen = 'review';
  if (action === 'language') state.lang = state.lang === 'en' ? 'ru' : 'en';
  if (action.startsWith('toggle-')) state.notifications[action.slice(7)] = !state.notifications[action.slice(7)];
  if (action === 'answer') { state.answered = true; showToast(state.lang === 'ru' ? 'Ответ отправлен' : 'Answer sent'); return; }
  if (action === 'fix') { showToast(t('sent')); return; }
  if (action === 'send') { state.screen = 'home'; showToast(t('queued')); return; }
  if (action === 'save') { state.screen = 'home'; showToast(state.lang === 'ru' ? 'Цели сохранены' : 'Goals saved'); return; }
  if (['provider','units','privacy','about'].includes(action)) { showToast(state.lang === 'ru' ? 'Экран появится в приложении' : 'This screen will live in the app'); return; }
  if (action === 'edit') { showToast(state.lang === 'ru' ? 'Ручной редактор: следующий экран' : 'Manual editor: next screen'); return; }
  render();
});

render();
