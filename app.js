/* ============================================================
   LILY — ENGLISH COACH · app.js (Gemini + Web Speech API)
   ============================================================ */

const state = {
  translated: 0,
  corrected: 0,
  words: 0,
  level: 'intermediate',
  phoneticStyle: 'both',
  currentMode: 'translate',
  targetLang: 'en',
  isTyping: false,
  apiKey: localStorage.getItem('gemini_api_key') || '',
  history: [],
};

const MODE_HINTS = {
  translate: '💬 Nhập tiếng Việt — Lily dịch sang tiếng Anh chuẩn giọng Mỹ',
  correct:   '✏️ Nhập câu tiếng Anh — Lily sửa lỗi chính tả & ngữ pháp',
  pronounce: '🔊 Nhập câu tiếng Anh — Lily phát âm chuẩn giọng Mỹ',
  rewrite:   '✨ Nhập câu tiếng Anh — Lily viết lại tự nhiên hơn',
  explain:   '💡 Nhập từ tiếng Anh — Lily giải thích nghĩa & cách dùng',
};

const TARGET_LANGS = {
  en: { name: '🇺🇸 English', flag: '🇺🇸' },
  ja: { name: '🇯🇵 Nhật Bản', flag: '🇯🇵' },
  ko: { name: '🇰🇷 Hàn Quốc', flag: '🇰🇷' },
  zh: { name: '🇨🇳 Trung Quốc', flag: '🇨🇳' },
};

async function callGemini(prompt, systemPrompt) {
  if (!state.apiKey) throw new Error('NO_API_KEY');

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model: 'llama-3.1-8b-instant',
    max_tokens: 500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  return text.trim();
}

const chatArea = document.getElementById('chat-area');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const statTranslated = document.getElementById('stat-translated');
const statCorrected = document.getElementById('stat-corrected');
const statWords = document.getElementById('stat-words');
const modeHintText = document.getElementById('mode-hint-text');

function formatTime(date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  setTimeout(() => chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' }), 50);
}

function bumpStat(el, val) {
  el.textContent = val;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 350);
}

function updateStats(type) {
  if (type === 'translated') {
    state.translated++;
    bumpStat(statTranslated, state.translated);
  } else if (type === 'corrected') {
    state.corrected++;
    bumpStat(statCorrected, state.corrected);
  } else if (type === 'words') {
    state.words++;
    bumpStat(statWords, state.words);
  }
}

function addMessage({ text, isUser, showSpeakBtn = false }) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isUser ? 'user' : 'lily'}`;

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${isUser ? 'user-avatar' : ''}`;
  avatar.textContent = isUser ? '🙋' : '🇺🇸';

  const bubbleWrap = document.createElement('div');

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  
  if (showSpeakBtn && !isUser) {
    const speakBtn = document.createElement('button');
    speakBtn.className = 'speak-btn';
    speakBtn.innerHTML = '🔊';
    speakBtn.title = 'Phát âm';
    speakBtn.onclick = () => speakText(extractEnglishText(text));
    bubble.appendChild(speakBtn);
  }
  
  const textSpan = document.createElement('span');
  textSpan.innerHTML = text.replace(/\n/g, '<br>');
  bubble.appendChild(textSpan);

  const timeEl = document.createElement('p');
  timeEl.className = 'msg-time';
  timeEl.textContent = formatTime(new Date());

  bubbleWrap.appendChild(bubble);
  bubbleWrap.appendChild(timeEl);
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubbleWrap);

  messagesContainer.appendChild(wrapper);
  scrollToBottom();
}

function extractEnglishText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

function showTyping() {
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🇺🇸';

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';

  indicator.appendChild(avatar);
  indicator.appendChild(dots);
  messagesContainer.appendChild(indicator);
  scrollToBottom();
}

function removeTyping() {
  document.getElementById('typing-indicator')?.remove();
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('Trình duyệt không hỗ trợ phát âm!');
    return;
  }
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('US')) 
                || voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utterance.voice = enVoice;
  
  window.speechSynthesis.speak(utterance);
}

