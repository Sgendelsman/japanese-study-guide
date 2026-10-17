"use strict";

const source = JSON.parse(document.getElementById("source-data").textContent);
const categories = new Map([
  ["N5", "JLPT N5"], ["N4", "JLPT N4"], ["N3", "JLPT N3"],
  ["N2", "JLPT N2"], ["N1", "JLPT N1"], ["Everyday", "Everyday Japanese"],
  ["Verbs", "Verbs"]
]);
const kanaMap = {
  あ:"a", い:"i", う:"u", え:"e", お:"o",
  か:"ka", き:"ki", く:"ku", け:"ke", こ:"ko",
  さ:"sa", し:"shi", す:"su", せ:"se", そ:"so",
  た:"ta", ち:"chi", つ:"tsu", て:"te", と:"to",
  な:"na", に:"ni", ぬ:"nu", ね:"ne", の:"no",
  は:"ha", ひ:"hi", ふ:"fu", へ:"he", ほ:"ho",
  ま:"ma", み:"mi", む:"mu", め:"me", も:"mo",
  や:"ya", ゆ:"yu", よ:"yo",
  ら:"ra", り:"ri", る:"ru", れ:"re", ろ:"ro",
  わ:"wa", ゐ:"wi", ゑ:"we", を:"o", ん:"n",
  が:"ga", ぎ:"gi", ぐ:"gu", げ:"ge", ご:"go",
  ざ:"za", じ:"ji", ず:"zu", ぜ:"ze", ぞ:"zo",
  だ:"da", ぢ:"ji", づ:"zu", で:"de", ど:"do",
  ば:"ba", び:"bi", ぶ:"bu", べ:"be", ぼ:"bo",
  ぱ:"pa", ぴ:"pi", ぷ:"pu", ぺ:"pe", ぽ:"po",
  きゃ:"kya", きゅ:"kyu", きょ:"kyo",
  しゃ:"sha", しゅ:"shu", しょ:"sho",
  ちゃ:"cha", ちゅ:"chu", ちょ:"cho",
  にゃ:"nya", にゅ:"nyu", にょ:"nyo",
  ひゃ:"hya", ひゅ:"hyu", ひょ:"hyo",
  みゃ:"mya", みゅ:"myu", みょ:"myo",
  りゃ:"rya", りゅ:"ryu", りょ:"ryo",
  ぎゃ:"gya", ぎゅ:"gyu", ぎょ:"gyo",
  じゃ:"ja", じゅ:"ju", じょ:"jo",
  びゃ:"bya", びゅ:"byu", びょ:"byo",
  ぴゃ:"pya", ぴゅ:"pyu", ぴょ:"pyo",
  ふぁ:"fa", ふぃ:"fi", ふぇ:"fe", ふぉ:"fo",
  うぃ:"wi", うぇ:"we", うぉ:"wo", てぃ:"ti", でぃ:"di"
};

function normalizeKana(text) {
  return [...text].map(char => {
    const code = char.charCodeAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
  }).join("");
}

function splitMorae(text) {
  const normalized = normalizeKana(text.replace(/[.・]/gu, ""));
  const morae = [];
  for (const character of normalized) {
    if (/[ゃゅょぁぃぅぇぉゎゕゖ]/u.test(character) && morae.length) {
      morae[morae.length - 1] += character;
    } else {
      morae.push(character);
    }
  }
  return morae;
}

function macronize(previous, vowel) {
  const macrons = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };
  for (let i = previous.length - 1; i >= 0; i--) {
    if ("aeiou".includes(previous[i])) {
      return previous[i] === vowel ? previous.slice(0, i) + macrons[vowel] : previous;
    }
  }
  return previous;
}

