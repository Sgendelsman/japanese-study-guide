# Product specification

## Purpose

Japanese Study Guide is a standalone, offline-capable browser app for learning Japanese kanji, vocabulary, and verb conjugations. It combines browsable reference cards with ordered lessons and scheduled reviews.

## Users and data

- The app runs locally in a browser and requires no account or network connection for its core features.
- People can create named local profiles and switch between them.
- Each profile has separate lesson and review progress. Profile data is stored in that browser's local storage.
- The app starts with a profile named Steven when no profile data exists.

## Card requirements

- A card is a kanji card or a word card.
- Kanji cards show available on'yomi and kun'yomi, readings in romaji, meanings, and links to deck words containing the character.
- Word cards show supplied readings and meanings, readings in romaji, links to kanji in the word, and a kanji-specific reading when the source allows it to be matched.
- JLPT word cards show sourced pitch-accent types and a mora-by-mora high/low contour when available. Missing readings are identified without inferring an accent.
- Verb cards include the supplied conjugation forms.
- Cards can be browsed, searched, filtered by JLPT/category and card type, and opened by stable URL fragment links. Linked cards are navigable.

## Learning and review

- Lessons proceed through six checkpoints: N5 Foundations, N4, N3, N2, N1, and Additional vocabulary.
- N5 Foundations combines N5 kanji, words assigned to N5 by their kanji prerequisites, and kana-only Everyday Japanese cards.
- A kanji-containing word is assigned to the highest JLPT level of its linked kanji. It is not available until every linked kanji lesson is complete.
- A checkpoint is complete when every card assigned to it has been answered correctly. The next checkpoint remains locked until then.
- A correct lesson answer marks the card learned and schedules its first review for the next day. An incorrect answer leaves it in the lesson queue.
- Reviews show due cards and a day-by-day schedule. A correct review doubles the interval; an incorrect review reduces it to one quarter, rounded down, with a one-day minimum.
- Dates use the browser's local calendar day. Review schedules and lesson progress persist across page reloads for the active profile.
- Users can reset only the active profile's study progress.

## Interface

- The app has Browse, Study, and Conjugation Guide views.
- Study has Lessons and Reviews sections.
- The profile control in the header opens a compact list of selectable profiles with a trailing add button. The selected profile is visibly highlighted. Adding opens an inline name field above the add button; leaving the field saves a non-empty name, and an adjacent cancel button abandons profile creation. Profiles cannot be deleted in the UI.
- Card and view routes use URL fragments and support browser navigation.
- The app is hosted on GitHub Pages from the repository's `main` branch and remains usable as a standalone offline HTML file.

## Acceptance criteria

- The generated `app.html` works without external requests and contains the deck, fonts, styles, and runtime.
- A word never becomes an available lesson before all of its linked kanji lessons are complete.
- Completing a checkpoint unlocks the next checkpoint without changing completed cards or review schedules.
- Switching profiles loads the selected profile's own progress; saving or resetting it does not alter another profile.
- A rebuild after changing source Markdown produces a functional app with the same features and updated deck data.
- A push to `main` publishes the rebuilt app at the repository's GitHub Pages URL.
