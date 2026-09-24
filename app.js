// ========== 狀態管理 ==========
const STORAGE_KEY = "vocab-practice-v1";

let state = {
  known: {},      // { word: true }
  selectedLetters: "ALL",
  currentView: "home",
  // flashcard state
  cardIndex: 0,
  cardQueue: [],
  // quiz state
  quizIndex: 0,
  quizScore: 0,
  quizQueue: [],
  quizMode: "en-to-zh", // en-to-zh | zh-to-en
  // spell state
  spellIndex: 0,
  spellQueue: [],
  spellScore: 0,
  // speak practice state
  speakIndex: 0,
  speakQueue: [],
  speakKnownCount: 0,
  recognition: null,
  isRecording: false,
};

// ========== 初始化 ==========
function init() {
  loadState();
  renderHome();
  bindEvents();
  initSpeechRecognition();
}

// ========== 語音辨識 ==========
function initSpeechRecognition() {
  // 不在這裡立刻判定不支援，等到使用者實際按按鈕再檢查
  // 因為瀏覽器 API 可能是非同步載入的
  console.log("初始化語音辨識模組");
  setMicStatus("按下方「開始跟讀」按鈕即可開始練習", "");
}

function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  console.log("開始錄音前檢查：", {
    SpeechRecognition: !!window.SpeechRecognition,
    webkitSpeechRecognition: !!window.webkitSpeechRecognition,
    isSecureContext: window.isSecureContext
  });
  
  if (!SpeechRecognition) {
    setMicStatus("❌ 此瀏覽器真的不支援語音辨識\n請確認使用的是最新版 Chrome，且是用 http://localhost 開啟", "error");
    return;
  }
  
  if (!window.isSecureContext) {
    setMicStatus("❌ 不是安全環境，請用 http://localhost:8766 開啟", "error");
    return;
  }
  
  if (!state.recognition) {
    try {
      state.recognition = new SpeechRecognition();
      state.recognition.lang = "en-US";
      state.recognition.continuous = false;
      state.recognition.interimResults = false;
      
      state.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        handleSpeechResult(transcript);
      };
      
      state.recognition.onerror = (event) => {
        console.warn("語音辨識錯誤:", event.error);
        if (event.error === "not-allowed") {
          setMicStatus("❌ 麥克風權限被拒絕！\n請點瀏覽器網址列左邊的鎖頭圖示，把麥克風改成允許", "error");
        } else if (event.error === "no-speech") {
          setMicStatus("沒有聽到聲音，請再大聲一點試一次", "error");
        } else {
          setMicStatus("發生錯誤：" + event.error + "，請再試一次", "error");
        }
        stopRecording();
      };
      
      state.recognition.onend = () => {
        stopRecording();
      };
    } catch (e) {
      console.error("建立語音辨識失敗:", e);
      setMicStatus("❌ 無法啟動語音辨識：" + e.message, "error");
      return;
    }
  }
  
  try {
    state.recognition.start();
    state.isRecording = true;
    document.getElementById("speak-mic-btn").classList.add("recording");
    document.getElementById("speak-mic-btn").textContent = "🎤 聆聽中... 請大聲唸";
    setMicStatus("🎤 請大聲唸出這個單字...", "success");
  } catch (e) {
    console.warn("無法開始錄音:", e);
    setMicStatus("❌ 無法開始錄音：" + e.message, "error");
  }
}

function stopRecording() {
  state.isRecording = false;
  const btn = document.getElementById("speak-mic-btn");
  if (btn) {
    btn.classList.remove("recording");
    btn.textContent = "🎤 開始跟讀";
  }
}

