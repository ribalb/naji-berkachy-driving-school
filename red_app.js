// red.js — Random 30 questions + confirm answer + end results review (Arabic UI) 

let QUESTIONS = [];

// --- i18n helpers (English fields fall back to Arabic) ---
function qField(q){
  return (window.I18N && window.I18N.isEn() && q["question_en"] != null && String(q["question_en"]).trim() !== "")
    ? q["question_en"] : (q["question"] || "");
}
function qChoices(q){
  return (window.I18N && window.I18N.isEn() && Array.isArray(q["choices_en"]))
    ? q["choices_en"] : (q["choices"] || []);
}

let quiz = {
  list: [],
  index: 0,
  score: 0,
  selected: null,
  locked: false,
  answers: [],
  _lastNextAt: 0
};

const TAKE_COUNT = 30;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadQuestions() {
  const res = await fetch("red_questions.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load red_questions.json");
  return await res.json();
}

function setButtonEnabled(btn, enabled) {
  if (!btn) return;
  btn.disabled = !enabled;
  btn.setAttribute("aria-disabled", String(!enabled));
  btn.style.pointerEvents = enabled ? "auto" : "none";
}

function bindTap(el, handler) {
  if (!el) return;

  const wrapped = (e) => {
    if (el.disabled) return;
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    handler(e);
  };

  if (window.PointerEvent) {
    el.addEventListener("pointerup", wrapped, { passive: false });
  } else {
    el.addEventListener("touchend", wrapped, { passive: false });
    el.addEventListener("click", wrapped);
  }
}

function preloadImages(list) {
  (list || []).forEach((q) => {
    const src = (q && q.image) ? String(q.image) : "";
    if (src.trim() !== "") {
      const img = new Image();
      img.src = src;
    }
  });
}

function setProgress() {
  const pct = (quiz.index / quiz.list.length) * 100;
  const progressEl = document.getElementById("progress");
  if (progressEl) progressEl.style.setProperty("--p", `${pct}%`);

  const counterEl = document.getElementById("qCounterTop");
  if (counterEl) {
    counterEl.textContent = `${I18N.t("quiz.qof",{i:quiz.index+1,n:quiz.list.length})}`;
  }
}

function renderQuestion() {
  const q = quiz.list[quiz.index];

  const qTextEl = document.getElementById("qText");
  const qImgEl = document.getElementById("qImg");

  quiz.selected = null;
  quiz.locked = false;

  const confirmBtn = document.getElementById("confirmBtn");
  const nextBtn = document.getElementById("nextBtn");
  setButtonEnabled(confirmBtn, false);
  setButtonEnabled(nextBtn, false);

  const fb = document.getElementById("feedback");
  if (fb) {
    fb.className = "feedback hidden";
    fb.textContent = "";
  }

  const hasImg = q && q.image && String(q.image).trim() !== "";
  if (hasImg) {
    qImgEl.src = q.image;
    qImgEl.classList.remove("hidden");

    const t = ((qField(q) || "")).trim();
    if (t === "") {
      qTextEl.textContent = "";
      qTextEl.classList.add("hidden");
    } else {
      qTextEl.textContent = t;
      qTextEl.classList.remove("hidden");
    }
  } else {
    qImgEl.removeAttribute("src");
    qImgEl.classList.add("hidden");

    qTextEl.textContent = (q && qField(q)) ? qField(q) : "";
    qTextEl.classList.remove("hidden");
  }

  const box = document.getElementById("choices");
  box.innerHTML = "";

  (qChoices(q) || []).forEach((text, idx) => {
    if (String(text || "").trim() === "") return;

    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.innerHTML = `<span>${text}</span>`;
    btn.dataset.index = String(idx);

    bindTap(btn, () => {
      if (quiz.locked) return;

      [...box.querySelectorAll(".choice")].forEach((b) =>
        b.classList.remove("selected")
      );

      btn.classList.add("selected");
      quiz.selected = idx;
      setButtonEnabled(confirmBtn, true);
    });

    box.appendChild(btn);
  });

  setProgress();
}

function revealAnswer() {
  const q = quiz.list[quiz.index];
  const chosen = quiz.selected;
  if (chosen === null) return;

  quiz.locked = true;

  const box = document.getElementById("choices");
  const buttons = [...box.querySelectorAll(".choice")];

  const correct = q.correctIndex;

  quiz.answers[quiz.index] = { id: q.id, chosenIndex: chosen, correctIndex: correct };

  if (typeof correct !== "number") {
    setButtonEnabled(document.getElementById("nextBtn"), true);
    setButtonEnabled(document.getElementById("confirmBtn"), false);
    return;
  }

  buttons.forEach((btn) => {
    const idx = Number(btn.dataset.index);
    if (idx === correct) btn.classList.add("correct");
    if (idx === chosen && chosen !== correct) btn.classList.add("wrong");
    btn.style.pointerEvents = "none";
  });

  if (chosen === correct) quiz.score += 1;

  setButtonEnabled(document.getElementById("nextBtn"), true);
  setButtonEnabled(document.getElementById("confirmBtn"), false);
}

