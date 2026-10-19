const STORAGE_KEY = "mis-midterm-review-v1";

const dom = {
  homeView: document.querySelector("#home-view"),
  quizView: document.querySelector("#quiz-view"),
  resultView: document.querySelector("#result-view"),
  chapterGrid: document.querySelector("#chapter-grid"),
  continueButton: document.querySelector("#continue-button"),
  randomButton: document.querySelector("#random-button"),
  resetAllButton: document.querySelector("#reset-all-button"),
  overallRing: document.querySelector("#overall-ring"),
  overallPercent: document.querySelector("#overall-percent"),
  overallAnswered: document.querySelector("#overall-answered"),
  overallTotal: document.querySelector("#overall-total"),
  overallDetail: document.querySelector("#overall-detail"),
  headerChapterCount: document.querySelector("#header-chapter-count"),
  headerQuestionCount: document.querySelector("#header-question-count"),
  backButton: document.querySelector("#back-button"),
  mobileBackButton: document.querySelector("#mobile-back-button"),
  sidebarKicker: document.querySelector("#sidebar-kicker"),
  sidebarTitle: document.querySelector("#sidebar-title"),
  correctCount: document.querySelector("#correct-count"),
  answeredCount: document.querySelector("#answered-count"),
  accuracyCount: document.querySelector("#accuracy-count"),
  sidebarProgressText: document.querySelector("#sidebar-progress-text"),
  sidebarProgressBar: document.querySelector("#sidebar-progress-bar"),
  shuffleButton: document.querySelector("#shuffle-button"),
  resetChapterButton: document.querySelector("#reset-chapter-button"),
  mobileChapter: document.querySelector("#mobile-chapter"),
  mobileProgress: document.querySelector("#mobile-progress"),
  questionPosition: document.querySelector("#question-position"),
  questionStatus: document.querySelector("#question-status"),
  questionText: document.querySelector("#question-text"),
  optionsList: document.querySelector("#options-list"),
  feedback: document.querySelector("#feedback"),
  previousButton: document.querySelector("#previous-button"),
  checkButton: document.querySelector("#check-button"),
  nextButton: document.querySelector("#next-button"),
  resultBackButton: document.querySelector("#result-back-button"),
  resultPercent: document.querySelector("#result-percent"),
  resultFraction: document.querySelector("#result-fraction"),
  resultMessage: document.querySelector("#result-message"),
  reviewWrongButton: document.querySelector("#review-wrong-button"),
  retryButton: document.querySelector("#retry-button"),
  mistakeList: document.querySelector("#mistake-list"),
  modal: document.querySelector("#confirm-modal"),
  modalTitle: document.querySelector("#modal-title"),
  modalCopy: document.querySelector("#modal-copy"),
  modalConfirmButton: document.querySelector("#modal-confirm-button"),
};

