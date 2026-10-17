let lessonAnswerRevealed = false;
let lessonNotice = "";
let reviewSessionCards = [];
let reviewSessionIndex = 0;
let reviewAnswerRevealed = false;
let reviewSessionActive = false;
let activeStudySection = "lessons";
let profileCreationPending = false;
let profileCreationId = 0;

function renderCheckpointList() {
  const list = document.getElementById("checkpoint-list");
  list.replaceChildren();
  const activeCheckpoint = currentCheckpoint();
  for (const [index, checkpoint] of lessonCheckpoints.entries()) {
    const completed = checkpoint.cards.filter(lessonComplete).length;
    const done = completed === checkpoint.cards.length;
    const current = checkpoint === activeCheckpoint;
    const item = element("li", `checkpoint-item${done ? " complete" : ""}${current ? " current" : ""}`);
    item.setAttribute("aria-current", current ? "step" : "false");
    const status = done ? "✓" : String(index + 1);
    item.append(element("span", "checkpoint-number", status));
    const detail = element("span", "checkpoint-detail");
    detail.append(element("b", "", checkpoint.title));
    detail.append(element("small", "", `${completed.toLocaleString()} of ${checkpoint.cards.length.toLocaleString()} cards`));
    item.append(detail);
    list.append(item);
  }
}

function renderAnswerCard(parent, card, revealed, reveal, correct, wrong, prompt) {
  parent.replaceChildren();
  const front = element("div", "study-front");
  front.append(element("span", "badge", card.type === "kanji" ? "Kanji" : card.isVerb ? "Verb" : "Word"));
  front.append(element("h2", "detail-title", card.term));
  if (revealed) {
    renderDetail(card, front);
    const actions = element("div", "study-actions");
    const wrongButton = element("button", "missed", "Need practice");
    const correctButton = element("button", "", "Got it");
    wrongButton.addEventListener("click", wrong);
    correctButton.addEventListener("click", correct);
    actions.append(wrongButton, correctButton);
    parent.append(front, actions);
  } else {
    front.append(element("p", "prompt", prompt));
    const actions = element("div", "study-actions");
    const revealButton = element("button", "", "Reveal answer");
    revealButton.addEventListener("click", reveal);
    actions.append(revealButton);
    parent.append(front, actions);
  }
}

function renderLessonSection() {
  const completed = lessonCards.filter(lessonComplete).length;
  const checkpoint = currentCheckpoint();
  const checkpointIndex = checkpoint ? lessonCheckpoints.indexOf(checkpoint) : lessonCheckpoints.length - 1;
  const checkpointCompleted = checkpoint ? checkpoint.cards.filter(lessonComplete).length : lessonCards.length;
  const next = nextLessonCard();
  document.getElementById("lesson-summary").textContent =
    checkpoint
      ? `Checkpoint ${checkpointIndex + 1} of ${lessonCheckpoints.length} · ${checkpoint.title}`
      : "All checkpoints complete";
  document.getElementById("lesson-subtitle").textContent = checkpoint
    ? `${checkpoint.description} · ${checkpointCompleted.toLocaleString()} of ${checkpoint.cards.length.toLocaleString()} cards complete · ${completed.toLocaleString()} of ${lessonCards.length.toLocaleString()} lessons overall`
    : `All ${lessonCards.length.toLocaleString()} lessons are complete. Learned cards are in the review deck.`;
  document.getElementById("lesson-progress-fill").style.width =
    `${checkpoint?.cards.length ? checkpointCompleted / checkpoint.cards.length * 100 : 100}%`;
  renderCheckpointList();

  const panel = document.getElementById("lesson-card");
  if (!next) {
    panel.replaceChildren(
      element("h2", "", checkpoint ? "Checkpoint complete" : "All lessons complete"),
      element("p", "muted", checkpoint
        ? "You reached a milestone. The next checkpoint is ready."
        : "You can keep practicing learned cards in Reviews.")
    );
    return;
  }
  if (lessonNotice) {
    showNotice(lessonNotice);
    lessonNotice = "";
  }
  renderAnswerCard(
    panel,
    next,
    lessonAnswerRevealed,
    () => { lessonAnswerRevealed = true; renderLessonSection(); },
    () => {
      const previous = cardProgress(next);
      progress.cards[next.id] = {
        lessonComplete: true,
        intervalDays: previous?.intervalDays || 1,
        dueDate: previous?.dueDate || addDaysToDateKey(todayKey(), 1),
        reviews: previous?.reviews || 0,
        lessonAttempts: (previous?.lessonAttempts || 0) + 1
      };
      const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
      activeProfile.history ||= [];
      if (!activeProfile.history.some(entry => entry.type === "lesson" && entry.cardId === next.id)) {
        activeProfile.history.push({
          cardId: next.id,
          type: "lesson",
          date: todayKey(),
          timestamp: new Date().toISOString()
        });
      }
      lessonAnswerRevealed = false;
      document.getElementById("notice").hidden = true;
      saveProgress();
      renderStudyHome();
    },
    () => {
      const previous = cardProgress(next) || {};
      progress.cards[next.id] = {
        ...previous,
        lessonComplete: false,
        lessonAttempts: (previous.lessonAttempts || 0) + 1
      };
      lessonAnswerRevealed = false;
      lessonNotice = "Not quite—this card stays in your lesson queue. Try it again when you're ready.";
      saveProgress();
      renderLessonSection();
    },
    "Recall the readings and meaning, then reveal the answer."
  );
}

