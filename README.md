# GTU PREP — Semester 3 Exam Preparation Website

A complete exam preparation tracker for the five Semester 3 Diploma Computer
Engineering subjects, built from the uploaded question bank + GTU paper PDFs.

## How to run

1. Unzip this folder anywhere.
2. Double-click `index.html` — it opens in Chrome or Edge and works fully
   offline. No install, no server, no login.

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | The app shell (navigation, modal, toast) |
| `styles.css` | Design system — light & dark themes |
| `app.js` | All behaviour: tracking, filters, revision, export/import |
| `data.js` | Every question extracted from the five PDFs (425 questions) |

## Features

- **Dashboard** — total subjects, total / completed / pending questions and
  overall completion %, plus a progress bar per subject (CN, DEF, DS, FOS,
  RDBMS). Everything recalculates instantly.
- **Subjects** — each subject has its own dashboard with two sections:
  *Question Bank* and *GTU Papers* (Summer 2026 + Winter 2025, OR questions
  included separately, marks preserved).
- **ON/OFF tracking** — a toggle beside every question. OFF = pending,
  ON = completed. States save automatically to `localStorage` and survive
  refreshes and browser restarts.
- **Study** — global question search, filter by subject, source (question bank
  or a specific paper) and status (all / pending / completed / marked).
- **Revision** — tap the repeat button on any question to practise it again
  later.
- **Settings** — light/dark theme, JSON progress export & import, reset with
  confirmation.
- **Navigation** — a premium floating bar fixed at the bottom centre with an
  animated active indicator, hover animations and page transitions.

## Progress data

All progress lives in your browser under the key `gtu-prep-v1`. Use
Settings → Export to back it up or move it to another computer, and
Settings → Import to restore it.

## Question counts (verified against the PDFs)

| Subject | Question bank | GTU papers | Total |
| --- | --- | --- | --- |
| CN | 25 | 56 | 81 |
| DEF | 25 | 56 | 81 |
| DS | 28 | 56 | 84 |
| FOS | 30 | 56 | 86 |
| RDBMS | 37 | 56 | 93 |
| **Total** | **145** | **280** | **425** |

Note: the Data Structures question bank in the source PDF numbers 1–13 and
15–29 (question 14 is not present in the PDF), so 28 questions are shown as
printed.
