let lessonAnswerRevealed = false;
let lessonNotice = "";
let reviewSessionCards = [];
let reviewSessionIndex = 0;
let reviewAnswerRevealed = false;
let reviewSessionActive = false;
let activeStudySection = "lessons";

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
  saveProgress();
  reviewSessionIndex++;
  reviewAnswerRevealed = false;
  renderStudyHome();
}

function renderStudyHome() {
  renderLessonSection();
  renderReviewOverview();
  renderReviewSession();
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
  const studyRoute = /^#study(?:\/(lessons|reviews))?$/u.exec(hash);
  if (studyRoute) {
    document.getElementById("notice").hidden = true;
    setView("study");
    setStudySection(studyRoute[1] || "lessons");
    return;
  }
  if (hash === "#guide") {
    document.getElementById("notice").hidden = true;
    setView("guide");
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
  const select = document.getElementById("profile-select");
  select.replaceChildren();
  for (const profile of profileStore.profiles) {
    const option = element("option", "", profile.name);
    option.value = profile.id;
    select.append(option);
  }
  select.value = profileStore.activeProfileId;
  const active = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  document.getElementById("active-profile-name").textContent = active.name;
  document.getElementById("reset-progress").textContent = `Reset ${active.name}'s progress`;
}

function activateProfile(profileId) {
  if (profileId === profileStore.activeProfileId) return true;
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
  renderProfileMenu();
  document.getElementById("profile-menu").open = false;
  document.getElementById("notice").hidden = true;
  renderStudyHome();
  return true;
}

document.getElementById("profile-switch").addEventListener("click", () => {
  activateProfile(document.getElementById("profile-select").value);
});
document.getElementById("profile-create-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.getElementById("new-profile-name");
  const name = input.value.trim();
  if (!name) {
    showNotice("Enter a name for the new profile.");
    input.focus();
    return;
  }
  if (profileStore.profiles.some(profile => profile.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    showNotice("A profile with that name already exists.");
    input.focus();
    return;
  }
  let id = `profile-${profileStore.nextProfileNumber || profileStore.profiles.length + 1}`;
  while (profileStore.profiles.some(profile => profile.id === id)) {
    profileStore.nextProfileNumber = (profileStore.nextProfileNumber || 1) + 1;
    id = `profile-${profileStore.nextProfileNumber}`;
  }
  const profile = { id, name, cards: {} };
  const previousProfileId = profileStore.activeProfileId;
  profileStore.profiles.push(profile);
  profileStore.nextProfileNumber = Number(id.slice("profile-".length)) + 1;
  profileStore.activeProfileId = id;
  if (!saveProfiles()) {
    profileStore.profiles.pop();
    profileStore.activeProfileId = previousProfileId;
    return;
  }
  progress = { version: 2, cards: profile.cards };
  lessonAnswerRevealed = false;
  reviewSessionCards = [];
  reviewSessionIndex = 0;
  reviewAnswerRevealed = false;
  reviewSessionActive = false;
  input.value = "";
  document.getElementById("notice").hidden = true;
  renderProfileMenu();
  document.getElementById("profile-menu").open = false;
  renderStudyHome();
});

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
    navigateToRoute(section === "lessons" ? "#study/lessons" : "#study/reviews");
  });
}
document.getElementById("reset-progress").onclick = () => {
  const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
  if (!window.confirm(`Reset all lesson progress and review schedules for ${activeProfile.name}?`)) return;
  progress = { version: 2, cards: {} };
  lessonAnswerRevealed = false;
  reviewSessionCards = [];
  reviewSessionIndex = 0;
  reviewAnswerRevealed = false;
  reviewSessionActive = false;
  saveProgress();
  renderStudyHome();
};
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
