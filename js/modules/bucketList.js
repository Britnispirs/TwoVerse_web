// Shared Bucket List Module for Couples
import { Storage } from '../storage.js';
import { AudioFX } from '../audio.js';
import { triggerConfetti } from '../confetti.js';

export class BucketListModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.items = [];
    this.activeCategory = 'all';
    this.activeStatus = 'all'; // all, pending, completed
  }

  init() {
    this.loadItems();
    this.render();
    this.bindEvents();

    window.addEventListener('bucketUpdated', () => {
      this.loadItems();
      this.renderListOnly();
      this.updateProgress();
    });
  }

  loadItems() {
    this.items = Storage.getBucketList();
  }

  getFilteredItems() {
    return this.items.filter((item) => {
      const matchCat = this.activeCategory === 'all' || item.category === this.activeCategory;
      let matchStatus = true;
      if (this.activeStatus === 'pending') matchStatus = !item.completed;
      if (this.activeStatus === 'completed') matchStatus = item.completed;
      return matchCat && matchStatus;
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="bucket-wrapper">
        <div class="bucket-header">
          <div class="header-badge">🎯 Совместные мечты & цели</div>
          <h2>Наш Bucket List</h2>
          <p class="subtitle">Отмечайте то, что уже успели воплотить, и планируйте новые грандиозные приключения!</p>
        </div>

        <!-- Progress Overview -->
        <div class="progress-card glass-panel" id="progress-overview">
          <!-- Filled dynamically -->
        </div>

        <!-- Toolbar & Filters -->
        <div class="bucket-toolbar glass-panel">
          <div class="toolbar-left">
            <div class="filter-chips" id="bucket-cat-chips">
              <button class="chip active" data-cat="all">✨ Все сферы</button>
              <button class="chip" data-cat="travel">✈️ Путешествия</button>
              <button class="chip" data-cat="cozy">🏡 Уют</button>
              <button class="chip" data-cat="creative">🎨 Творчество</button>
              <button class="chip" data-cat="adventure">🔥 Приключения</button>
            </div>
          </div>

          <div class="toolbar-right">
            <select class="select-input" id="bucket-status-select">
              <option value="all">Все статусы</option>
              <option value="pending">⏳ Запланированные</option>
              <option value="completed">🎉 Выполненные</option>
            </select>
            <button class="btn btn-gradient btn-pulse" id="btn-add-bucket-item">
              + Новая цель
            </button>
          </div>
        </div>

        <!-- Bucket List Cards Grid -->
        <div class="bucket-grid" id="bucket-grid">
          <!-- Item Cards rendered here -->
        </div>
      </div>
    `;

    this.updateProgress();
    this.renderListOnly();
  }

  updateProgress() {
    const total = this.items.length;
    const completedCount = this.items.filter((i) => i.completed).length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const progressEl = this.container.querySelector('#progress-overview');
    if (!progressEl) return;

    progressEl.innerHTML = `
      <div class="progress-text-info">
        <div class="progress-title">
          <span>Воплощено мечтаний</span>
          <span class="progress-stats"><b>${completedCount}</b> из <b>${total}</b></span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
      <div class="progress-badge">
        <span class="percentage">${percentage}%</span>
        <span class="lbl">Готово</span>
      </div>
    `;
  }

  renderListOnly() {
    const grid = this.container.querySelector('#bucket-grid');
    if (!grid) return;

    const filtered = this.getFilteredItems();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state glass-card">
          <div class="empty-icon">🎈</div>
          <h4>Пока нет целей в этом разделе</h4>
          <p>Нажмите "+ Новая цель", чтобы добавить совместное желание!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (item) => `
      <div class="bucket-card glass-card ${item.completed ? 'completed' : ''}" data-id="${item.id}">
        <div class="bucket-card-header">
          <div class="bucket-checkbox ${item.completed ? 'checked' : ''}" data-action="toggle-complete">
            ${item.completed ? '✓' : ''}
          </div>
          <div class="bucket-icon">${item.icon || '🎯'}</div>
          <div class="bucket-details">
            <span class="bucket-cat-tag">${item.categoryName || 'Цель'}</span>
            <h4 class="bucket-item-title">${this.escapeHtml(item.title)}</h4>
            ${item.targetDate ? `<span class="target-date">📅 До ${item.targetDate}</span>` : ''}
          </div>
        </div>

        ${
          item.completed
            ? `
          <div class="bucket-memory-box">
            <div class="memory-header">
              <span>🎉 Исполнено ${item.completedAt ? `(${item.completedAt})` : ''}</span>
            </div>
            <p class="memory-note">${item.note ? this.escapeHtml(item.note) : 'Воспоминание сохранено ❤️'}</p>
          </div>
        `
            : ''
        }

        <div class="bucket-card-footer">
          <button class="btn-text" data-action="add-note">
            📝 ${item.note ? 'Редактировать заметку' : 'Добавить впечатление'}
          </button>
          <button class="btn-text btn-danger-text" data-action="delete">
            🗑️ Удалить
          </button>
        </div>
      </div>
    `
      )
      .join('');
  }

  bindEvents() {
    // Category chips
    const catChips = this.container.querySelectorAll('#bucket-cat-chips .chip');
    catChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        catChips.forEach((c) => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.cat;
        AudioFX.playClick();
        this.renderListOnly();
      });
    });

    // Status filter
    const statusSelect = this.container.querySelector('#bucket-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.activeStatus = e.target.value;
        AudioFX.playClick();
        this.renderListOnly();
      });
    }

    // Add Item button
    const btnAdd = this.container.querySelector('#btn-add-bucket-item');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        AudioFX.playClick();
        window.dispatchEvent(new CustomEvent('openAddBucketModal'));
      });
    }

    // Card Delegated events (toggle complete, add note, delete)
    const grid = this.container.querySelector('#bucket-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.bucket-card');
        if (!card) return;
        const itemId = card.dataset.id;
        const actionTarget = e.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;

        if (action === 'toggle-complete') {
          this.toggleComplete(itemId, e);
        } else if (action === 'add-note') {
          this.promptNote(itemId);
        } else if (action === 'delete') {
          this.deleteItem(itemId);
        }
      });
    }
  }

  toggleComplete(id, event) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;

    item.completed = !item.completed;
    if (item.completed) {
      item.completedAt = new Date().toISOString().split('T')[0];
      AudioFX.playSuccess();
      const rect = event.target.getBoundingClientRect();
      triggerConfetti(rect.left / window.innerWidth, rect.top / window.innerHeight);
    } else {
      item.completedAt = null;
      AudioFX.playClick();
    }

    Storage.saveBucketList(this.items);
    this.updateProgress();
    this.renderListOnly();
  }

  promptNote(id) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;

    const currentNote = item.note || '';
    const newNote = prompt('Добавьте заметку или яркое воспоминание об этом событии:', currentNote);
    if (newNote !== null) {
      item.note = newNote.trim();
      Storage.saveBucketList(this.items);
      AudioFX.playClick();
      this.renderListOnly();
    }
  }

  deleteItem(id) {
    if (confirm('Удалить эту цель из вашего списка?')) {
      this.items = this.items.filter((i) => i.id !== id);
      Storage.saveBucketList(this.items);
      AudioFX.playClick();
      this.updateProgress();
      this.renderListOnly();
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}
