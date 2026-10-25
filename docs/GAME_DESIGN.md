# Pinpoint — Game Design Document

**Product:** Pinpoint
**Genre:** Daily location-guessing game
**Primary platform:** Mobile-first PWA, desktop web
**Core promise:** Drop a pin, read the planet, and get the truth revealed with precision.
**Vertical slice in this workspace:** One complete daily route with five locations, a 3D globe, pin placement, lock state, anticipation beat, camera reveal, score, streak status, and shareable result.

> **Design guardrail:** Pinpoint is designed to be highly replayable and habit-forming without using dark patterns. The game can create anticipation, mastery, and social motivation; it should not weaponize panic, shame, sleep disruption, paid streak recovery, or deceptive reward odds. Streak protection is visible, optional, and earned or freely granted—not sold as emotional insurance.

## 1. Player fantasy

The player is a precision explorer. They are not answering a trivia question from a list; they are reading the shape of the world. A clue becomes a hunch, a hunch becomes a coordinate, and the reveal turns that coordinate into a story.

The product should feel closer to a broadcast control room and a beautiful atlas than a conventional quiz app:

- restrained chrome while playing
- a globe that feels physically present
- a short, deliberate commitment moment
- an expensive camera flight to the answer
- clear proof of distance and improvement
- a result card players want to send to friends

## 2. The daily ritual

### Entry sequence

1. Open to a clear daily status: streak, challenge expiration, and one primary action.
2. Enter the globe in under two taps.
3. Read one concise clue with a small lore hook.
4. Explore, rotate, zoom, and place a pin.
5. Lock the pin. The game temporarily removes uncertainty from the UI.
6. A 900–1,300 ms anticipation beat plays.
7. The globe flies to the real location.
8. Guess pin and answer pin arrive together, followed by the distance count and score.
9. The player sees rank movement and the next round action.
10. After five questions, the player receives a share card and a calm return cue for tomorrow.

### Session target

- First question: 20–45 seconds
- Full daily route: 3–6 minutes
- Practice mode: no streak risk, unlimited rounds with a soft daily cap on rewarded boosts
- One official daily route per local calendar day

## 3. Psychological systems, used responsibly

### Anticipation gap

After lock, the player has committed but does not yet know the answer. The state should be short enough to feel intentional, not slow:

- 0 ms: lock control compresses by 1–2 px and becomes “Locked”
- 120 ms: clue panel dims and the globe ambient light tightens
- 260 ms: “Calculating your line…” appears
- 900–1,300 ms: camera flight begins
- 1,600–2,600 ms: target enters the frame

The player always receives visible progress and can skip the cinematic reveal on a second attempt. The anticipation is a reveal ceremony, not a withholding tactic.

### Near miss

Near misses are framed as useful skill feedback, never as fake wins. Suggested bands:

| Distance | Player message | Visual language |
| --- | --- | --- |
| 0–25 km | “Bullseye.” | lime pulse, precise line |
| 26–150 km | “So close.” | warm amber pulse, small improvement hint |
| 151–800 km | “Good read.” | neutral score reveal |
| 801–3,000 km | “The right region.” | measured feedback |
| 3,000+ km | “New territory.” | educational lore emphasis |

Never falsify the score, hide the distance, or pretend a poor guess was almost correct. The emotional hook comes from the player’s actual skill curve.

### Variable difficulty

Daily routes use a weighted mix rather than a predictable staircase:

- 35% accessible city or country clue
- 40% medium location with a geographic signal
- 20% hard random place or sea/ocean location
- 5% “wildcard” location with a high storytelling payoff

Difficulty is published after the answer, not before. The daily route may use a difficulty seed so all players receive the same set.

### Loss aversion without coercion

The streak is meaningful because it represents accumulated practice, not because the product threatens the player. Rules:

- one official daily completion preserves the streak
- one free streak shield is granted at the start of a new account
- additional shields are earned through milestones and weekly play, never required for access
- missing a day shows the previous best streak and a fresh restart path without guilt language
- no paid “streak rescue” during the first release
- notifications are opt-in and quiet-hours aware

### Progressive mastery

The game should show improvement in ways that are more meaningful than a single high score:

- rolling 7-day average distance
- best region and weakest region
- accuracy by category
- closest pin ever
- improvement compared with the player’s own first week
- “you were 18% closer than your average in Europe”

### Social comparison

The leaderboard is a mirror, not a harassment engine:

- show the player’s own position prominently
- show a small window above and below the player
- friends leaderboard is opt-in
- names can be hidden behind a privacy alias
- rank updates are shown after the player has seen the answer
- no fake live counts or fabricated player activity

## 4. Question categories

