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
  GAME_STATS: 'twoverse_game_stats'
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
  }
};