function kanaToRomaji(text) {
  const normalized = normalizeKana(text.replace(/[.・]/gu, ""));
  const morae = normalized.match(/きゃ|きゅ|きょ|しゃ|しゅ|しょ|ちゃ|ちゅ|ちょ|にゃ|にゅ|にょ|ひゃ|ひゅ|ひょ|みゃ|みゅ|みょ|りゃ|りゅ|りょ|ぎゃ|ぎゅ|ぎょ|じゃ|じゅ|じょ|びゃ|びゅ|びょ|ぴゃ|ぴゅ|ぴょ|ふぁ|ふぃ|ふぇ|ふぉ|うぃ|うぇ|うぉ|てぃ|でぃ|っ|ん|ー|./gu) || [];
  let result = "";
  let geminate = false;
  for (let i = 0; i < morae.length; i++) {
    const mora = morae[i];
    if (mora === "っ") { geminate = true; continue; }
    if (mora === "ー") {
      result = macronize(result, result.match(/[aeiou](?!.*[aeiou])/u)?.[0] || "");
      continue;
    }
    if (mora === "ん") {
      const next = kanaMap[morae[i + 1]] || "";
      result += /^[bmp]/u.test(next) ? "m" : (/^[aeiouy]/u.test(next) ? "n'" : "n");
      continue;
    }
    let romaji = kanaMap[mora] || mora;
    if (geminate) {
      result += romaji.startsWith("ch") ? "t" : (romaji.match(/^[^aeiou]/u)?.[0] || "");
      geminate = false;
    }
    const vowel = romaji.length === 1 && "aeiou".includes(romaji);
    if (vowel) {
      const previousVowel = result.match(/[aeiou](?!.*[aeiou])/u)?.[0];
      const longVowel = previousVowel === romaji && romaji !== "i"
        || previousVowel === "o" && romaji === "u";
      if (longVowel) {
        result = macronize(result, previousVowel);
        continue;
      }
    }
    result += romaji;
  }
  if (geminate) result += "tsu";
  return result;
}

function romanized(text) {
  return kanaToRomaji(text);
}

function parseFields(body) {
  const fields = {};
  const pattern = /\*\*([^*]+):\*\*\s*(.*?)(?=(?:\s*\|\s*|\.\s+)\*\*[^*]+:\*\*|$)/gu;
  for (const match of body.matchAll(pattern)) fields[match[1].trim()] = match[2].trim().replace(/\s*\|\s*$/u, "");
  return fields;
}

function stripMarkdown(text) {
  return text.replace(/\*\*/gu, "").replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1").replace(/\s*\|\s*$/u, "").trim();
}

function parseDeck(markdown) {
  const cards = [];
  const guide = [];
  let top = "";
  let sub = "";
  let order = 0;
  for (const line of markdown.split(/\r?\n/u)) {
    const heading = /^(#{2,6})\s+(.+?)\s*$/u.exec(line);
    if (heading) {
      if (heading[1].length === 2) { top = heading[2]; sub = ""; }
      else sub = heading[2];
      continue;
    }
    const entry = /^\*\*(.+?)\.\*\*\s*(.*)$/u.exec(line);
    if (!entry || line.startsWith("<!--")) continue;
    const [, rawTerm, body] = entry;
    const fields = parseFields(body);
    if (top === "Verbs and Conjugations" && sub === "Conjugation Patterns") {
      guide.push({ title: stripMarkdown(rawTerm), text: stripMarkdown(body) });
      continue;
    }
    const markedKanji = /\s+\[([^\]]+)\]\s*$/u.exec(rawTerm);
    const marked = markedKanji && /^\p{Script=Han}+$/u.test(markedKanji[1]) ? markedKanji[1] : "";
    const term = stripMarkdown(marked ? rawTerm.slice(0, markedKanji.index) : rawTerm).replace(/[.。]$/u, "");
    if (!term) continue;
    const isJlpt = /^JLPT N[1-5]$/u.test(top);
    const isEveryday = top === "Everyday Japanese (Kana Included)";
    const isVerb = top === "Verbs and Conjugations" && sub !== "Conjugation Patterns";
    if (!isJlpt && !isEveryday && !isVerb) continue;
    const level = isJlpt ? top.replace("JLPT ", "") : "";
    const category = level || (isEveryday ? "Everyday" : "Verbs");
    const kanji = [...new Set([...term.matchAll(/\p{Script=Han}/gu)].map(match => match[0]))];
    const conjugations = {};
    if (isVerb) {
      for (const [label, value] of Object.entries(fields)) {
        if (!["Reading", "Meaning", "Example", "Usage"].includes(label)) conjugations[label] = value;
      }
    }
    const sourceOrder = order++;
    cards.push({
      id: `card-${sourceOrder}`,
      term,
      sourceOrder,
      linkedKanji: marked ? [marked] : [],
      type: isJlpt && sub === "Kanji" ? "kanji" : "word",
      category,
      subcategory: sub,
      level,
      isVerb,
      fields,
      readings: fields["Kun'yomi"] || "",
      onReadings: fields["On'yomi"] || "",
      reading: fields.Reading || "",
      pitchAccent: fields["Pitch accent"] || "",
      meaning: fields.Meaning || "",
      example: fields.Example || "",
      usage: fields.Usage || "",
      conjugations,
      sourceUrl: /\[Kanshudo detail\]\(([^)]+)\)/u.exec(body)?.[1] || "",
      kanji
    });
  }
  return { cards, guide };
}

