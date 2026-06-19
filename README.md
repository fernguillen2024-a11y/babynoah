# bitethatthing — Cheater Accountability Tribunal

> *"Catch a cheatin' cho-mo. Earn rewards."*

A community-powered tribunal for Fortnite cheaters. Players pull real names from
replays, file evidence-backed cases, and the community votes a verdict. Every verified
catch builds reporter credibility. False accusations are punished harder than cheating.

---

## Table of Contents

1. [What We Are Building](#1-what-we-are-building)
2. [Where We Are Right Now](#2-where-we-are-right-now)
3. [The Iron Rules — Read Before Touching Anything](#3-the-iron-rules)
4. [Architecture](#4-architecture)
5. [The Tribunal System — Full Rules](#5-the-tribunal-system)
6. [Credibility & Reputation System](#6-credibility--reputation-system)
7. [Auth & Access Model](#7-auth--access-model)
8. [The Knowledge Base — Cheating Encyclopedia](#8-the-knowledge-base)
9. [Frontend Vision — The Full Design Blueprint](#9-frontend-vision)
10. [Pages & Screens — Complete Spec](#10-pages--screens)
11. [Backend Roadmap — Supabase Integration Plan](#11-backend-roadmap)
12. [Next Steps in Order](#12-next-steps-in-order)
13. [File Map](#13-file-map)
14. [Git History](#14-git-history)

---

## 1. What We Are Building

**bitethatthing** is not a report form. It is a community court.

Fortnite cheaters — aimbotters, wallhackers, speedhackers — hide behind anonymous
in-game aliases because they are ashamed of what they are. The Fortnite replay system
exposes their real Epic account name on the roster. This site turns that into a public
accountability record.

### The Core Loop

```
Player catches cheater in-game
        ↓
Pulls real name from replay roster (or clip/screenshot)
        ↓
Files a case on bitethatthing with evidence
        ↓
Community votes guilty / not guilty
        ↓
25 net guilty votes → VERIFIED → Wall of Yella (permanent)
15 net not-guilty votes → DISMISSED → reporter credibility takes a hit
        ↓
Reporter gains/loses credibility score
Credibility determines vote weight for future cases
```

### The Founding Tension

**False accusation is worse than cheating.** A cheater ruins one match. A false accuser
ruins a real player's reputation. The entire accountability system exists equally to
protect the accused as to punish the guilty. This is the soul of the platform and every
design decision must reinforce it.

### What Makes This Different From Epic's Report System

| Epic's Report Button | bitethatthing |
|---|---|
| Goes into a black hole | Public record, community verdict |
| No feedback ever | Live vote tally, you see the case progress |
| Anonymous | Your name is on it — as is theirs |
| No accountability for false reports | False reports cost you credibility |
| Forgets everything | Permanent — verified brands don't expire |

---

## 2. Where We Are Right Now

### Status: Front End Complete — Mock Data Only

**What exists and works:**

| Screen | Status | Notes |
|---|---|---|
| Home / Hero | ✅ Complete | Header banner, headline, stats, creed cards |
| Case Feed / Docket | ✅ Complete | Filter by status, sort by credibility or votes |
| Case Detail View | ✅ Complete | Evidence panel, live tally bar, vote buttons |
| Report Wizard (3-step) | ✅ Complete | Accused → Evidence → Oath flow |
| Wall of Yella | ✅ Complete | Dark cards, clickable to case detail |
| The Code / Rules Page | ✅ Complete | Live RULES constants table + tier list |
| Nav | ✅ Complete | Sticky, bear logo, credibility pill, file button |
| Footer | ✅ Complete | bear.png, tagline, rules link |

**What does NOT exist yet:**
- Real database (Supabase)
- Authentication (sign up / log in)
- Real user accounts and persistent credibility scores
- Real image/video evidence uploads
- Search
- User profile pages
- Notifications
- Knowledge Base / Encyclopedia section
- Mobile navigation (hamburger menu)

### Deployed To
- **Netlify** — auto-deploys on push to `main`
- **GitHub** — `https://github.com/fernguillen2024-a11y/babynoah`

### Tech Stack
- **React 18** via **Vite 5**
- **Single file app** — everything in `src/App.jsx` (intentional for now, splits later)
- **No external UI library** — all styles are inline JS objects + a `<style>` tag for
  hover/focus states and Google Fonts
- **Fonts** — Oswald (headings/branding) + Inter (body) via Google Fonts
- **No state management library** — React useState/useMemo only
- **No router** — single-page route state via `useState({ name, id })`

---

## 3. The Iron Rules

These rules govern every session, every PR, every decision. Read them before opening
any file.

### Rule 1 — If It Works and Is Tested, Do Not Touch It
If a component, style, or behavior has been verified working in the Netlify deployment,
it is frozen. We do not refactor it, "clean it up," or change it while building
something else. The only reason to touch working code is a direct bug in that code.

### Rule 2 — One Feature at a Time, Fully Finished
We do not start the auth system and the knowledge base at the same time. We pick one,
build it to completion, test it in production, then move. Half-built features live in
branches, not main.

### Rule 3 — Mock Data First, Real Data Second
Every new screen or feature gets built with mock data first. When it looks right and
works right, we wire in Supabase. We never block UI progress on backend decisions.

### Rule 4 — The RULES Object Is the Source of Truth
All thresholds — votes to verify, votes to dismiss, credibility gains, tier minimums —
live in the `RULES` constant at the top of `App.jsx`. A moderator can tune the entire
tribunal by editing that one object. Never hardcode a threshold anywhere else.

### Rule 5 — Credibility Is Sacred
The credibility system is what separates this from a mob. Every code decision that
touches voting, reporting, or case resolution must ask: "does this preserve the
integrity of the credibility system?" If it makes it easier to game, it doesn't ship.

### Rule 6 — Never Ship Without Evidence Requirement
A case cannot be opened without at least one piece of evidence. This is a hard
gate, not a soft warning. Do not remove or soften it under any circumstances.

### Rule 7 — The Oath Is Not Optional
The 3-step report flow ends with an oath checkbox. This must remain the final gate
before submission. It is not a formality — it is the legal and moral weight the
reporter accepts.

### Rule 8 — Public Viewing, Gated Participation
Anyone can view the site: cases, verdicts, the Wall of Yella, the knowledge base.
Only authenticated users can vote, file reports, or comment. This is the access model
and it must never be reversed. We want transparency, not gatekeeping.

### Rule 9 — Permanent Means Permanent
A VERIFIED verdict and a YELLA brand do not expire, get appealed, or get removed by
admin request. The only exception is if new exculpatory evidence reopens a case via
a formal process (future feature). "Permanent" is the word we use because we mean it.

### Rule 10 — Bans Are Final
When the community votes to ban a bad-faith reporter, that account is gone. No appeals
process, no second account grace period. This is the stated policy and it must be
enforced technically (email blacklist, IP ban layer, manual moderation). Every user
who signs up agrees to this.

---

## 4. Architecture

```
bitethatthing/
├── index.html              ← Vite entry, loads /src/main.jsx
├── vite.config.js          ← Vite + React plugin config
├── package.json            ← React 18, Vite 5, @vitejs/plugin-react
├── netlify.toml            ← Build: npm run build, publish: dist
└── src/
    ├── main.jsx            ← ReactDOM.createRoot → <App />
    ├── index.css           ← Box-sizing reset + font smoothing
    ├── App.jsx             ← ENTIRE app (components + styles + mock data)
    ├── bear.png            ← Nav logo + footer icon
    └── HEADER.png          ← Hero banner image (top of home page)
```

### Why Single File?
Until Supabase is wired in and the component count grows to the point where the
single file becomes a navigation problem, splitting is premature. When we split,
the pattern will be:

```
src/
├── components/
│   ├── Nav.jsx
│   ├── Footer.jsx
│   ├── CaseCard.jsx
│   ├── CaseView.jsx
│   ├── Feed.jsx
│   ├── Wall.jsx
│   ├── Report.jsx
│   ├── RulesPage.jsx
│   └── Home.jsx
├── pages/
│   └── (route-level wrappers if we add React Router)
├── lib/
│   ├── supabase.js         ← Supabase client
│   ├── auth.js             ← Auth helpers
│   └── rules.js            ← RULES constants (extracted)
├── hooks/
│   ├── useAuth.js
│   ├── useCases.js
│   └── useVote.js
└── App.jsx                 ← Router + layout only
```

---

## 5. The Tribunal System

### Case Lifecycle

```
OPEN → (25 net guilty votes) → VERIFIED → Wall of Yella
OPEN → (15 net not-guilty votes) → DISMISSED
```

### Voting Rules

- One vote per user per case — enforced at DB level (unique constraint on user_id + case_id)
- Vote weight by credibility tier (see Section 6)
- Votes are public — you can see who voted what (accountability goes both ways)
- You cannot vote on your own case
- You cannot vote if you are currently on trial yourself

### The Weighted Vote Math

```
Net score = Σ(guilty votes × voter weight) - Σ(not-guilty votes × voter weight)

Weights:
  Unproven  = 1.0×
  Trusted   = 1.5×
  Sheriff   = 2.0×
  Marshal   = 3.0×

Example: 10 Unproven guilty votes vs 3 Marshal not-guilty votes
Net = (10 × 1.0) - (3 × 3.0) = 10 - 9 = +1 (still open, barely)
```

### False Report System

| Event | Consequence |
|---|---|
| Case dismissed by community | -12 credibility to reporter |
| Case dismissed AND flagged as bad-faith | Counts as 1 bad-faith strike |
| 3 bad-faith strikes | Reporter goes on trial themselves |
| First honest mistake | 1 forgiveness pass — flagged but no penalty |
| Trial verdict: guilty (30 net votes) | Permanent ban |
| Trial verdict: not-guilty | Cleared, bad-faith strike removed |

### The Streamer Flag

If the in-game alias contains `ttv` or `yt` (case-insensitive), the case is
auto-tagged **STREAMER · extra scrutiny**. This means:
- The case surfaces higher in the feed
- The badge signals to voters that the accusation carries extra weight because
  streamers use their platform to influence the community
- Extra scrutiny also means: the community should be MORE careful before voting
  guilty, not less — a false accusation against a streamer has amplified harm

---

## 6. Credibility & Reputation System

### Starting State
Every new user begins at **50 credibility** — "Unproven."

### Credibility Changes

| Action | Change |
|---|---|
| Case verified by community | +8 |
| Case dismissed | -12 |
| Case dismissed + bad-faith flag | -12 + bad-faith strike |
| Voted correctly (majority agrees) | +1 (future feature) |
| Voted against consensus | -1 (future feature) |

### Tiers

| Tier | Min Credibility | Vote Weight | Color | Description |
|---|---|---|---|---|
| Unproven | 0 | 1.0× | Steel blue | New reporter. No track record. |
| Trusted | 60 | 1.5× | Green | Has won verified cases. Community trusts them. |
| Sheriff | 78 | 2.0× | Gold | Consistent, reliable. Their cases surface prominently. |
| Marshal | 92 | 3.0× | Electric blue | Elite. One Marshal vote = three Unproven votes. |

### How Credibility Affects The Feed

Cases are sorted by reporter credibility by default. A Marshal's case loads at
the top. An Unproven reporter's first case still gets seen — it just starts below
established reporters. This is intentional: new users earn their place.

---

## 7. Auth & Access Model

### What Anyone Can See (No Account Required)
- Home page
- Case feed (all statuses)
- Individual case details
- Evidence descriptions
- Vote tallies (read-only)
- Wall of Yella
- The Code / Rules page
- Knowledge Base (when built)
- User credibility profiles (public)

### What Requires An Account
- Filing a report
- Voting on a case
- Commenting on a case (future)
- Flagging a vote as bad-faith (future)
- Viewing your own credibility dashboard

### Auth Stack Plan — Supabase Auth

Supabase provides email/password + OAuth (Discord, Google, Twitch) out of the box.

**Sign Up Flow:**
1. Email + password (or OAuth)
2. Must agree to The Code (the rules) — checkbox, stored as `agreed_to_rules: true`
3. Must agree that bans are permanent — separate checkbox
4. Credibility starts at 50
5. Email verified before account is active

**Sign In Flow:**
1. Email/password or OAuth
2. Redirect to where they were
3. Session persists via Supabase JWT

**Banned User Flow:**
1. Supabase user marked `banned: true` in `profiles` table
2. All API calls return 403
3. They see a ban screen explaining the community decision
4. No appeal form. No contact email for bans.

### UI Behavior — Unauthenticated User

- "File a report" button → redirects to sign-in
- Vote buttons → shows "Sign in to vote" inline, no redirect
- The site never hides content from guests — it only gates actions

---

## 8. The Knowledge Base

This is the section that makes bitethatthing the authoritative resource on Fortnite
cheating — not just a tribunal but an encyclopedia. The goal: if anyone has any
question about cheating in Fortnite, this is where they come.

### Categories

#### A. How Cheats Work (Technical)

**Aimbot**
- Software that reads game memory and automatically moves the crosshair to enemy
  hitboxes, bypassing the need for human aim
- Types: silent aimbot (snaps then returns so it looks natural on killcam),
  rage aimbot (obvious snap-to-head), humanized aimbot (adds slight delay and
  curve to mimic human movement), bone prioritization (prefers headshots)
- Detection tells: instant 180° flicks with zero tracking curve, crosshair
  teleporting between targets frame-by-frame in replay slow-motion, unnaturally
  high headshot ratios (95%+ over many games), locking through movement

**Wallhack / ESP (Extra Sensory Perception)**
- Reads game memory to show enemy positions through walls, sometimes with
  health bars, distance, and loot indicators overlaid
- Detection tells: pre-aiming exact corners before peeking, crosshair tracking
  targets through solid structures in replay, rotating to a player's location
  before any audio cue, building/editing decisions that only make sense if you
  know exactly where someone is
- Difference from game sense: a good player uses audio cues and map knowledge.
  A wallhacker moves with perfect certainty. In replay, footstep audio is visible
  as a ring — if someone rotates before the ring appears, they knew without audio.

**Speedhack**
- Manipulates the game's timing to move faster than physically possible
- Obvious in replay — player covers more distance per frame than the engine allows
- Less common in Fortnite due to server-side movement validation

**Trigger Bot**
- Automatically fires the moment the crosshair crosses an enemy hitbox
- Harder to detect because it still requires the player to aim (sort of)
- Tell: reaction time below 50ms consistently, firing through walls before
  the crosshair visually reaches the enemy

**No Recoil / No Spread**
- Removes weapon spread/recoil patterns
- Tell: AR shots at long range all hitting head with zero spray pattern,
  impossible to replicate legitimately

**Soft Aim (The Gray Area)**
- Slightly curves aim assist values beyond what controller legitimately allows
- Very hard to detect visually — requires stat comparison
- Fortnite legitimately has strong aim assist on controller; soft aim pushes
  those values beyond their capped maximum

#### B. How To Detect Cheating Using Replay

**Step 1: Open the replay**
After every match, Fortnite stores a replay file. Go to Career → Replays.
Open the match in question. You can switch to any player's POV.

**Step 2: Switch to the suspected cheater's POV**
Click the player name in the replay. You now see exactly what they saw.

**Step 3: Use slow motion**
Set replay speed to 0.1×. Frame-by-frame movement becomes visible. An aimbot
snaps will show as a single-frame teleport of the crosshair. Human aim shows
gradual movement even at maximum speed.

**Step 4: Pull the real name**
In the replay, pause and open the scoreboard (Tab). Every player's real Epic
account name is listed. This cannot be changed mid-game. Screenshot this.

**Step 5: Check pre-aim angles**
Watch the cheater rotate toward a player before any audio or visual cue is
possible. In replay, Fortnite shows the footstep audio radius as a ring.
If the cheater's crosshair moves toward a player before that ring reaches
them, they had information the game did not give them.

**Step 6: Document stat anomalies**
Legitimate players, even pros, have headshot rates around 30-60%.
A consistent 95%+ headshot rate over many eliminations is a statistical
impossibility without aimbot assistance.

#### C. What Counts As Evidence (Ranked By Strength)

| Strength | Evidence Type | Why It Matters |
|---|---|---|
| Strongest | Replay file showing aimbot snap (frame by frame) | Direct mechanical proof |
| Strong | Replay showing pre-aim before audio cue | Proves information they couldn't have |
| Strong | Real name screenshot from replay roster | Identifies the person |
| Medium | Clip of impossible reaction time | Compelling but can be disputed |
| Medium | Stat anomaly (95%+ HS rate over 10+ games) | Statistical proof |
| Weak alone | Single clip of suspicious play | Not enough — pros do wild things |
| Not valid | "He killed me too fast" | Not evidence |
| Not valid | "Someone told me he cheats" | Hearsay — case will be dismissed |

#### D. Common False Positive Mistakes

Understanding why innocent players get falsely accused is critical for voters.

**High aim assist on controller:** Fortnite's controller aim assist is genuinely
very strong. A controller player tracking through builds or making fast flicks can
look like aimbot to a keyboard/mouse player. Check: was the player on controller?
Aim assist has a specific "sticky" behavior — it slows the crosshair near targets
but does not snap. If it snaps, it's not aim assist.

**Good game sense vs wallhack:** A 10,000-hour player knows where people are
from audio, storm patterns, and map meta. Rotating to where someone is because
you predicted it from audio is not wallhack. It looks the same in a clip. In
replay, check the audio rings.

**Great builders making pre-edits:** A skilled builder pre-edits windows and
floors because they're making reads — not because they see through walls. Replay
shows their keyboard inputs; they're executing a pre-planned sequence.

**Low-latency hardware:** Sub-100ms reaction times are humanly possible for
elite players. The world record human reaction to a visual stimulus is ~100ms.
A competitive player with 1ms monitor and high FPS routinely fires in 120-180ms.
Not evidence alone.

#### E. How Epic's Anti-Cheat Works (And Why It's Not Enough)

Fortnite uses Easy Anti-Cheat (EAC). It:
- Scans for known cheat software signatures
- Monitors memory injection attempts
- Checks for modified game files

Why it's not enough:
- Kernel-level cheats load before EAC initializes
- Private/paid cheat subscriptions are updated faster than EAC's signatures
- Hardware-level cheats (external overlay on second monitor reading GPU output)
  never touch the game's memory
- EAC bans happen in waves, meaning a cheater can operate for weeks before
  a ban wave hits

bitethatthing fills the gap: **community detection and public exposure** while
Epic's systems catch up.

#### F. Cheat Software Landscape (For Research/Detection Context)

Understanding that cheats exist across a spectrum helps voters calibrate their
verdicts:

- **Free/public cheats:** Lowest quality, detected by EAC quickly. Usually used
  by casual griefers. Easy to spot — obvious aimbot, rage mode.
- **Paid private cheats:** Subscription services ($30-100/month). Updated
  constantly to evade EAC. Harder to detect visually because they include
  humanization settings.
- **Hardware cheats (Cronus Zen, XIM):** Plug-in devices that exploit controller
  aim assist at a hardware level, technically bypassing anti-cheat entirely.
  Used to make a mouse look like a controller to the game engine.
- **Soft aim:** Subtle manipulation, almost always paid, designed specifically
  to avoid detection. Hardest to prove without stat analysis.

#### G. The Legal and Ethical Dimension

**Real names and privacy:** The Fortnite replay system exposes Epic account names.
Epic accounts are created with real names/emails. The connection between alias and
real name is established through Epic's own system, not through any hacking or
doxxing. This site documents what Epic's own software shows.

**What this site is NOT:**
- Not doxxing — we do not find home addresses, phone numbers, social media
  beyond what the player themselves attached to their gaming identity
- Not harassment — posting a name here is not an invitation to contact, threaten,
  or harass. Cases are for the record. The brand is the punishment.
- Not legal action — this is community accountability, not a lawsuit

**What players agree to by playing Fortnite:**
Epic's Terms of Service prohibit cheating. Players who cheat have already
violated the agreement under which their account was created. The real name
associated with that account was provided to Epic voluntarily.

---

## 9. Frontend Vision

### The Design Philosophy

bitethatthing should feel like walking into a federal courthouse that was designed
by the same people who made Fortnite's Season 1 lobby — dark, serious, electric,
alive. Not a Reddit thread. Not a Discord server. A tribunal.

**Three emotional registers:**
1. **Home page:** Power and consequence. Dark. Gold. The feeling that something
   real is at stake here.
2. **Cases feed:** Urgency. An ongoing trial. Things are happening.
3. **Wall of Yella:** Shame. The permanence of the brand. Yellow on black.

### Color System (Fortnite Dark Theme)

```
Background (deep):    #0d1b2a  (navy void)
Background (card):    #0a1628  (slightly lighter void)
Card border:          #1a3a6a  (deep ocean blue)
Primary text:         #e8f0fe  (cold white-blue)
Secondary text:       #7ba7d4  (muted blue)
Muted text:           #5a7fa8  (distant blue)

Electric blue (CTA):  #00c2ff  (the Fortnite spark)
Gold (YELLA/accent):  #f5c400  (the brand)
Green (clear/safe):   #00e676  (not guilty)
Red (danger):         #ff4d4d  (ban, false report warning)
```

### Typography

- **Oswald** — All headlines, brand text, status tags, numbers. Condensed,
  authoritative, Fortnite-adjacent. All-caps where weight is needed.
- **Inter** — All body text, form labels, descriptions. Clean, readable at small
  sizes, never competes with Oswald.

### Animation Principles

- Card hover: `translateY(-2px)` + electric blue border glow. Subtle. Never
  distracting.
- Buttons: `brightness(1.1)` + box-shadow glow on hover. Feels alive.
- Tally bar: Should animate on page load — fill from 0 to actual percentage
  over 600ms with an ease-out. Makes the verdict feel dramatic.
- YELLA cards: Gold glow on hover. Like touching something radioactive.
- Page transitions: Fade in (opacity 0 → 1, 200ms) when switching routes.
  The site should never feel like it snapped.

### Detailed Screen Visions

**Home Page — The Arrival**
The HEADER.png dominates first. Below it, the headline hits hard:
"Catch a cheatin' cho-mo. Earn rewards." in Oswald at 78px.
The subtext explains the stakes. Two CTAs: electric blue primary "Expose a
cho-mo," ghost secondary "See the Wall of Yella." The stat row (YELLA count,
on trial, etc.) grounds everything in reality. The four creed cards below are
the tutorial — they tell you exactly how this works without a wall of text.

**Case Feed — The Docket**
The list of all active and closed cases. Filter tabs across the top.
Each card shows: status badge, alias in Oswald, real name (or "hidden"),
2-line summary, evidence count, vote mini-tally, reporter + tier badge.
Sort by credibility (default) or votes. The highest-credibility reporters'
cases surface first — this is how trust propagates through the system.

Future enhancement: pinned "HOT" cases — cases that crossed 15 net votes
but haven't yet hit 25 — surfaced with a pulse animation on the status badge.

**Case Detail — The Trial**
Full-width status badge at top. Alias in giant Oswald. Real name in gold
if exposed. Reporter card on the right: their tier badge, credibility score,
their verified/dismissed history.

Then the summary — their own words. Then evidence cards. Then the tally bar —
this is the emotional center of the page. The bar fills with electric blue
(guilty) and green (clear). Below the bar: exact counts and distance to verdict.

Voting buttons full-width, stacked on mobile. After voting, the bar
should animate the new vote in real time.

At the bottom: the weight warning — "Marshals count 3×..." This reminds
voters that their vote has consequences in both directions.

**Report Wizard — The Filing**
Three steps feel like filing at a real courthouse:
1. "The Accused" — alias, real name, what happened
2. "The Evidence" — add pieces with type + description
3. "Swear it" — the oath, the review, the submit

The step indicators at the top are numbered pills. Active step has electric
blue border and glow. Completed steps stay filled. The "swear it" step has a
red/gold warning box for the oath text — this is the most serious moment in
the flow and should look like it.

The submit button only activates when all three conditions are met:
alias filled, at least one evidence item, oath checked.

**Wall of Yella — The Shame Gallery**
Black cards with gold borders and gold text. The YELLA stamp in all-caps at
the top of each card, letter-spaced wide, with a gold glow. The alias in white
below it. Real name in gold below the alias. Guilty vote count at the bottom.

This page should feel like a museum of cowardice. Each card should feel heavy.
The hover glow should look like the card is contaminated.

**Knowledge Base — The Encyclopedia**
A searchable reference section. Left sidebar with categories:
- How cheats work
- How to use replay mode
- What counts as evidence
- Common false positive mistakes
- How Epic anti-cheat works
- Legal and ethical guide

Each article is long-form, detailed, authoritative. Search bar at the top
filters articles in real time. Articles link to relevant cases where possible.
("See Case #c1 for a real example of replay-detected aimbot.")

This section makes bitethatthing a resource, not just a vigilante board.

**User Profile Pages**
Public. Shows: handle, tier badge, credibility score and history graph,
verified cases count, dismissed cases count, join date, recent activity.
The credibility graph should be a simple line chart — your rep over time.
Big wins (Marshal cases verified) appear as gold dots on the line.

**Auth Pages (Sign In / Sign Up)**
Clean, centered, dark. The brand at the top. Two steps for sign up:
credentials, then "Take the Oath" — agreement to The Code and acceptance
that bans are permanent. This is not bureaucracy. It is the threshold
between spectator and participant.

---

## 10. Pages & Screens — Complete Spec

### Current Routes
| Route Name | Component | Auth Required |
|---|---|---|
| `home` | `<Home />` | No |
| `feed` | `<Feed />` | No |
| `wall` | `<Wall />` | No |
| `rules` | `<RulesPage />` | No |
| `case` | `<CaseView />` | No (read) / Yes (vote) |
| `report` | `<Report />` | Yes (future — currently open) |

### Future Routes to Add
| Route | Component | Auth Required |
|---|---|---|
| `signin` | `<SignIn />` | No |
| `signup` | `<SignUp />` | No |
| `profile/:handle` | `<UserProfile />` | No (read) |
| `dashboard` | `<MyDashboard />` | Yes |
| `knowledge` | `<KnowledgeBase />` | No |
| `knowledge/:slug` | `<Article />` | No |
| `admin` | `<AdminPanel />` | Admin role only |

---

## 11. Backend Roadmap — Supabase Integration Plan

### Database Schema (Planned)

```sql
-- Users / Profiles
profiles (
  id uuid PRIMARY KEY references auth.users,
  handle text UNIQUE NOT NULL,
  cred integer DEFAULT 50,
  verified_count integer DEFAULT 0,
  dismissed_count integer DEFAULT 0,
  false_flag_count integer DEFAULT 0,
  forgiveness_used integer DEFAULT 0,
  banned boolean DEFAULT false,
  ban_reason text,
  agreed_to_rules boolean NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Cases
cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid references profiles(id),
  alias text NOT NULL,
  real_name text,
  summary text NOT NULL,
  streamer boolean DEFAULT false,
  status text DEFAULT 'open', -- open | verified | dismissed
  guilty_score numeric DEFAULT 0,  -- weighted tally
  not_guilty_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
)

-- Evidence
evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid references cases(id) ON DELETE CASCADE,
  type text NOT NULL,  -- 'Replay screenshot' | 'Clip' | 'Stat anomaly' | 'Other'
  note text NOT NULL,
  url text,  -- future: file upload URL
  created_at timestamptz DEFAULT now()
)

-- Votes
votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid references cases(id),
  voter_id uuid references profiles(id),
  vote text NOT NULL,  -- 'guilty' | 'not_guilty'
  weight numeric NOT NULL,  -- voter's tier weight at time of vote
  created_at timestamptz DEFAULT now(),
  UNIQUE(case_id, voter_id)  -- one vote per user per case
)

-- Bad Faith Flags
bad_faith_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid references cases(id),
  flagged_user_id uuid references profiles(id),
  flagged_by uuid references profiles(id),
  reason text,
  reviewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)
```

### Row Level Security (RLS) Rules

```
profiles: public read, own-row write only
cases: public read, authenticated insert, no user update (status updated by trigger)
evidence: public read, authenticated insert (own cases only)
votes: public read, authenticated insert (own votes only, no update/delete)
bad_faith_flags: authenticated read/insert only
```

### Triggers / Edge Functions

- On vote insert: recalculate `guilty_score` / `not_guilty_score`, check
  thresholds, update `cases.status` if thresholds crossed, update
  `profiles.cred` for reporter if case just resolved
- On case dismissed + bad_faith_flag: increment `profiles.false_flag_count`,
  check if `FALSE_REPORTS_TO_TRIAL` threshold reached, if so create a
  special case against the reporter

### Integration Order
1. Install Supabase client: `npm install @supabase/supabase-js`
2. Create `src/lib/supabase.js` with client init
3. Create `src/hooks/useAuth.js` — wraps Supabase auth
4. Build sign-in / sign-up pages
5. Gate report wizard and vote buttons behind auth
6. Replace mock `USERS` with real `profiles` table reads
7. Replace mock `SEED_CASES` with real `cases` + `evidence` joins
8. Replace `castVote` with Supabase insert + real-time subscription
9. Replace `addCase` with Supabase insert (cases + evidence rows)
10. Wire credibility updates via DB triggers

---

## 12. Next Steps In Order

Work through these in sequence. Do not skip ahead.

### Phase 1 — Auth (Next)
- [ ] Create Supabase project
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Netlify env vars
- [ ] Build `<SignIn />` and `<SignUp />` pages with the oath step
- [ ] Build `useAuth` hook
- [ ] Gate report wizard + vote buttons behind auth
- [ ] Show user's real handle + credibility in nav pill (from DB)
- [ ] Test: sign up, sign in, sign out, banned user flow

### Phase 2 — Real Cases
- [ ] Create Supabase tables (cases, evidence, votes, profiles)
- [ ] Set up RLS
- [ ] Replace mock data with Supabase reads (useEffect + useState)
- [ ] Wire report wizard to insert into `cases` + `evidence`
- [ ] Wire vote buttons to insert into `votes` + real-time tally update
- [ ] Test: file a real case, vote, watch tally update

### Phase 3 — Credibility Engine
- [ ] Write DB trigger: on case status change → update reporter cred
- [ ] Write DB trigger: on vote insert → recalculate weighted scores
- [ ] Build credibility history (stored in a `cred_events` log table)
- [ ] Test: verify a case and watch reporter cred go up

### Phase 4 — Knowledge Base
- [ ] Design article schema (markdown or rich text in Supabase)
- [ ] Build knowledge base index page with search
- [ ] Write all articles (Section 8 above is the source material)
- [ ] Link articles to relevant cases
- [ ] Test: search works, articles render

### Phase 5 — User Profiles
- [ ] Build public profile page (`/profile/:handle`)
- [ ] Credibility score + tier badge
- [ ] Case history (filed, verified, dismissed)
- [ ] Simple credibility line chart
- [ ] Test: profile loads from URL, data is accurate

### Phase 6 — Polish and Scale
- [ ] Mobile nav (hamburger menu)
- [ ] Page transition animations
- [ ] Tally bar animate on load
- [ ] "HOT" case surfacing (near-verdict cases pinned)
- [ ] Evidence file upload (Supabase Storage)
- [ ] Real-time vote updates (Supabase Realtime)
- [ ] Email notifications (case resolved, you've been voted on)
- [ ] SEO meta tags for case pages

---

## 13. File Map

| File | Purpose | Touch it when... |
|---|---|---|
| `src/App.jsx` | Entire app — components, styles, mock data, routing | Adding components, changing UI, wiring backend |
| `src/main.jsx` | ReactDOM entry point | Never, unless changing root |
| `src/index.css` | Global reset | Never |
| `src/bear.png` | Nav + footer logo | Replacing the logo |
| `src/HEADER.png` | Home page hero banner | Replacing the banner |
| `index.html` | HTML shell, favicon, meta | Changing title/meta/favicon |
| `vite.config.js` | Vite + React plugin | Adding Vite plugins |
| `package.json` | Dependencies | Installing new packages |
| `netlify.toml` | Netlify build config | Changing build settings |

---

## 14. Git History

```
3168e2e  Update HEADER.png with correct image
f0b9afc  Fix header banner image not rendering
abffc02  Add HEADER.png as hero banner image
65cb3d5  Fortnite color theme + new hero copy
415281e  Replace bear emoji with bear.png in nav, footer, and favicon
f55abe6  Add netlify.toml build config
35dc3d5  Initial build: bitethatthing cheater accountability tribunal
```

---

*Built by bitethatthing. Evidence over anonymity. Reputation over noise.*
*False witnesses go on trial. When we ban you, you're gone.*