function handleSpeechResult(transcript) {
  const word = state.speakQueue[state.speakIndex];
  if (!word) return;
  
  const mainWord = getMainWord(word.word).toLowerCase();
  // 比對規則：
  // 1. 完全相同
  // 2. 辨識結果包含完整主詞（辨識引擎可能夾帶雜訊字）
  // 3. 主詞包含辨識結果，但要求至少 2 個字母，避免只唸 1 個字母就被誤判正確
  const isCorrect = transcript === mainWord || transcript.includes(mainWord) || (transcript.length >= 2 && mainWord.includes(transcript));
  
  if (isCorrect) {
    setMicStatus("答對了！正確發音 🎉", "success");
    state.known[word.word] = true;
    state.speakKnownCount++;
    saveState();
    
    setTimeout(() => {
      state.speakIndex++;
      renderSpeak();
    }, 1200);
  } else {
    setMicStatus(`聽到你說：「${transcript}」再試一次`, "error");
  }
}

function setMicStatus(text, type) {
  const el = document.getElementById("speak-mic-status");
  if (!el) return;
  el.textContent = text;
  el.className = "speak-mic-status " + type;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.known = data.known || {};
    }
  } catch (e) {
    console.warn("Failed to load state", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ known: state.known }));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
}

// ========== 工具函式 ==========
function getFilteredWords() {
  if (state.selectedLetters === "ALL") {
    return VOCAB_DATA;
  }
  return VOCAB_DATA.filter(w => w.letter === state.selectedLetters);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getKnownCount() {
  return Object.keys(state.known).length;
}

// ========== 發音功能 ==========
function speakWord(word) {
  if (!("speechSynthesis" in window)) {
    alert("您的瀏覽器不支援語音發音功能");
    return;
  }
  // 取主詞發音（忽略括號別名和連接詞）
  const mainWord = word.split("(")[0].trim().split(" ")[0].split("/")[0].trim();
  
  speechSynthesis.cancel();
  
  const utter = new SpeechSynthesisUtterance(mainWord);
  utter.lang = "en-US";
  utter.rate = 0.75;  // 慢一點更清楚
  utter.pitch = 1.05; // 稍微提高音調更自然
  utter.volume = 1;
  
  // 選擇品質最好的英文語音
  const voices = speechSynthesis.getVoices();
  const enVoices = voices.filter(v => v.lang.startsWith("en-"));
  
  if (enVoices.length > 0) {
    // 優先順序：Siri > Google > Alex > Samantha > 其他 en-US
    let selectedVoice = null;
    
    // 優先選 Siri 發音（品質最好）
    selectedVoice = enVoices.find(v => v.name.includes("Siri") || v.name.includes("siri"));
    // 再選 Google 發音
    if (!selectedVoice) selectedVoice = enVoices.find(v => v.name.includes("Google") || v.name.includes("google"));
    // 再選 Alex（macOS 高品質）
    if (!selectedVoice) selectedVoice = enVoices.find(v => v.name.includes("Alex") || v.name.includes("alex"));
    // 再選 Samantha / Victoria / Karen 等高品質語音
    if (!selectedVoice) selectedVoice = enVoices.find(v => /Samantha|Victoria|Karen|Moira|Tessa|Zira|David/i.test(v.name));
    // 最後選 en-US 的任何語音
    if (!selectedVoice) selectedVoice = enVoices.find(v => v.lang === "en-US");
    if (!selectedVoice) selectedVoice = enVoices[0];
    
    if (selectedVoice) {
      utter.voice = selectedVoice;
    }
  }
  
  speechSynthesis.speak(utter);
}

// 預先載入語音列表（解決初次載入時 voices 為空的問題）
if ("speechSynthesis" in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

// 取單字主詞（用於字母提示比對）
function getMainWord(word) {
  return word.split("(")[0].trim().split(" ")[0].split("/")[0].trim();
}

// ========== 視圖切換 ==========
function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");
  
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if (navBtn) navBtn.classList.add("active");
}

// ========== 首頁 ==========
function renderHome() {
  const totalWords = VOCAB_DATA.length;
  const knownCount = getKnownCount();
  const progress = Math.round((knownCount / totalWords) * 100);

  document.getElementById("stat-total").textContent = totalWords;
  document.getElementById("stat-known").textContent = knownCount;
  document.getElementById("stat-unknown").textContent = totalWords - knownCount;
  document.getElementById("progress-fill").style.width = progress + "%";
  document.getElementById("progress-text").textContent = `${knownCount} / ${totalWords} 字（${progress}%）`;

  renderLetterGrid();
}

function renderLetterGrid() {
  const container = document.getElementById("letter-grid");
  const letters = [...new Set(VOCAB_DATA.map(w => w.letter))].sort();
  
  let html = `<button class="letter-btn ${state.selectedLetters === "ALL" ? "selected" : ""}" data-letter="ALL">
    <span>全部</span><span class="count">${VOCAB_DATA.length}</span>
  </button>`;
  
  letters.forEach(letter => {
    const count = VOCAB_DATA.filter(w => w.letter === letter).length;
    const isSelected = state.selectedLetters === letter;
    html += `<button class="letter-btn ${isSelected ? "selected" : ""}" data-letter="${letter}">
      <span>${letter}</span><span class="count">${count}</span>
    </button>`;
  });
  
  container.innerHTML = html;
}

// ========== 單字卡翻轉練習 ==========
function startFlashcard() {
  const words = getFilteredWords();
  state.cardQueue = shuffle(words);
  state.cardIndex = 0;
  renderFlashcard();
  switchView("flashcard");
}

function renderFlashcard() {
  const card = document.getElementById("flashcard");
  const total = state.cardQueue.length;
  
  if (state.cardIndex >= total) {
    document.getElementById("flashcard-progress").textContent = "練習完成！";
    card.style.display = "none";
    document.getElementById("card-controls").style.display = "none";
    document.getElementById("flashcard-done").style.display = "block";
    return;
  }
  
  document.getElementById("flashcard-done").style.display = "none";
  card.style.display = "block";
  document.getElementById("card-controls").style.display = "flex";
  
  card.classList.remove("flipped");
  const word = state.cardQueue[state.cardIndex];
  
  document.getElementById("card-letter").textContent = word.letter;
  document.getElementById("card-letter-back").textContent = word.letter;
  document.getElementById("card-word-front").textContent = word.word;
  document.getElementById("card-word-back").textContent = word.word;
  document.getElementById("card-meaning-back").textContent = word.meaning;
  document.getElementById("flashcard-progress").textContent = `${state.cardIndex + 1} / ${total}`;
}

function flipCard() {
  document.getElementById("flashcard").classList.toggle("flipped");
}

function markCard(known) {
  const word = state.cardQueue[state.cardIndex];
  if (known) {
    state.known[word.word] = true;
  } else {
    delete state.known[word.word];
  }
  saveState();
  state.cardIndex++;
  renderFlashcard();
}

// ========== 選擇題測驗 ==========
function startQuiz(mode) {
  state.quizMode = mode || "en-to-zh";
  const words = getFilteredWords();
  state.quizQueue = shuffle(words).slice(0, Math.min(20, words.length));
  state.quizIndex = 0;
  state.quizScore = 0;
  renderQuiz();
  switchView("quiz");
}

function renderQuiz() {
  const total = state.quizQueue.length;
  
  if (state.quizIndex >= total) {
    renderQuizResult();
    return;
  }
  
  document.getElementById("quiz-result").style.display = "none";
  document.getElementById("quiz-active").style.display = "block";
  
  const word = state.quizQueue[state.quizIndex];
  const others = shuffle(VOCAB_DATA.filter(w => w.word !== word.word)).slice(0, 3);
  const options = shuffle([word, ...others]);
  
  document.getElementById("quiz-progress").textContent = `${state.quizIndex + 1} / ${total}`;
  document.getElementById("quiz-score").textContent = `得分：${state.quizScore}`;
  
  if (state.quizMode === "en-to-zh") {
    document.getElementById("quiz-question-label").textContent = "這個單字的意思是？";
    document.getElementById("quiz-question-word").textContent = word.word;
    document.getElementById("quiz-question-word").style.display = "block";
    document.getElementById("quiz-speak-btn").style.display = "flex";
    document.getElementById("quiz-question-meaning").textContent = "";
    document.getElementById("quiz-question-meaning").style.display = "none";
    
    const optsHtml = options.map((opt, i) => 
      `<button class="quiz-option" data-index="${i}" data-correct="${opt.word === word.word}">${escapeHtml(opt.meaning)}</button>`
    ).join("");
    document.getElementById("quiz-options").innerHTML = optsHtml;
  } else {
    document.getElementById("quiz-question-label").textContent = "哪個單字的意思是？";
    document.getElementById("quiz-question-word").textContent = "";
    document.getElementById("quiz-question-word").style.display = "none";
    document.getElementById("quiz-speak-btn").style.display = "none";
    document.getElementById("quiz-question-meaning").textContent = word.meaning;
    document.getElementById("quiz-question-meaning").style.display = "block";
    
    const optsHtml = options.map((opt, i) => 
      `<button class="quiz-option" data-index="${i}" data-correct="${opt.word === word.word}" data-word="${escapeHtml(opt.word)}">${escapeHtml(opt.word)}</button>`
    ).join("");
    document.getElementById("quiz-options").innerHTML = optsHtml;
  }
  
  // 綁定選項點擊
  document.querySelectorAll(".quiz-option").forEach(btn => {
    btn.addEventListener("click", handleQuizAnswer);
    // 英選中模式：滑鼠移過去自動發音
    if (state.quizMode === "zh-to-en") {
      btn.addEventListener("mouseenter", () => {
        const wordToSpeak = btn.dataset.word;
        if (wordToSpeak && !btn.disabled) {
          speakWord(wordToSpeak);
        }
      });
    }
  });
}

function handleQuizAnswer(e) {
  const btn = e.currentTarget;
  const isCorrect = btn.dataset.correct === "true";
  const allBtns = document.querySelectorAll(".quiz-option");
  
  allBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === "true") {
      b.classList.add("correct");
    }
  });
  
  if (!isCorrect) {
    btn.classList.add("wrong");
  } else {
    state.quizScore++;
    const word = state.quizQueue[state.quizIndex];
    state.known[word.word] = true;
    saveState();
  }
  
  setTimeout(() => {
    state.quizIndex++;
    renderQuiz();
  }, 800);
}