let bank = null;
let saved = loadSaved();
let currentChapter = null;
let sessionIds = [];
let cursor = 0;
let draftSelection = null;
let modalAction = null;

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { chapters: {}, lastChapter: null };
  } catch {
    return { chapters: {}, lastChapter: null };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function chapterState(number) {
  const key = String(number);
  if (!saved.chapters[key]) saved.chapters[key] = { answers: {}, order: [] };
  return saved.chapters[key];
}

function questionById(id) {
  return currentChapter.questions.find((question) => question.id === id);
}

function splitTitle(chapter) {
  return chapter.title.replace(/^Chapter\s+\d+\s*/i, "").trim();
}

function showView(name) {
  dom.homeView.hidden = name !== "home";
  dom.quizView.hidden = name !== "quiz";
  dom.resultView.hidden = name !== "result";
  document.querySelector(".site-header").hidden = name === "quiz";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getStats(chapter) {
  const answers = chapterState(chapter.number).answers;
  const answered = chapter.questions.filter((question) => answers[question.id]).length;
  const correct = chapter.questions.filter((question) => answers[question.id]?.correct).length;
  return { answered, correct, total: chapter.questions.length };
}

function renderHome() {
  const total = bank.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
  const stats = bank.chapters.map(getStats);
  const answered = stats.reduce((sum, item) => sum + item.answered, 0);
  const correct = stats.reduce((sum, item) => sum + item.correct, 0);
  const percent = total ? Math.round((answered / total) * 100) : 0;

  dom.headerChapterCount.textContent = bank.chapters.length;
  dom.headerQuestionCount.textContent = total;
  dom.overallTotal.textContent = total;
  dom.overallAnswered.textContent = answered;
  dom.overallPercent.textContent = `${percent}%`;
  dom.overallRing.style.setProperty("--percent", percent);
  dom.overallDetail.textContent = answered
    ? `目前答對 ${correct} 題，整體正確率 ${Math.round((correct / answered) * 100)}%。`
    : "挑一章開始，把進度累積起來。";

  const lastChapter = bank.chapters.find((chapter) => chapter.number === saved.lastChapter);
  dom.continueButton.querySelector("span").textContent = lastChapter
    ? `繼續第 ${lastChapter.number} 章`
    : "從第 1 章開始";

  dom.chapterGrid.innerHTML = bank.chapters.map((chapter) => {
    const stat = getStats(chapter);
    const progress = Math.round((stat.answered / stat.total) * 100);
    const label = stat.answered === stat.total ? "已完成" : `${stat.answered} / ${stat.total}`;
    return `
      <button class="chapter-card" type="button" data-chapter="${chapter.number}">
        <span class="chapter-card-top">
          <span class="chapter-number">Chapter ${String(chapter.number).padStart(2, "0")}</span>
          <span class="chapter-count">${chapter.questions.length} 題</span>
        </span>
        <h3>${escapeHtml(splitTitle(chapter))}</h3>
        <span class="chapter-card-footer">
          <span class="chapter-card-progress"><span>${label}</span><span>${progress}%</span></span>
          <span class="progress-track"><span style="width:${progress}%"></span></span>
        </span>
      </button>`;
  }).join("");

  dom.chapterGrid.querySelectorAll("[data-chapter]").forEach((button) => {
    button.addEventListener("click", () => startChapter(Number(button.dataset.chapter)));
  });
}

function startChapter(number, mode = "normal") {
  currentChapter = bank.chapters.find((chapter) => chapter.number === number);
  if (!currentChapter) return;

  const state = chapterState(number);
  if (mode === "wrong") {
    sessionIds = currentChapter.questions
      .filter((question) => state.answers[question.id] && !state.answers[question.id].correct)
      .map((question) => question.id);
    sessionIds.forEach((id) => delete state.answers[id]);
  } else {
    sessionIds = state.order.length === currentChapter.questions.length
      ? [...state.order]
      : currentChapter.questions.map((question) => question.id);
  }
  if (!sessionIds.length) sessionIds = currentChapter.questions.map((question) => question.id);

  const firstUnanswered = sessionIds.findIndex((id) => !state.answers[id]);
  cursor = firstUnanswered >= 0 ? firstUnanswered : 0;
  draftSelection = null;
  saved.lastChapter = number;
  persist();

  dom.sidebarKicker.textContent = `Chapter ${String(number).padStart(2, "0")}`;
  dom.mobileChapter.textContent = `Chapter ${number}`;
  dom.sidebarTitle.textContent = splitTitle(currentChapter);
  showView("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = questionById(sessionIds[cursor]);
  const state = chapterState(currentChapter.number);
  const recorded = state.answers[question.id];
  const stats = getStats(currentChapter);
  draftSelection = recorded?.selected || null;

  dom.questionPosition.textContent = `Question ${cursor + 1} of ${sessionIds.length}`;
  dom.mobileProgress.textContent = `${cursor + 1} / ${sessionIds.length}`;
  dom.questionText.textContent = question.prompt;
  dom.previousButton.disabled = cursor === 0;
  dom.nextButton.textContent = cursor === sessionIds.length - 1 ? "完成本輪 →" : "下一題 →";

  dom.optionsList.innerHTML = Object.entries(question.options).map(([letter, text], index) => {
    const isSelected = draftSelection === letter;
    const classes = ["option"];
    if (isSelected) classes.push("selected");
    if (recorded && letter === question.answer) classes.push("correct");
    if (recorded && isSelected && letter !== question.answer) classes.push("incorrect");
    return `
      <button class="${classes.join(" ")}" type="button" role="radio"
        aria-checked="${isSelected}" data-option="${letter}" ${recorded ? "disabled" : ""}>
        <span class="option-letter">${letter}</span>
        <span class="option-text">${escapeHtml(text)}</span>
      </button>`;
  }).join("");

  dom.optionsList.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => selectOption(button.dataset.option));
  });

  if (recorded) {
    const correct = recorded.correct;
    dom.questionStatus.textContent = correct ? "答對" : "答錯";
    dom.questionStatus.className = `status-pill ${correct ? "correct" : "incorrect"}`;
    dom.feedback.hidden = false;
    dom.feedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
    dom.feedback.textContent = correct
      ? `答對了。正確答案是 ${question.answer}。`
      : `這題的正確答案是 ${question.answer}：${question.options[question.answer]}`;
    dom.checkButton.hidden = true;
    dom.nextButton.hidden = false;
  } else {
    dom.questionStatus.textContent = "尚未作答";
    dom.questionStatus.className = "status-pill";
    dom.feedback.hidden = true;
    dom.checkButton.hidden = false;
    dom.checkButton.disabled = !draftSelection;
    dom.nextButton.hidden = true;
  }

  dom.correctCount.textContent = stats.correct;
  dom.answeredCount.textContent = stats.answered;
  dom.accuracyCount.textContent = stats.answered ? `${Math.round((stats.correct / stats.answered) * 100)}%` : "—";
  dom.sidebarProgressText.textContent = `${stats.answered} / ${stats.total}`;
  dom.sidebarProgressBar.style.width = `${Math.round((stats.answered / stats.total) * 100)}%`;
}