function mergeValues(first, second, separator) {
  return [...new Set([first, second].filter(Boolean))].join(separator);
}

function mergeWordCards(entries) {
  const merged = new Map();
  for (const card of entries) {
    if (card.type === "kanji") {
      card.categories = [card.category];
      merged.set(`kanji:${card.term}`, card);
      continue;
    }
    const key = `word:${card.term}`;
    const existing = merged.get(key);
    if (!existing) {
      card.categories = [card.category];
      merged.set(key, card);
      continue;
    }
    existing.categories = [...new Set([...existing.categories, card.category])];
    existing.subcategories = [...new Set([existing.subcategory, card.subcategory].filter(Boolean))];
    existing.reading = mergeValues(existing.reading, card.reading, "、");
    existing.pitchAccent = mergeValues(existing.pitchAccent, card.pitchAccent, "; ");
    existing.meaning = [...new Set(`${existing.meaning}; ${card.meaning}`.split(/\s*;\s*/u).filter(Boolean))].join("; ");
    existing.example = mergeValues(existing.example, card.example, " · ");
    existing.usage = mergeValues(existing.usage, card.usage, " · ");
    existing.isVerb ||= card.isVerb;
    existing.linkedKanji = [...new Set([...existing.linkedKanji, ...card.linkedKanji])];
    existing.conjugations = { ...existing.conjugations, ...card.conjugations };
    existing.fields["Pitch accent"] = existing.pitchAccent;
    existing.fields.Meaning = existing.meaning;
  }
  return [...merged.values()].map(card => ({
    ...card,
    id: `${card.type}:${card.term}`,
    category: card.categories[0]
  }));
}

const parsedSource = parseDeck(source);
const cards = mergeWordCards(parsedSource.cards);
const parsed = { ...parsedSource, cards };
const kanjiCards = new Map(cards.filter(card => card.type === "kanji").map(card => [card.term, card]));
const categoryCounts = new Map();
const profilesKey = "japanese-study-profiles-v1";
const progressKey = "japanese-study-progress-v2";
const previousProgressKey = "japanese-study-progress-v1";
const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];
const lessonCheckpoints = [
  { id: "n5", title: "N5 Foundations", description: "N5 kanji, words using N5 kanji, and basic Everyday Japanese." },
  { id: "n4", title: "N4", description: "N4 kanji and words that need them." },
  { id: "n3", title: "N3", description: "N3 kanji and words that need them." },
  { id: "n2", title: "N2", description: "N2 kanji and words that need them." },
  { id: "n1", title: "N1", description: "N1 kanji and words that need them." },
  { id: "extra", title: "Additional vocabulary", description: "Words without a JLPT kanji prerequisite, including extra vocabulary and verbs." }
];
const lessonCards = cards
  .filter(card => card.type === "kanji" || card.type === "word")
  .sort((first, second) => {
    return (first.type === second.type ? 0 : first.type === "kanji" ? -1 : 1)
      || first.sourceOrder - second.sourceOrder;
  });