### Cities

High precision and satisfying close calls. Reveal camera flies to the city, eases into a lower altitude, and shows a short urban fact.

### Countries

Broad strategic play. The answer pin lands near the country centroid or editorial target. Scoring rewards regional understanding but caps the advantage of guessing a capital by default.

### Seas and oceans

The widest emotional swing. The globe holds a little longer before the reveal and uses a longer arc line. Lore focuses on currents, trenches, islands, and maritime history.

### Random places

The highest variance. Targets can be obscure islands, mountain passes, research stations, or towns. Every reveal includes one verified sentence of context.

## 5. Scoring model

### Distance

Use the Haversine distance between the submitted coordinate and the editorial target. Store the raw coordinate and calculated distance server-side.

### Score curve

```text
accuracy = max(0, 1 - log10(distanceKm + 1) / log10(categoryCapKm + 1))
precisionScore = round(accuracy ^ 1.18 * 900)
speedBonus = round(max(0, 90 - secondsSpent * 1.2))
difficultyBonus = 0..110
questionScore = clamp(precisionScore + speedBonus + difficultyBonus, 0, 1,000)
```

The exponent makes the last few kilometres matter while keeping the game approachable at world scale. Category caps:

- cities: 2,500 km
- countries: 8,000 km
- seas/oceans: 14,000 km
- random places: 10,000 km

### Score feedback order

1. Distance count-up with thousands separators
2. Accuracy phrase
3. Question score
4. Running total
5. Rank movement

The score should never appear before the player has had time to understand the line between the two pins.

## 6. Streaks and milestones

Milestones: 3, 7, 14, 30, 50, 100 days.

Milestone animation:

- the streak number expands once
- a small constellation completes around it
- a single sentence confirms what was earned
- the user can dismiss it without blocking the next round

Streak status copy should be honest:

- “Your 7-day run is active.”
- “One daily route keeps it moving.”
- “You have one free shield available.”

Avoid “You’ll lose everything” or countdown language that implies punishment.

## 7. Result and sharing

The result card contains:

- PINPOINT wordmark
- total score
- streak
- percentile or rank, if available
- five tiny route lines or target markers
- best distance
- daily seed/date
- “Can you beat this?” challenge link

Sharing a result should work without login. A guest share can contain a signed result payload or a short-lived challenge id. Accounts can later claim the score.

## 8. Monetization principles

Ads should pay for optional convenience, not core access:

- no ad before the first completed round
- no ad between lock and answer reveal
- rewarded ad may reveal a broad region hint in practice mode
- rewarded ad may grant one extra practice round
- interstitials are frequency-capped and only appear after a completed daily route
- no ad should cover the globe, the answer, or the score
- future remove-ads option should not hide the free daily route

Instrumentation must monitor whether ads reduce completion and next-day return. Revenue is subordinate to the core loop.

## 9. Production architecture

### Client

- Next.js App Router + TypeScript
- client-only Three.js globe component
- mobile-first PWA shell
- CSS Modules or a single scoped global layer for the vertical slice
- reduced-motion mode

### Data model

```text
users
daily_challenges
questions
question_sources
round_sessions
guesses
streaks
streak_shields
leaderboard_entries
share_links
achievements
practice_sessions
```

### Server invariants

- answer coordinates are never shipped before lock
- the score is calculated server-side
- daily challenge membership is deterministic and signed
- one official completion per player per day
- share cards expose only a public result, never target data ahead of time

The vertical slice keeps the question set in a typed local module so the interaction can be proven before adding auth and persistence. The module boundary is intentionally shaped like an API response.

## 10. Vertical-slice acceptance criteria

The shipped slice is complete when:

1. A player can open the app and see today's route, streak, and expiration.
2. A real 3D globe loads with atmosphere, stars, texture, drag rotation, and pinch/scroll zoom.
3. A player can place, move, and lock one pin per question.
4. Lock creates a deliberate anticipation state and prevents accidental re-placement.
5. The globe flies to the answer and shows both pins plus a distance line.
6. Distance, feedback phrase, score, and running total animate in order.
7. Five questions can be completed without a page reload.
8. The final view shows score, streak, route summary, and a shareable result payload.
9. Reduced motion disables the cinematic movement while preserving clarity.
10. The production build completes without errors.

## 11. Follow-on production work

- replace local questions with signed server payloads
- add OAuth/email account linking
- persist streaks and scores in Postgres
- add WebSocket or polling-backed leaderboards
- generate server-side OG result images
- add service worker caching and an offline practice route
- add content review tooling and source verification
- add analytics events with consent and privacy controls
- self-host or contract a production-grade globe texture/tile pipeline
