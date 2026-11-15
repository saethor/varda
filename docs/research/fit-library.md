# Which library should read FIT files in TypeScript?

Research for [#36](https://github.com/saethor/varda/issues/36), part of map [#35](https://github.com/saethor/varda/issues/35) (Place a stone from a watch file). Checked on 2026-11-15.

## Answer

Use **Garmin's official FIT JavaScript SDK, `@garmin/fitsdk`**, for both reading uploads and writing test FIT files. Read uploads with `checkIntegrity()` and turn the file away unless it passes. The SDK has generated TypeScript types for the whole FIT profile, it ships with each Garmin profile release, it is native ESM, it reads `file_id.type`, sessions, laps and `activity.numSessions` directly, and its `Encoder` writes valid FIT files from the same camelCase message objects the decoder returns, so test files can be built in code with no real GPS tracks. The catch is that its licence is Garmin's own FIT licence, not an open-source licence (see [Licence](#licence)). That is fine for depending on it from npm, but the SDK source must not be vendored into this public repo.

`fit-file-parser` is the runner-up. It is well maintained, MIT licensed and catches broken files properly once `force: false` is set, but its typed output is looser, its FIT profile is maintained by the community rather than Garmin, and its encoder only writes raw field numbers and bytes, so building test files with it is much more work.

## Candidates

| | `@garmin/fitsdk` | `fit-file-parser` | Others |
|---|---|---|---|
| Version checked | 21.221.0 (2026-11-03) | 6.2.9 (2026-11-14) | |
| Repo | [garmin/fit-javascript-sdk](https://github.com/garmin/fit-javascript-sdk) | [jimmykane/fit-parser](https://github.com/jimmykane/fit-parser) | |
| Downloads, week of 2026-11-08 | 114,033 | 59,397 | |
| Licence | Garmin FIT Protocol License | MIT | |

Other packages, ruled out early:

- `@markw65/fit-file-writer` 0.2.0 (MIT): writer only, 2,178 downloads a week ([npm](https://www.npmjs.com/package/@markw65/fit-file-writer)). We need a reader.
- `easy-fit` 0.0.8 and `fit-decoder` 1.0.5: last published in 2022 (`npm view`). Not maintained.
- `backfit/backfit`: last push December 2022 (GitHub API). Not maintained.
- `@sports-alliance/sports-lib`: a whole activity model built on top of `fit-file-parser`, with a custom licence. Far more than we need.

## Comparison

### Maintenance

- **`@garmin/fitsdk`**: published by Garmin, generated from the FIT profile ("This file is auto-generated! … Profile Version = 21.221.0", `src/index.d.ts`). A new version comes out with each profile release, about every two to six weeks: 21.208 (June), 21.212, 21.213, 21.214 (August), 21.217 (September), 21.218 (October), 21.221 (2026-11-03) (`npm view @garmin/fitsdk time`). GitHub issues are switched off on the repo (`has_issues: false`, GitHub API). Support goes through the [FIT SDK developer forum](https://forums.garmin.com/developer/) (package README).
- **`fit-file-parser`**: active community project, around since 2015 (the LICENSE copyright is Pierre Jacquier 2015; the current maintainer is Dimitrios Kanellopoulos). 56 commits since 2026-08-01, latest release 2026-11-14, with a detailed CHANGELOG. 6.2.8 fixed a prototype-pollution hole reachable through crafted developer-field metadata (GHSA-gjg8-qvmp-pvp2, CHANGELOG). Good to know that's fixed. It also shows that a parser handling uploaded files is attack surface. The library's FIT profile is "community-maintained" (`src/profile.ts`, see README "Profile-backed output"), not generated from Garmin's: "127 messages, 1,462 fields" (README "Profile coverage").

### Licence

- **`@garmin/fitsdk`**: `"license": "SEE LICENSE IN LICENSE.txt"`. The [FIT Protocol License Agreement](https://github.com/garmin/fit-javascript-sdk/blob/main/LICENSE.txt) grants a "non-exclusive, royalty-free, non-transferable, non-sublicensable, limited license to use the Licensed Technology for Licensee's internal business purposes, including to use the FIT protocol in any software created by Licensee" (§1). The restrictions that matter to us:
  - No redistributing or publishing the SDK itself (§2c), and no putting it under a licence that forces source disclosure (§2d). So depend on it from npm and never copy its source into this public repo.
  - Implementations must follow the FIT protocol (§2h, §3).
  - A §2f clause forbids "benchmarking or a competitive analysis of the Licensed Technology". This note only checks whether the SDK fits Varda's needs. It doesn't publish a benchmark.
  - It isn't an OSI licence, so check it if Varda's own licence or distribution model changes. (This is a reading of the text, not legal advice.)
- **`fit-file-parser`**: MIT (LICENSE file, `package.json`). No conditions.

### TypeScript types

- **`@garmin/fitsdk`** ships hand-written `.d.ts` files next to plain ESM JavaScript (`"type": "module"`, `"types": "src/index.d.ts"`). There are typed interfaces for every message (`FileIdMesg`, `SessionMesg`, `LapMesg`, `ActivityMesg` …, about 3,000 lines in `src/types/mesgs.d.ts`) and string-literal unions for enums (`Types.File = number | "device" | "settings" | "sport" | "activity" | "workout" | "course" | …`, `Types.Sport` the same way). `Decoder.read()` returns `{ messages: FitMessages; profileVersion; errors: Error[] }`, where `FitMessages` has `fileIdMesgs?`, `sessionMesgs?`, `lapMesgs?`, `activityMesgs?` and so on. Every enum union also includes `number`, for values the profile doesn't know, so code has to deal with the number case.
- **`fit-file-parser`** has two sets of types. The exported `ParsedFit` (from `dist/fit_types.d.ts`) has generated snake_case interfaces such as `ParsedSession { sport?: Sport; start_time?: Date; total_timer_time?: number … }`. The older `dist/types.d.ts` uses `[key: string]: any`. The README warns that some `ParsedFit` root properties have "legacy required annotations" but "can be absent at runtime". Usable, but looser.

### Reading sessions and laps

Both work. I checked this by encoding an activity with the Garmin encoder (FILE_ID, RECORD, LAP, SESSION, ACTIVITY) and decoding it with both libraries on Node 24.10.0. Both returned one `running` session, two laps, and the right `startTime`/`start_time` as a `Date`.

- Garmin: `messages.sessionMesgs`, `messages.lapMesgs`. Fields are camelCase with scale and offset applied, enums become strings and timestamps become `Date` by default (README "Read Method" options).
- `fit-file-parser`: `data.sessions`, `data.laps`, or, with `mode: 'cascade'`, sessions that contain their own laps (README "Output modes").

To link laps to their session, Garmin's cookbook says: "the Session message provides the First Lap Index and Lap Count properties that can be used to find all the Lap messages", but "Not all manufacturers provide" them. If they're missing, match laps to a session by timestamp ([Decoding FIT Activity Files](https://developer.garmin.com/fit/articles/cookbook/decoding_activity_files.html)). For Record this only matters if multisport is ever allowed. With one session, every lap belongs to it.

### Recognising the file type

Garmin's cookbook: "A more reliable way to determine the file type is to check the Type field found in the File Id message". Its sample refuses to read the file if the type isn't `Activity` ([Decoding FIT Activity Files](https://developer.garmin.com/fit/articles/cookbook/decoding_activity_files.html)). Both libraries expose the field:

- Garmin: `messages.fileIdMesgs[0].type`, which is `"activity"`, `"course"`, `"workout"`, `"settings"` and so on.
- `fit-file-parser`: `data.file_ids[0].type`, same strings.

In the experiment both reported `activity` for the activity file and `course` for a file encoded with `type: "course"`. An activity file must contain File Id, Activity, Session, Lap and Record messages ([Encoding FIT Activity Files](https://developer.garmin.com/fit/articles/cookbook/encoding_activity_files.html)). So "not a session" can be defined as `type !== "activity"`, or no session message.

### Spotting multisport

"An Activity file may contain one or more Session messages … the file may contain a session representing each leg of the event and the transitions" ([Decoding FIT Activity Files](https://developer.garmin.com/fit/articles/cookbook/decoding_activity_files.html)). Neither library has a flag for multisport. You check it yourself the same way in both: more than one session message (or `activity.numSessions > 1`), or a session whose sport is `transition`. `Types.Sport` also has a `multisport` value. In the experiment a swim/transition/bike/transition/run file decoded in both libraries as five sessions `swimming,transition,cycling,transition,running`, and Garmin's decoder reported `numSessions = 5`.

### Broken files

I tested a file cut to 60% of its length, a file with one flipped byte in the data, and plain text:

| Input | `@garmin/fitsdk` `read()` | `checkIntegrity()` | `fit-file-parser` default (`force: true`) | `fit-file-parser` `{ force: false }` |
|---|---|---|---|---|
| Truncated | No throw. `errors: ["FIT Runtime Error end of stream at byte 156"]`, partial messages (1 lap, no session) | `false` | throws "File data exceeds input length" | throws the same |
| Bit flip | No throw. `errors: ["FIT Runtime Error at byte 61"]`, no session | `false` | **Parses with no error**, returns a session | throws "File CRC mismatch" |
| Text | `errors: ["… input is not a FIT file"]` | `false` | throws "Incorrect header size" | throws the same |

- Garmin's `read()` never throws. It "caught by the Read method and added to the array of errors" and returns whatever it had decoded before the error (package README "Read Method"). `checkIntegrity()` checks the `.FIT` signature, that the size equals header + data + CRC, and the CRC (README "Check Integrity Method"). For Record: refuse the file if `!checkIntegrity()`, or if `errors.length > 0`, so a partial file is never kept.
- Garmin's JS decoder throws (into `errors`) on compressed-timestamp record headers: "compressed timestamp messages are not currently supported" (`src/decoder.js`). The FIT protocol allows these headers to save space. Garmin watch activity files normally use normal headers, but one real Forerunner 255 file should be decoded once to confirm. `fit-file-parser` does support compressed timestamps (README).
- `fit-file-parser` **defaults to `force: true`, which skips the CRC check** ("The example enables CRC checks; the library default `force: true` skips them", README). With that default, the corrupted file was accepted. Anyone using it must pass `{ force: false, strict: true }`.

### Writing FIT files (test files)

- **`@garmin/fitsdk`** has an `Encoder` with `onMesg(mesgNum, mesg)`, `writeMesg({ mesgNum, … })` and `close(): Uint8Array` (`src/types/encoder.d.ts`). "The message data should match the format returned by the Decoder. Field names should be camelCase" (README "Encoder"). It handles definitions, scale and offset, enum strings and `Date` timestamps, and writes the header CRC and file CRC. In the experiment a ~20-line builder made activity, course and multisport files that passed `checkIntegrity()` and that `fit-file-parser` also read correctly. That covers the map's open question on test FIT files: build them in code, and commit no real GPS tracks.
- **`fit-file-parser`** has `FitEncoder` (`fit-file-parser/encoder`). It is "profile-agnostic: callers provide profile message and field numbers, base types, sizes, and values in their raw FIT representation. Applying FIT scales and offsets is the caller's responsibility" (README "Encoding"). 6.2.7 (2026-10-30) fixed it writing a wrong protocol header byte by default (CHANGELOG). It works, but every test file would need field numbers, sizes and scales coded by hand.

## Recommendation

Use `@garmin/fitsdk` in `packages/record`, behind the adapter that reads uploads, so the rest of Record never sees FIT message shapes:

1. Refuse the file if `Decoder.isFIT` or `checkIntegrity()` fails, or if `read()` returns `errors`.
2. Refuse it if `fileIdMesgs[0].type !== "activity"` or there are no `sessionMesgs`.
3. Refuse it as multisport if `sessionMesgs.length > 1` or a session's sport is `"transition"`/`"multisport"`.
4. Map the single session and its `lapMesgs` to the stone summary and its laps.

Build test FIT files in code with the SDK's `Encoder`, in a small fixture builder shared by the adapter tests and the Playwright flow. Pin the version exactly (the repo already pins dependencies) and only add it as an npm dependency, never copied in. Decode one real Forerunner 255 file locally (without committing it) to confirm it has no compressed-timestamp headers.
