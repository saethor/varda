# Shared

Terms used identically by the Plan and Record contexts. Neither context owns them; both depend on them.

The English words here are canonical in code and docs; the Icelandic UI translates them.

## Language

### People

**Person**:
Someone who uses Varða, as an athlete, a coach or both. A person signs in with exactly one login account, which is not part of the domain, and exists from the moment that login account is created; there is no person who cannot sign in. A person is known by their name; their email address belongs to the login account.
_Avoid_: User, account, member, profile

**Login account**:
What a person signs in with: an email address, reached through one or more sign-in methods. It is not part of the domain; it belongs to login, and the person refers to it by identity only. Each login account has exactly one person, created with it.
_Avoid_: User, account (unprefixed), credentials

**Sign-in method**:
A way into a login account: a password or a passkey. A login account has at least one, and any but the last can be removed. Better Auth calls the password method "email"; that word stays inside the auth modules.
_Avoid_: Login method, provider, credential

**Athlete**:
The person whose training is planned, recorded and analysed.
_Avoid_: User, runner, Athletic

**Coach**:
A person who plans training for an athlete and sees all of that athlete's training. An athlete can have any number of coaches and can always plan for themselves. Coach is a role in a coaching relationship; the same person can also be an athlete.
_Avoid_: Trainer, planner, self-coached athlete

**Coaching relationship**:
The link between one athlete and one coach, started by an invitation from either side and ended by either side at any time. An invitation is addressed to an email address, not a person, so the person invited may not exist yet. When it ends the coach loses access, but everything they contributed stays with the athlete.
_Avoid_: Subscription, connection, follow

### Training

**Sport**:
What kind of training a stone or workout is: running (road, trail, track, treadmill), strength, or cross-training (cycling, swimming, skiing, hiking, walking, other).
_Avoid_: Activity type, discipline

**Zones**:
The athlete's personal heart-rate, pace and power ranges, set by the athlete or a coach, each version valid from a date. A stone is always judged against the zones valid on its day.
_Avoid_: Thresholds, settings

**Strength exercise**:
A single strength movement within a workout or stone, made up of strength sets.
_Avoid_: Exercise (unprefixed), movement, lift

**Strength set**:
One round of a strength exercise, given as reps × weight or as a duration.
_Avoid_: Set (unprefixed), round