function renderReviewOverview() {
  const entries = reviewEntries();
  const dueCount = dueReviewEntries().length;
  const today = todayKey();
  document.getElementById("due-tab-count").textContent = dueCount ? String(dueCount) : "";
  document.getElementById("review-summary").textContent =
    `${dueCount.toLocaleString()} review${dueCount === 1 ? "" : "s"} available today`;
  document.getElementById("review-subtitle").textContent =
    `${entries.length.toLocaleString()} cards in your review deck. Correct answers double the interval; missed answers reduce it to a quarter, minimum one day.`;
  const startButton = document.getElementById("start-reviews");
  startButton.textContent = reviewSessionActive ? "End review session" : "Start due reviews";
  startButton.disabled = !reviewSessionActive && dueCount === 0;
  document.getElementById("review-total").textContent = `${entries.length} cards`;
  document.getElementById("reviews-panel").classList.toggle("in-session", reviewSessionActive);

  const dateCounts = new Map();
  for (const { record } of entries) {
    const date = record.dueDate < today ? today : record.dueDate;
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
  }
  const schedule = document.getElementById("review-schedule");
  schedule.replaceChildren();
  if (!dateCounts.size) {
    schedule.append(element("p", "empty-state", "Your first reviews will appear here after a lesson."));
  } else {
    for (const [date, count] of [...dateCounts].sort(([first], [second]) => first.localeCompare(second))) {
      const row = element("div", "schedule-day");
      row.append(element("span", "", date === today ? "Today" : prettyDate(date)));
      row.append(element("b", "", String(count)));
      schedule.append(row);
    }
  }

  const list = document.getElementById("review-list");
  list.replaceChildren();
  if (!entries.length) {
    list.append(element("p", "empty-state", "Complete a lesson to add a card to your review deck."));
  } else {
    for (const { card, record } of entries) {
      const row = element("div", "review-row");
      const link = element("a", "review-card-link", card.term);
      link.href = cardUrl(card);
      const dueText = record.dueDate <= today ? "Due today" : `Due ${prettyDate(record.dueDate)}`;
      const info = element("span", "review-card-info",
        `${dueText} · every ${record.intervalDays} day${record.intervalDays === 1 ? "" : "s"}`);
      row.append(link, info);
      list.append(row);
    }
  }
}

