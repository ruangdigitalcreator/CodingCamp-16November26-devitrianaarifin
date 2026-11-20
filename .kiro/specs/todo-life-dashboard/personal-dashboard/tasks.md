# Implementation Plan: Personal Dashboard

## Overview

The Personal Dashboard is a single-page, client-side web app: one `index.html`, exactly one CSS file (`css/styles.css`), exactly one JavaScript file (`js/app.js`) organized as a single IIFE that exposes a `Dashboard` namespace for test hooks, plus a Manifest V3 `manifest.json`. No frameworks, libraries, or backend. All persistence goes through a Local Storage wrapper with graceful failure.

Implementation builds bottom-up along the dependency direction App → Controllers → Domain Models → Storage: scaffold the entry files, then the Storage layer, then each feature (pure domain model + controller) appended into the single `app.js`, then the App bootstrap that wires controllers to their DOM roots, then final styling and automated integration checks. Because all logic lives in one JS file, every `app.js` edit is sequenced across waves; property tests (each in its own file) are pipelined one wave behind the feature they test so they run in parallel with the next feature's implementation.

## Tasks

- [x] 1. Scaffold project structure and entry files
  - [x] 1.1 Create `index.html` with semantic containers for each component (`#greeting`, `#timer`, `#todo`, `#links`, `#theme-toggle`) and link `css/styles.css` and `js/app.js` via relative paths so it works over `file://` and inside an extension popup
    - _Requirements: 1.1, 8.1, 9.2_
  - [x] 1.2 Create `css/styles.css` skeleton with CSS custom properties for light/dark themes and a minimal base layout/typography shell (full styling completed in task 10)
    - _Requirements: 1.1, 9.1_
  - [x] 1.3 Create `js/app.js` with the top-level IIFE, a `uid()` helper (`crypto.randomUUID()` with a timestamp+random fallback), and a `Dashboard` namespace attached to `window` as the test hook that later sub-tasks populate
    - _Requirements: 1.1, 1.2_
  - [x] 1.4 Create `manifest.json` as a valid Manifest V3 file with `default_popup` set to `index.html`, plus name, version, and description; include an `icons` field only if icon assets are provided (icons are optional in MV3)
    - _Requirements: 1.3, 8.2_
  - [x]* 1.5 Set up the test runner and property-based testing library
    - Add `package.json` with dev dependencies for a JS test runner (e.g., vitest) and a property-based testing library (e.g., fast-check), and a `tests/` directory; configure jsdom so `app.js` can be loaded in tests
    - This is the prerequisite for all `*` test sub-tasks below

- [x] 2. Implement the Storage layer
  - [x] 2.1 Implement the `Storage` object in `app.js` with `KEYS` (`dashboard.tasks`, `dashboard.quickLinks`, `dashboard.theme`), `isAvailable()`, `load(key, fallback)`, `save(key, value)`, and `remove(key)` — each wrapped in try/catch so failures return `false` or `fallback` and never throw; expose `Storage` on the `Dashboard` namespace
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 2.2 Write property test for Storage failure resilience
    - Create `tests/prop-18-storage-failure.test.js` using a failing/missing Local Storage mock
    - **Property 18: Storage failure does not crash the dashboard**
    - **Validates: Requirements 2.3**
    - _Requirements: 2.3_
  - [ ]* 2.3 Write property test for task list persistence round-trip
    - Create `tests/prop-15-task-roundtrip.test.js` against a mock Local Storage
    - **Property 15: Task list persistence round-trip**
    - **Validates: Requirements 2.1, 2.2, 5.5**
    - _Requirements: 2.1, 2.2, 5.5_
  - [ ]* 2.4 Write property test for quick link persistence round-trip
    - Create `tests/prop-16-link-roundtrip.test.js` against a mock Local Storage
    - **Property 16: Quick link persistence round-trip**
    - **Validates: Requirements 2.1, 2.2, 6.5**
    - _Requirements: 2.1, 2.2, 6.5_
  - [ ]* 2.5 Write property test for theme persistence round-trip with light default
    - Create `tests/prop-17-theme-roundtrip.test.js` against a mock Local Storage, including the missing/unreadable case
    - **Property 17: Theme persistence round-trip with light default**
    - **Validates: Requirements 2.1, 2.2, 7.2, 7.3, 7.4**
    - _Requirements: 2.1, 2.2, 7.2, 7.3, 7.4_

