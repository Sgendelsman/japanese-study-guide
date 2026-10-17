# Japanese Deck Sources

- The JLPT levels, character selection, and frequency order follow Kanshudo's estimated lists: https://www.kanshudo.com/collections/jlpt_kanji. Kanshudo notes that these are its own assessments, not official JLPT lists.
- Kanji readings and English meanings are derived from KANJIDIC2 through the kanjiapi.dev public data download: https://kanjiapi.dev/. KANJIDIC2 is maintained by the Electronic Dictionary Research and Development Group (EDRDG).
- Per-kanji vocabulary entries and English glosses are derived from JMdict records in the kanjiapi.dev data bundle. One vocabulary example is associated with each kanji; entries marked "additional" may be uncommon.
- KANJIDIC2 and JMdict data are distributed under the Creative Commons Attribution-ShareAlike 4.0 International License. EDRDG license and attribution details: https://www.edrdg.org/edrdg/licence.html.
- The kana-only everyday words and verb conjugation examples are study material prepared for this deck.
- The standalone browser app is generated from `terms-to-know.md` with `build-app.ps1`; its romaji is generated from the supplied kana readings using Hepburn-style transliteration. A word's kanji-specific reading is shown only when it can be matched directly to a source reading; otherwise the app identifies it as unspecified.
- The app bundles the Noto Sans JP glyph subsets needed for the deck's kana readings from Google Fonts, so the font works offline. Noto Sans JP is distributed under the SIL Open Font License 1.1; see `fonts/OFL.txt`.
- Card links use `#card/kanji/<character>` or `#card/word/<word>` routes; Study and the conjugation guide use `#study` and `#guide`. Related cards are real links, so they can be bookmarked or shared.
- Lesson and spaced-review progress is saved per profile in the browser's `japanese-study-profiles-v1` local-storage entry. Profiles are local names only; switching profiles switches the lesson and review schedule, and resetting progress affects only the active profile.
- Lessons are grouped into six checkpoints: N5 Foundations (N5 kanji, words using N5 kanji, and Everyday basics), N4, N3, N2, N1, and Additional vocabulary. Words with kanji are placed at the highest JLPT level of their linked kanji, so they cannot reach a checkpoint before those kanji; kana-only words use their source category. A checkpoint must be completed before the next one begins. Correct lesson answers enter review due the next day; review intervals double on correct answers and quarter on missed answers, with a one-day minimum.

To build the standalone app, run this from the workspace root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "decks\japanese-kanji\build-app.ps1"
```

Then open `decks\japanese-kanji\app.html`. It is a self-contained offline page; progress is stored in the current browser.
