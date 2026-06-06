// ========== FIREBASE INIT ==========
const firebaseConfig = {
  apiKey: "AIzaSyD19JGl5WQ6J9DluiZ2h5tS2-4XOQK_JKc",
  authDomain: "anketa-roygon.firebaseapp.com",
  projectId: "anketa-roygon",
  storageBucket: "anketa-roygon.firebasestorage.app",
  messagingSenderId: "336789061218",
  appId: "1:336789061218:web:3c3e226a076705a2bedb3b",
  measurementId: "G-KFKRE3GZ40"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const sessionsRef = db.collection('sessions');

// ========== STATE ==========
let sessionId = null;
let userName = null;
let currentQuestionIndex = 0;
let answersMap = {};

// DOM
const mainContent = document.getElementById('mainContent');
const progBarWrap = document.getElementById('progBarWrap');
const progressBar = document.getElementById('progressBar');
const counter = document.getElementById('counter');
const nextBtn = document.getElementById('nextBtn');

// ========== 20 QUESTIONS ==========
const questions = [
  { text: "1. Дар муносибатҳо ҳозир дарди асосии ту чист?", type: "text" },
  {
    text: "2. Кадом ҳис бештар дар ту такрор мешавад?",
    subText: "Якчанд вариант интихоб кун:",
    type: "checkbox", hasOther: true,
    options: ["Беарзишӣ", "Нодида шудан", "Тарси танҳоӣ", "Рашк", "Вобастагӣ", "Хашм", "Шарм", "Тарси тарк шудан", "Тарси рад шудан", "Назорат", "Хунукӣ"]
  },
  {
    text: "3. Вақте мард сард мешавад ё камтар менависад, ту чӣ кор мекунӣ?",
    type: "checkbox", hasOther: true,
    options: ["Зиёд менависам/мечаспам", "Хунук мешавам/ҷавоб намедиҳам", "Талаб мекунам ва фаҳмонданӣ мешавам", "Метарсам ва кӯшиш мекунам хубтар шавам"]
  },
  { text: "4. Аз ҳама бештар аз чӣ метарсӣ?", type: "text" },
  {
    text: "5. Вақте мард дур мешавад, дар бадани ту чӣ мешавад?",
    type: "checkbox", hasOther: true,
    options: ["Гулӯям мегирад", "Нафасам танг мешавад", "Дар қафаси синаам дард ё вазнинӣ ҳис мекунам", "Меларзам ё хунук мешавам", "Дили ман тез мезанад", "Ҳисси холӣ будан дар меъда"]
  },
  { text: "6. Барои нигоҳ доштани мард чӣ кор мекунӣ, ки баъд пушаймон мешавӣ?", type: "text" },
  { text: "7. Чаро фикр мекунӣ мард туро пурра интихоб намекунад?", type: "text" },
  {
    text: "8. Дар назди мард ту бештар кӣ мешавӣ?",
    type: "checkbox", hasOther: true,
    options: ["Модар (назорат, ғамхории зиёд)", "Духтарча (гиря, ноз, интизорӣ)", "Қурбонӣ (шикоят, ранҷиш)", "Ҷанговар (талаб, исбот)", "Нодида (хомӯш, розикунанда)"]
  },
  { text: "9. Кадом рафтори мард туро сахт мешиканад?", type: "text" },
  { text: "10. Кадом сухан ё ҷумла то имрӯз дар сарат садо медиҳад?", subText: "(Аз мард ё аз гузашта)", type: "text" },
  {
    text: "11. Дар кӯдакӣ бештар аз кӣ шикастӣ?",
    type: "checkbox", hasOther: true,
    options: ["Падар", "Модар", "Ака/Апа", "Муаллим", "Хешовандон"]
  },
  { text: "12. Бори аввал кай худро нолозим, нодида ё беқадр ҳис кардӣ?", subText: "(Синну сол ва ҳолатро навис)", type: "text" },
  {
    text: "13. Ту дар бораи худ чӣ фикри дарднок дорӣ?",
    type: "checkbox", hasOther: true,
    options: ["«Ман кофӣ хуб нестам»", "«Маро дӯст доштан мумкин нест»", "«Ман ҳамеша партофта мешавам»", "«Ман бояд исбот кунам, ки лозимам»", "«Ба мардҳо бовар кардан мумкин нест»"]
  },
  { text: "14. Пеш барои ин мушкил чӣ кор кардӣ ва чӣ кӯмак кард?", type: "text" },
  { text: "15. Чӣ кӯмак накард ё ҳатто бадтар кард?", type: "text" },
  { text: "16. Агар ин мушкил ҳал нашавад, баъди 1 сол зиндагият чӣ мешавад?", type: "text" },
  { text: "17. Агар ин мушкил ҳал шавад, ту чӣ гуна зан мешавӣ?", type: "text" },
  {
    text: "18. Ба кадом формат бештар бовар мекунӣ?",
    type: "checkbox", hasOther: true,
    options: ["Курси гурӯҳӣ", "Кори инфиродӣ (як ба як)", "Машварати кӯтоҳ", "Дарсҳои сабтшуда"]
  },
  { text: "19. Барои ҳалли ин дард чӣ қадар маблағ дода метавонӣ?", type: "text" },
  { text: "20. Аз ман ҳамчун мутахассис чӣ интизор мешавӣ?", type: "text" }
];

// ========== FIRESTORE HELPERS ==========
function generateId() {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

async function loadOrCreateSession() {
  const savedId = localStorage.getItem('anketa_sessionId');

  if (savedId) {
    try {
      const doc = await sessionsRef.doc(savedId).get();
      if (doc.exists) {
        const data = doc.data();
        sessionId = savedId;
        userName = data.userName || null;
        currentQuestionIndex = data.currentQ || 0;
        answersMap = data.answers || {};
        return data.status;
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
  }

  // Create new session
  sessionId = generateId();
  await sessionsRef.doc(sessionId).set({
    userName: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    currentQ: 0,
    status: 'active',
    answers: {}
  });
  localStorage.setItem('anketa_sessionId', sessionId);
  return 'active';
}

async function saveAnswer(index, answer) {
  answersMap[String(index)] = answer;
  const nextQ = index + 1;
  const status = nextQ >= questions.length ? 'finished' : 'active';

  await sessionsRef.doc(sessionId).update({
    [`answers.${index}`]: answer,
    currentQ: nextQ,
    status: status,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  return status;
}

async function saveUserName(name) {
  userName = name;
  await sessionsRef.doc(sessionId).update({ userName: name });
}

// ========== UI ==========
function getCurrentAnswer() {
  const q = questions[currentQuestionIndex];
  if (!q) return null;

  if (q.type === 'text') {
    const ta = document.getElementById('questionTextarea');
    if (!ta) return null;
    const val = ta.value.trim();
    return val.length > 0 ? val : null;
  }

  if (q.type === 'checkbox') {
    const checked = [];
    document.querySelectorAll('.cb-option:checked').forEach(cb => checked.push(cb.value));

    const otherCb = document.getElementById('other-checkbox');
    const otherInput = document.getElementById('other-input');
    if (otherCb && otherCb.checked) {
      const otherVal = otherInput ? otherInput.value.trim() : '';
      if (!otherVal) return null;
      checked.push('Дигар: ' + otherVal);
    }
    return checked.length > 0 ? checked : null;
  }
  return null;
}

function validateAndEnableNext() {
  nextBtn.disabled = (getCurrentAnswer() === null);
}

function renderNameInput() {
  progBarWrap.style.display = 'none';
  counter.style.display = 'none';
  nextBtn.style.display = 'none';

  mainContent.innerHTML = `
    <div class="question-text">Номи худро нависед</div>
    <div class="q-subtitle">Ин ба мо кӯмак мекунад, ки ба шумо шахсӣ муроҷиат кунем.</div>
    <div class="options-container">
      <input type="text" id="nameInput" class="name-input" placeholder="Номи шумо" maxlength="50" autocomplete="off" />
    </div>
    <button id="startBtn" class="btn-primary" style="margin-top:28px;" disabled>Оғоз кардан →</button>
  `;

  const nameInput = document.getElementById('nameInput');
  const startBtn = document.getElementById('startBtn');
  nameInput.focus();

  nameInput.addEventListener('input', () => {
    startBtn.disabled = nameInput.value.trim().length < 2;
  });

  startBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (name.length >= 2) {
      startBtn.disabled = true;
      startBtn.textContent = '...';
      await saveUserName(name);
      nextBtn.style.display = 'block';
      renderQuestion();
    }
  });
}

function renderQuestion() {
  const q = questions[currentQuestionIndex];
  if (!q) return;

  progBarWrap.style.display = 'block';
  counter.style.display = 'block';
  nextBtn.style.display = 'block';
  nextBtn.disabled = true;

  const progress = (currentQuestionIndex / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
  counter.textContent = `${currentQuestionIndex + 1}/${questions.length}`;

  const savedAnswer = answersMap[String(currentQuestionIndex)];

  let html = `<div class="question-text">${q.text}</div>`;
  if (q.subText) {
    html += `<div class="q-subtitle">${q.subText}</div>`;
  }

  if (q.type === 'text') {
    const val = (typeof savedAnswer === 'string') ? savedAnswer : '';
    html += `
      <div class="options-container">
        <textarea id="questionTextarea" class="answer-textarea"
                  placeholder="Ҷавоби шумо..." rows="5" maxlength="2000">${val}</textarea>
      </div>
    `;
    mainContent.innerHTML = html;

    const ta = document.getElementById('questionTextarea');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    nextBtn.disabled = val.length === 0;

    ta.addEventListener('input', () => {
      nextBtn.disabled = ta.value.trim().length === 0;
    });

  } else if (q.type === 'checkbox') {
    const savedArr = Array.isArray(savedAnswer) ? savedAnswer : [];
    const savedOtherEntry = savedArr.find(a => a.startsWith('Дигар: ')) || '';
    const savedOtherText = savedOtherEntry ? savedOtherEntry.replace('Дигар: ', '') : '';
    const savedChecked = savedArr.filter(a => !a.startsWith('Дигар: '));

    html += `<div class="options-container">`;
    q.options.forEach((opt, i) => {
      const isChecked = savedChecked.includes(opt) ? 'checked' : '';
      html += `
        <label class="cb-label ${isChecked ? 'cb-label--checked' : ''}">
          <input type="checkbox" class="cb-option" value="${opt}" id="cb-${i}" ${isChecked}>
          <span class="cb-custom-box"></span>
          <span class="cb-text">${opt}</span>
        </label>
      `;
    });

    if (q.hasOther) {
      const isOtherChecked = savedOtherText.length > 0 ? 'checked' : '';
      html += `
        <label class="cb-label ${isOtherChecked ? 'cb-label--checked' : ''}" id="other-label">
          <input type="checkbox" id="other-checkbox" value="other" ${isOtherChecked}>
          <span class="cb-custom-box"></span>
          <span class="cb-text">Дигар</span>
        </label>
        <div class="other-input-wrap ${isOtherChecked ? '' : 'hidden'}" id="other-input-wrap">
          <input type="text" id="other-input" class="other-text-input"
                 placeholder="Нависед..." value="${savedOtherText}" maxlength="500" />
        </div>
      `;
    }
    html += `</div>`;
    mainContent.innerHTML = html;

    document.querySelectorAll('.cb-option').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.cb-label').classList.toggle('cb-label--checked', cb.checked);
        validateAndEnableNext();
      });
    });

    const otherCb = document.getElementById('other-checkbox');
    const otherWrap = document.getElementById('other-input-wrap');
    const otherInput = document.getElementById('other-input');
    const otherLabel = document.getElementById('other-label');

    if (otherCb) {
      otherCb.addEventListener('change', () => {
        otherLabel.classList.toggle('cb-label--checked', otherCb.checked);
        if (otherCb.checked) {
          otherWrap.classList.remove('hidden');
          otherInput.focus();
        } else {
          otherWrap.classList.add('hidden');
          if (otherInput) otherInput.value = '';
        }
        validateAndEnableNext();
      });
      if (otherInput) otherInput.addEventListener('input', validateAndEnableNext);
    }

    validateAndEnableNext();
  }
}

function showResult() {
  progBarWrap.style.display = 'block';
  progressBar.style.width = '100%';
  counter.textContent = `${questions.length}/${questions.length}`;
  nextBtn.style.display = 'none';

  mainContent.innerHTML = `
    <div class="result-card">
      <div class="result-emoji">✅</div>
      <h2 class="result-title">Ташаккур, ${userName || 'дӯст'}!</h2>
      <p class="result-description">
        Ҷавобҳои шумо қабул шуд.<br><br>
        Мо онҳоро барои сохтани барнома истифода хоҳем кард.
      </p>
    </div>
  `;
}

nextBtn.addEventListener('click', async () => {
  const answer = getCurrentAnswer();
  if (answer === null) return;

  nextBtn.disabled = true;
  nextBtn.textContent = '...';

  const status = await saveAnswer(currentQuestionIndex, answer);

  if (status === 'finished') {
    showResult();
  } else {
    currentQuestionIndex++;
    nextBtn.textContent = 'Давом додан';
    renderQuestion();
  }
});

// ========== INIT ==========
async function init() {
  try {
    const status = await loadOrCreateSession();

    if (status === 'finished') {
      showResult();
      return;
    }

    if (!userName) {
      renderNameInput();
    } else {
      nextBtn.style.display = 'block';
      renderQuestion();
    }
  } catch (err) {
    console.error('Init error:', err);
    mainContent.innerHTML = `<p style="text-align:center;color:#FFA500;padding:40px 0;">
      Хатогӣ рух дод. Лутфан саҳифаро нав кунед.</p>`;
  }
}

init();