- [x] 3. Implement the Greeting feature
  - [x] 3.1 Implement `GreetingModel` (pure: `greetingForHour(hour)`, `greetingForDate(date)`, `formatTime(date)` → HH:MM 24h zero-padded, `formatDate(date)`) and `GreetingCtrl` (renders time/date/greeting into `#greeting` and refreshes on a `setInterval` of ≤ 60000 ms); expose `GreetingModel` on the `Dashboard` namespace
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [ ]* 3.2 Write property test for greeting time and date rendering
    - Create `tests/prop-01-greeting-time.test.js`
    - **Property 1: Greeting displays the current time and date**
    - **Validates: Requirements 3.1**
    - _Requirements: 3.1_
  - [ ]* 3.3 Write property test for greeting period matching the hour
    - Create `tests/prop-02-greeting-period.test.js` over hours 0–23 including the 21:00–04:59 wrap
    - **Property 2: Greeting period matches the hour of day**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement the Focus Timer feature
  - [x] 4.1 Implement `TimerModel` (pure: `INITIAL_SECONDS = 1500`, `reset()`, `start(state)`, `stop(state)`, `tick(state)`, `format(seconds)` → MM:SS) and `TimerCtrl` (binds Start/Stop/Reset, drives a 1-second `setInterval`, stops and shows a "session complete" indicator at 00:00; not persisted); expose `TimerModel` on the `Dashboard` namespace
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 4.2 Write property test for timer reset canonicalization
    - Create `tests/prop-03-timer-reset.test.js`
    - **Property 3: Timer reset always canonicalizes to 25:00**
    - **Validates: Requirements 4.1, 4.4**
    - _Requirements: 4.1, 4.4_
  - [ ]* 4.3 Write property test for timer start countdown
    - Create `tests/prop-04-timer-start.test.js`
    - **Property 4: Timer Start counts down from the currently displayed time**
    - **Validates: Requirements 4.2**
    - _Requirements: 4.2_
  - [ ]* 4.4 Write property test for timer stop pause
    - Create `tests/prop-05-timer-stop.test.js`
    - **Property 5: Timer Stop pauses and retains the displayed time**
    - **Validates: Requirements 4.3**
    - _Requirements: 4.3_
  - [ ]* 4.5 Write property test for timer completion at zero
    - Create `tests/prop-06-timer-complete.test.js`
    - **Property 6: Timer stops and signals completion at zero**
    - **Validates: Requirements 4.5**
    - _Requirements: 4.5_
  - [ ]* 4.6 Write unit test for initial timer display
    - Create `tests/unit-timer-initial.test.js` asserting a fresh `TimerModel.reset()` formats to `25:00`
    - _Requirements: 4.1_

- [x] 5. Implement the To-Do List feature
  - [x] 5.1 Implement `TaskModel` (pure: `create(text)`, `setText(t, text)`, `toggleDone(t)`, `isValidText(text)`) and `TodoCtrl` (add/edit/toggle/delete with persistence via `Storage`, render stored tasks on init, reject empty/whitespace submissions with an inline notice); expose `TaskModel` on the `Dashboard` namespace
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 5.2 Write property test for adding a valid task
    - Create `tests/prop-07-task-add.test.js`
    - **Property 7: Adding a valid task grows the list by exactly one**
    - **Validates: Requirements 5.1**
    - _Requirements: 5.1_
  - [ ]* 5.3 Write property test for task field updates
    - Create `tests/prop-08-task-update.test.js`
    - **Property 8: Task update modifies only the specified field**
    - **Validates: Requirements 5.2, 5.3**
    - _Requirements: 5.2, 5.3_
  - [ ]* 5.4 Write property test for deleting a task
    - Create `tests/prop-09-task-delete.test.js`
    - **Property 9: Deleting a task removes exactly that task**
    - **Validates: Requirements 5.4**
    - _Requirements: 5.4_
  - [ ]* 5.5 Write property test for whitespace task rejection
    - Create `tests/prop-10-task-whitespace.test.js` over spaces, tabs, newlines, and the empty string
    - **Property 10: Whitespace-only task text is rejected**
    - **Validates: Requirements 5.6**
    - _Requirements: 5.6_
  - [ ]* 5.6 Write unit test for completed-task visual distinction
    - Create `tests/unit-task-done.test.js` asserting a toggled task's rendered DOM element receives a distinguishing class
    - _Requirements: 5.3_

