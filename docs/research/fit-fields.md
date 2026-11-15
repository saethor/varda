# Which FIT fields a stone is read from

Research for [#37](https://github.com/saethor/varda/issues/37), part of map [#35](https://github.com/saethor/varda/issues/35) (Place a stone from a watch file). Researched 2026-11-15.

The question: which FIT messages and fields should a stone be read from, checked against what a Garmin Forerunner 255 records? It covers session identity, the local date, the sport, the summary and laps, and the file type.

## Short answer

| Stone needs | Read from | Fallback |
| --- | --- | --- |
| File is a recording we accept | `file_id.type == 4` (activity) | none: turn the file away |
| Same session uploaded twice | `file_id.manufacturer` + `file_id.serial_number` + `file_id.time_created` | if `serial_number` is missing (0): `manufacturer` + `product` + `session.start_time` |
| Start | `session.start_time` (UTC) | none: a file with no session is turned away as broken |
| Local date | date of `session.start_time + (activity.local_timestamp − activity.timestamp)` | timezone looked up from the first GPS `record` position, then the athlete's own timezone |
| Sport | `session.sport` + `session.sub_sport` through the table below | unknown → cross-training "other" |
| Distance | `session.total_distance` (metres) | none (absent for strength: store as no distance) |
| Moving time | `session.total_timer_time` (excludes pauses) | none (required field) |
| Elapsed time | `session.total_elapsed_time` (includes pauses) | none (required field) |
| Laps | `lap` messages `[first_lap_index, first_lap_index + num_laps)` | laps whose time falls inside the session |
| Multisport | more than one `session`, or `activity.num_sessions > 1`, or a session sport of `multisport`/`transition` | turn the file away |

Details, sources and caveats follow.

## Sources

Primary sources used (all fetched 2026-11-15):

- **[Activity File]** Garmin FIT SDK, "Activity File": <https://developer.garmin.com/fit/file-types/activity/>
- **[File Types]** Garmin FIT SDK, "FIT File Types" (File Id message table): <https://developer.garmin.com/fit/file-types/>
- **[Decoding]** Garmin FIT SDK Cookbook, "Decoding Activity Files": <https://developer.garmin.com/fit/cookbook/decoding-activity-files/>
- **[Durations]** Garmin FIT SDK Cookbook, "Elapsed, Timer, and Moving Durations": <https://developer.garmin.com/fit/cookbook/durations/>
- **[Datetime]** Garmin FIT SDK Cookbook, "Working with Date Time Values": <https://developer.garmin.com/fit/cookbook/datetime/>
- **[Protocol]** Garmin FIT SDK, "FIT Protocol": <https://developer.garmin.com/fit/protocol/>
- **[Profile]** The FIT Profile as shipped in Garmin's official JavaScript SDK, `src/profile.js`, profile version 21.221.0: <https://github.com/garmin/fit-javascript-sdk/blob/main/src/profile.js>. This is generated from `Profile.xlsx` and carries the same message, field and enum definitions and comments.
- **[FR255 manual]** Garmin, *Forerunner 255 Series Owner's Manual* (EN-US PDF): <https://www8.garmin.com/manuals/webhelp/GUID-676967A0-1B23-4384-9BC9-76F3D643F1C8/EN-US/Forerunner_255_OM_EN-US.pdf>

No real Forerunner 255 file was decoded for this note. Where a claim is about what the FR255 *writes* (rather than what the FIT spec says), it is marked **verify with a real file**.

## 1. File type: activity, not activity, multisport

**Activity vs not.** Check `file_id.type`. The File Id message "is required by all FIT file types and is expected to be the first message in the file. For Activity files, the Type property should be set to 4" [Activity File]. The cookbook warns against guessing from content: "inspecting the message types found in a file is not a deterministic way to determine the type of file being decoded. A more reliable way to determine the file type is to check the Type field found in the File Id message", and its example throws if the type isn't `File.Activity` [Decoding]. The `file` enum has `4: activity`; other values a watch produces include `device` (1), `settings` (2), `sport` (3), `workout` (5), `course` (6), `totals` (10), `monitoring_b` (32) and `activity_summary` (20) [Profile]. Varða should accept only 4.

**Broken files.** Every FIT file ends with a 2-byte CRC, and the header carries the data size [Protocol]. A decoder that checks the header and CRC catches truncation and corruption. Separately, Garmin warns that devices write the Session and Activity messages last, so a crashed or truncated recording "may not include a Session or Activity message" [Decoding], and "it is possible that the Activity message will be missing if the file is truncated or corrupted, so dependencies on the Activity message in post processing ... should be keep [sic] to a minimum" [Activity File]. The cookbook rebuilds a missing session from the first and last records [Decoding]. Map #35 says broken files are turned away, so the simpler rule fits: **no `session` message means a broken file**. A missing Activity message alone is not fatal. Only the local date loses its preferred source (see §3).

Note that the protocol allows several FIT files chained in one file: "Each FIT file in the chain must be a properly formatted FIT file" [Protocol]. Watch activity files are not chained in practice. The safe rule is to read the first file and treat any further chained file with sessions as multisport/unsupported.

**Multisport.** A multisport recording is one activity file with one Session per leg, including transitions: "the summary data for each leg of the activity, including transitions, will be stored in separate Session messages within the same Activity file", ending with e.g. "Activity - Session Count = 5" for a triathlon [Activity File]. On the FR255, "When your activity includes two or more sports, it is recorded as a multisport activity" (Change Sport during an activity, or the Triathlon/Multisport activities) [FR255 manual]. Detection, any one of:

- more than one `session` message (the primary signal, since the Activity message can be missing);
- `activity.num_sessions > 1`;
- any session with `sport = transition (3)` or `multisport (18)`, or a multisport `sub_sport` (`triathlon` 78, `duathlon` 79, `brick` 80, `swim_run` 81, `pool_triathlon` 126) [Profile];
- `activity.type = auto_multi_sport (1)` [Profile].

## 2. Session identity

**Fields.** `file_id` holds `type`, `manufacturer`, `product` (with `garmin_product` as its subfield when manufacturer is Garmin), `serial_number` and `time_created`, plus `number` [Profile, File Types]:

- `serial_number` is `uint32z`: "Device serial number, managed by manufacturer. The 'z' indicates that the invalid value for the type is 0" [File Types]. It is optional.
- `time_created` is a required `date_time`, "File creation time" [File Types]. The Profile adds "Only set for files that are can be created/erased" [Profile], and activity files are "Read/erase, multiple files" [Profile, `file` enum], so activity files carry it.
- `number` is "Only set for files that are not created/erased" [Profile], so it is not useful for activities.
- The FR255 shows up as `manufacturer = garmin (1)` with `garmin_product` `fr255` (3992), `fr255_small` (3993), `fr255_music` (3990) or `fr255_small_music` (3991) [Profile, `garminProduct` enum].

**Proposed key:** `(manufacturer, serial_number, time_created)`. One device cannot create two activity files in the same second, so the triple is unique per recording. Store it on the stone with a unique constraint per athlete, so a repeat upload can be refused with a link to the existing stone (map #35).

**Fallback** when `serial_number` is 0/absent (some apps and non-Garmin exporters omit it): `(manufacturer, product, session.start_time)`. A SHA-256 of the file bytes can also be stored. It is cheap and catches byte-identical repeats from any source, but it is not enough alone: a re-exported or re-encoded file has different bytes for the same session.

**Does it stay the same if the file is downloaded again?** The FIT spec says nothing about re-downloads. The identity fields are written into the file when the watch records it, and copying a file doesn't change its contents. So:

- Copying the same file off the watch again (USB, from the device's activity folder) gives the same bytes and the same key. *(Reasoning, not a documented guarantee.)*
- Garmin Connect's "Export Original" is widely reported to return the file as it was synced, as a ZIP with the `.fit` inside. That source is Garmin forum users, not Garmin documentation, so **verify with a real file**: export the same activity twice, and compare it with the file copied over USB.
- A file re-encoded by another platform (e.g. Strava's or a third party's FIT export) may keep or rewrite `file_id`. Don't rely on it. The fallback on `session.start_time` covers this partly.

**Out of reach for this key:** the same session recorded by two devices (watch + bike computer) has two serial numbers. The glossary's "A session is placed as a stone only once, whatever its sources" would need matching on start time and sport across sources. That is not in scope for #35 (only watch files) and is worth noting for later sync work.

**FR255 caveat:** "Resume Later" suspends an activity and continues it later in the same recording [FR255 manual]. That is still one file and one identity, and its elapsed time can span hours or days. It doesn't affect the key. It does mean `total_elapsed_time` can be far larger than `total_timer_time`.

## 3. Local start date

FIT `date_time` values are seconds since 1989-12-31T00:00:00Z (the "FIT Epoch"). Add 631065600 s to get Unix time. Values below `0x10000000` are relative, not absolute [Datetime]. `local_date_time` is the same count "since midnight on December 31, 1989 local time", and "When both a date_time value and corresponding local_date_time value are provided, the time zone offset for the FIT file can be calculated" [Datetime].

**Preferred:** the Activity message's `local_timestamp` (field 5), documented as "timestamp epoch expressed in local time, used to convert activity timestamps to local time" [Profile]. "The Local Timestamp is used to determine the time zone offset that can be applied to all timestamps in the file" [Activity File].

```
offset   = activity.local_timestamp - activity.timestamp      // seconds, may be negative
localDay = calendarDate(session.start_time + offset)          // as a plain date, no zone
```

Apply the offset to `session.start_time`, not to `activity.timestamp`: the activity timestamp is the end of the recording, and a run that crosses midnight belongs to the day it started (glossary: stones "are dated by the local date where they started"). The offset is taken at the end of the recording. If a DST change happens mid-activity, the offset is off by an hour at the start. That is negligible for dating, but worth a test.

**Fallbacks, in order:**

1. **Activity message missing or `local_timestamp` invalid** (Garmin: "Not all manufacturers include the Local Timestamp property, so it should always be checked for a valid value before using" [Decoding]). Garmin's own suggestion: "When the Local Timestamp property is not included it is common to use a timezone lookup based on the GPS location of the first Record message in the file" [Decoding]. This needs a timezone-boundary lookup library. Indoor activities (treadmill, strength) have no GPS.
2. **No GPS:** use the athlete's own timezone (a person-level setting Varða doesn't have yet), or UTC as the last resort. Flag the stone's date as inferred if that matters to the product.

Not recommended as a fallback: `device_settings.time_zone_offset` ("timezone offset in 1/4 hour increments") and `utc_offset` exist [Profile], but it is not established that a watch includes `device_settings` in activity files, and they describe the watch setting rather than the session. The FR255 sets its timezone automatically from GPS [FR255 manual], so on that watch `local_timestamp` should be reliable when the Activity message is present. **Verify with a real file** that FR255 activity files carry `local_timestamp`.

## 4. Summary and laps

**Summary (Session message, `session`, global 18)** [Profile]:

| Stone | Field | Type / units | Notes |
| --- | --- | --- | --- |
| Start | `start_time` (2) | `date_time` | required for all summary messages [Activity File] |
| Distance | `total_distance` (9) | uint32, scale 100, m | absent for strength and similar; store "no distance", not 0 |
| Moving time | `total_timer_time` (8) | uint32, scale 1000, s | "Timer Time (excludes pauses)" |
| Elapsed time | `total_elapsed_time` (7) | uint32, scale 1000, s | "Time (includes pauses)" |
| Sport | `sport` (5), `sub_sport` (6) | enums | see §5 |
| (unused) | `total_moving_time` (59) | uint32, scale 1000, s | see below |

**Moving vs elapsed.** Garmin defines three durations [Durations]:

- Elapsed: "wall-clock time ... continues to accumulate even when the device timer has been paused".
- Timer: "the stopwatch duration displayed on cycling computers and wearable devices ... accounts for pauses ... due to a manual or auto-pause". Always ≤ elapsed.
- Moving: "only accumulates when the device timer is running and the person is moving". It is "rarely if ever found in an Activity file created by a device. Many software platforms ... implement a moving duration calculation based on their own threshold speed".

So map **stone "moving time" ← `total_timer_time`**. That is the time the watch showed, and it is the only pause-free figure a device reliably writes. `total_moving_time` should not be relied on, and computing one ourselves would be a derived metric, which #35 leaves out. The glossary and spec should say that "moving time" means timer time (pauses excluded), so nobody later "fixes" it into a speed-threshold figure.

**Laps (`lap`, global 19)** [Profile]: per lap, `message_index` (254), `start_time` (2), `timestamp` (253, end), `total_elapsed_time` (7), `total_timer_time` (8), `total_distance` (9), `lap_trigger` (24: `manual`, `time`, `distance`, `position_*`, `session_end`, `fitness_equipment`), `intensity` (23: `active`, `rest`, `warmup`, `cooldown`, `recovery`, `interval`, `other`) and `wkt_step_index` (71).

- Which laps belong to the session: "the Session message provides the First Lap Index and Lap Count properties ... `Laps.Skip(FirstLapIndex).Take(NumLaps)`". "Not all manufacturers provide [them]. If these values are not provided, then the Where() and Within() technique can be used" (lap time inside the session's span) [Decoding]. With multisport turned away there is one session, so all laps belong to it.
- Lap boundaries: each lap spans `start_time` to `start_time + total_elapsed_time` (its `timestamp`). "Lap messages should be sequential and non-overlapping, and the sum of the total elapsed time and distance values for all Lap messages should equal the total elapsed time and distance for the corresponding Session message" [Activity File]. That is a "should": sum checks belong in tests as a warning, not as a reason to reject.
- Laps may be manual (lap button) or automatic (Auto Lap per km/mile) [Activity File; FR255 manual "Marking Laps Using the Auto Lap Feature"]. `lap_trigger` tells which. The glossary avoids "split" except for automatic per-kilometre splits, so `lap_trigger = distance` laps are the glossary's "splits". Varða could keep `lap_trigger` on each lap to tell them apart later.
- Worth keeping for later workout matching (glossary: laps are matched to workout steps): "the device will typically include a Lap message for each workout step completed, and the Lap message's Workout Step Index field will contain the index in to the list of Workout Step messages" [Activity File]. Storing `wkt_step_index` and `intensity` costs nothing now.
- Order laps by `start_time`, not file order. Files may be "summary first" or "summary last", and "the summary messages can be processed based on the message start time rather than the order that they appear in the file" [Decoding, Activity File].
- Pool swims: the watch records "swim intervals and lengths" [FR255 manual]. Lengths are separate `length` messages, and the laps are the intervals. Keep laps only.
- Strength: #35 keeps totals only. Strength sets live in their own messages and are out of scope. Laps on a strength recording are per set/rest and can be kept or dropped. The map says "totals only", so drop them.

## 5. Sport

Read `session.sport` and `session.sub_sport`. If the session lacks them, fall back to the `sport` message (global 12) and then the first lap's `sport`/`sub_sport` (lap fields 25/39) [Profile]. `session.sport_profile_name` (110, "Sport name from associated sport mesg") is the user's activity name, e.g. a custom "Trail Run(2)" [Profile; FR255 manual on duplicate activity names]. It is a label, not a type, so don't map on it.

Enum values below are from the Profile (`sport` and `sub_sport` enums, with Garmin's own comments such as `treadmill // Run/Fitness Equipment`).

### What the FR255 offers

Preloaded or addable activities named in the manual: Run, Trail Run, Ultra Run, Track Run, Treadmill, Virtual Run, Bike, Bike Indoor, Pool Swim, Open Water, Triathlon and custom Multisport, Strength, Cardio, HIIT, Yoga, Pilates, Breathwork, skiing and snowboarding, walking, rowing, and more from an extended list [FR255 manual]. The sport/sub_sport each one writes is not documented by Garmin. The "expected" column below follows the Profile enum's comments and names. **Verify each with a real file**, especially Run (road), whose sub_sport may be `generic` (0) or `street` (2).

### Proposed mapping

| FIT `sport` | FIT `sub_sport` | Varða sport | FR255 activity (expected) |
| --- | --- | --- | --- |
| `running` (1) | `generic` (0), `street` (2), absent | running: road | Run |
| `running` (1) | `trail` (3) | running: trail | Trail Run |
| `running` (1) | `track` (4) | running: track | Track Run |
| `running` (1) | `treadmill` (1) | running: treadmill | Treadmill |
| `running` (1) | `virtual_activity` (58) | running: treadmill | Virtual Run (indoor, e.g. Zwift on a treadmill) |
| `running` (1) | `indoor_running` (45) | running: treadmill *(decide)* | indoor track / indoor run |
| `running` (1) | `ultra` (67) | running: road *(decide: trail?)* | Ultra Run |
| `running` (1) | `obstacle` (59), any other | running: road *(decide)* | — |
| `fitness_equipment` (4) | `treadmill` (1) | running: treadmill | treadmill via fitness equipment link |
| `training` (10) | `strength_training` (20) | strength | Strength |
| `cycling` (2) | any (`road` 7, `mountain` 8, `indoor_cycling` 6, `gravel_cycling` 46, `spin` 5, `virtual_activity` 58, …) | cross-training: cycling | Bike, Bike Indoor |
| `fitness_equipment` (4) | `indoor_cycling` (6) | cross-training: cycling | — |
| `e_biking` (21) | any | cross-training: cycling *(decide)* | eBike |
| `swimming` (5) | `lap_swimming` (17), `open_water` (18), any | cross-training: swimming | Pool Swim, Open Water |
| `cross_country_skiing` (12) | any (`skate_skiing` 42, …) | cross-training: skiing | XC ski |
| `alpine_skiing` (13) | any | cross-training: skiing | Ski |
| `snowboarding` (14) | any | cross-training: other *(decide: skiing?)* | Snowboard |
| `hiking` (17) | any (incl. `rucking` 124) | cross-training: hiking | Hike |
| `mountaineering` (16), `snowshoeing` (35) | any | cross-training: hiking *(decide)* | — |
| `walking` (11) | any (`casual_walking` 30, `speed_walking` 31, `indoor_walking` 27) | cross-training: walking | Walk, Indoor Walk |
| `fitness_equipment` (4) | `indoor_walking` (27) | cross-training: walking | — |
| `training` (10) | `cardio_training` (26), `yoga` (43), `flexibility_training` (19), `hiit` (70), `breathing` (62), other | cross-training: other | Cardio, Yoga, Breathwork, HIIT (older firmware) |
| `hiit` (62) | any | cross-training: other | HIIT (newer profiles) |
| `fitness_equipment` (4) | `elliptical` (15), `stair_climbing` (16), `indoor_rowing` (14), `pilates` (44), other | cross-training: other | Pilates, Elliptical, Indoor Row |
| `rowing` (15), `paddling` (19), `stand_up_paddleboarding` (37), etc. | any | cross-training: other | Row, SUP |
| `generic` (0) | any | cross-training: other | custom "Other" |
| `transition` (3), `multisport` (18) | any | turn the file away (multisport) | Triathlon, Multisport |
| anything else, or absent | — | cross-training: other | — |

Rows marked *(decide)* are product calls the spec should settle. The proposal is the conservative default: an unknown running sub-sport is road, and anything unknown is "other", as map #35 asks.

Two notes for the implementer:

- Map on `sport` first, then refine by `sub_sport` only for running (and the `fitness_equipment` treadmill/bike/walk cases). Every other cross-training bucket ignores sub-sport, so new Garmin sub-sports don't break the mapping.
- Libraries differ in how they spell enum strings (`lap_swimming` vs `lapSwimming`). Match on the numeric values or the chosen library's constants, not hand-typed strings.

## Open questions to settle with a real FR255 file

1. Which sub_sport the FR255's plain "Run" writes (`generic` or `street`), and which sport/sub_sport Strength, HIIT, Cardio, Yoga and Virtual Run write.
2. Whether FR255 activity files always carry `activity.local_timestamp`, `serial_number`, `first_lap_index` and `num_laps`.
3. Whether a Garmin Connect "Export Original" file is byte-identical to the file copied from the watch over USB, and whether two exports of the same activity are identical.
4. How a resumed ("Resume Later") recording looks: one session, elapsed ≫ timer.

These can be answered quickly by decoding a few of the athlete's own files with the chosen library (or Garmin's FitCSVTool) and comparing them. The files don't need to be committed.