function renderQuizResult() {
  document.getElementById("quiz-active").style.display = "none";
  document.getElementById("quiz-result").style.display = "block";
  
  const total = state.quizQueue.length;
  const score = state.quizScore;
  const pct = Math.round((score / total) * 100);
  
  document.getElementById("result-emoji").textContent = pct >= 80 ? "🎉" : pct >= 60 ? "💪" : "📚";
  document.getElementById("result-title").textContent = pct >= 80 ? "太棒了！" : pct >= 60 ? "不錯喔！" : "繼續加油！";
  document.getElementById("result-score").textContent = `${score} / ${total}`;
  document.getElementById("result-detail").textContent = `正確率 ${pct}%`;
}

// ========== 拼字練習 ==========
function startSpell() {
  const words = getFilteredWords();
  state.spellQueue = shuffle(words);
  state.spellIndex = 0;
  state.spellScore = 0;
  renderSpell();
  switchView("spell");
}

function renderSpell() {
  const total = state.spellQueue.length;
  
  if (state.spellIndex >= total) {
    document.getElementById("spell-active").style.display = "none";
    document.getElementById("spell-result").style.display = "block";
    const pct = Math.round((state.spellScore / total) * 100);
    document.getElementById("spell-result-emoji").textContent = pct >= 80 ? "🎉" : pct >= 60 ? "💪" : "📚";
    document.getElementById("spell-result-title").textContent = pct >= 80 ? "拼字高手！" : pct >= 60 ? "表現不錯！" : "再多多練習！";
    document.getElementById("spell-result-score").textContent = `${state.spellScore} / ${total}`;
    document.getElementById("spell-result-detail").textContent = `正確率 ${pct}%`;
    return;
  }
  
  document.getElementById("spell-result").style.display = "none";
  document.getElementById("spell-active").style.display = "block";
  
  const word = state.spellQueue[state.spellIndex];
  const mainWord = getMainWord(word.word);
  document.getElementById("spell-progress").textContent = `${state.spellIndex + 1} / ${total}`;
  document.getElementById("spell-meaning-text").textContent = word.meaning;
  
  // 渲染字母提示底線
  renderLetterHint(mainWord, "");
  
  const input = document.getElementById("spell-input");
  input.value = "";
  input.className = "spell-input";
  input.disabled = false;
  document.getElementById("spell-feedback").textContent = "";
  document.getElementById("spell-feedback").className = "spell-feedback";
  input.focus();
}