- [x] 6. Implement the Quick Links feature
  - [x] 6.1 Implement `LinkModel` (pure: `create(name, url)`, `setName(l, name)`, `setUrl(l, url)`) and `LinksCtrl` (add/edit/remove with persistence, render stored links on init, `openLink` via `window.open(url, '_blank', 'noopener')`); expose `LinkModel` on the `Dashboard` namespace
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 6.2 Write property test for adding a quick link
    - Create `tests/prop-11-link-add.test.js`
    - **Property 11: Adding a valid quick link grows the list by exactly one**
    - **Validates: Requirements 6.1**
    - _Requirements: 6.1_
  - [ ]* 6.3 Write property test for quick link field updates
    - Create `tests/prop-12-link-update.test.js`
    - **Property 12: Quick link update modifies only the specified field(s)**
    - **Validates: Requirements 6.3**
    - _Requirements: 6.3_
  - [ ]* 6.4 Write property test for removing a quick link
    - Create `tests/prop-13-link-remove.test.js`
    - **Property 13: Removing a quick link removes exactly that link**
    - **Validates: Requirements 6.4**
    - _Requirements: 6.4_
  - [ ]* 6.5 Write unit test for opening a quick link
    - Create `tests/unit-link-open.test.js` mocking `window.open` and asserting it is called with the link's URL
    - _Requirements: 6.2_

- [x] 7. Implement the Theme Toggle feature
  - [x] 7.1 Implement `ThemeModel` (pure: `toggle(theme)`, `defaultTheme()`) and `ThemeCtrl` (load theme from `Storage` or default to light on init, toggle and persist, apply via `document.documentElement.setAttribute('data-theme', theme)`); expose `ThemeModel` on the `Dashboard` namespace
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 7.2 Write property test for theme toggle involution
    - Create `tests/prop-14-theme-toggle.test.js`
    - **Property 14: Theme toggle switches to the other theme**
    - **Validates: Requirements 7.1**
    - _Requirements: 7.1_

- [x] 8. Wire the App bootstrap and initialize
  - [x] 8.1 Implement `App.init` to initialize all controllers against their DOM roots (theme first to avoid a flash of the wrong theme) and register it on `DOMContentLoaded`; ensure stored tasks, links, and theme are restored on load. Guard each controller's `init`/`update` against a missing root so the module loads without crashing in a jsdom test environment
    - _Requirements: 2.2, 5.5, 6.5, 7.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Finalize styling and visual design
  - [x] 10.1 Complete `css/styles.css`: page layout and clear visual hierarchy, readable typography, light/dark theme rules keyed on `[data-theme]`, completed-task visual distinction, timer display, greeting area, and a responsive minimal UI requiring no setup
    - _Requirements: 5.3, 7.1, 9.1, 9.2_

- [ ] 11. Add automated integration checks
  - [ ]* 11.1 Write integration test for file structure and packaging
    - Create `tests/integ-structure.test.js` asserting `index.html`, `css/styles.css`, and `js/app.js` exist and are referenced; no external framework/library/backend references are present; and `manifest.json` is valid Manifest V3 with `default_popup` pointing to `index.html`
    - _Requirements: 1.1, 1.2, 1.3, 8.2_
  - [ ]* 11.2 Write integration test for greeting refresh cadence
    - Create `tests/integ-greeting-refresh.test.js` asserting the greeting refresh `setInterval` delay is ≤ 60000 ms
    - _Requirements: 3.6_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; the implementing agent must not implement them unless instructed.
- Each implementation sub-task appends its section into the single `js/app.js` IIFE and exposes its pure model (and, where needed, its controller) on the `Dashboard` namespace so the separate test files can reach it.
- Property test sub-tasks each live in their own file under `tests/` and reference their design property by number plus the requirement clauses they validate; run at least 100 iterations per property per the design's testing strategy.
- Because all JavaScript is in one file, `app.js` edits are sequenced across waves; property tests are pipelined one wave behind their feature so they execute in parallel with the next feature's implementation.
- Manual browser-extension loading and performance timing are intentionally excluded as they are not automatable coding tasks.
- Checkpoints gate the build: task 9 verifies the feature logic tests; task 12 verifies the final styling and integration tests.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8.1"] },
    { "id": 8, "tasks": ["9"] },
    { "id": 9, "tasks": ["10.1", "11.1", "11.2"] },
    { "id": 10, "tasks": ["12"] }
  ]
}
```
