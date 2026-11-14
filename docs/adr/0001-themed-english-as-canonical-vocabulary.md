# Themed English is the canonical vocabulary, in code as well as the UI

Varða models training as a journey: stones are placed one at a time on the way to a destination. We use the themed English words (Stone, Stage, Rest stop, Journal, Destination, Milestone, Cairn) as the canonical domain terms everywhere: in the glossaries, the code, the database and the English UI. Icelandic (steinn, áfangi, áning, dagbók, markið, vörður) is purely a UI translation. One vocabulary means there is nothing to translate between what the athlete sees and what the code says, so the two can't drift apart.

## Considered Options

- **Plain English in code, themed words only in the UI** (`Activity` in code, "Stone" on screen). Easier for outsiders to read, but two vocabularies would have to be kept in sync forever.
- **Icelandic as canonical.** Rejected: the accents don't survive in identifiers, and the English UI would then be the translation.

## Consequences

- A stone is never called an "activity" in code, even though Garmin and most libraries use that word. Map at the integration boundary.
- "Workout" always means something planned, never something already done.
- Themed words are only used where they are clearly part of the theme and remain clear ("Place a stone"). Buttons and actions stay readable to someone who doesn't know the theme, and themed nouns get a plain subtitle the first time they appear.