function selectOption(letter) {
  draftSelection = letter;
  dom.optionsList.querySelectorAll("[data-option]").forEach((button) => {
    const selected = button.dataset.option === letter;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", selected);
  });
  dom.checkButton.disabled = false;
}

function checkAnswer() {
  if (!draftSelection) return;
  const question = questionById(sessionIds[cursor]);
  const state = chapterState(currentChapter.number);
  state.answers[question.id] = {
    selected: draftSelection,
    correct: draftSelection === question.answer,
    answeredAt: Date.now(),
  };
  persist();
  renderQuestion();
}

function nextQuestion() {
  if (cursor < sessionIds.length - 1) {
    cursor += 1;
    draftSelection = null;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    renderResult();
  }
}

function previousQuestion() {
  if (cursor === 0) return;
  cursor -= 1;
  draftSelection = null;
  renderQuestion();
}

function renderResult() {
  const state = chapterState(currentChapter.number);
  const questions = sessionIds.map(questionById);
  const correct = questions.filter((question) => state.answers[question.id]?.correct).length;
  const answered = questions.filter((question) => state.answers[question.id]).length;
  const wrong = questions.filter((question) => state.answers[question.id] && !state.answers[question.id].correct);
  const percent = answered ? Math.round((correct / answered) * 100) : 0;

  dom.resultPercent.textContent = `${percent}%`;
  dom.resultFraction.textContent = `${correct} / ${questions.length} 題答對`;
  dom.resultMessage.textContent = percent >= 90
    ? "掌握得很穩，這章可以先放心了。"
    : percent >= 70
      ? "基礎已經很不錯，再把錯題練熟就更完整。"
      : "先從錯題開始補強；每輪都會比上一輪更熟。";
  dom.reviewWrongButton.hidden = wrong.length === 0;

  dom.mistakeList.innerHTML = wrong.length
    ? `<h2 class="mistake-heading">本輪錯題 ${wrong.length} 題</h2>` + wrong.map((question) => `
        <div class="mistake-item">
          <span>QUESTION ${question.sourceNumber} · ANSWER ${question.answer}</span>
          <p>${escapeHtml(question.prompt)}</p>
        </div>`).join("")
    : `<div class="mistake-item" style="border-color:var(--green-mid);background:var(--mint)">
        <span style="color:var(--green-mid)">PERFECT</span><p>這一輪沒有錯題。</p>
      </div>`;
  showView("result");
}

