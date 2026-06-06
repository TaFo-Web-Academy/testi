// ========== КЛИЕНТСКАЯ ЛОГИКА АНКЕТЫ ==========

const ADMIN_LINK = '/admin'; // Ссылка на админку в конце
let sessionId = null;
let userName = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];

// DOM элементы
const mainContent = document.getElementById('mainContent');
const progBarWrap = document.getElementById('progBarWrap');
const progressBar = document.getElementById('progressBar');
const counter = document.getElementById('counter');
const nextBtn = document.getElementById('nextBtn');

// 20 вопросов
const questions = [
  { text: "1. Дар муносибатҳо ҳозир дарди асосии ту чист?", type: "text" },
  { text: "2. Кадом ҳис бештар дар ту такрор мешавад?", type: "checkbox", hasOther: true, options: ["Беарзишӣ", "Нодида шудан", "Тарси танҳоӣ", "Рашк", "Вобастагӣ", "Хашм", "Шарм", "Тарси тарк шудан", "Тарси рад шудан", "Назорат", "Хунукӣ"] },
  { text: "3. Вақте мард сард мешавад ё камтар менависад, ту чӣ кор мекунӣ?", type: "checkbox", hasOther: true, options: ["Зиёд менависам/мечаспам", "Хунук мешавам/ҷавоб намедиҳам", "Талаб мекунам ва фаҳмонданӣ мешавам", "Метарсам ва кӯшиш мекунам хубтар шавам"] },
  { text: "4. Аз ҳама бештар аз чӣ метарсӣ?", type: "text" },
  { text: "5. Вақте мард дур мешавад, дар бадани ту чӣ мешавад?", type: "checkbox", hasOther: true, options: ["Гулӯям мегирад", "Нафасам танг мешавад", "Дар қафаси синаам дард ё вазнинӣ ҳис мекунам", "Меларзам ё хунук мешавам", "Дили ман тез мезанад", "Ҳисси холӣ будан дар меъда"] },
  { text: "6. Барои нигоҳ доштани мард чӣ кор мекунӣ, ки баъд пушаймон мешавӣ?", type: "text" },
  { text: "7. Чаро фикр мекунӣ мард туро пурра интихоб намекунад?", type: "text" },
  { text: "8. Дар назди мард ту бештар кӣ мешавӣ?", type: "checkbox", hasOther: true, options: ["Модар (назорат, ғамхории зиёд)", "Духтарча (гиря, ноз, интизорӣ)", "Қурбонӣ (шикоят, ранҷиш)", "Ҷанговар (талаб, исбот)", "Нодида (хомӯш, розикунанда)"] },
  { text: "9. Кадом рафтори мард туро сахт мешиканад?", type: "text" },
  { text: "10. Кадом сухан ё ҷумла то имрӯз дар сарат садо медиҳад?", subText: "(Аз мард ё аз гузашта)", type: "text" },
  { text: "11. Дар кӯдакӣ бештар аз кӣ шикастӣ?", type: "checkbox", hasOther: true, options: ["Падар", "Модар", "Ака/Апа", "Муаллим", "Хешовандон"] },
  { text: "12. Бори аввал кай худро нолозим, нодида ё беқадр ҳис кардӣ?", subText: "(Синну сол ва ҳолатро навис)", type: "text" },
  { text: "13. Ту дар бораи худ чӣ фикри дарднок дорӣ?", type: "checkbox", hasOther: true, options: ["«Ман кофӣ хуб нестам»", "«Маро дӯст доштан мумкин нест»", "«Ман ҳамеша партофта мешавам»", "«Ман бояд исбот кунам, ки лозимам»", "«Ба мардҳо бовар кардан мумкин нест»"] },
  { text: "14. Пеш барои ин мушкил чӣ кор кардӣ ва чӣ кӯмак кард?", type: "text" },
  { text: "15. Чӣ кӯмак накард ё ҳатто бадтар кард?", type: "text" },
  { text: "16. Агар ин мушкил ҳал нашавад, баъди 1 сол зиндагият чӣ мешавад?", type: "text" },
  { text: "17. Агар ин мушкил ҳал шавад, ту чӣ гуна зан мешавӣ?", type: "text" },
  { text: "18. Ба кадом формат бештар бовар мекунӣ?", type: "checkbox", hasOther: true, options: ["Курси гурӯҳӣ", "Кори инфиродӣ (як ба як)", "Машварати кӯтоҳ", "Дарсҳои сабтшуда"] },
  { text: "19. Барои ҳалли ин дард чӣ қадар маблағ дода метавонӣ?", type: "text" },
  { text: "20. Аз ман ҳамчун мутахассис чӣ интизор мешавӣ?", type: "text" }
];

