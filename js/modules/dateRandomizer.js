// Date Randomizer Module ("Что делаем сегодня?")
import { Storage } from '../storage.js';
import { AudioFX } from '../audio.js';
import { triggerConfetti } from '../confetti.js';

export class DateRandomizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = null;
    this.isSpinning = false;
    this.selectedCategory = 'all';
    this.selectedBudget = 'all';
  }

  init() {
    this.render();
    this.bindEvents();
    // Pick a initial date
    this.spinDate(false);
  }

  getFilteredDates() {
    const allDates = Storage.getAllDates();
    return allDates.filter((date) => {
      const matchCat = this.selectedCategory === 'all' || date.category === this.selectedCategory;
      const matchBud = this.selectedBudget === 'all' || date.budget === this.selectedBudget;
      return matchCat && matchBud;
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="randomizer-wrapper">
        <div class="randomizer-header">
          <div class="header-badge">🎲 Рандомайзер свиданий</div>
          <h2>Что делаем сегодня?</h2>
          <p class="subtitle">Нажмите кнопку, и генератор подберет идеальную идею для вашего вечера!</p>
        </div>

        <!-- Filters Bar -->
        <div class="filters-card glass-panel">
          <div class="filter-group">
            <span class="filter-label"><i class="icon">🏷️</i> Категория:</span>
            <div class="filter-chips" id="cat-chips">
              <button class="chip active" data-cat="all">✨ Все</button>
              <button class="chip" data-cat="home">🏠 Домашний уют</button>
              <button class="chip" data-cat="outdoor">🌳 На воздухе</button>
              <button class="chip" data-cat="romantic">🕯️ Романтика</button>
              <button class="chip" data-cat="active">🧗‍♂️ Активность</button>
              <button class="chip" data-cat="creative">🎨 Творчество</button>
              <button class="chip" data-cat="unusual">🚀 Необычное</button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-label"><i class="icon">💳</i> Бюджет:</span>
            <div class="filter-chips" id="budget-chips">
              <button class="chip active" data-bud="all">Любой</button>
              <button class="chip" data-bud="free">✨ Бесплатно</button>
              <button class="chip" data-bud="low">💰 Доступно</button>
              <button class="chip" data-bud="medium">💰💰 Средне</button>
              <button class="chip" data-bud="high">💰💰💰 Премиум</button>
            </div>
          </div>
        </div>

        <!-- Reel & Card Container -->
        <div class="date-card-display glass-card-glow" id="date-result-card">
          <div class="date-icon-badge" id="date-icon">🍕</div>
          <div class="date-category-tag" id="date-category">Домашний уют</div>
          
          <h3 class="date-title" id="date-title">Генерация идеи...</h3>
          <p class="date-description" id="date-description">Выбираем самое интересное для вашей пары...</p>
          
          <div class="date-meta-bar">
            <span class="meta-item" id="date-duration">⏱️ 1-2 часа</span>
            <span class="meta-item" id="date-budget">💰 Доступно</span>
          </div>

          <!-- Actions -->
          <div class="date-actions">
            <button class="btn btn-secondary" id="btn-fav-date">
              <span id="fav-icon">🤍</span> В избранное
            </button>
            <button class="btn btn-gradient btn-lg btn-pulse" id="btn-spin">
              🎲 Сгенерировать идею!
            </button>
            <button class="btn btn-primary" id="btn-accept-date">
              🚀 Принять вызов!
            </button>
          </div>
        </div>

        <div class="custom-date-trigger">
          <span>Знаете классное место или занятие?</span>
          <button class="btn btn-outline btn-sm" id="btn-open-custom-date">+ Добавить свою идею</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Category chips
    const catChips = this.container.querySelectorAll('#cat-chips .chip');
    catChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        catChips.forEach((c) => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedCategory = e.currentTarget.dataset.cat;
        AudioFX.playClick();
        this.spinDate(true);
      });
    });

    // Budget chips
    const budChips = this.container.querySelectorAll('#budget-chips .chip');
    budChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        budChips.forEach((c) => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedBudget = e.currentTarget.dataset.bud;
        AudioFX.playClick();
        this.spinDate(true);
      });
    });

    // Spin button
    const btnSpin = this.container.querySelector('#btn-spin');
    btnSpin.addEventListener('click', () => {
      AudioFX.playClick();
      this.spinDate(true);
    });

    // Fav button
    const btnFav = this.container.querySelector('#btn-fav-date');
    btnFav.addEventListener('click', () => {
      if (!this.currentDate) return;
      const favs = Storage.toggleFavoriteDate(this.currentDate.id);
      const isFav = favs.includes(this.currentDate.id);
      AudioFX.playClick();
      this.updateFavButton(isFav);
    });

    // Accept Date button
    const btnAccept = this.container.querySelector('#btn-accept-date');
    btnAccept.addEventListener('click', (e) => {
      if (!this.currentDate) return;
      AudioFX.playSuccess();
      const rect = e.currentTarget.getBoundingClientRect();
      triggerConfetti(rect.left / window.innerWidth, rect.top / window.innerHeight);

      // Add to bucket list or notify
      const bucket = Storage.getBucketList();
      const exists = bucket.some((b) => b.title === this.currentDate.title);
      if (!exists) {
        bucket.unshift({
          id: 'bucket-' + Date.now(),
          title: this.currentDate.title,
          category: 'cozy',
          categoryName: '❤️ Активное свидание',
          icon: this.currentDate.icon || '🔥',
          targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          completed: false,
          completedAt: null,
          note: 'Выбрано через рандомайзер!'
        });
        Storage.saveBucketList(bucket);
        // Refresh bucket list event
        window.dispatchEvent(new CustomEvent('bucketUpdated'));
      }
      alert(`🎉 Отлично! Свидание "${this.currentDate.title}" добавлено в ваш списочек дел!`);
    });

    // Open custom date modal
    const btnCustom = this.container.querySelector('#btn-open-custom-date');
    if (btnCustom) {
      btnCustom.addEventListener('click', () => {
        AudioFX.playClick();
        window.dispatchEvent(new CustomEvent('openCustomDateModal'));
      });
    }
  }

  spinDate(animate = true) {
    const dates = this.getFilteredDates();
    if (dates.length === 0) {
      this.renderEmptyState();
      return;
    }

    if (this.isSpinning) return;

    if (!animate) {
      const randomDate = dates[Math.floor(Math.random() * dates.length)];
      this.displayDate(randomDate);
      return;
    }

    this.isSpinning = true;
    const card = this.container.querySelector('#date-result-card');
    card.classList.add('spinning');

    let counter = 0;
    const totalTicks = 12;
    const interval = setInterval(() => {
      counter++;
      const randomTemp = dates[Math.floor(Math.random() * dates.length)];
      this.updateCardContent(randomTemp);
      AudioFX.playSpinTick();

      if (counter >= totalTicks) {
        clearInterval(interval);
        card.classList.remove('spinning');
        const finalDate = dates[Math.floor(Math.random() * dates.length)];
        this.displayDate(finalDate);
        this.isSpinning = false;
        AudioFX.playFlip();
      }
    }, 90);
  }

  displayDate(date) {
    this.currentDate = date;
    this.updateCardContent(date);
    const favs = Storage.getFavoriteDateIds();
    this.updateFavButton(favs.includes(date.id));
  }

  updateCardContent(date) {
    const iconEl = this.container.querySelector('#date-icon');
    const catEl = this.container.querySelector('#date-category');
    const titleEl = this.container.querySelector('#date-title');
    const descEl = this.container.querySelector('#date-description');
    const durEl = this.container.querySelector('#date-duration');
    const budEl = this.container.querySelector('#date-budget');

    if (iconEl) iconEl.textContent = date.icon || '❤️';
    if (catEl) catEl.textContent = date.categoryName || 'Свидание';
    if (titleEl) titleEl.textContent = date.title;
    if (descEl) descEl.textContent = date.description;
    if (durEl) durEl.textContent = `⏱️ ${date.durationName || '1-2 часа'}`;
    if (budEl) budEl.textContent = date.budgetName || '💰 Доступно';
  }

  updateFavButton(isFav) {
    const btnFav = this.container.querySelector('#btn-fav-date');
    const favIcon = this.container.querySelector('#fav-icon');
    if (btnFav && favIcon) {
      if (isFav) {
        favIcon.textContent = '❤️';
        btnFav.classList.add('is-fav');
      } else {
        favIcon.textContent = '🤍';
        btnFav.classList.remove('is-fav');
      }
    }
  }

  renderEmptyState() {
    this.container.querySelector('#date-title').textContent = 'Нет подходящих идей';
    this.container.querySelector('#date-description').textContent = 'Попробуйте сбросить фильтры категории или бюджета!';
    this.container.querySelector('#date-icon').textContent = '🔍';
  }
}
