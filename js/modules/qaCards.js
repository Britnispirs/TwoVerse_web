// Q&A Cards Module ("Карточки Q&A")
import { PRESET_QUESTIONS } from '../data/questions.js';
import { Storage } from '../storage.js';
import { AudioFX } from '../audio.js';

export class QACardsModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.questions = PRESET_QUESTIONS;
    this.currentIndex = 0;
    this.activeCategory = 'all';
    this.isFlipped = false;
    this.turnPartner = 1; // 1: Partner 1, 2: Partner 2
  }

  init() {
    this.render();
    this.bindEvents();
    this.updateCardContent();
  }

  getFilteredQuestions() {
    if (this.activeCategory === 'all') return this.questions;
    if (this.activeCategory === 'favs') {
      const favIds = Storage.getFavoriteQuestionIds();
      return this.questions.filter((q) => favIds.includes(q.id));
    }
    return this.questions.filter((q) => q.category === this.activeCategory);
  }

  render() {
    const profile = Storage.getProfile();

    this.container.innerHTML = `
      <div class="qa-wrapper">
        <div class="qa-header">
          <div class="header-badge">💬 Вопросы для двоих</div>
          <h2>Карточки Q&A</h2>
          <p class="subtitle">Переворачивайте карточки, узнавайте друг друга лучше и обсуждайте самые сокровенные вещи!</p>
        </div>

        <!-- Category Selector -->
        <div class="qa-categories glass-panel">
          <button class="qa-chip active" data-cat="all">✨ Все вопросы</button>
          <button class="qa-chip" data-cat="fun">💖 Забавные</button>
          <button class="qa-chip" data-cat="deep">🔮 Глубокие</button>
          <button class="qa-chip" data-cat="spicy">🔥 Пикантные</button>
          <button class="qa-chip" data-cat="future">🚀 Будущее</button>
          <button class="qa-chip" data-cat="favs">⭐ Избранные</button>
        </div>

        <!-- Turn indicator -->
        <div class="turn-bar glass-panel">
          <span class="turn-label">Очередь отвечать:</span>
          <div class="turn-switcher">
            <button class="turn-btn active" id="turn-p1" data-p="1">👤 ${this.escapeHtml(profile.partner1)}</button>
            <button class="turn-btn" id="turn-p2" data-p="2">👤 ${this.escapeHtml(profile.partner2)}</button>
          </div>
        </div>

        <!-- 3D Card Scene -->
        <div class="card-scene">
          <div class="qa-3d-card" id="qa-card">
            <!-- Front Face (Shirt / Cover) -->
            <div class="card-face card-front glass-card">
              <div class="card-pattern-icon">💖</div>
              <h3 class="card-cover-title">Нажмите, чтобы открыть вопрос</h3>
              <p class="card-cover-hint">Узнайте, о чем поговорить прямо сейчас</p>
              <div class="card-flip-prompt">✨ Нажми или кликни</div>
            </div>

            <!-- Back Face (Question Content) -->
            <div class="card-face card-back glass-card-glow">
              <div class="card-back-header">
                <span class="qa-category-badge" id="qa-category-tag">💖 Забавные</span>
                <button class="qa-fav-btn" id="qa-fav-btn">🤍</button>
              </div>

              <div class="qa-question-text" id="qa-question-text">
                Загрузка вопроса...
              </div>

              <div class="qa-hint-box" id="qa-hint-box">
                <span class="hint-icon">💡 Подсказка:</span>
                <span id="qa-hint-text">Будьте искренни!</span>
              </div>

              <div class="card-back-footer">
                <span class="card-counter" id="qa-counter">1 / 20</span>
                <button class="btn btn-sm btn-outline" id="btn-flip-back">🔄 Свернуть</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="qa-controls">
          <button class="btn btn-secondary" id="btn-prev-q">⬅️ Предыдущий</button>
          <button class="btn btn-gradient btn-lg" id="btn-random-q">🎲 Случайный вопрос</button>
          <button class="btn btn-secondary" id="btn-next-q">Следующий ➡️</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const card = this.container.querySelector('#qa-card');

    // Flip logic
    if (card) {
      card.addEventListener('click', (e) => {
        // Prevent flipping if clicked on fav button or back flip button
        if (e.target.closest('#qa-fav-btn') || e.target.closest('#btn-flip-back')) return;

        this.isFlipped = !this.isFlipped;
        AudioFX.playFlip();
        if (this.isFlipped) {
          card.classList.add('is-flipped');
        } else {
          card.classList.remove('is-flipped');
        }
      });
    }

    const btnFlipBack = this.container.querySelector('#btn-flip-back');
    if (btnFlipBack) {
      btnFlipBack.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isFlipped = false;
        AudioFX.playFlip();
        card.classList.remove('is-flipped');
      });
    }

    // Category chips
    const catChips = this.container.querySelectorAll('.qa-chip');
    catChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        catChips.forEach((c) => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.cat;
        this.currentIndex = 0;
        this.isFlipped = false;
        if (card) card.classList.remove('is-flipped');
        AudioFX.playClick();
        this.updateCardContent();
      });
    });

    // Turn switcher
    const turnBtns = this.container.querySelectorAll('.turn-btn');
    turnBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        turnBtns.forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.turnPartner = parseInt(e.currentTarget.dataset.p, 10);
        AudioFX.playClick();
      });
    });

    // Navigation buttons
    const btnPrev = this.container.querySelector('#btn-prev-q');
    const btnNext = this.container.querySelector('#btn-next-q');
    const btnRandom = this.container.querySelector('#btn-random-q');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const filtered = this.getFilteredQuestions();
        if (filtered.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + filtered.length) % filtered.length;
        AudioFX.playClick();
        this.switchQuestionAnimation();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const filtered = this.getFilteredQuestions();
        if (filtered.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % filtered.length;
        AudioFX.playClick();
        this.switchQuestionAnimation();
      });
    }

    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const filtered = this.getFilteredQuestions();
        if (filtered.length === 0) return;
        this.currentIndex = Math.floor(Math.random() * filtered.length);
        AudioFX.playClick();
        this.switchQuestionAnimation();
      });
    }

    // Favorite Question Button
    const favBtn = this.container.querySelector('#qa-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtered = this.getFilteredQuestions();
        const q = filtered[this.currentIndex];
        if (!q) return;

        const favs = Storage.toggleFavoriteQuestion(q.id);
        const isFav = favs.includes(q.id);
        AudioFX.playClick();
        favBtn.textContent = isFav ? '❤️' : '🤍';
        if (isFav) favBtn.classList.add('is-fav');
        else favBtn.classList.remove('is-fav');
      });
    }
  }

  switchQuestionAnimation() {
    const card = this.container.querySelector('#qa-card');
    if (!card) return;

    card.classList.add('card-changing');
    setTimeout(() => {
      this.updateCardContent();
      card.classList.remove('card-changing');
    }, 200);
  }

  updateCardContent() {
    const filtered = this.getFilteredQuestions();
    const tagEl = this.container.querySelector('#qa-category-tag');
    const textEl = this.container.querySelector('#qa-question-text');
    const hintEl = this.container.querySelector('#qa-hint-text');
    const counterEl = this.container.querySelector('#qa-counter');
    const favBtn = this.container.querySelector('#qa-fav-btn');

    if (filtered.length === 0) {
      if (textEl) textEl.textContent = 'В этой категории пока нет вопросов или не добавлено в избранное!';
      if (tagEl) tagEl.textContent = 'Пусто';
      if (hintEl) hintEl.textContent = 'Выбери другую категорию';
      if (counterEl) counterEl.textContent = '0 / 0';
      return;
    }

    if (this.currentIndex >= filtered.length) {
      this.currentIndex = 0;
    }

    const q = filtered[this.currentIndex];
    if (tagEl) {
      tagEl.textContent = q.categoryName;
      tagEl.style.backgroundColor = q.categoryColor || '#ff6b8b';
    }
    if (textEl) textEl.textContent = q.question;
    if (hintEl) hintEl.textContent = q.hint || 'Будьте открыты и искренни друг с другом!';
    if (counterEl) counterEl.textContent = `${this.currentIndex + 1} / ${filtered.length}`;

    if (favBtn) {
      const favs = Storage.getFavoriteQuestionIds();
      const isFav = favs.includes(q.id);
      favBtn.textContent = isFav ? '❤️' : '🤍';
      if (isFav) favBtn.classList.add('is-fav');
      else favBtn.classList.remove('is-fav');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}
