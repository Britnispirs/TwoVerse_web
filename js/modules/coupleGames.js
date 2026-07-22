// Mini-Games & Quizzes for Couples ("Игры & Квизы")
import { Storage } from '../storage.js';
import { AudioFX } from '../audio.js';
import { triggerConfetti } from '../confetti.js';

export class CoupleGamesModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentTab = 'likely'; // likely, wheel
    this.likelyIndex = 0;
    this.wheelRotation = 0;
    this.isWheelSpinning = false;
  }

  init() {
    this.render();
    this.bindEvents();
    this.initWheelCanvas();
  }

  getLikelyQuestions() {
    const profile = Storage.getProfile();
    const p1 = profile.partner1;
    const p2 = profile.partner2;

    return [
      { id: 1, text: 'Кто вероятнее всего заберет себе всё одеяло ночью?' },
      { id: 2, text: 'Кто вероятнее всего уснет во время просмотра интересного фильма?' },
      { id: 3, text: 'Кто вероятнее всего потратит деньги на какую-нибудь забавную милоту?' },
      { id: 4, text: 'Кто вероятнее всего первый согласится на спонтанное путешествие?' },
      { id: 5, text: 'Кто из вас кулинарный гений на кухне?' },
      { id: 6, text: 'Кто вероятнее всего забудет, зачем зашел в комнату?' },
      { id: 7, text: 'Кто первым начинает обниматься после мелкой размолвки?' },
      { id: 8, text: 'Кто вероятнее всего организует грандиозный сюрприз на праздник?' }
    ];
  }

  getWheelOptions() {
    return [
      { text: '🍕 Заказываем любимую пиццу', color: '#ff4757' },
      { text: '💆‍♀️ Массаж спины 15 минут', color: '#9b51e0' },
      { text: '🎬 Выбирает фильм', color: '#2ed573' },
      { text: '🥐 Завтрак в постель завтра', color: '#ffa502' },
      { text: '🍦 Идем за десертом прямо сейчас', color: '#70a1ff' },
      { text: '💋 10 спонтанных поцелуев', color: '#ff6b8b' }
    ];
  }

  render() {
    const profile = Storage.getProfile();

    this.container.innerHTML = `
      <div class="games-wrapper">
        <div class="games-header">
          <div class="header-badge">🎮 Игры для двоих</div>
          <h2>Мини-игры & Развлечения</h2>
          <p class="subtitle">Повеселитесь вместе, решите спорные вопросы или доверьтесь Колесу Удачи!</p>
        </div>

        <!-- Sub-tab Bar -->
        <div class="games-tabs glass-panel">
          <button class="g-tab active" data-tab="likely">🤔 Кто вероятнее всего...</button>
          <button class="g-tab" data-tab="wheel">🎡 Колесо удачи на вечер</button>
        </div>

        <!-- Sub-tab 1: Who is Most Likely To -->
        <div class="g-subtab-content" id="tab-likely">
          <div class="likely-card glass-card-glow">
            <div class="likely-badge">Вопрос #<span id="likely-num">1</span></div>
            <h3 class="likely-question" id="likely-question">Загрузка...</h3>
            <p class="likely-hint">Каждый указывает на того, о ком это предложение!</p>

            <div class="likely-votes">
              <button class="likely-vote-btn btn-p1" id="btn-vote-p1">
                <span class="v-icon">👤</span>
                <span class="v-name" id="p1-name">${this.escapeHtml(profile.partner1)}</span>
              </button>
              <button class="likely-vote-btn btn-p2" id="btn-vote-p2">
                <span class="v-icon">👤</span>
                <span class="v-name" id="p2-name">${this.escapeHtml(profile.partner2)}</span>
              </button>
            </div>

            <div class="likely-result-box hidden" id="likely-result">
              <div class="result-emoji" id="res-emoji">🎉</div>
              <h4 id="res-title">Выбор сделан!</h4>
              <p id="res-text">Обсудите ваш выбор!</p>
            </div>

            <div class="likely-actions">
              <button class="btn btn-secondary" id="btn-next-likely">Следующий вопрос ➡️</button>
            </div>
          </div>
        </div>

        <!-- Sub-tab 2: Wheel of Fortune -->
        <div class="g-subtab-content hidden" id="tab-wheel">
          <div class="wheel-container glass-card-glow">
            <h3>🎡 Колесо решений для пары</h3>
            <p class="subtitle">Не можете решить, кто сегодня выбирает кино или делает массаж? Вращайте колесо!</p>

            <div class="wheel-box">
              <div class="wheel-pointer">▼</div>
              <canvas id="wheel-canvas" width="360" height="360"></canvas>
            </div>

            <div class="wheel-result-box" id="wheel-result-text">
              ✨ Нажмите "Вращать колесо", чтобы получить результат!
            </div>

            <button class="btn btn-gradient btn-lg btn-pulse" id="btn-spin-wheel">
              🎡 Вращать колесо!
            </button>
          </div>
        </div>
      </div>
    `;

    this.updateLikelyQuestion();
  }

  bindEvents() {
    // Subtab switching
    const tabs = this.container.querySelectorAll('.g-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        tabs.forEach((t) => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentTab = e.currentTarget.dataset.tab;
        AudioFX.playClick();

        const tLikely = this.container.querySelector('#tab-likely');
        const tWheel = this.container.querySelector('#tab-wheel');

        if (this.currentTab === 'likely') {
          tLikely.classList.remove('hidden');
          tWheel.classList.add('hidden');
        } else {
          tLikely.classList.add('hidden');
          tWheel.classList.remove('hidden');
          this.drawWheel();
        }
      });
    });

    // Votes for "Who is Most Likely To"
    const btnP1 = this.container.querySelector('#btn-vote-p1');
    const btnP2 = this.container.querySelector('#btn-vote-p2');
    const resBox = this.container.querySelector('#likely-result');

    if (btnP1 && btnP2) {
      btnP1.addEventListener('click', () => {
        AudioFX.playSuccess();
        triggerConfetti(0.3, 0.5);
        if (resBox) {
          resBox.classList.remove('hidden');
          this.container.querySelector('#res-title').textContent = `Выбрано: ${Storage.getProfile().partner1}!`;
          this.container.querySelector('#res-text').textContent = 'Согласен ли второй партнер с этим выбором? 😁';
        }
      });

      btnP2.addEventListener('click', () => {
        AudioFX.playSuccess();
        triggerConfetti(0.7, 0.5);
        if (resBox) {
          resBox.classList.remove('hidden');
          this.container.querySelector('#res-title').textContent = `Выбрано: ${Storage.getProfile().partner2}!`;
          this.container.querySelector('#res-text').textContent = 'Согласен ли второй партнер с этим выбором? 😁';
        }
      });
    }

    const btnNextLikely = this.container.querySelector('#btn-next-likely');
    if (btnNextLikely) {
      btnNextLikely.addEventListener('click', () => {
        const questions = this.getLikelyQuestions();
        this.likelyIndex = (this.likelyIndex + 1) % questions.length;
        AudioFX.playClick();
        if (resBox) resBox.classList.add('hidden');
        this.updateLikelyQuestion();
      });
    }

    // Spin wheel button
    const btnSpinWheel = this.container.querySelector('#btn-spin-wheel');
    if (btnSpinWheel) {
      btnSpinWheel.addEventListener('click', () => {
        this.spinWheel();
      });
    }
  }

  updateLikelyQuestion() {
    const questions = this.getLikelyQuestions();
    const q = questions[this.likelyIndex];

    const numEl = this.container.querySelector('#likely-num');
    const textEl = this.container.querySelector('#likely-question');

    if (numEl) numEl.textContent = `${this.likelyIndex + 1}/${questions.length}`;
    if (textEl) textEl.textContent = q.text;
  }

  initWheelCanvas() {
    setTimeout(() => {
      this.drawWheel();
    }, 100);
  }

  drawWheel() {
    const canvas = this.container.querySelector('#wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const options = this.getWheelOptions();
    const numOptions = options.length;
    const arcSize = (Math.PI * 2) / numOptions;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(this.wheelRotation);

    options.forEach((opt, idx) => {
      const angle = idx * arcSize;

      // Slice
      ctx.beginPath();
      ctx.fillStyle = opt.color;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 10, angle, angle + arcSize);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(opt.text, radius - 30, 5);
      ctx.restore();
    });

    // Center pin
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff4757';
    ctx.stroke();

    ctx.restore();
  }

  spinWheel() {
    if (this.isWheelSpinning) return;
    this.isWheelSpinning = true;
    AudioFX.playClick();

    const options = this.getWheelOptions();
    const extraSpins = 5 + Math.random() * 5;
    const totalRotation = extraSpins * Math.PI * 2 + Math.random() * Math.PI * 2;

    const duration = 4000;
    const start = performance.now();
    const initialRot = this.wheelRotation;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.wheelRotation = initialRot + totalRotation * easeOut;
      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isWheelSpinning = false;
        AudioFX.playSuccess();
        triggerConfetti(0.5, 0.5);

        // Determine winner option
        const normalized = (this.wheelRotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        // Pointer is at top (3*PI/2)
        const pointerAngle = (Math.PI * 3 / 2 - normalized + Math.PI * 2) % (Math.PI * 2);
        const arcSize = (Math.PI * 2) / options.length;
        const winnerIndex = Math.floor(pointerAngle / arcSize) % options.length;

        const winner = options[winnerIndex];
        const resText = this.container.querySelector('#wheel-result-text');
        if (resText) {
          resText.innerHTML = `🎉 <b>Результат колеса:</b><br><span style="color:${winner.color}; font-size:1.2rem;">${winner.text}</span>`;
        }
      }
    };

    requestAnimationFrame(animate);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}
