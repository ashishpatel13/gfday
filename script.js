// Game logic for Case of the Missing Heart
let GF_NAME = 'Your Girlfriend';
let DEEPSEEK_API_KEY = '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const fallbackHints = {
  scramble: `Try rearranging the letters to form common words—look for prefixes or suffixes to help!`,
  memory: 'Hint: find two identical heart icons in succession.',
  statute: 'Hint: match each term logically: Objection = protest; Sustained = allowed; Overruled = disallowed.',
  cross: 'Hint: chocolate fingerprints point to the sweetest clue.',
  timeline: 'Hint: think about the sweet progression of your relationship.',
  travel: 'Hint: remember those trips together—only the states you both visited!'
};

async function getDeepSeekHint(puzzleType, data = {}) {
  try {
    const systemPrompt =
      `You are a playful, flirty hint assistant for the web game "Case of the Missing Heart"—a mystery-style puzzle celebrating National Girlfriend Day.`;
    const userPrompt =
      `Puzzle type: ${puzzleType}. Data: ${JSON.stringify(data)}. Provide a concise, cute hint.`;

    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false
      })
    });
    if (!res.ok) throw new Error('Network response not ok');
    const json = await res.json();
    const hint = json.choices?.[0]?.message?.content?.trim();
    return hint || fallbackHints[puzzleType];
  } catch (e) {
    console.warn('DeepSeek hint failed:', e);
    return fallbackHints[puzzleType];
  }
}

function startGame() {
  GF_NAME = document.getElementById('gf-name').value.trim() || 'Your Girlfriend';
  DEEPSEEK_API_KEY = document.getElementById('api-key').value.trim();
  nextSection('puzzle1');
}

function personalize() {
  document.getElementById('final-msg').textContent = `Objection overruled – ${GF_NAME}, you stole my heart!`;
}

function nextSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');
  if (id === 'puzzle2') initMemory();
  if (id === 'verdict') personalize();
}

async function showHint(type) {
  let data = {};
  if (type === 'scramble') {
    data.scrambled = 'yuo ertocolle ievl <3';
    data.guess = document.getElementById('scramble-input').value;
  }
  if (type === 'timeline') {
    data.inputs = {
      msg: document.getElementById('date-msg').value,
      meet: document.getElementById('date-meet').value,
      love: document.getElementById('date-love').value,
      ask: document.getElementById('date-ask').value
    };
  }
  if (type === 'travel') {
    data.selected = Array.from(document.querySelectorAll('input[name="state"]:checked')).map(e => e.value);
  }
  const hint = await getDeepSeekHint(type, data);
  document.getElementById(`${type}-hint`).textContent = hint;
}

function checkScramble() {
  const input = document.getElementById('scramble-input').value.trim().toLowerCase();
  const correct = 'you recollect evil <3';
  if (input === correct) {
    document.getElementById('scramble-msg').textContent = 'Correct!';
    setTimeout(() => nextSection('puzzle2'), 1000);
  } else {
    document.getElementById('scramble-msg').textContent = 'Try again.';
  }
}

let firstCard, secondCard, lock = false, matches = 0;
function initMemory() {
  const grid = document.getElementById('memory-grid');
  grid.innerHTML = '';
  ['💖','💖','💕','💕','❤️','❤️','💗','💗'].sort(() => 0.5 - Math.random()).forEach(icon => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.icon = icon;
    card.addEventListener('click', flipCard);
    grid.appendChild(card);
  });
  matches = 0;
}

function flipCard() {
  if (lock || this === firstCard) return;
  this.textContent = this.dataset.icon;
  if (!firstCard) { firstCard = this; return; }
  secondCard = this; lock = true;
  if (firstCard.dataset.icon === secondCard.dataset.icon) { matches++; resetMatch(); }
  else { setTimeout(() => { firstCard.textContent = ''; secondCard.textContent = ''; resetMatch(); }, 800); }
  if (matches === 4) setTimeout(() => nextSection('puzzle3'), 500);
}

function resetMatch() { [firstCard, secondCard, lock] = [null, null, false]; }

let dragged;
document.addEventListener('dragstart', e => { if (e.target.classList.contains('def')) dragged = e.target; });
document.querySelectorAll('.term').forEach(term => {
  term.addEventListener('dragover', e => e.preventDefault());
  term.addEventListener('drop', e => { e.preventDefault(); term.appendChild(dragged); term.dataset.def = dragged.textContent; });
});

function checkStatute() {
  const mapping = {
    'Objection': 'A lawyer protests a question’s validity',
    'Sustained': 'A judge agrees the question is allowed',
    'Overruled': 'A judge disallows a lawyer’s protest'
  };
  const correctCount = Array.from(document.querySelectorAll('.term')).filter(t => t.dataset.def === mapping[t.dataset.term]).length;
  if (correctCount === 3) {
    document.getElementById('statute-msg').textContent = 'All set!';
    setTimeout(() => nextSection('crossExam'), 1000);
  } else {
    document.getElementById('statute-msg').textContent = 'Check your matches.';
  }
}

function checkCross() {
  const sel = document.querySelector('input[name="q"]:checked');
  if (!sel) return alert('Please choose an option.');
  if (sel.value === '1') {
    document.getElementById('cross-msg').textContent = 'Correct!';
    setTimeout(() => nextSection('timeline'), 1000);
  } else {
    document.getElementById('cross-msg').textContent = 'Not quite, try again.';
  }
}

function checkTimeline() {
  const correct = {
    msg: '2024-01-25',
    meet: '2024-04-25',
    love: '2024-04-28',
    ask: '2024-04-28'
  };
  const inputs = {
    msg: document.getElementById('date-msg').value,
    meet: document.getElementById('date-meet').value,
    love: document.getElementById('date-love').value,
    ask: document.getElementById('date-ask').value
  };
  const allCorrect = Object.keys(correct).every(k => inputs[k] === correct[k]);
  if (allCorrect) {
    document.getElementById('timeline-msg').textContent = 'You remembered all the dates!';
    setTimeout(() => nextSection('travel'), 1000);
  } else {
    document.getElementById('timeline-msg').textContent = 'Hmm, check the dates again.';
  }
}

function checkTravel() {
  const selected = Array.from(document.querySelectorAll('input[name="state"]:checked')).map(e => e.value);
  const required = ['TN', 'NV', 'NY', 'IL'];
  const isCorrect = required.every(r => selected.includes(r)) && selected.length === required.length;
  if (isCorrect) {
    document.getElementById('travel-msg').textContent = 'Road trip success!';
    setTimeout(() => nextSection('verdict'), 1000);
  } else {
    document.getElementById('travel-msg').textContent = 'Try selecting only the places you both visited.';
  }
}

function showObjection() { alert('Objection sustained – you’re too cute! ❤️'); }

async function downloadCert() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.text('Certificate of Love', 20, 30);
  doc.setFontSize(16);
  doc.text('This certifies that you have successfully proven your love.', 20, 50);
  doc.text('Date: ' + new Date().toLocaleDateString(), 20, 70);
  doc.save('Certificate_of_Love.pdf');
}