function renderProgressHistory() {
  const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  if (!activeProfile) return;
  activeProfile.history ||= [];
  document.getElementById("progress-profile-title").textContent = `${activeProfile.name}'s study history`;

  const lessons = activeProfile.history
    .filter(entry => entry.type === "lesson")
    .slice()
    .sort((first, second) => (first.timestamp || first.date || "").localeCompare(second.timestamp || second.date || ""));
  const lessonIds = new Set(lessons.map(entry => entry.cardId));
  for (const card of lessonCards.filter(lessonComplete)) {
    if (!lessonIds.has(card.id)) lessons.push({ cardId: card.id, type: "lesson", date: "" });
  }

  const lessonList = document.getElementById("completed-lesson-list");
  lessonList.replaceChildren();
  document.getElementById("completed-lesson-count").textContent = `${lessons.length.toLocaleString()} cards`;
  if (!lessons.length) {
    lessonList.append(element("p", "empty-state", "Completed lessons will appear here."));
  } else {
    for (const entry of lessons) {
      const card = cards.find(item => item.id === entry.cardId);
      const row = element("div", "history-row");
      if (card) {
        const link = element("a", "review-card-link", card.term);
        link.href = cardUrl(card);
        row.append(link);
      } else {
        row.append(element("span", "history-term", entry.cardId));
      }
      row.append(element("span", "review-card-info", entry.date ? prettyDate(entry.date) : "Date not recorded"));
      lessonList.append(row);
    }
  }

  const reviewEvents = activeProfile.history
    .filter(entry => entry.type === "review")
    .slice()
    .sort((first, second) => (second.timestamp || second.date || "").localeCompare(first.timestamp || first.date || ""));
  const reviewCounts = new Map();
  for (const entry of reviewEvents) reviewCounts.set(entry.cardId, (reviewCounts.get(entry.cardId) || 0) + 1);
  const legacyReviews = [];
  for (const card of lessonCards) {
    const record = progress.cards[card.id];
    const missingCount = Math.max(0, (record?.reviews || 0) - (reviewCounts.get(card.id) || 0));
    if (missingCount) legacyReviews.push({ cardId: card.id, count: missingCount, record });
  }

  const reviewList = document.getElementById("review-history-list");
  reviewList.replaceChildren();
  const totalReviewCount = reviewEvents.length + legacyReviews.reduce((sum, entry) => sum + entry.count, 0);
  document.getElementById("review-history-count").textContent = `${totalReviewCount.toLocaleString()} reviews`;
  if (!totalReviewCount) {
    reviewList.append(element("p", "empty-state", "Completed reviews will appear here."));
  } else {
    for (const entry of reviewEvents) {
      const card = cards.find(item => item.id === entry.cardId);
      const row = element("div", "history-row");
      if (card) {
        const link = element("a", "review-card-link", card.term);
        link.href = cardUrl(card);
        row.append(link);
      } else {
        row.append(element("span", "history-term", entry.cardId));
      }
      const result = entry.result === "correct" ? "Got it" : "Need practice";
      const details = [`${entry.date ? prettyDate(entry.date) : "Date not recorded"} · ${result}`];
      if (entry.intervalDays) details.push(`next review in ${entry.intervalDays} day${entry.intervalDays === 1 ? "" : "s"}`);
      row.append(element("span", "review-card-info", details.join(" · ")));
      reviewList.append(row);
    }
    for (const entry of legacyReviews) {
      const card = cards.find(item => item.id === entry.cardId);
      const row = element("div", "history-row");
      if (card) {
        const link = element("a", "review-card-link", card.term);
        link.href = cardUrl(card);
        row.append(link);
      } else {
        row.append(element("span", "history-term", entry.cardId));
      }
      const latest = entry.record.lastReviewed
        ? `${prettyDate(entry.record.lastReviewed)} · latest: ${entry.record.lastResult === "missed" ? "Need practice" : "Got it"}`
        : "Dates not recorded";
      row.append(element("span", "review-card-info", `${entry.count} earlier review${entry.count === 1 ? "" : "s"} · ${latest}`));
      reviewList.append(row);
    }
  }
}

function renderReviewSession() {
  const panel = document.getElementById("review-card");
  panel.hidden = !reviewSessionActive;
  if (!reviewSessionActive) return;
  if (reviewSessionIndex >= reviewSessionCards.length) {
    panel.replaceChildren(
      element("h2", "", "Reviews complete"),
      element("p", "muted", "You've finished all reviews that were available today.")
    );
    return;
  }
  const card = reviewSessionCards[reviewSessionIndex];
  renderAnswerCard(
    panel,
    card,
    reviewAnswerRevealed,
    () => { reviewAnswerRevealed = true; renderReviewSession(); },
    () => updateReviewSchedule(card, true),
    () => updateReviewSchedule(card, false),
    `Review due ${prettyDate(cardProgress(card).dueDate)}. Recall the reading and meaning.`
  );
}

