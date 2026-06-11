// i18n.js — shared language engine (Arabic <-> English) with floating toggle
(function () {
  const KEY = "nb_lang";
  let lang = localStorage.getItem(KEY) || "ar";

  // UI dictionary. Quiz QUESTIONS are translated separately via *_en fields in the JSON.
  const DICT = {
    // Landing page
    "home.moto":      { ar: "اختبار الدراجات النارية", en: "Motorcycle Test" },
    "home.car":       { ar: "اختبار السيارات خصوصي",   en: "Private Car Test" },
    "home.public":    { ar: "اختبار السيارات عمومي",   en: "Public Car Test" },
    "home.f1":        { ar: "تعلم إشارات السير بسهولة", en: "Learn road signs easily" },
    "home.f2":        { ar: "استعد لامتحان القيادة بثقة", en: "Get ready for your driving test" },
    "home.f3":        { ar: "اختبر نفسك في أي وقت",     en: "Test yourself anytime" },

    // Signs page
    "signs.title":    { ar: "تعلم إشارات السير", en: "Learn Road Signs" },
    "signs.sub":      { ar: "تعرّف على إشارات السير ومعانيها بسهولة", en: "Learn road signs and their meanings easily" },
    "signs.search":   { ar: "🔍 ابحث عن إشارة (مثلاً: منعطف، توقف، سرعة)...", en: "🔍 Search a sign (e.g. bend, stop, speed)..." },
    "signs.empty":    { ar: "لا توجد نتائج مطابقة للبحث.", en: "No matching results." },
    "signs.back":     { ar: "→ الرئيسية", en: "← Home" },
    "signs.count":    { ar: "إشارة", en: "signs" },

    // Quiz pages (static)
    "quiz.title.moto":   { ar: "اختبار قيادة الدراجات النارية", en: "Motorcycle Driving Test" },
    "quiz.title.car":    { ar: "اختبار قيادة السيارات خصوصي",   en: "Private Car Driving Test" },
    "quiz.title.public": { ar: "اختبار قيادة السيارات عمومي",   en: "Public Car Driving Test" },
    "quiz.confirm":   { ar: "تأكيد الإجابة", en: "Confirm Answer" },
    "quiz.next":      { ar: "السؤال التالي", en: "Next Question" },
    "quiz.result":    { ar: "النتيجة", en: "Result" },
    "quiz.retry":     { ar: "إعادة اختبار (30 سؤال)", en: "Retake test (30 questions)" },
    "quiz.home":      { ar: "الرجوع للرئيسية", en: "Back to Home" },
    "quiz.pageTitle": { ar: "الاختبار", en: "Test" },

    // Quiz dynamic (used from JS)
    "quiz.qof":       { ar: "السؤال {i} من {n}", en: "Question {i} of {n}" },
    "quiz.qnum":      { ar: "سؤال {i}", en: "Question {i}" },
    "quiz.yourScore": { ar: "علامتك", en: "Your score" },
    "quiz.pass":      { ar: "ناجح", en: "Pass" },
    "quiz.fail":      { ar: "راسب", en: "Fail" },
    "quiz.resultLbl": { ar: "النتيجة:", en: "Result:" },
    "quiz.yourAns":   { ar: "إجابتك:", en: "Your answer:" },
    "quiz.correct":   { ar: "الصحيح:", en: "Correct:" },
    "quiz.notAns":    { ar: "لم تُجب", en: "Not answered" },
    "quiz.na":        { ar: "غير متوفر", en: "N/A" },

    // Toggle button label (shows the language you switch TO)
    "lang.toggle":    { ar: "English", en: "العربية" }
  };

  function tr(key) {
    const e = DICT[key];
    return e ? (e[lang] || e.ar) : key;
  }

  window.I18N = {
    get lang() { return lang; },
    isEn() { return lang === "en"; },
    // translate a key, with optional {i},{n} substitution
    t(key, vars) {
      let s = tr(key);
      if (vars) for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
      return s;
    },
    // pick the right value when both are available inline
    pick(ar, en) { return lang === "en" ? (en || ar) : ar; },
    set(l) { localStorage.setItem(KEY, l); location.reload(); },
    toggle() { this.set(lang === "en" ? "ar" : "en"); }
  };

  function applyStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (DICT[k]) el.textContent = tr(k);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const k = el.getAttribute("data-i18n-ph");
      if (DICT[k]) el.setAttribute("placeholder", tr(k));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const k = el.getAttribute("data-i18n-title");
      if (DICT[k]) document.title = tr(k);
    });

    injectToggle();
  }

  function injectToggle() {
    if (document.getElementById("langToggle")) return;
    const b = document.createElement("button");
    b.id = "langToggle";
    b.type = "button";
    b.className = "lang-toggle";
    b.textContent = "🌐 " + tr("lang.toggle");
    b.addEventListener("click", () => window.I18N.toggle());
    document.body.appendChild(b);
  }

  if (document.readyState !== "loading") applyStatic();
  else document.addEventListener("DOMContentLoaded", applyStatic);
})();
