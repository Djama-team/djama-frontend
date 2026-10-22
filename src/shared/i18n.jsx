import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Add a language = add a block here. Keys are used as t('section.key').
const dict = {
  ru: {
    'app.tagline': 'Djama — всегда на связи со своими',
    'auth.login': 'Войти', 'auth.register': 'Создать аккаунт',
    'auth.username': 'Имя пользователя', 'auth.usernameOrEmail': 'Имя пользователя или e-mail',
    'auth.displayName': 'Отображаемое имя', 'auth.email': 'E-mail', 'auth.password': 'Пароль',
    'auth.noAccount': 'Нет аккаунта?', 'auth.haveAccount': 'Уже есть аккаунт?',
    'nav.chats': 'Чаты', 'nav.contacts': 'Контакты', 'nav.notifications': 'Уведомления', 'nav.profile': 'Профиль',
    'chat.empty': 'Выберите чат или начните новый', 'chat.noChats': 'Пока нет чатов. Найдите человека во вкладке «Контакты».',
    'chat.search': 'Поиск чатов', 'chat.filter.all': 'Все', 'chat.filter.unread': 'Непрочитанные', 'chat.filter.groups': 'Группы',
    'chat.noResults': 'Ничего не найдено',
    'chat.typeMessage': 'Напишите сообщение…', 'chat.send': 'Отправить', 'chat.typing': 'печатает…',
    'chat.loadOlder': 'Загрузить ранее', 'chat.deleted': 'Сообщение удалено', 'chat.delete': 'Удалить',
    'chat.online': 'в сети', 'chat.offline': 'не в сети', 'chat.members': 'Участники',
    'chat.reconnecting': 'Нет соединения. Переподключаемся…', 'chat.you': 'Вы',
    'chat.photo': 'Фото', 'chat.file': 'Файл', 'chat.voice': 'Голосовое сообщение',
    'chat.reply': 'Ответить', 'chat.copy': 'Копировать', 'chat.edit': 'Изменить', 'chat.edited': 'изменено',
    'chat.editing': 'Редактирование сообщения', 'chat.replyingTo': 'Ответ для',
    'chat.attachPhoto': 'Фото и видео', 'chat.attachFile': 'Документ',
    'chat.recording': 'Запись…', 'chat.micDenied': 'Нет доступа к микрофону. Разрешите его в браузере.',
    'chat.caption': 'Добавить подпись…', 'chat.dropHere': 'Перетащите файлы сюда',
    'chat.scrollDown': 'Вниз', 'chat.tooBig': 'Файл слишком большой (максимум 25 МБ)', 'chat.speed': 'Скорость',
    'call.audio': 'Голосовой звонок', 'call.video': 'Видеозвонок', 'call.missed': 'Пропущенный звонок',
    'call.noAnswer': 'Нет ответа', 'call.declined': 'Звонок отклонён',
    'call.incomingAudio': 'Входящий голосовой звонок', 'call.incomingVideo': 'Входящий видеозвонок',
    'call.calling': 'Вызов…', 'call.connecting': 'Соединение…', 'call.accept': 'Принять', 'call.decline': 'Отклонить',
    'call.end': 'Завершить', 'call.mute': 'Выключить микрофон', 'call.unmute': 'Включить микрофон',
    'call.cameraOff': 'Выключить камеру', 'call.cameraOn': 'Включить камеру',
    'call.noMedia': 'Нет доступа к микрофону или камере. Разрешите их в браузере.',
    'call.ended': 'Звонок завершён', 'call.start.audio': 'Голосовой звонок', 'call.start.video': 'Видеозвонок',
    'contacts.search': 'Найти пользователя…', 'contacts.add': 'Добавить', 'contacts.message': 'Написать',
    'contacts.block': 'Заблокировать', 'contacts.unblock': 'Разблокировать', 'contacts.remove': 'Удалить',
    'contacts.list': 'Мои контакты', 'contacts.blocked': 'Заблокированные', 'contacts.none': 'Контактов пока нет',
    'groups.new': 'Новая группа', 'groups.title': 'Название группы', 'groups.create': 'Создать группу',
    'groups.info': 'О группе', 'groups.members': 'Участники', 'groups.addMember': 'Добавить участников',
    'groups.leave': 'Выйти из группы', 'groups.admin': 'админ', 'groups.makeAdmin': 'Сделать админом',
    'groups.makeMember': 'Снять права админа', 'groups.rename': 'Переименовать', 'groups.remove': 'Исключить',
    'groups.search': 'Найти по имени или логину…', 'groups.noneFound': 'Никого не найдено',
    'groups.addSelected': 'Добавить выбранных',
    'notif.empty': 'Уведомлений нет', 'notif.NewMessage': 'Новое сообщение', 'notif.AddedToGroup': 'Вас добавили в группу',
    'notif.System': 'Системное сообщение', 'notif.readAll': 'Прочитать все',
    'profile.title': 'Профиль', 'profile.save': 'Сохранить', 'profile.about': 'О себе',
    'profile.language': 'Язык', 'profile.logout': 'Выйти', 'profile.saved': 'Сохранено', 'profile.theme': 'Тема',
    'theme.light': 'Светлая', 'theme.dark': 'Тёмная', 'theme.system': 'Как в системе',
    'common.cancel': 'Отмена', 'common.back': 'Назад', 'common.close': 'Закрыть', 'common.loading': 'Загрузка…',
    'common.copied': 'Скопировано',
    'err.BLOCKED': 'Пользователь заблокирован', 'err.FORBIDDEN': 'Нет доступа', 'err.NOT_FOUND': 'Не найдено',
    'err.CONFLICT': 'Уже существует', 'err.INVALID_CREDENTIALS': 'Неверное имя пользователя или пароль',
    'err.BUSY': 'Собеседник уже разговаривает', 'err.OFFLINE': 'Пользователь не в сети',
    'err.ERROR': 'Что-то пошло не так. Попробуйте ещё раз',
  },
  fr: {
    'app.tagline': 'Djama — restez ensemble',
    'auth.login': 'Se connecter', 'auth.register': 'Créer un compte',
    'auth.username': "Nom d'utilisateur", 'auth.usernameOrEmail': "Nom d'utilisateur ou e-mail",
    'auth.displayName': 'Nom affiché', 'auth.email': 'E-mail', 'auth.password': 'Mot de passe',
    'auth.noAccount': 'Pas de compte ?', 'auth.haveAccount': 'Déjà un compte ?',
    'nav.chats': 'Discussions', 'nav.contacts': 'Contacts', 'nav.notifications': 'Notifications', 'nav.profile': 'Profil',
    'chat.empty': 'Choisissez une discussion ou commencez-en une', 'chat.noChats': "Aucune discussion. Trouvez quelqu'un dans l'onglet « Contacts ».",
    'chat.search': 'Rechercher une discussion', 'chat.filter.all': 'Toutes', 'chat.filter.unread': 'Non lues', 'chat.filter.groups': 'Groupes',
    'chat.noResults': 'Aucun résultat',
    'chat.typeMessage': 'Écrivez un message…', 'chat.send': 'Envoyer', 'chat.typing': 'écrit…',
    'chat.loadOlder': 'Charger les messages précédents', 'chat.deleted': 'Message supprimé', 'chat.delete': 'Supprimer',
    'chat.online': 'en ligne', 'chat.offline': 'hors ligne', 'chat.members': 'Membres',
    'chat.reconnecting': 'Connexion perdue. Reconnexion…', 'chat.you': 'Vous',
    'chat.photo': 'Photo', 'chat.file': 'Fichier', 'chat.voice': 'Message vocal',
    'chat.reply': 'Répondre', 'chat.copy': 'Copier', 'chat.edit': 'Modifier', 'chat.edited': 'modifié',
    'chat.editing': 'Modification du message', 'chat.replyingTo': 'Réponse à',
    'chat.attachPhoto': 'Photos et vidéos', 'chat.attachFile': 'Document',
    'chat.recording': 'Enregistrement…', 'chat.micDenied': "Accès au microphone refusé. Autorisez-le dans le navigateur.",
    'chat.caption': 'Ajouter une légende…', 'chat.dropHere': 'Déposez vos fichiers ici',
    'chat.scrollDown': 'Descendre', 'chat.tooBig': 'Fichier trop volumineux (25 Mo maximum)', 'chat.speed': 'Vitesse',
    'call.audio': 'Appel vocal', 'call.video': 'Appel vidéo', 'call.missed': 'Appel manqué',
    'call.noAnswer': 'Sans réponse', 'call.declined': 'Appel refusé',
    'call.incomingAudio': 'Appel vocal entrant', 'call.incomingVideo': 'Appel vidéo entrant',
    'call.calling': 'Appel en cours…', 'call.connecting': 'Connexion…', 'call.accept': 'Répondre', 'call.decline': 'Refuser',
    'call.end': 'Raccrocher', 'call.mute': 'Couper le micro', 'call.unmute': 'Activer le micro',
    'call.cameraOff': 'Couper la caméra', 'call.cameraOn': 'Activer la caméra',
    'call.noMedia': 'Micro ou caméra inaccessible. Autorisez-les dans le navigateur.',
    'call.ended': 'Appel terminé', 'call.start.audio': 'Appel vocal', 'call.start.video': 'Appel vidéo',
    'contacts.search': 'Rechercher un utilisateur…', 'contacts.add': 'Ajouter', 'contacts.message': 'Écrire',
    'contacts.block': 'Bloquer', 'contacts.unblock': 'Débloquer', 'contacts.remove': 'Retirer',
    'contacts.list': 'Mes contacts', 'contacts.blocked': 'Bloqués', 'contacts.none': 'Aucun contact pour le moment',
    'groups.new': 'Nouveau groupe', 'groups.title': 'Nom du groupe', 'groups.create': 'Créer le groupe',
    'groups.info': 'Infos du groupe', 'groups.members': 'Membres', 'groups.addMember': 'Ajouter des membres',
    'groups.leave': 'Quitter le groupe', 'groups.admin': 'admin', 'groups.makeAdmin': 'Nommer admin',
    'groups.makeMember': "Retirer le rôle d'admin", 'groups.rename': 'Renommer', 'groups.remove': 'Exclure',
    'groups.search': 'Rechercher par nom ou identifiant…', 'groups.noneFound': 'Personne trouvée',
    'groups.addSelected': 'Ajouter les personnes choisies',
    'notif.empty': 'Aucune notification', 'notif.NewMessage': 'Nouveau message', 'notif.AddedToGroup': 'Vous avez été ajouté au groupe',
    'notif.System': 'Message système', 'notif.readAll': 'Tout marquer comme lu',
    'profile.title': 'Profil', 'profile.save': 'Enregistrer', 'profile.about': 'À propos',
    'profile.language': 'Langue', 'profile.logout': 'Se déconnecter', 'profile.saved': 'Enregistré', 'profile.theme': 'Thème',
    'theme.light': 'Clair', 'theme.dark': 'Sombre', 'theme.system': 'Selon le système',
    'common.cancel': 'Annuler', 'common.back': 'Retour', 'common.close': 'Fermer', 'common.loading': 'Chargement…',
    'common.copied': 'Copié',
    'err.BLOCKED': 'Utilisateur bloqué', 'err.FORBIDDEN': 'Accès refusé', 'err.NOT_FOUND': 'Introuvable',
    'err.CONFLICT': 'Existe déjà', 'err.INVALID_CREDENTIALS': "Nom d'utilisateur ou mot de passe incorrect",
    'err.BUSY': 'Votre contact est déjà en communication', 'err.OFFLINE': "L'utilisateur est hors ligne",
    'err.ERROR': 'Une erreur est survenue. Réessayez',
  },
};

export const LANGS = { ru: 'Русский', fr: 'Français' };
const I18nContext = createContext(null);
export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('djama_lang');
    if (saved && dict[saved]) return saved;
    return navigator.language?.startsWith('fr') ? 'fr' : 'ru';
  });
  const setLang = useCallback((l) => { localStorage.setItem('djama_lang', l); setLangState(l); }, []);
  const t = useCallback((key) => dict[lang][key] ?? dict.ru[key] ?? key, [lang]);
  const value = useMemo(() => ({ t, lang, setLang }), [t, lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Turn an ApiError / hub error into a translated sentence. VALIDATION keeps the server detail (it says what to fix). */
export function errText(t, e) {
  if (e?.code === 'VALIDATION' && e.message) return e.message;
  const key = 'err.' + (e?.code || 'ERROR');
  const s = t(key);
  return s === key ? t('err.ERROR') : s;
}