// 渲染字母提示
function renderLetterHint(word, userInput) {
  const hintContainer = document.getElementById("spell-letter-hint");
  if (!hintContainer) return;
  
  const len = word.length;
  let html = "";
  for (let i = 0; i < len; i++) {
    const char = userInput[i] || "";
    html += `<div class="letter-box ${char ? "filled" : ""}">${char}</div>`;
  }
  hintContainer.innerHTML = html;
}

function checkSpell() {
  const word = state.spellQueue[state.spellIndex];
  const input = document.getElementById("spell-input");
  const feedback = document.getElementById("spell-feedback");
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = word.word.toLowerCase();
  
  if (!userAnswer) return;
  
  // 取主詞比對（忽略括號別名），拼字練習採嚴格比對，避免子字串誤判
  const mainWord = getMainWord(word.word);
  const isCorrect = userAnswer === correctAnswer || userAnswer === mainWord.toLowerCase();
  
  input.disabled = true;
  
  if (isCorrect) {
    input.classList.add("correct");
    feedback.textContent = "答對了！";
    feedback.classList.add("correct");
    state.spellScore++;
    state.known[word.word] = true;
    saveState();
  } else {
    input.classList.add("wrong");
    feedback.textContent = `正確答案：${word.word}`;
    feedback.classList.add("wrong");
    // 答錯時顯示完整正確字母提示
    renderLetterHint(mainWord, mainWord);
  }
  
  // 播放正確答案發音
  speakWord(word.word);
  
  setTimeout(() => {
    state.spellIndex++;
    renderSpell();
  }, 2000);
}