function updateReviewSchedule(card, correct) {
  const previous = cardProgress(card);
  if (!previous?.lessonComplete) return;
  const intervalDays = correct
    ? previous.intervalDays * 2
    : Math.max(1, Math.floor(previous.intervalDays / 4));
  progress.cards[card.id] = {
    ...previous,
    intervalDays,
    dueDate: addDaysToDateKey(todayKey(), intervalDays),
    reviews: previous.reviews + 1,
    lastReviewed: todayKey(),
    lastResult: correct ? "correct" : "missed"
  };
  const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  activeProfile.history ||= [];
  activeProfile.history.push({
    cardId: card.id,
    type: "review",
    date: todayKey(),
    timestamp: new Date().toISOString(),
    result: correct ? "correct" : "missed",
    intervalDays,
    dueDate: addDaysToDateKey(todayKey(), intervalDays)
  });
  saveProgress();
  reviewSessionIndex++;
  reviewAnswerRevealed = false;
  renderStudyHome();
}

function renderStudyHome() {
  renderLessonSection();
  renderReviewOverview();
  renderReviewSession();
  if (activeStudySection === "progress") renderProgressHistory();
}

function setStudySection(section) {
  activeStudySection = section;
  for (const tab of document.querySelectorAll(".study-tab")) {
    const active = tab.dataset.studySection === section;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  document.getElementById("lessons-panel").hidden = section !== "lessons";
  document.getElementById("reviews-panel").hidden = section !== "reviews";
  document.getElementById("progress-panel").hidden = section !== "progress";
  renderStudyHome();
}

function beginReviewSession() {
  reviewSessionCards = dueReviewEntries().map(entry => entry.card);
  reviewSessionIndex = 0;
  reviewAnswerRevealed = false;
  reviewSessionActive = true;
  renderStudyHome();
}

function applyRoute() {
  const hash = location.hash;
  if (!hash || hash === "#browse") {
    document.getElementById("notice").hidden = true;
    setView("browse");
    return;
  }
  const studyRoute = /^#study(?:\/(lessons|reviews|progress))?$/u.exec(hash);
  if (studyRoute) {
    document.getElementById("notice").hidden = true;
    setView("study");
    setStudySection(studyRoute[1] || "lessons");
    return;
  }
  const guideRoute = /^#guide(?:\/([a-z0-9-]+))?$/u.exec(hash);
  if (guideRoute) {
    document.getElementById("notice").hidden = true;
    setView("guide");
    if (guideRoute[1]) {
      const section = document.getElementById(guideRoute[1]);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      else showNotice("That conjugation guide section could not be found.");
    }
    return;
  }
  const match = /^#card\/(kanji|word)\/(.+)$/u.exec(hash);
  if (match) {
    let term;
    try {
      term = decodeURIComponent(match[2]);
    } catch (error) {
      showNotice("That card link contains an invalid character encoding.");
      setView("browse");
      return;
    }
    const card = cards.find(item => item.type === match[1] && item.term === term);
    if (!card) {
      showNotice(`No ${match[1]} card was found for “${term}”.`);
      setView("browse");
      return;
    }
    document.getElementById("notice").hidden = true;
    selectedCardId = card.id;
    setView("browse", true);
    document.getElementById("card-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  showNotice("That app link wasn't recognized. Showing Browse instead.");
  history.replaceState(null, "", `${location.pathname}${location.search}#browse`);
  setView("browse");
}

function setView(view, preserveSelected = false) {
  currentView = view;
  for (const button of document.querySelectorAll(".nav-button")) {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  }
  document.getElementById("browse-view").hidden = view !== "browse";
  document.getElementById("study-view").hidden = view !== "study";
  document.getElementById("guide-view").hidden = view !== "guide";
  if (view === "browse") renderBrowse(preserveSelected);
  if (view === "study") renderStudyHome();
  if (view === "guide") renderGuide();
}

function renderProfileMenu() {
  const list = document.getElementById("profile-list");
  list.replaceChildren();
  for (const profile of profileStore.profiles) {
    const row = element("div", "profile-list-item");
    row.setAttribute("role", "listitem");
    const choice = element("button", "profile-choice", profile.name);
    choice.type = "button";
    choice.setAttribute("aria-pressed", String(profile.id === profileStore.activeProfileId));
    choice.addEventListener("click", () => {
      if (profileCreationPending && !savePendingProfile()) return;
      activateProfile(profile.id);
    });
    row.append(choice);
    list.append(row);
  }
  if (profileCreationPending) {
    const row = element("div", "profile-list-item");
    row.setAttribute("role", "listitem");
    const form = element("form", "profile-create-row");
    form.id = "profile-create-form";
    const label = element("label", "visually-hidden", "New profile name");
    label.htmlFor = "new-profile-name";
    const input = element("input");
    input.id = "new-profile-name";
    input.type = "text";
    input.maxLength = 40;
    input.autocomplete = "off";
    input.placeholder = "New profile name";
    const cancel = element("button", "profile-cancel-button", "×");
    cancel.type = "button";
    cancel.setAttribute("aria-label", "Cancel profile creation");
    cancel.addEventListener("mousedown", event => event.preventDefault());
    cancel.addEventListener("click", cancelProfileCreation);
    input.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelProfileCreation();
      } else if (event.key === "Enter") {
        event.preventDefault();
        savePendingProfile();
      }
    });
    const pendingId = profileCreationId;
    input.addEventListener("blur", event => {
      if (!profileCreationPending || event.relatedTarget === cancel) return;
      window.setTimeout(() => {
        if (!profileCreationPending || pendingId !== profileCreationId || form.contains(document.activeElement)) return;
        savePendingProfile();
      }, 0);
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      savePendingProfile();
    });
    form.append(label, input, cancel);
    row.append(form);
    list.append(row);
  }
  const addRow = element("div", "profile-list-item");
  addRow.setAttribute("role", "listitem");
  const addButton = element("button", "profile-add-button", "+");
  addButton.type = "button";
  addButton.id = "profile-add";
  addButton.setAttribute("aria-label", "Add profile");
  addButton.addEventListener("click", () => {
    if (profileCreationPending && !savePendingProfile()) return;
    profileCreationPending = true;
    profileCreationId++;
    renderProfileMenu();
    document.getElementById("new-profile-name").focus();
  });
  addRow.append(addButton);
  list.append(addRow);
  const active = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  document.getElementById("active-profile-name").textContent = active.name;
  document.getElementById("reset-progress").textContent = `Reset ${active.name}'s progress`;
}

