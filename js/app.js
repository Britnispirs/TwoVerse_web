// Main Entrypoint Application Logic for TwoVerse
import { Storage } from './storage.js';
import { AudioFX } from './audio.js';
import { DateRandomizer } from './modules/dateRandomizer.js';
import { BucketListModule } from './modules/bucketList.js';
import { QACardsModule } from './modules/qaCards.js';
import { CoupleGamesModule } from './modules/coupleGames.js';

class TwoVerseApp {
  constructor() {
    this.modules = {};
    this.currentTab = 'randomizer';
  }

  init() {
    // 1. Initialize audio & settings
    AudioFX.init();
    this.applyTheme(Storage.getProfile().theme || 'dark');

    // 2. Instantiate Modules
    this.modules.randomizer = new DateRandomizer('tab-content-randomizer');
    this.modules.bucket = new BucketListModule('tab-content-bucket');
    this.modules.qa = new QACardsModule('tab-content-qa');
    this.modules.games = new CoupleGamesModule('tab-content-games');

    // Initialize all modules
    this.modules.randomizer.init();
    this.modules.bucket.init();
    this.modules.qa.init();
    this.modules.games.init();

    // 3. Bind UI & Global Events
    this.bindNavigation();
    this.bindModals();
    this.bindHeaderControls();
    this.updateProfileDisplay();

    // Custom Event Listeners
    window.addEventListener('openCustomDateModal', () => this.openModal('modal-custom-date'));
    window.addEventListener('openAddBucketModal', () => this.openModal('modal-add-bucket'));
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-section');

    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        if (targetTab === this.currentTab) return;

        AudioFX.playClick();

        navItems.forEach((n) => n.classList.remove('active'));
        e.currentTarget.classList.add('active');

        tabContents.forEach((sec) => sec.classList.add('hidden'));
        const targetSection = document.getElementById(`tab-content-${targetTab}`);
        if (targetSection) {
          targetSection.classList.remove('hidden');
          targetSection.classList.add('fade-in');
        }

        this.currentTab = targetTab;
      });
    });
  }

  bindHeaderControls() {
    // Theme toggle
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const profile = Storage.getProfile();
        const newTheme = profile.theme === 'light' ? 'dark' : 'light';
        profile.theme = newTheme;
        Storage.saveProfile(profile);
        this.applyTheme(newTheme);
        AudioFX.playClick();
      });
    }

    // Sound toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const enabled = AudioFX.toggleSound();
        soundBtn.textContent = enabled ? '🔊' : '🔇';
        AudioFX.playClick();
      });
    }

    // Profile Edit button
    const editProfileBtn = document.getElementById('btn-edit-profile');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        AudioFX.playClick();
        this.populateProfileModal();
        this.openModal('modal-profile');
      });
    }
  }

  applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      const btn = document.getElementById('btn-toggle-theme');
      if (btn) btn.textContent = '☀️';
    } else {
      document.body.classList.remove('light-theme');
      const btn = document.getElementById('btn-toggle-theme');
      if (btn) btn.textContent = '🌙';
    }
  }

  updateProfileDisplay() {
    const profile = Storage.getProfile();
    const p1El = document.getElementById('header-p1');
    const p2El = document.getElementById('header-p2');

    if (p1El) p1El.textContent = profile.partner1 || 'Партнер 1';
    if (p2El) p2El.textContent = profile.partner2 || 'Партнер 2';
  }

  bindModals() {
    // Close modal triggers
    const closeBtns = document.querySelectorAll('.modal-close, .modal-backdrop');
    closeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target === btn) {
          const modal = btn.closest('.modal');
          if (modal) this.closeModal(modal.id);
        }
      });
    });

    // Profile Form Save
    const profileForm = document.getElementById('form-profile');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const p1 = document.getElementById('input-p1').value.trim();
        const p2 = document.getElementById('input-p2').value.trim();
        const anni = document.getElementById('input-anniversary').value;

        if (p1 && p2) {
          const profile = Storage.getProfile();
          profile.partner1 = p1;
          profile.partner2 = p2;
          profile.anniversary = anni;
          Storage.saveProfile(profile);

          AudioFX.playSuccess();
          this.updateProfileDisplay();
          this.closeModal('modal-profile');
          // Re-render QA module to update names in turn indicator
          this.modules.qa.render();
          this.modules.qa.bindEvents();
          this.modules.qa.updateCardContent();
          this.modules.games.render();
          this.modules.games.bindEvents();
        }
      });
    }

    // Custom Date Idea Save
    const customDateForm = document.getElementById('form-custom-date');
    if (customDateForm) {
      customDateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('input-date-title').value.trim();
        const category = document.getElementById('input-date-category').value;
        const duration = document.getElementById('input-date-duration').value;
        const budget = document.getElementById('input-date-budget').value;
        const description = document.getElementById('input-date-desc').value.trim();
        const icon = document.getElementById('input-date-icon').value.trim() || '✨';

        if (title) {
          const newDate = {
            id: 'custom-date-' + Date.now(),
            title,
            category,
            categoryName: this.getCategoryName(category),
            duration,
            durationName: duration === 'short' ? '1 час' : duration === 'medium' ? '2-3 часа' : 'Весь день',
            budget,
            budgetName: budget === 'free' ? '✨ Бесплатно' : budget === 'low' ? '💰 Доступно' : budget === 'medium' ? '💰💰 Средне' : '💰💰💰 Премиум',
            description: description || 'Собственная идея пары!',
            icon
          };

          Storage.saveCustomDate(newDate);
          AudioFX.playSuccess();
          this.closeModal('modal-custom-date');
          customDateForm.reset();
          // Re-spin randomizer
          this.modules.randomizer.spinDate(true);
        }
      });
    }

    // Add Bucket Item Save
    const bucketForm = document.getElementById('form-add-bucket');
    if (bucketForm) {
      bucketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('input-bucket-title').value.trim();
        const category = document.getElementById('input-bucket-category').value;
        const targetDate = document.getElementById('input-bucket-date').value;
        const icon = document.getElementById('input-bucket-icon').value.trim() || '🎯';

        if (title) {
          const items = Storage.getBucketList();
          items.unshift({
            id: 'bucket-' + Date.now(),
            title,
            category,
            categoryName: this.getBucketCategoryName(category),
            icon,
            targetDate: targetDate || '',
            completed: false,
            completedAt: null,
            note: ''
          });

          Storage.saveBucketList(items);
          AudioFX.playSuccess();
          this.closeModal('modal-add-bucket');
          bucketForm.reset();
          // Notify bucket module
          window.dispatchEvent(new CustomEvent('bucketUpdated'));
        }
      });
    }
  }

  populateProfileModal() {
    const profile = Storage.getProfile();
    const input1 = document.getElementById('input-p1');
    const input2 = document.getElementById('input-p2');
    const inputAnni = document.getElementById('input-anniversary');

    if (input1) input1.value = profile.partner1 || '';
    if (input2) input2.value = profile.partner2 || '';
    if (inputAnni) inputAnni.value = profile.anniversary || '';
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('modal-active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('modal-active');
      modal.classList.add('hidden');
    }
  }

  getCategoryName(cat) {
    const map = {
      home: 'Домашний уют',
      outdoor: 'На свежем воздухе',
      romantic: 'Романтика',
      active: 'Активный отдых',
      creative: 'Творчество',
      unusual: 'Необычное'
    };
    return map[cat] || 'Свидание';
  }

  getBucketCategoryName(cat) {
    const map = {
      travel: '✈️ Путешествия',
      cozy: '🏡 Уютные цели',
      creative: '🎨 Творчество',
      adventure: '🔥 Безумства'
    };
    return map[cat] || 'Цель';
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new TwoVerseApp();
  app.init();
});