function cardLevelRank(card) {
  const ranks = card.categories
    .map(category => jlptLevels.indexOf(category))
    .filter(rank => rank >= 0);
  return ranks.length ? Math.min(...ranks) : null;
}

function checkpointRank(card) {
  if (card.type === "kanji") return cardLevelRank(card) ?? lessonCheckpoints.length - 1;
  const kanjiRanks = card.kanji
    .map(character => kanjiCards.get(character))
    .filter(Boolean)
    .map(kanji => cardLevelRank(kanji))
    .filter(rank => rank !== null);
  if (kanjiRanks.length) return Math.max(...kanjiRanks);
  if (card.categories.includes("Everyday")) return 0;
  return cardLevelRank(card) ?? lessonCheckpoints.length - 1;
}

for (const [rank, checkpoint] of lessonCheckpoints.entries()) {
  checkpoint.cards = lessonCards
    .filter(card => checkpointRank(card) === rank)
    .sort((first, second) => (first.type === second.type ? 0 : first.type === "kanji" ? -1 : 1)
      || first.sourceOrder - second.sourceOrder);
}

let profileStore = { version: 1, activeProfileId: "profile-1", nextProfileNumber: 2, profiles: [] };
let progress = { version: 2, cards: {} };
try {
  const savedProfiles = localStorage.getItem(profilesKey);
  if (savedProfiles) {
    const parsedProfiles = JSON.parse(savedProfiles);
    if (parsedProfiles?.version !== 1 || !Array.isArray(parsedProfiles.profiles)
      || !parsedProfiles.profiles.every(profile => typeof profile.id === "string"
        && typeof profile.name === "string" && profile.name.trim()
        && profile.cards && typeof profile.cards === "object")) {
      throw new Error("The saved profiles have an invalid format.");
    }
    profileStore = parsedProfiles;
    if (!profileStore.profiles.some(profile => profile.id === profileStore.activeProfileId)) {
      throw new Error("The active study profile could not be found.");
    }
  } else {
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      if (parsedProgress?.version !== 2 || !parsedProgress.cards || typeof parsedProgress.cards !== "object") {
        throw new Error("The saved study schedule has an invalid format.");
      }
      progress = parsedProgress;
    } else {
      const oldProgress = JSON.parse(localStorage.getItem(previousProgressKey) || "{}");
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      for (const card of lessonCards) {
        if (oldProgress[card.id] !== "known") continue;
        progress.cards[card.id] = {
          lessonComplete: true,
          intervalDays: 1,
          dueDate: formatDateKey(tomorrow),
          reviews: 0,
          lessonAttempts: 1
        };
      }
    }
    profileStore.profiles.push({ id: "profile-1", name: "Steven", cards: progress.cards });
    localStorage.setItem(profilesKey, JSON.stringify(profileStore));
  }
  progress = {
    version: 2,
    cards: profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId).cards
  };
} catch (error) {
  profileStore = { version: 1, activeProfileId: "profile-1", nextProfileNumber: 2, profiles: [
    { id: "profile-1", name: "Steven", cards: {} }
  ] };
  progress = { version: 2, cards: {} };
  showNotice("Saved profiles or study progress could not be read. A new Steven profile will be used; existing browser data was left untouched.");
}
let chosenCategories = new Set([...new Set(cards.flatMap(card => card.categories))]);
let selectedCardId = cards[0]?.id || null;
let currentView = "browse";

function showNotice(message) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
}

function saveProgress() {
  try {
    const activeProfile = profileStore.profiles.find(profile => profile.id === profileStore.activeProfileId);
    if (!activeProfile) throw new Error("The active study profile could not be found.");
    activeProfile.cards = progress.cards;
    localStorage.setItem(profilesKey, JSON.stringify(profileStore));
  } catch (error) {
    showNotice("Study progress could not be saved in this browser. Check its storage settings.");
  }
}

