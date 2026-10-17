# Card model and content

## Canonical source

`terms-to-know.md` is the source of truth. The app parses the Markdown at build time and embeds it as data in `app.html`; generated HTML must not be edited directly.

Cards use level-two headings for top-level groups and deeper headings for categories:

- `## JLPT N5` through `## JLPT N1` group level-specific material.
- A `### Kanji` subsection identifies kanji cards.
- Other JLPT subsections identify vocabulary cards.
- `## Everyday Japanese (Kana Included)` contains Everyday vocabulary.
- `## Verbs and Conjugations` contains verb cards and the conjugation guide.

Card entries use the bold term followed by labeled fields, such as `Reading`, `Meaning`, `On'yomi`, `Kun'yomi`, `Example`, and `Usage`. N5 vocabulary may include a `Pitch accent` field with one entry per reading, formatted as `reading: type [L-H-L]`; entries without a verified pitch record use `reading: unavailable`. Verb entries may also include labeled conjugation forms.

## Runtime card shape

Each parsed card includes its term, type, categories, source order, source fields, readings, meaning, and Japanese characters appearing in its term. Kanji cards contain on'yomi and kun'yomi data. Word cards may include verb status and conjugations.

Repeated word terms from multiple categories are merged into one card while retaining all category memberships and unique meanings/readings. Stable card identifiers are `kanji:<term>` and `word:<term>`.

## Relationships and readings

- A kanji card links to word cards whose terms contain that kanji.
- A word card links to deck kanji cards found in its term.
- The app compares supplied word readings with the kanji card's supplied readings to identify a specific on'yomi or kun'yomi where an exact normalized match exists.
- Romaji is rendered from the supplied kana using the app's Hepburn-style transliterator. It does not replace or modify source readings.
- N5 word-card pitch contours use the supplied L/H sequence for each mora and display the following-particle pitch to make final-mora downsteps visible. The type and sequence come from the Kanjium entry; missing records remain unavailable.
- The source markup may mark an explicitly linked kanji on a vocabulary term. Other kanji relationships are derived from the word text.

## Attribution

The source data and font attributions are listed in [SOURCES.md](../SOURCES.md). Preserve the dataset and font license notices when changing bundled data or fonts.