// ========== 跟讀發音練習 ==========
function startSpeak() {
  const words = getFilteredWords();
  state.speakQueue = shuffle(words);
  state.speakIndex = 0;
  state.speakKnownCount = 0;
  renderSpeak();
  switchView("speak");
}

function renderSpeak() {
  const total = state.speakQueue.length;
  
  if (state.speakIndex >= total) {
    document.getElementById("speak-active").style.display = "none";
    document.getElementById("speak-result").style.display = "block";
    document.getElementById("speak-result-score").textContent = `${state.speakKnownCount} / ${total}`;
    document.getElementById("speak-result-detail").textContent = `熟練度進度已更新`;
    return;
  }
  
  document.getElementById("speak-result").style.display = "none";
  document.getElementById("speak-active").style.display = "block";
  
  const word = state.speakQueue[state.speakIndex];
  document.getElementById("speak-progress").textContent = `${state.speakIndex + 1} / ${total}`;
  document.getElementById("speak-word-text").textContent = word.word;
  document.getElementById("speak-meaning-text").textContent = word.meaning;
  // 重置跟讀狀態提示
  setMicStatus("按「🎤 開始跟讀」，跟著單字大聲唸出來", "");
  const micBtn = document.getElementById("speak-mic-btn");
  if (micBtn) {
    micBtn.classList.remove("recording");
    micBtn.textContent = "🎤 開始跟讀";
  }
}