function saveProfiles() {
  try {
    localStorage.setItem(profilesKey, JSON.stringify(profileStore));
    return true;
  } catch (error) {
    showNotice("Profiles could not be saved in this browser. Check its storage settings.");
    return false;
  }
}

function cardProgress(card) {
  return progress.cards[card.id] || null;
}

function lessonComplete(card) {
  return cardProgress(card)?.lessonComplete === true;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return formatDateKey(new Date(year, month - 1, day + days));
}

function todayKey() {
  return formatDateKey(new Date());
}

function prettyDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: year === new Date().getFullYear() ? undefined : "numeric"
  });
}

function reviewEntries() {
  return lessonCards
    .map(card => ({ card, record: cardProgress(card) }))
    .filter(entry => entry.record?.lessonComplete && entry.record.dueDate)
    .sort((first, second) => first.record.dueDate.localeCompare(second.record.dueDate)
      || first.card.term.localeCompare(second.card.term));
}

function dueReviewEntries() {
  const today = todayKey();
  return reviewEntries().filter(entry => entry.record.dueDate <= today);
}

function lessonPrerequisites(card) {
  if (card.type === "kanji") return [];
  return [...new Set(card.kanji)]
    .map(character => kanjiCards.get(character))
    .filter(Boolean);
}

function checkpointComplete(checkpoint) {
  return checkpoint.cards.every(lessonComplete);
}

function currentCheckpoint() {
  return lessonCheckpoints.find(checkpoint => !checkpointComplete(checkpoint)) || null;
}