async function startSession() {
  const savedSessionId = localStorage.getItem('anketa_sessionId');
  const savedUserName = localStorage.getItem('anketa_userName') || '';

  const response = await fetch('/api/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: savedSessionId || undefined,
      userName: savedUserName || undefined
    })
  });

  const data = await response.json();
  sessionId = data.sessionId;
  userName = data.userName || savedUserName;
  localStorage.setItem('anketa_sessionId', sessionId);

  currentQuestionIndex = data.currentQuestion;
  selectedAnswers = data.answers || [];

  return data;
}

async function submitAnswer(answer) {
  selectedAnswers[currentQuestionIndex] = answer;

  const response = await fetch('/api/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, answer })
  });

  const data = await response.json();

  if (data.status === 'finished') {
    showResult();
  } else {
    currentQuestionIndex = data.nextQuestion;
    renderQuestion();
  }
}

async function recordClick() {
  try {
    await fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, linkType: 'admin' })
    });
  } catch (e) {
    console.log('Click recorded');
  }
}

function getCurrentAnswer() {
  const q = questions[currentQuestionIndex];
  if (!q) return null;

  if (q.type === 'text') {
    const textarea = document.getElementById('questionTextarea');
    if (!textarea) return null;
    const val = textarea.value.trim();
    return val.length > 0 ? val : null;
  } else if (q.type === 'checkbox') {
    const checked = [];
    document.querySelectorAll('.cb-option:checked').forEach(cb => {
      checked.push(cb.value);
    });
    const otherCb = document.getElementById('other-checkbox');
    const otherInput = document.getElementById('other-input');
    if (otherCb && otherCb.checked) {
      const otherVal = otherInput ? otherInput.value.trim() : '';
      if (otherVal.length > 0) {
        checked.push('Дигар: ' + otherVal);
      } else {
        return null; // Пустой ввод
      }
    }
    return checked.length > 0 ? checked : null;
  }
  return null;
}

function validateAndEnableNext() {
  const answer = getCurrentAnswer();
  nextBtn.disabled = (answer === null);
}

function renderNameInput() {
  progBarWrap.style.display = 'none';
  counter.style.display = 'none';

  mainContent.innerHTML = `
    <div class="question-text">Номи худро нависед</div>
    <div class="q-subtitle">Ин ба мо кӯмак мекунад, ки ба шумо шахсӣ муроҷиат кунем.</div>
    <div class="options-container">
      <input type="text" id="nameInput" class="name-input" 
             placeholder="Номи шумо" maxlength="50" autocomplete="off" />
    </div>
  `;

  const nameInput = document.getElementById('nameInput');
  nameInput.focus();

  nextBtn.textContent = 'Оғоз кардан';
  nextBtn.disabled = true;

  nameInput.addEventListener('input', () => {
    nextBtn.disabled = nameInput.value.trim().length < 2;
  });

  nextBtn.onclick = async () => {
    const name = nameInput.value.trim();
    if (name.length >= 2) {
      userName = name;
      localStorage.setItem('anketa_userName', name);
      await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userName: name })
      });
      nextBtn.textContent = 'Давом додан';
      nextBtn.onclick = null;
      renderQuestion();
    }
  };
}