function showNoKeyWarning() {
  const exists = document.getElementById('no-key-warning');
  if (exists) return;

  const warn = document.createElement('div');
  warn.id = 'no-key-warning';
  warn.className = 'no-key-warning';
  warn.innerHTML = `
    <span>⚠️ Chưa có API key.</span>
    <button onclick="openModal('settings-modal'); document.getElementById('no-key-warning').remove()">
      Thêm ngay →
    </button>
  `;
  document.querySelector('.input-area').prepend(warn);
}

function getModePrompt(text) {
  const level = state.level === 'beginner' ? 'A1-A2' : state.level === 'intermediate' ? 'B1-B2' : 'C1-C2';
  
  switch (state.currentMode) {
    case 'translate': {
      const langNames = { en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese (Simplified)' };
      return {
        system: `You are Lily, a professional Vietnamese-English translator. Translate accurately with natural, fluent ${level} level English.`,
        user: `Translate this Vietnamese text to ${langNames[state.targetLang]}:\n\n"${text}"`
      };
    }
    case 'correct':
      return {
        system: `You are Lily, an English teacher. Correct spelling and grammar errors. Provide corrections in this format:\n\n**Original:** [original sentence with errors]\n**Corrected:** [corrected sentence]\n**Explanation:** [brief explanation in Vietnamese]`,
        user: text
      };
    case 'pronounce':
      return {
        system: `You are Lily, an American English pronunciation expert. Provide phonetic transcription using IPA and Vietnamese pronunciation guide. Format:\n\n**Text:** [the sentence]\n**IPA:** [phonetic transcription]\n**Vietnamese:** [Vietnamese pronunciation guide]\n**Audio:** [use 🔊 button to hear pronunciation]`,
        user: text
      };
    case 'rewrite':
      return {
        system: `You are Lily, an English writing coach. Rewrite sentences to sound more natural and fluent. Keep the same meaning but use better word choices and structure appropriate for ${level} level.`,
        user: `Rewrite this sentence more naturally:\n\n"${text}"`
      };
    case 'explain':
      return {
        system: `You are Lily, an English vocabulary teacher. Explain word meaning, usage, examples in Vietnamese. Include:\n\n**Word:** [the word]\n**Meaning:** [Vietnamese meaning]\n**Part of speech:** [noun/verb/adj...]\n**Example:** [English example sentence]\n**Note:** [usage tips]`,
        user: text
      };
    default:
      return { system: 'You are Lily, an English tutor.', user: text };
  }
}

async function processMessage() {
  const text = messageInput.value.trim();
  if (!text || state.isTyping) return;

  if (!state.apiKey) {
    showNoKeyWarning();
    return;
  }

  messageInput.value = '';
  autoResize();
  addMessage({ text, isUser: true });

  state.isTyping = true;
  showTyping();

  try {
    const { system, user } = getModePrompt(text);
    const result = await callGemini(user, system);
    
    removeTyping();
    state.isTyping = false;

    const showSpeak = state.currentMode === 'translate' && state.targetLang === 'en';
    addMessage({ text: result, isUser: false, showSpeakBtn: showSpeak });

    if (state.currentMode === 'translate') updateStats('translated');
    else if (state.currentMode === 'correct') updateStats('corrected');
    else if (state.currentMode === 'explain') {
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount <= 3) updateStats('words');
    }

  } catch (err) {
    removeTyping();
    state.isTyping = false;

    let errorMsg = '⚠️ Có lỗi xảy ra. Thử lại nhé!';
    console.error('Gemini API Error:', err.message);
    if (err.message === 'NO_API_KEY') {
      errorMsg = '🔑 Bạn chưa nhập API Key. Vào ⚙️ Cài đặt để thêm.';
    } else if (err.message.includes('API_KEY_INVALID') || err.message.includes('400') || err.message.includes('UNAUTHENTICATED')) {
      errorMsg = '❌ API Key không hợp lệ. Vui lòng kiểm tra lại.';
    } else if (err.message.includes('quota') || err.message.includes('429')) {
      errorMsg = '⏳ Vượt giới hạn quota. Thử lại sau vài giây.';
    } else {
      errorMsg = '⚠️ Lỗi: ' + err.message;
    }

    addMessage({ text: errorMsg, isUser: false });
  }
}