function nextQuestion() {
  if (!quiz.locked) return;

  const now = Date.now();
  if (now - quiz._lastNextAt < 250) return;
  quiz._lastNextAt = now;

  if (quiz.index < quiz.list.length - 1) {
    quiz.index += 1;
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById("quizView").classList.add("hidden");
  document.getElementById("resultsView").classList.remove("hidden");

  const phone = localStorage.getItem("quiz_phone") || "71600228";
  document.getElementById("resultUser").textContent = `Naji Berkachy Driving School — ${phone}`;

  const passed = quiz.score >= 24;

  document.getElementById("scoreBox").innerHTML = `
    <div class="score-title">${I18N.t("quiz.yourScore")}</div>
    <div class="score-value">${quiz.score} / ${quiz.list.length}</div>
    <div class="result-status ${passed ? "pass" : "fail"}">
      ${I18N.t("quiz.resultLbl")} ${passed ? I18N.t("quiz.pass") : I18N.t("quiz.fail")}
    </div>
  `;

  const review = document.getElementById("reviewList");
  review.innerHTML = "";

  quiz.list.forEach((q, i) => {
    const a = quiz.answers[i] || { chosenIndex: null, correctIndex: q.correctIndex };

    const chosenText =
      (a.chosenIndex !== null && qChoices(q)[a.chosenIndex] !== undefined)
        ? qChoices(q)[a.chosenIndex]
        : I18N.t("quiz.notAns");

    const correctText =
      (typeof a.correctIndex === "number" && qChoices(q)[a.correctIndex] !== undefined)
        ? qChoices(q)[a.correctIndex]
        : I18N.t("quiz.na");

    const isCorrect =
      (typeof a.correctIndex === "number") && (a.chosenIndex === a.correctIndex);

    const qText = ((qField(q) || "")).trim();
    const hasImg = q.image && String(q.image).trim() !== "";

    const item = document.createElement("div");
    item.className = "review-item";

    item.innerHTML = `
      <div class="review-q">
        <div class="review-num">${I18N.t("quiz.qnum",{i:i+1})}</div>
        ${hasImg ? `<img class="qimg" src="${q.image}" alt="question image">` : ""}
        ${qText ? `<div class="review-text">${qText}</div>` : ""}
      </div>

      <div class="review-answers">
        <div class="ans-row ${isCorrect ? "ans-ok" : "ans-bad"}">
          <span class="ans-label">${I18N.t("quiz.yourAns")}</span>
          <span class="ans-value">${chosenText}</span>
        </div>

        <div class="ans-row ans-ok">
          <span class="ans-label">${I18N.t("quiz.correct")}</span>
          <span class="ans-value">${correctText}</span>
        </div>
      </div>
    `;

    review.appendChild(item);
  });
}

function startNewExam() {
  quiz.index = 0;
  quiz.score = 0;
  quiz.selected = null;
  quiz.locked = false;
  quiz.answers = [];
  quiz._lastNextAt = 0;

  quiz.list = shuffle(QUESTIONS).slice(0, Math.min(TAKE_COUNT, QUESTIONS.length));
  preloadImages(quiz.list);

  document.getElementById("resultsView").classList.add("hidden");
  document.getElementById("quizView").classList.remove("hidden");

  renderQuestion();
}

async function init() {
  const phone = localStorage.getItem("quiz_phone") || "71600228";

  document.getElementById("userName").textContent = "Naji Berkachy Driving School";
  document.getElementById("userPhone").textContent = phone;

  QUESTIONS = await loadQuestions();

  quiz.list = shuffle(QUESTIONS).slice(0, Math.min(TAKE_COUNT, QUESTIONS.length));
  preloadImages(quiz.list);

  quiz.index = 0;
  quiz.score = 0;
  quiz.answers = [];
  quiz._lastNextAt = 0;

  bindTap(document.getElementById("confirmBtn"), revealAnswer);
  bindTap(document.getElementById("nextBtn"), nextQuestion);
  bindTap(document.getElementById("retryBtn"), startNewExam);

  bindTap(document.getElementById("homeBtn"), () => {
    window.location.href = "index.html";
  });

  renderQuestion();
}

init().catch((err) => alert("Error: " + err.message));