function renderQuestion() {
  const q = questions[currentQuestionIndex];
  if (!q) return;

  progBarWrap.style.display = 'block';
  counter.style.display = 'block';

  const progress = (currentQuestionIndex / questions.length) * 100;
  progressBar.style.width = \`\${progress}%\`;
  counter.textContent = \`\${currentQuestionIndex + 1}/\${questions.length}\`;

  const savedAnswer = selectedAnswers[currentQuestionIndex];

  let html = \`<div class="question-text">\${q.text}</div>\`;

  if (q.subText) {
    const subEscaped = q.subText.replace(/\\n/g, '<br>');
    html += \`<div class="q-subtitle">\${subEscaped}</div>\`;
  }

  if (q.type === 'text') {
    const savedVal = (typeof savedAnswer === 'string') ? savedAnswer : '';
    html += \`
      <div class="options-container">
        <textarea id="questionTextarea" class="answer-textarea" 
                  placeholder="Ҷавоби шумо..." rows="5" maxlength="2000">\${savedVal}</textarea>
      </div>
    \`;
    mainContent.innerHTML = html;

    const textarea = document.getElementById('questionTextarea');
    textarea.focus();
    nextBtn.disabled = savedVal.length === 0;

    textarea.addEventListener('input', () => {
      nextBtn.disabled = textarea.value.trim().length === 0;
    });

  } else if (q.type === 'checkbox') {
    const savedArr = Array.isArray(savedAnswer) ? savedAnswer : [];
    const savedOther = savedArr.find(a => a.startsWith('Дигар: ')) || '';
    const savedOtherText = savedOther ? savedOther.replace('Дигар: ', '') : '';
    const savedChecked = savedArr.filter(a => !a.startsWith('Дигар: '));

    html += \`<div class="options-container">\`;

    q.options.forEach((opt, i) => {
      const isChecked = savedChecked.includes(opt) ? 'checked' : '';
      html += \`
        <label class="cb-label \${isChecked ? 'cb-label--checked' : ''}">
          <input type="checkbox" class="cb-option" value="\${opt}" id="cb-\${i}" \${isChecked}>
          <span class="cb-custom-box"></span>
          <span class="cb-text">\${opt}</span>
        </label>
      \`;
    });

    if (q.hasOther) {
      const otherChecked = savedOtherText.length > 0 ? 'checked' : '';
      html += \`
        <label class="cb-label \${otherChecked ? 'cb-label--checked' : ''}" id="other-label">
          <input type="checkbox" class="cb-option-other" id="other-checkbox" value="other" \${otherChecked}>
          <span class="cb-custom-box"></span>
          <span class="cb-text">Дигар</span>
        </label>
        <div class="other-input-wrap \${otherChecked ? '' : 'hidden'}" id="other-input-wrap">
          <input type="text" id="other-input" class="other-text-input" 
                 placeholder="Нависед..." value="\${savedOtherText}" maxlength="500" />
        </div>
      \`;
    }

    html += \`</div>\`;
    mainContent.innerHTML = html;

    document.querySelectorAll('.cb-option').forEach(cb => {
      const label = cb.closest('.cb-label');
      cb.addEventListener('change', () => {
        label.classList.toggle('cb-label--checked', cb.checked);
        validateAndEnableNext();
      });
    });

    const otherCb = document.getElementById('other-checkbox');
    const otherWrap = document.getElementById('other-input-wrap');
    const otherInput = document.getElementById('other-input');
    const otherLabel = document.getElementById('other-label');

    if (otherCb) {
      otherCb.addEventListener('change', () => {
        if (otherCb.checked) {
          otherWrap.classList.remove('hidden');
          otherInput.focus();
          otherLabel.classList.add('cb-label--checked');
        } else {
          otherWrap.classList.add('hidden');
          otherLabel.classList.remove('cb-label--checked');
          if (otherInput) otherInput.value = '';
        }
        validateAndEnableNext();
      });

      if (otherInput) {
        otherInput.addEventListener('input', () => {
          validateAndEnableNext();
        });
      }
    }

    validateAndEnableNext();
  }

  nextBtn.textContent = 'Давом додан';
  nextBtn.onclick = null;
}

function showResult() {
  progBarWrap.style.display = 'block';
  progressBar.style.width = '100%';
  counter.textContent = \`\${questions.length}/\${questions.length}\`;

  mainContent.innerHTML = \`
    <div class="result-card">
      <div class="result-emoji">📝</div>
      <h2 class="result-title">Анкета қабул шуд!</h2>
      <p class="result-description">
        Ташаккур барои ҷавобҳои самимии шумо.<br><br>
        Шумо муваффақона тестро хатм кардед!
      </p>
      <div class="result-step">
        Барои дидани ҷавобҳо ба панели администратор гузаред.
      </div>
      <a href="\${ADMIN_LINK}" class="telegram-link" id="adminLink" target="_blank">
        ⚙️ Панели Администратор
      </a>
    </div>
  \`;

  nextBtn.style.display = 'none';

  document.getElementById('adminLink').addEventListener('click', () => {
    recordClick();
  });
}

nextBtn.addEventListener('click', () => {
  if (nextBtn.textContent === 'Давом додан') {
    const answer = getCurrentAnswer();
    if (answer !== null) {
      submitAnswer(answer);
    }
  }
});

async function init() {
  try {
    const session = await startSession();

    if (!session.userName && session.status !== 'finished') {
      renderNameInput();
    } else if (session.status === 'finished') {
      showResult();
    } else {
      nextBtn.textContent = 'Давом додан';
      nextBtn.disabled = true;
      renderQuestion();
    }
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    mainContent.innerHTML = '<p style="text-align:center;color:#FFA500;">Хатогӣ рух дод. Лутфан саҳифаро нав кунед.</p>';
  }
}

init();
