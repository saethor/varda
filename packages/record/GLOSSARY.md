# Record

Looking back: what the athlete actually did, how it went, and what it adds up to. Shown in the product as **Varða**.

The English words here are canonical in code and docs; the Icelandic UI translates them (stone → steinn, journal → dagbók, milestones → vörður, the path → leiðin).

## Language

### Stones

**Stone**:
A training session the athlete actually did, of any sport. Stones belong to the athlete, are dated by the local date where they started, and fall within a journey only by that date. A session is placed as a stone only once, whatever its sources. Only the athlete can delete a stone; deleting it removes the stone and its recording entirely, leaving nothing behind, so the same session can be placed again.
_Avoid_: Activity, workout (for completed work), run (unless it is one)

**Placing a stone**:
Adding a completed session to the athlete's record, whether from a watch file, a synced platform or manual entry.
_Avoid_: Uploading, logging, syncing (as domain verbs)

**Recording**:
The raw data a stone was placed from (a watch file, a synced platform). It is never changed, and is deleted only together with its stone.
_Avoid_: Activity file, raw data

**Correction**:
A change the athlete makes to a stone's distance, pace or laps when the recording was wrong (e.g. treadmill). Corrections sit on top of the recording, are marked as such, and can be reverted. Only the athlete can correct a stone.
_Avoid_: Edit, override

**Lap**:
A recorded section of a stone. Laps are matched to the workout steps of the workout the stone fulfils; the match can be corrected by hand.
_Avoid_: Split (that is a kilometre)

**Split**:
Each whole kilometre of a stone, in order, and the remainder at the end, worked out from what the watch recorded along the way. A stone without distance, or a swim, has no splits.
_Avoid_: Lap (laps are what the watch recorded), km split

**Stretch**:
A part of a run spent running, walking or standing, as the watch detected it.
_Avoid_: Split, run/walk split, segment

**Moving time**:
How long a stone's or lap's timer ran, pauses excluded, as the watch recorded it. It is never worked out from speed.
_Avoid_: Timer time, active time

**Elapsed time**:
How long a stone or lap took from start to finish, pauses included.
_Avoid_: Total time, duration (unqualified)

**Trace**:
The line a stone traced over the ground, simplified from its recording's GPS. A stone without GPS (treadmill, pool, strength) has no trace.
_Avoid_: Track (that is track running), route (planned), GPS track, map

**Stream**:
Every point the watch recorded over a stone, as recorded and never thinned: for each moment its distance, speed, heart rate, altitude, power, cadence, temperature, position and running form, whichever the watch measured, and whether the timer was running. Splits and charts are drawn from the streams. A distance correction scales the distance stream on top of what was recorded.
_Avoid_: Records, samples, time series, data points

**Running form**:
How a run was run, step by step: its step length, vertical oscillation, vertical ratio and ground contact time, as the watch recorded them, averaged over the stone and each lap and along its streams. Only runs have running form; other sports never do, even when their recording holds it.
_Avoid_: Running dynamics, form metrics, stance time

**Training load**:
Varða's own measure of how much strain a stone put on the athlete, calculated the same way whatever its source.
_Avoid_: TSS, training stress, Garmin load

**Effort**:
The athlete's rating of how hard a stone felt, from 1 to 10. A rating the athlete gave on the watch becomes the stone's effort; the athlete can change it.
_Avoid_: RPE (in the UI), difficulty, feel

**Day check-in**:
The athlete's optional once-a-day record of sleep, soreness, mood and illness.
_Avoid_: Wellness, readiness, daily log

### Against the plan

**Workout outcome**:
How a workout turned out: _completed_, _partial_ or _missed_. Doing a workout on another day is not a workout outcome; it is the same workout on a different date. A workout outcome is judged when a stone is matched to the workout; later changes to the workout don't change an outcome already judged, and if the workout is removed from the plan, the stone keeps its outcome and shows that it fulfilled a removed workout.
_Avoid_: Outcome (unprefixed), status, compliance

**Deviation reason**:
The athlete's chosen reason a workout was partial or missed (e.g. illness, niggle, fatigue, weather, time).
_Avoid_: Excuse

**Unplanned stone**:
A stone that did not fulfil any workout. A stone whose workout was later removed from the plan is not an unplanned stone.

### The journey, looking back

**Cairn**:
The stones placed during one journey.
_Avoid_: Collection, history

**Journey result**:
How a journey ended: _reached_, _fell short_ or _abandoned_. An open journey cannot fall short.
_Avoid_: Outcome

### Journal

**Journal**:
The athlete's diary: every journal entry, in date order.
_Avoid_: Diary, log, logbook, notes

**Journal entry**:
A written reflection belonging to a day, optionally about one stone. The athlete's explanation of a partial or missed workout lives here.
_Avoid_: Note, comment, log entry

**Private journal entry**:
A journal entry the athlete has hidden from their coaches.

**Journal comment**:
A message by the athlete or a coach on a stone or a journal entry, forming a discussion shown in the journal.
_Avoid_: Comment (unprefixed), journal entry comment, reply, message

**Journal reaction**:
An emoji placed on a single stone or journal entry.
_Avoid_: Reaction (unprefixed), like, kudos

### Looking back

**Milestone**:
A notable achievement, either calculated (a personal best, a longest run) or added by the athlete ("first ultra").
_Avoid_: PR, record, achievement, cairn, vörður (in English)

**Best effort**:
The athlete's fastest time over a standard distance within any part of any stone, including corrected ones. The athlete can exclude any single stone from best efforts.
_Avoid_: PR (ambiguous between this and race result)

**Race result**:
The time of a stone run as a waypoint or destination race.
_Avoid_: PR, official time

**The Path**:
The athlete's long-term trends and progress.
_Avoid_: Trends, history, leiðin (in English)

**Odometer**:
The athlete's lifetime totals: distance, time and number of stones.
_Avoid_: Totals, lifetime stats