function nextLessonCard() {
  const checkpoint = currentCheckpoint();
  return checkpoint?.cards.find(card => !lessonComplete(card)
    && lessonPrerequisites(card).every(lessonComplete)) || null;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function addSection(parent, title) {
  const section = element("section", "detail-section");
  section.append(element("h3", "", title));
  parent.append(section);
  return section;
}

function pitchAccentEntries(value) {
  return value.replace(/[.。]\s*$/u, "").split(/\s*;\s*/u).filter(Boolean).map(entry => {
    const unavailable = /^(.+?)\s*:\s*unavailable$/u.exec(entry);
    if (unavailable) return { reading: unavailable[1].trim(), unavailable: true };
    const match = /^(.+?)\s*:\s*(\d+)\s*\[([LH](?:-[LH])*)\]$/u.exec(entry);
    if (!match) return { error: entry };
    const reading = match[1].trim();
    const morae = splitMorae(reading);
    const levels = match[3].split("-");
    if (morae.length !== levels.length) return { error: entry };
    return { reading, accentNumber: Number(match[2]), morae, levels };
  });
}

function addPitchAccent(parent, value) {
  const section = addSection(parent, "Pitch accent");
  section.append(element("p", "muted pitch-help",
    "H is higher and L is lower. The final point shows an example following particle, が."));
  const entries = value ? pitchAccentEntries(value) : [];
  for (const entry of entries) {
    if (entry.error) {
      section.append(element("p", "pitch-unavailable", "Pitch accent data could not be read."));
      continue;
    }
    if (entry.unavailable) {
      section.append(element("p", "pitch-unavailable", `No source data for ${entry.reading}.`));
      continue;
    }
    const item = element("div", "pitch-entry");
    const title = element("div", "pitch-heading");
    title.append(
      element("span", "pitch-reading kana-reading", entry.reading),
      element("span", "pitch-type", entry.accentNumber === 0
        ? "Type 0 · no downstep"
        : `Type ${entry.accentNumber} · downstep after mora ${entry.accentNumber}`)
    );
    item.append(title);

    const particleLevel = entry.accentNumber === 0 ? "H" : "L";
    const levels = [...entry.levels, particleLevel];
    const morae = [...entry.morae, "が"];
    const pointGap = 38;
    const width = (levels.length - 1) * pointGap + 42;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "pitch-contour");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", "86");
    svg.setAttribute("viewBox", `0 0 ${width} 86`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Pitch contour for ${entry.reading}, type ${entry.accentNumber}: ${
      morae.map((mora, index) => `${mora} ${levels[index]}`).join(", ")
    }`);
    const points = levels.map((level, index) =>
      `${21 + index * pointGap},${level === "H" ? 22 : 52}`).join(" ");
    const line = document.createElementNS(svg.namespaceURI, "polyline");
    line.setAttribute("points", points);
    line.setAttribute("class", "pitch-line");
    svg.append(line);
    levels.forEach((level, index) => {
      const x = 21 + index * pointGap;
      const y = level === "H" ? 22 : 52;
      const dot = document.createElementNS(svg.namespaceURI, "circle");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", "4");
      dot.setAttribute("class", "pitch-dot");
      svg.append(dot);
      const pitchLabel = document.createElementNS(svg.namespaceURI, "text");
      pitchLabel.setAttribute("x", String(x));
      pitchLabel.setAttribute("y", String(y - (level === "H" ? 8 : -14)));
      pitchLabel.setAttribute("class", "pitch-level");
      pitchLabel.textContent = level;
      svg.append(pitchLabel);
      const moraLabel = document.createElementNS(svg.namespaceURI, "text");
      moraLabel.setAttribute("x", String(x));
      moraLabel.setAttribute("y", "79");
      moraLabel.setAttribute("class", index === morae.length - 1 ? "pitch-mora pitch-particle" : "pitch-mora");
      moraLabel.textContent = morae[index];
      svg.append(moraLabel);
    });
    item.append(svg);
    section.append(item);
  }
  if (!entries.length) section.append(element("p", "pitch-unavailable", "No source data for this word."));
  const sourceLink = element("a", "pitch-source", "Pitch data: Kanjium");
  sourceLink.href = "https://github.com/mifunetoshiro/kanjium";
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  section.append(sourceLink);
}

function addReadingList(parent, title, readings) {
  const values = readings.split(/[、,]/u).map(value => value.trim()).filter(Boolean);
  if (!values.length) return;
  const section = addSection(parent, title);
  const list = element("div", "reading-list");
  for (const value of values) {
    const chip = element("span", "reading-chip");
    chip.append(element("span", "kana-reading", value), element("span", "reading-romaji", romanized(value)));
    list.append(chip);
  }
  section.append(list);
}

function matchingKanjiReading(word, kanjiCard) {
  const readings = [kanjiCard.readings, kanjiCard.onReadings]
    .flatMap(value => value.split(/[、,]/u))
    .map(value => value.trim())
    .filter(Boolean);
  const wordReadings = word.reading.split(/[、,]/u).map(value => value.replace(/\s*\(.*?\)/gu, "").trim()).filter(Boolean);
  for (const reading of wordReadings) {
    for (const candidate of readings) {
      if (normalizeKana(candidate.replace(/[.-]/gu, "")) !== normalizeKana(reading.replace(/[.-]/gu, ""))) continue;
      const readingPart = candidate.includes(".") ? candidate.slice(0, candidate.indexOf(".")) : candidate.replace(/^-|-$/gu, "");
      return { reading: readingPart || candidate, kind: kanjiCard.readings.includes(candidate) ? "Kun'yomi" : "On'yomi" };
    }
  }
  return null;
}

function relatedKanji(word) {
  return word.kanji.map(character => kanjiCards.get(character)).filter(Boolean);
}

function relatedWords(kanjiCard) {
  return cards.filter(card => card.type === "word" && card.term.includes(kanjiCard.term));
}

function categoryLabel(card) {
  return card.categories.map(category => categories.get(category) || category).join(" · ");
}

function addRelatedButtons(parent, related, extraText) {
  const list = element("div", "related-list");
  for (const card of related) {
    const button = element("a", "related-button");
    button.href = cardUrl(card);
    button.append(element("span", "", card.term));
    const description = [card.reading || card.readings || card.onReadings, card.meaning].filter(Boolean).join(" · ");
    if (description) button.append(element("small", "", description));
    if (extraText) button.append(element("small", "", extraText(card)));
    list.append(button);
  }
  parent.append(list);
}

function renderDetail(card, parent) {
  parent.replaceChildren();
  if (!card) {
    parent.append(element("p", "empty-state", "Choose a card to see its details."));
    return;
  }
  const header = element("div", "detail-top");
  const badges = element("div", "detail-badges");
  badges.append(element("span", "badge", card.type === "kanji" ? "Kanji" : card.isVerb ? "Verb" : "Word"));
  badges.append(element("span", "badge", categoryLabel(card)));
  if (card.subcategory && card.type !== "kanji") badges.append(element("span", "badge", card.subcategory));
  header.append(badges);
  parent.append(header);
  parent.append(element("h2", "detail-title", card.term));
  if (card.type === "kanji") {
    addReadingList(parent, "On'yomi · 音読み", card.onReadings);
    addReadingList(parent, "Kun'yomi · 訓読み", card.readings);
  } else if (card.reading) {
    const reading = addSection(parent, "Reading");
    reading.append(element("p", "meaning japanese-reading kana-reading", card.reading), element("p", "detail-romaji", romanized(card.reading)));
  }
  if (card.type === "word" && card.categories.some(category => jlptLevels.includes(category))) {
    addPitchAccent(parent, card.pitchAccent);
  }
  if (card.meaning) addSection(parent, "Meaning").append(element("p", "meaning", card.meaning));
  if (card.usage) addSection(parent, "Usage").append(element("p", "meaning", card.usage));
  if (card.example) addSection(parent, "Example").append(element("p", "meaning", card.example));
  if (card.sourceUrl) {
    const section = addSection(parent, "Reference");
    const link = element("a", "text-button", "Kanshudo detail");
    link.href = card.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    section.append(link);
  }
  if (card.type === "kanji") {
    const words = relatedWords(card);
    const section = addSection(parent, `Words containing ${card.term} · ${words.length}`);
    if (words.length) addRelatedButtons(section, words);
    else section.append(element("p", "muted", "No linked words in this deck."));
  } else {
    const linked = relatedKanji(card);
    if (linked.length) {
      const section = addSection(parent, "Kanji in this word");
      const list = element("div", "related-list");
      for (const linkedCard of linked) {
        const button = element("a", "related-button");
        button.href = cardUrl(linkedCard);
        button.append(element("span", "", linkedCard.term), element("small", "", linkedCard.meaning));
        const specific = matchingKanjiReading(card, linkedCard);
        if (specific) {
          button.append(element("small", "",
            `${specific.kind} in this word: ${specific.reading} · ${romanized(specific.reading)}`));
        }
        list.append(button);
      }
      section.append(list);
    }
  }
  if (card.isVerb) {
    const entries = Object.entries(card.conjugations);
    const section = addSection(parent, `Conjugations · ${card.fields["Verb class"] || card.subcategory}`);
    const grid = element("div", "conjugation-grid");
    for (const [label, value] of entries) {
      const item = element("div", "conjugation");
      item.append(element("b", "", label), element("span", "", value));
      grid.append(item);
    }
    section.append(grid);
  }
}

function searchText(card) {
  const readings = [card.reading, card.readings, card.onReadings].filter(Boolean).join(" ");
  const romanizedFields = [card.reading, card.readings, card.onReadings].filter(Boolean).map(romanized).join(" ");
  return `${card.term} ${card.meaning} ${readings} ${romanizedFields} ${categoryLabel(card)} ${card.subcategory}`.toLowerCase();
}

function normalizeSearch(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase();
}

function visibleCards() {
  const query = normalizeSearch(document.getElementById("search").value.trim());
  const type = document.getElementById("type-filter").value;
  return cards.filter(card => {
    if (!card.categories.some(category => chosenCategories.has(category))) return false;
    if (type === "kanji" && card.type !== "kanji") return false;
    if (type === "word" && card.type !== "word") return false;
    if (type === "verb" && !card.isVerb) return false;
    return !query || normalizeSearch(searchText(card)).includes(query);
  });
}

function renderCategories() {
  const root = document.getElementById("categories");
  root.replaceChildren();
  categoryCounts.clear();
  for (const card of cards) {
    for (const category of card.categories) categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }
  const order = ["N5", "N4", "N3", "N2", "N1", "Verbs", "Everyday"];
  for (const category of order.filter(value => categoryCounts.has(value))) {
    const button = element("button", `category-button${chosenCategories.has(category) ? " active" : ""}`);
    button.type = "button";
    button.setAttribute("aria-pressed", String(chosenCategories.has(category)));
    button.append(document.createTextNode(categories.get(category) || category));
    button.append(element("span", "", String(categoryCounts.get(category))));
    button.addEventListener("click", () => {
      if (chosenCategories.has(category)) chosenCategories.delete(category);
      else chosenCategories.add(category);
      renderCategories();
      renderBrowse();
    });
    root.append(button);
  }
  document.getElementById("toggle-categories").textContent =
    chosenCategories.size === categoryCounts.size ? "Clear all" : "Select all";
}

function cardUrl(card) {
  return `#card/${card.type}/${encodeURIComponent(card.term)}`;
}

function navigateToRoute(hash, replace = false) {
  if (location.hash === hash) {
    applyRoute();
  } else if (replace) {
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
    applyRoute();
  } else {
    location.hash = hash;
  }
}

function renderBrowse(preserveSelected = false) {
  const filtered = visibleCards();
  const list = document.getElementById("card-list");
  list.replaceChildren();
  document.getElementById("result-count").textContent = `${filtered.length} cards`;
  if (!preserveSelected && !filtered.some(card => card.id === selectedCardId)) selectedCardId = filtered[0]?.id || null;
  if (!filtered.length) list.append(element("p", "empty-state", "No cards match these filters."));
  for (const card of filtered) {
    const button = element("a", `result-card${card.id === selectedCardId ? " selected" : ""}`);
    button.href = cardUrl(card);
    if (card.id === selectedCardId) button.setAttribute("aria-current", "page");
    const summary = element("span");
    summary.append(element("span", "japanese", card.term));
    summary.append(element("span", "result-meaning", card.reading ? `${card.reading} · ${card.meaning}` : card.meaning));
    const meta = card.isVerb ? "Verb" : card.categories.map(category => category === "Verbs" ? "Verb" : category).join(" · ");
    button.append(summary, element("span", "result-meta", meta));
    list.append(button);
  }
  renderDetail(cards.find(card => card.id === selectedCardId), document.getElementById("card-detail"));
}

function renderGuide() {
  const root = document.getElementById("guide-content");
  root.replaceChildren();
  for (const entry of parsed.guide) {
    const section = element("section", "guide-entry");
    section.append(element("h3", "", entry.title), element("p", "", entry.text));
    root.append(section);
  }
  if (!parsed.guide.length) root.append(element("p", "muted", "No conjugation patterns are included in the source."));
}

document.getElementById("deck-summary").textContent = `${cards.length.toLocaleString()} cards · JLPT N5–N1`;
document.getElementById("deck-count").textContent =
  `${cards.filter(card => card.type === "kanji").length.toLocaleString()} kanji · ${cards.filter(card => card.type === "word").length.toLocaleString()} words`;
document.getElementById("search").addEventListener("input", () => {
  renderBrowse();
});
document.getElementById("type-filter").addEventListener("change", () => {
  renderBrowse();
});
document.getElementById("toggle-categories").addEventListener("click", () => {
  chosenCategories = chosenCategories.size === categoryCounts.size
    ? new Set() : new Set(categoryCounts.keys());
  renderCategories();
  renderBrowse();
});
for (const button of document.querySelectorAll(".nav-button")) {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    const hash = view === "browse" && selectedCardId
      ? cardUrl(cards.find(card => card.id === selectedCardId))
      : `#${view}`;
    navigateToRoute(hash);
  });
}
window.addEventListener("hashchange", applyRoute);

renderCategories();
renderBrowse();
renderGuide();
