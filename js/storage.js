// LocalStorage Helper for TwoVerse
import { PRESET_DATE_IDEAS } from './data/dateIdeas.js';
import { PRESET_QUESTIONS } from './data/questions.js';
import { PRESET_BUCKET_ITEMS } from './data/bucketTemplates.js';

const STORAGE_KEYS = {
  COUPLE_PROFILE: 'twoverse_profile',
  BUCKET_LIST: 'twoverse_bucket_list',
  CUSTOM_DATES: 'twoverse_custom_dates',
  FAVORITE_DATES: 'twoverse_favorite_dates',
  FAVORITE_QUESTIONS: 'twoverse_favorite_questions',
  SETTINGS: 'twoverse_settings',
  GAME_STATS: 'twoverse_game_stats',
  USERS: 'twoverse_users',
  CURRENT_USER: 'twoverse_current_user'
};

export const Storage = {
  // Couple profile (names, anniversary, avatar)
  getProfile() {
    const defaultProfile = {
      partner1: 'Алекс',
      partner2: 'Саша',
      anniversary: '2024-02-14',
      theme: 'dark'
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COUPLE_PROFILE);
      return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile;
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return defaultProfile;
    }
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEYS.COUPLE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  },

  // Bucket list items
  getBucketList() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUCKET_LIST);
      return data ? JSON.parse(data) : PRESET_BUCKET_ITEMS;
    } catch (e) {
      return PRESET_BUCKET_ITEMS;
    }
  },

  saveBucketList(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUCKET_LIST, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving bucket list:', e);
    }
  },

  // Custom date ideas added by user
  getCustomDates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_DATES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCustomDate(dateIdea) {
    const dates = this.getCustomDates();
    dates.unshift(dateIdea);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DATES, JSON.stringify(dates));
    } catch (e) {
      console.error('Error saving custom date:', e);
    }
    return dates;
  },

  // Combine preset + custom dates
  getAllDates() {
    return [...this.getCustomDates(), ...PRESET_DATE_IDEAS];
  },

  // Favorite dates
  getFavoriteDateIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITE_DATES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  toggleFavoriteDate(dateId) {
    const favs = this.getFavoriteDateIds();
    const index = favs.indexOf(dateId);
    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.push(dateId);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITE_DATES, JSON.stringify(favs));
    } catch (e) {}
    return favs;
  },

  // Favorite questions
  getFavoriteQuestionIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITE_QUESTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  toggleFavoriteQuestion(questionId) {
    const favs = this.getFavoriteQuestionIds();
    const index = favs.indexOf(questionId);
    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.push(questionId);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITE_QUESTIONS, JSON.stringify(favs));
    } catch (e) {}
    return favs;
  },

  // Audio & UI settings
  getSettings() {
    const defaults = { soundEnabled: true, theme: 'dark' };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (e) {
      return defaults;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  },

  // Export / Import
  exportData() {
    const data = {
      profile: this.getProfile(),
      bucketList: this.getBucketList(),
      customDates: this.getCustomDates(),
      favDates: this.getFavoriteDateIds(),
      favQuestions: this.getFavoriteQuestionIds(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) this.saveProfile(parsed.profile);
      if (parsed.bucketList) this.saveBucketList(parsed.bucketList);
      if (parsed.customDates) localStorage.setItem(STORAGE_KEYS.CUSTOM_DATES, JSON.stringify(parsed.customDates));
      if (parsed.favDates) localStorage.setItem(STORAGE_KEYS.FAVORITE_DATES, JSON.stringify(parsed.favDates));
      if (parsed.favQuestions) localStorage.setItem(STORAGE_KEYS.FAVORITE_QUESTIONS, JSON.stringify(parsed.favQuestions));
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  // ──────── User Authentication ────────

  // Simple hash for client-side password storage (NOT secure for production)
  _hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36);
  },

  // Get all registered users
  _getUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Save users array
  _saveUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - { username, email, password, avatar, partnerName }
   * @returns {{ success: boolean, error?: string }}
   */
  registerUser(userData) {
    const { username, email, password, avatar, partnerName } = userData;

    if (!username || !password) {
      return { success: false, error: 'Имя пользователя и пароль обязательны' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Пароль должен быть минимум 4 символа' };
    }

    const users = this._getUsers();

    // Check for duplicate username or email
    const existingUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() ||
        (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );
    if (existingUser) {
      return { success: false, error: 'Пользователь с таким именем или email уже существует' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username: username.trim(),
      email: (email || '').trim(),
      passwordHash: this._hashPassword(password),
      avatar: avatar || '😊',
      partnerName: (partnerName || '').trim(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this._saveUsers(users);

    // Auto-login after registration
    this._setCurrentUser(newUser);

    // Update couple profile with the registered user's data
    const profile = this.getProfile();
    profile.partner1 = newUser.username;
    if (newUser.partnerName) {
      profile.partner2 = newUser.partnerName;
    }
    this.saveProfile(profile);

    return { success: true, user: newUser };
  },

  /**
   * Login user by username/email and password
   * @param {string} identifier - username or email
   * @param {string} password
   * @returns {{ success: boolean, error?: string, user?: Object }}
   */
  loginUser(identifier, password) {
    if (!identifier || !password) {
      return { success: false, error: 'Введите имя пользователя и пароль' };
    }

    const users = this._getUsers();
    const passwordHash = this._hashPassword(password);
    const id = identifier.toLowerCase().trim();

    const user = users.find(
      u => (u.username.toLowerCase() === id || (u.email && u.email.toLowerCase() === id)) &&
        u.passwordHash === passwordHash
    );

    if (!user) {
      return { success: false, error: 'Неверное имя пользователя или пароль' };
    }

    this._setCurrentUser(user);

    // Restore profile names from user data
    const profile = this.getProfile();
    profile.partner1 = user.username;
    if (user.partnerName) {
      profile.partner2 = user.partnerName;
    }
    this.saveProfile(profile);

    return { success: true, user };
  },

  /**
   * Logout current user
   */
  logoutUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {}
  },

  /**
   * Get current logged-in user or null
   * @returns {Object|null}
   */
  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Set current user session
   * @param {Object} user
   */
  _setCurrentUser(user) {
    try {
      // Store without password hash for safety
      const safeUser = { ...user };
      delete safeUser.passwordHash;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    } catch (e) {}
  },

  /**
   * Update current user's avatar or partner name
   * @param {Object} updates - { avatar?, partnerName? }
   */
  updateCurrentUser(updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) return false;

    if (updates.avatar) {
      users[idx].avatar = updates.avatar;
      currentUser.avatar = updates.avatar;
    }
    if (updates.partnerName !== undefined) {
      users[idx].partnerName = updates.partnerName;
      currentUser.partnerName = updates.partnerName;
    }

    this._saveUsers(users);
    this._setCurrentUser(currentUser);
    return true;
  }
};