function shuffleCurrentChapter() {
  const state = chapterState(currentChapter.number);
  const ids = currentChapter.questions.map((question) => question.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]];
  }
  state.order = ids;
  persist();
  sessionIds = [...ids];
  cursor = 0;
  renderQuestion();
}

function openModal({ title, copy, action }) {
  dom.modalTitle.textContent = title;
  dom.modalCopy.textContent = copy;
  modalAction = action;
  dom.modal.hidden = false;
  dom.modalConfirmButton.focus();
}

function closeModal() {
  dom.modal.hidden = true;
  modalAction = null;
}

function resetChapter(number) {
  delete saved.chapters[String(number)];
  persist();
  startChapter(number);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function bindEvents() {
  document.querySelector(".brand").addEventListener("click", (event) => {
    event.preventDefault();
    renderHome();
    showView("home");
  });
  dom.continueButton.addEventListener("click", () => startChapter(saved.lastChapter || bank.chapters[0].number));
  dom.randomButton.addEventListener("click", () => {
    const chapter = bank.chapters[Math.floor(Math.random() * bank.chapters.length)];
    startChapter(chapter.number);
  });
  [dom.backButton, dom.mobileBackButton, dom.resultBackButton].forEach((button) => {
    button.addEventListener("click", () => { renderHome(); showView("home"); });
  });
  dom.checkButton.addEventListener("click", checkAnswer);
  dom.nextButton.addEventListener("click", nextQuestion);
  dom.previousButton.addEventListener("click", previousQuestion);
  dom.shuffleButton.addEventListener("click", shuffleCurrentChapter);
  dom.resetChapterButton.addEventListener("click", () => openModal({
    title: `重設第 ${currentChapter.number} 章進度？`,
    copy: "本章的作答紀錄與錯題標記都會被清除。",
    action: () => resetChapter(currentChapter.number),
  }));
  dom.resetAllButton.addEventListener("click", () => openModal({
    title: "清除全部複習進度？",
    copy: "六個章節的作答紀錄都會被清除，這個動作無法復原。",
    action: () => {
      saved = { chapters: {}, lastChapter: null };
      persist();
      renderHome();
    },
  }));
  document.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", closeModal));
  dom.modalConfirmButton.addEventListener("click", () => {
    const action = modalAction;
    closeModal();
    action?.();
  });
  dom.reviewWrongButton.addEventListener("click", () => startChapter(currentChapter.number, "wrong"));
  dom.retryButton.addEventListener("click", () => {
    delete saved.chapters[String(currentChapter.number)];
    persist();
    startChapter(currentChapter.number);
  });
  document.addEventListener("keydown", (event) => {
    if (!dom.modal.hidden && event.key === "Escape") return closeModal();
    if (dom.quizView.hidden) return;
    if (["1", "2", "3", "4", "5"].includes(event.key) && !dom.checkButton.hidden) {
      const letter = ["A", "B", "C", "D", "E"][Number(event.key) - 1];
      selectOption(letter);
    }
    if (event.key === "Enter") {
      if (!dom.nextButton.hidden) nextQuestion();
      else if (!dom.checkButton.disabled) checkAnswer();
    }
  });
}

function init() {
  try {
    bank = window.QUESTION_BANK;
    if (!bank?.chapters?.length) throw new Error("Question bank could not be loaded.");
    bindEvents();
    renderHome();
  } catch (error) {
    document.querySelector("main").innerHTML = `<section class="view"><div class="result-card"><h1>載入失敗</h1><p>${escapeHtml(error.message)}</p></div></section>`;
  }
}

init();