function markSpeak(known) {
  const word = state.speakQueue[state.speakIndex];
  if (known) {
    state.known[word.word] = true;
    state.speakKnownCount++;
  } else {
    delete state.known[word.word];
  }
  saveState();
  state.speakIndex++;
  renderSpeak();
}

// ========== 事件綁定 ==========
function bindEvents() {
  // 字母選擇
  document.getElementById("letter-grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".letter-btn");
    if (!btn) return;
    state.selectedLetters = btn.dataset.letter;
    renderLetterGrid();
    renderHome();
  });
  
  // 模式卡片
  document.querySelectorAll(".mode-card").forEach(card => {
    card.addEventListener("click", () => {
      const mode = card.dataset.mode;
      if (mode === "flashcard") startFlashcard();
      else if (mode === "quiz-en") startQuiz("en-to-zh");
      else if (mode === "quiz-zh") startQuiz("zh-to-en");
      else if (mode === "spell") startSpell();
      else if (mode === "speak") startSpeak();
    });
  });
  
  // 單字卡翻轉
  document.getElementById("flashcard").addEventListener("click", flipCard);
  document.getElementById("btn-known").addEventListener("click", (e) => { e.stopPropagation(); markCard(true); });
  document.getElementById("btn-unknown").addEventListener("click", (e) => { e.stopPropagation(); markCard(false); });
  // 單字卡發音按鈕
  document.getElementById("card-speak-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const word = state.cardQueue[state.cardIndex];
    if (word) speakWord(word.word);
  });
  
  // 導覽
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === "home") {
        renderHome();
        switchView("home");
      }
    });
  });
  
  // 測驗重新開始
  document.getElementById("btn-quiz-retry").addEventListener("click", () => startQuiz(state.quizMode));
  document.getElementById("btn-quiz-home").addEventListener("click", () => { renderHome(); switchView("home"); });
  
  // 拼字
  document.getElementById("btn-spell-check").addEventListener("click", checkSpell);
  document.getElementById("spell-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkSpell();
  });
  // 拼字輸入即時更新字母提示
  document.getElementById("spell-input").addEventListener("input", (e) => {
    const word = state.spellQueue[state.spellIndex];
    if (!word) return;
    const mainWord = getMainWord(word.word);
    renderLetterHint(mainWord, e.target.value.toLowerCase());
  });
  // 拼字發音按鈕
  document.getElementById("spell-speak-btn").addEventListener("click", () => {
    const word = state.spellQueue[state.spellIndex];
    if (word) speakWord(word.word);
  });
  // 測驗發音按鈕
  document.getElementById("quiz-speak-btn").addEventListener("click", () => {
    const word = state.quizQueue[state.quizIndex];
    if (word && state.quizMode === "en-to-zh") {
      speakWord(word.word);
    }
  });
  document.getElementById("btn-spell-retry").addEventListener("click", startSpell);
  document.getElementById("btn-spell-home").addEventListener("click", () => { renderHome(); switchView("home"); });
  
  // 跟讀發音練習
  document.getElementById("speak-play-btn").addEventListener("click", () => {
    const word = state.speakQueue[state.speakIndex];
    if (word) speakWord(word.word);
  });
  // 麥克風按鈕
  document.getElementById("speak-mic-btn").addEventListener("click", () => {
    if (state.isRecording) {
      state.recognition && state.recognition.stop();
    } else {
      startRecording();
    }
  });
  document.getElementById("btn-speak-known").addEventListener("click", () => markSpeak(true));
  document.getElementById("btn-speak-unknown").addEventListener("click", () => markSpeak(false));
  document.getElementById("btn-speak-retry").addEventListener("click", startSpeak);
  document.getElementById("btn-speak-home").addEventListener("click", () => { renderHome(); switchView("home"); });
  
  // 單字卡完成按鈕
  document.getElementById("btn-card-done").addEventListener("click", () => { renderHome(); switchView("home"); });
}

// 啟動
document.addEventListener("DOMContentLoaded", init);
