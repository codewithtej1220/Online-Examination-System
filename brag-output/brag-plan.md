# /brag plan — OES Pro

**What it is:** An online examination system where faculty turn study notes into a proctored exam, students sit it under camera/mic/tab-switch monitoring, it's graded the moment they submit, and a 3D assistant (Ava) reviews the result and answers their doubts.
**For:** Colleges — faculty who write and run exams, students who take them, admins who oversee them.
**What sets it apart:** Notes → MCQs → full exam in one flow, plus a friendly 3D study guide instead of a chatbot box.
**Most impressive claim:** Paste notes, get a proctored exam, graded instantly.
**Visual hook:** Big wave-in type over flowing light waves: "Paste your notes. / Get a proctored exam."
**Tone:** default (punchy, playful, clean), with soft wave wipes between scenes.
**Share caption:** see `share-copy.txt`.

## Visual identity (from the codebase)
- Background `#060816` (deep navy), glows: indigo `#6366f1`, violet `#7c3aed`, emerald `#10b981` (the app's role colours / `.hero-orb`s)
- Type: Plus Jakarta Sans 800 (headings), Inter (UI) — loaded by `index.html`
- Real UI captured from the running app in dark mode (Chrome DevTools protocol), cropped into components; Ava is the real three.js mascot, captured as a transparent sequence.
- **Wave effect:** layered sine-wave ribbons react to the kick drum; scene changes are liquid wave wipes (dip through the background, never a double exposure); headlines rise in letter-by-letter waves.

## Music
Original, synthesized for this video: 120 BPM (beat = 0.5s = 15 frames), C major, I–V–vi–IV (C G Am F). Hook is pad + plucked arpeggio only; soft kick, sub bass and hats enter on the reveal (3.5s); ends resolving on C. Whooshes ride into each wipe, soft ticks on simulated clicks, a bell chime when the score lands — all in key and on the same grid, mixed under the music.

## Storyboard (21.0s, 30fps, cuts on beats)
| # | Time | Scene | On screen |
|---|---|---|---|
| 1 | 0.0–3.5 | **Hook** | "Paste your notes." / "Get a proctored exam." waves in over glowing ribbons |
| 2 | 3.5–6.0 | **Reveal** | OES Pro logo, real tagline "Exams, reimagined for every classroom.", Ava waves: "Hi, I'm Ava!" |
| 3 | 6.0–10.0 | **Highlight 1 — Notes → Questions** | Real notes panel; cursor clicks *Generate questions*; real generated MCQ cards fly in one per beat. Title: "Notes in. Questions out." |
| 4 | 10.0–14.0 | **Highlight 2 — Proctoring** | Real proctoring checklist lights up row by row; then the real exam card, cursor picks *Semaphore*. Title: "AI-proctored, start to finish." |
| 5 | 14.0–18.0 | **Highlight 3 — Grading + Ava** | Real result card, score ring counts to 88%, chime; Ava's real review panel slides in; swaps to Ava answering "What is normalization?". Titles: "Graded instantly. Reviewed by Ava." → "Doubts? Ask Ava." |
| 6 | 18.0–21.0 | **Outro** | Ava + logo, "Create · Proctor · Grade", repo URL |

## Data notes
- All accounts shown are local demo accounts (`demo_faculty`, `demo_student`); exams and questions were generated through the app's own generator from sample notes. No real users, emails or secrets appear.
- The Chrome fake-camera test pattern is masked with a neutral "camera live" tile.
- The 88% result was produced by actually taking the exam in the app (7/8 answered correctly).