function createProfile(name) {
  if (profileStore.profiles.some(profile => profile.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    showNotice("A profile with that name already exists.");
    return false;
  }
  let id = `profile-${profileStore.nextProfileNumber || profileStore.profiles.length + 1}`;
  while (profileStore.profiles.some(profile => profile.id === id)) {
    profileStore.nextProfileNumber = (profileStore.nextProfileNumber || 1) + 1;
    id = `profile-${profileStore.nextProfileNumber}`;
  }
  const profile = { id, name, cards: {}, history: [] };
  const previousProfileId = profileStore.activeProfileId;
  profileStore.profiles.push(profile);
  profileStore.nextProfileNumber = Number(id.slice("profile-".length)) + 1;
  profileStore.activeProfileId = id;
  if (!saveProfiles()) {
    profileStore.profiles.pop();
    profileStore.activeProfileId = previousProfileId;
    return false;
  }
  profileCreationPending = false;
  profileCreationId++;
  progress = { version: 2, cards: profile.cards };
  lessonAnswerRevealed = false;
  reviewSessionCards = [];
  reviewSessionIndex = 0;
  reviewAnswerRevealed = false;
  reviewSessionActive = false;
  document.getElementById("notice").hidden = true;
  renderProfileMenu();
  renderStudyHome();
  return true;
}

function savePendingProfile() {
  if (!profileCreationPending) return true;
  const input = document.getElementById("new-profile-name");
  const name = input.value.trim();
  if (!name) {
    cancelProfileCreation();
    return true;
  }
  if (!createProfile(name)) {
    if (input.isConnected) input.focus();
    return false;
  }
  return true;
}

function cancelProfileCreation() {
  profileCreationPending = false;
  profileCreationId++;
  document.getElementById("notice").hidden = true;
  renderProfileMenu();
}

function activateProfile(profileId) {
  if (profileId === profileStore.activeProfileId) {
    document.getElementById("profile-menu").open = false;
    return true;
  }
  const profile = profileStore.profiles.find(item => item.id === profileId);
  if (!profile) {
    showNotice("That study profile could not be found.");
    return false;
  }
  const previousProfileId = profileStore.activeProfileId;
  profileStore.activeProfileId = profileId;
  if (!saveProfiles()) {
    profileStore.activeProfileId = previousProfileId;
    return false;
  }
  progress = { version: 2, cards: profile.cards };
  lessonAnswerRevealed = false;
  lessonNotice = "";
  reviewSessionCards = [];
  reviewSessionIndex = 0;
  reviewAnswerRevealed = false;
  reviewSessionActive = false;
  profileCreationPending = false;
  profileCreationId++;
  renderProfileMenu();
  document.getElementById("profile-menu").open = false;
  document.getElementById("notice").hidden = true;
  renderStudyHome();
  return true;
}

function validDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateProgressBackup(data) {
  if (!data || data.format !== "japanese-study-progress" || data.version !== 1
    || !data.cards || typeof data.cards !== "object" || Array.isArray(data.cards)
    || !Array.isArray(data.history)) {
    throw new Error("This file is not a supported Japanese Study Guide progress backup.");
  }
  const importedCards = Object.create(null);
  for (const [cardId, record] of Object.entries(data.cards)) {
    if (!cardId || !record || typeof record !== "object" || Array.isArray(record)
      || typeof record.lessonComplete !== "boolean"
      || !Number.isInteger(record.lessonAttempts) || record.lessonAttempts < 0
      || !Number.isInteger(record.reviews) || record.reviews < 0
      || (record.intervalDays !== undefined && (!Number.isInteger(record.intervalDays) || record.intervalDays < 1))
      || (record.dueDate !== undefined && !validDateKey(record.dueDate))
      || (record.lastReviewed !== undefined && !validDateKey(record.lastReviewed))
      || (record.lastResult !== undefined && !["correct", "missed"].includes(record.lastResult))
      || (record.lessonComplete && (!Number.isInteger(record.intervalDays) || record.intervalDays < 1
        || !validDateKey(record.dueDate)))
      || (record.reviews > 0 && (!record.lessonComplete || !Number.isInteger(record.intervalDays)
        || record.intervalDays < 1 || !validDateKey(record.dueDate)))) {
      throw new Error("The backup contains an invalid card-progress record.");
    }
    importedCards[cardId] = {
      lessonComplete: record.lessonComplete,
      lessonAttempts: record.lessonAttempts,
      reviews: record.reviews,
      ...(record.intervalDays !== undefined ? { intervalDays: record.intervalDays } : {}),
      ...(record.dueDate !== undefined ? { dueDate: record.dueDate } : {}),
      ...(record.lastReviewed !== undefined ? { lastReviewed: record.lastReviewed } : {}),
      ...(record.lastResult !== undefined ? { lastResult: record.lastResult } : {})
    };
  }
  const history = data.history.map(entry => {
    if (!entry || typeof entry !== "object" || typeof entry.cardId !== "string" || !entry.cardId
      || !["lesson", "review"].includes(entry.type) || !validDateKey(entry.date)
      || (entry.timestamp !== undefined && (typeof entry.timestamp !== "string" || !Number.isFinite(Date.parse(entry.timestamp))))) {
      throw new Error("The backup contains an invalid study-history record.");
    }
    if (entry.type === "review" && (!["correct", "missed"].includes(entry.result)
      || !Number.isInteger(entry.intervalDays) || entry.intervalDays < 1
      || !validDateKey(entry.dueDate))) {
      throw new Error("The backup contains an invalid review-history record.");
    }
    return {
      cardId: entry.cardId,
      type: entry.type,
      date: entry.date,
      ...(entry.timestamp ? { timestamp: entry.timestamp } : {}),
      ...(entry.type === "review" ? {
        result: entry.result,
        intervalDays: entry.intervalDays,
        dueDate: entry.dueDate
      } : {})
    };
  });
  return { cards: importedCards, history };
}

function exportActiveProfileProgress() {
  const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  const backup = {
    format: "japanese-study-progress",
    version: 1,
    exportedAt: new Date().toISOString(),
    profileName: activeProfile.name,
    cards: activeProfile.cards,
    history: activeProfile.history || []
  };
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = element("a");
  const filename = activeProfile.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "") || "profile";
  link.href = blobUrl;
  link.download = `japanese-study-${filename}-progress.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  showNotice(`Exported progress for ${activeProfile.name}. Keep the downloaded JSON file somewhere safe.`);
}

async function importActiveProfileProgress(file) {
  try {
    if (file.size > 25 * 1024 * 1024) throw new Error("The selected backup is larger than 25 MB.");
    const data = JSON.parse(await file.text());
    const imported = validateProgressBackup(data);
    const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
    const completedCount = Object.values(imported.cards).filter(record => record.lessonComplete).length;
    const reviewCount = Object.values(imported.cards).reduce((total, record) => total + record.reviews, 0);
    if (!window.confirm(
      `Replace ${activeProfile.name}'s current progress with the backup for ${data.profileName || "another profile"}? `
      + `This imports ${completedCount.toLocaleString()} completed lessons and ${reviewCount.toLocaleString()} reviews. `
      + "Other profiles will not change."
    )) return;

    const previousCards = activeProfile.cards;
    const previousHistory = activeProfile.history || [];
    const previousProgress = progress;
    activeProfile.cards = imported.cards;
    activeProfile.history = imported.history;
    progress = { version: 2, cards: activeProfile.cards };
    if (!saveProfiles()) {
      activeProfile.cards = previousCards;
      activeProfile.history = previousHistory;
      progress = previousProgress;
      return;
    }
    lessonAnswerRevealed = false;
    lessonNotice = "";
    reviewSessionCards = [];
    reviewSessionIndex = 0;
    reviewAnswerRevealed = false;
    reviewSessionActive = false;
    renderStudyHome();
    showNotice(`Imported progress into ${activeProfile.name}.`);
  } catch (error) {
    showNotice(error instanceof Error ? `Progress import failed: ${error.message}` : "Progress import failed.");
  }
}

