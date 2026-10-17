# Study, checkpoints, and profiles

## Checkpoint assignment

The lesson queue is divided into six sequential checkpoints:

1. **N5 Foundations** — N5 kanji, words whose kanji prerequisites are N5, and kana-only Everyday vocabulary.
2. **N4** — N4 kanji and words assigned to N4.
3. **N3** — N3 kanji and words assigned to N3.
4. **N2** — N2 kanji and words assigned to N2.
5. **N1** — N1 kanji and words assigned to N1.
6. **Additional vocabulary** — cards without a JLPT assignment or JLPT kanji prerequisite.

A kanji card belongs to its JLPT category. For a word containing deck kanji, its checkpoint is the highest-level prerequisite among those characters (the greatest JLPT rank from N5 to N1). A word cannot be learned until all linked kanji cards have completed their lessons. A kana-only Everyday word belongs to N5 Foundations. Other kana-only words follow their JLPT category or belong to Additional vocabulary when no level is assigned.

Within the active checkpoint, kanji cards are offered before words. A correct lesson answer records completion and creates a one-day review. An incorrect answer records an attempt but leaves the card available in its lesson queue.

The checkpoint progress bar and counts describe the active checkpoint. An overall completed-card count is also shown. The next checkpoint unlocks only when every card in the current checkpoint is complete.

## Review schedule

Each learned card has an interval in whole days, a local date key (`YYYY-MM-DD`), review count, and lesson attempt count. The initial interval is one day and the first due date is the next local calendar day.

- A correct review doubles the current interval and schedules the next due date from today.
- An incorrect review sets the interval to `max(1, floor(current interval / 4))` days and schedules the next due date from today.
- Overdue cards count as due today.
- The review view lists due cards and groups upcoming cards by due date.
- Each review response records its date, result, and resulting interval in the active profile's history.

## Profiles and persistence

Profiles are local to the browser and have a name, internal ID, and independent map of card progress. The initial profile is named Steven. Names must be non-empty and unique without regard to letter case. The profile menu lists every profile as a button, highlights the selected profile, and puts an add button after the names. Selecting a name switches profiles. Selecting add inserts a name field immediately above the add button. Leaving the field saves a non-empty name and selects the new profile; Enter also saves. An adjacent X cancels profile creation. The interface does not delete profiles.

The `japanese-study-profiles-v1` local-storage value has this shape:

```json
{
  "version": 1,
  "activeProfileId": "profile-1",
  "nextProfileNumber": 2,
  "profiles": [
    {
      "id": "profile-1",
      "name": "Steven",
      "cards": {
        "kanji:人": {
          "lessonComplete": true,
          "intervalDays": 1,
          "dueDate": "2026-10-17",
          "reviews": 0,
          "lessonAttempts": 1
        }
      },
      "history": [
        {
          "cardId": "kanji:人",
          "type": "lesson",
          "date": "2026-10-16",
          "timestamp": "2026-10-16T12:00:00.000Z"
        },
        {
          "cardId": "kanji:人",
          "type": "review",
          "date": "2026-10-17",
          "timestamp": "2026-10-17T12:00:00.000Z",
          "result": "correct",
          "intervalDays": 2,
          "dueDate": "2026-10-19"
        }
      ]
    }
  ]
}
```

The Progress tab lists completed lessons and review events for the active profile. Existing profiles without history show their completed cards, review totals, and any available latest-review date/result; historical event dates that were not stored cannot be reconstructed.

Export downloads a JSON backup with format `japanese-study-progress`, version `1`, the profile name for reference, that profile's card schedule map, and its study history. Import validates this data and asks for confirmation before replacing the active profile's cards and history. It never replaces a profile name or changes another profile. Card data and history are preserved in the backup even if an entry no longer exists in the currently loaded deck.

Google Drive sync is a manual, all-profile operation. It stores the profile collection as JSON in Drive's hidden `appDataFolder`, authorized with the `drive.appdata` scope. The first sync uploads local profiles if no cloud backup exists. Matching profile data requires no changes; a difference in active-profile selection alone is ignored. If profile data differs, the user chooses whether to replace Drive with this device's profiles or replace this device's profiles with Drive's copy; canceling both prompts leaves both copies untouched. Sync does not merge edits. When downloading, the current local profile remains active if it exists in the Drive copy; otherwise the Drive copy's active profile is selected. A Google OAuth web client ID must be configured for the hosted origin. Access tokens are requested only after the user selects Sync and are kept in memory, not local storage.

Reset progress clears lesson, review schedule, and history records for the active profile only; profiles and other profiles' records remain intact. If local storage cannot be read or written, the app presents a notice.