function switchMode(modeKey) {
  if (state.currentMode === modeKey) return;

  state.currentMode = modeKey;
  state.history = [];

  document.querySelectorAll('.topic-chip').forEach(c =>
    c.classList.toggle('active', c.dataset.topic === modeKey)
  );

  modeHintText.textContent = MODE_HINTS[modeKey];

  const activeTag = document.getElementById('active-mode-tag');
  const modeNames = {
    translate: '✍️ Dịch thuật',
    correct: '📝 Sửa lỗi',
    pronounce: '🔊 Phát âm',
    rewrite: '✨ Viết lại',
    explain: '💡 Giải thích'
  };
  activeTag.textContent = modeNames[modeKey];

  messagesContainer.innerHTML = '';
}

function changeTargetLang(lang) {
  state.targetLang = lang;
  document.getElementById('target-lang-tag').textContent = TARGET_LANGS[lang].flag + ' ' + TARGET_LANGS[lang].name.split(' ')[0];
  
  if (state.currentMode === 'translate') {
    messagesContainer.innerHTML = '';
    const hintLangs = { en: 'tiếng Anh', ja: 'tiếng Nhật', ko: 'tiếng Hàn', zh: 'tiếng Trung' };
    modeHintText.textContent = `💬 Nhập tiếng Việt — Lily dịch sang ${hintLangs[lang]}`;
  }
}
window.changeTargetLang = changeTargetLang;

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  if (id === 'settings-modal' && state.apiKey) {
    document.getElementById('api-key-input').value = state.apiKey;
  }
}
window.openModal = openModal;

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
window.closeModal = closeModal;

function saveSettings() {
  const keyInput = document.getElementById('api-key-input');
  const newKey = keyInput.value.trim();
  const statusEl = document.getElementById('api-key-status');

  if (newKey) {
    state.apiKey = newKey;
    localStorage.setItem('gemini_api_key', newKey);
    statusEl.textContent = '✅ Đã lưu';
    statusEl.style.color = 'var(--green)';
    document.getElementById('no-key-warning')?.remove();
  } else if (!newKey && state.apiKey) {
    state.apiKey = '';
    localStorage.removeItem('gemini_api_key');
    statusEl.textContent = '🗑 Đã xóa';
    statusEl.style.color = 'var(--text-muted)';
  }

  state.level = document.getElementById('level-select').value;
  state.phoneticStyle = document.getElementById('phonetic-select').value;

  setTimeout(() => closeModal('settings-modal'), 600);
}
window.saveSettings = saveSettings;

function autoResize() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}

sendBtn.addEventListener('click', processMessage);

messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    processMessage();
  }
});

messageInput.addEventListener('input', autoResize);

document.getElementById('settings-btn').addEventListener('click', () => openModal('settings-modal'));

document.querySelectorAll('.topic-chip').forEach(chip =>
  chip.addEventListener('click', () => switchMode(chip.dataset.topic))
);

document.getElementById('settings-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal('settings-modal');
});

function init() {
  const greeting = `👋 Xin chào! Tôi là Lily — trợ lý tiếng Anh của bạn.

Tôi có thể giúp bạn:
• ✍️ Dịch tiếng Việt sang Anh, Nhật, Hàn, Trung
• 📝 Sửa lỗi chính tả và ngữ pháp
• 🔊 Phát âm chuẩn giọng Mỹ
• ✏️ Viết lại câu tự nhiên hơn
• 💡 Giải thích từ vựng tiếng Anh

Chọn chức năng bên dưới và bắt đầu nhé!`;

  setTimeout(() => addMessage({ text: greeting, isUser: false }), 400);

  if (!state.apiKey) {
    setTimeout(showNoKeyWarning, 1500);
  }

  messageInput.focus();
}

init();