document.getElementById("start-reviews").addEventListener("click", () => {
  if (reviewSessionActive) {
    reviewSessionActive = false;
    renderStudyHome();
  } else {
    beginReviewSession();
  }
});
for (const tab of document.querySelectorAll(".study-tab")) {
  tab.addEventListener("click", () => {
    const section = tab.dataset.studySection;
    navigateToRoute(`#study/${section}`);
  });
}
document.addEventListener("pointerdown", event => {
  if (!profileCreationPending || !(event.target instanceof Element)) return;
  if (event.target.closest(".profile-choice, .profile-add-button, .profile-cancel-button, #new-profile-name")) return;
  savePendingProfile();
}, true);
document.getElementById("reset-progress").onclick = () => {
  const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  if (!window.confirm(`Reset all lesson progress and review schedules for ${activeProfile.name}?`)) return;
  progress = { version: 2, cards: {} };
  activeProfile.history = [];
  lessonAnswerRevealed = false;
  reviewSessionCards = [];
  reviewSessionIndex = 0;
  reviewAnswerRevealed = false;
  reviewSessionActive = false;
  saveProgress();
  renderStudyHome();
};
document.getElementById("export-progress").addEventListener("click", exportActiveProfileProgress);
const importProgressFile = document.getElementById("import-progress-file");
document.getElementById("import-progress").addEventListener("click", () => importProgressFile.click());
importProgressFile.addEventListener("change", async () => {
  const [file] = importProgressFile.files || [];
  if (file) await importActiveProfileProgress(file);
  importProgressFile.value = "";
});
document.addEventListener("keydown", event => {
  if (currentView !== "study" || event.target.matches("input, select, textarea, button, a")) return;
  if (activeStudySection === "lessons" && event.code === "Space" && !lessonAnswerRevealed) {
    event.preventDefault();
    lessonAnswerRevealed = true;
    renderStudyHome();
  } else if (activeStudySection === "reviews" && reviewSessionActive && event.code === "Space" && !reviewAnswerRevealed) {
    event.preventDefault();
    reviewAnswerRevealed = true;
    renderStudyHome();
  } else if (activeStudySection === "reviews" && reviewSessionActive && reviewAnswerRevealed && event.key === "ArrowRight") {
    updateReviewSchedule(reviewSessionCards[reviewSessionIndex], true);
  } else if (activeStudySection === "reviews" && reviewSessionActive && reviewAnswerRevealed && event.key === "ArrowLeft") {
    updateReviewSchedule(reviewSessionCards[reviewSessionIndex], false);
  }
});

renderProfileMenu();
applyRoute();
