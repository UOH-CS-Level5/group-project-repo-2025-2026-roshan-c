# VITAL Sprint Slides (One-Slide Each)

## Sprint: Import/Create Student Timetable (iCal-first)
- Goal: iCal URL import + preview + save + refresh; manual entry fallback.
- Scope: iCal fetch/parse, timezone conversion, cancel handling, weekly normalization, local storage, refresh action, basic day-grouped view.
- Plan (1 week): model + import flow -> validation/errors -> persistence + refresh -> manual fallback + view.
- Key risks: missing RRULE, multi-week feed selection, cancelled events, UTC vs local time.
- Definition of Done: import/refresh/manual paths work, bad data handled cleanly, schedule persists across restarts.

## Sprint: Reward per Completed Requirement
- Goal: award rewards when a requirement is completed.
- Scope: define requirement events, trigger reward logic, log rewards, show feedback.
- Plan (1 week): map requirements -> reward rules -> event triggers -> UI feedback.
- Key risks: duplicate triggers, unclear requirement definitions.
- Definition of Done: rewards fire exactly once per completion and are visible to user.

## Sprint: Track Gold
- Goal: track user gold balance reliably.
- Scope: gold balance model, earn/spend APIs, persistence, basic display.
- Plan (1 week): data model -> earn/spend logic -> storage -> UI display.
- Key risks: double counting, sync conflicts.
- Definition of Done: gold updates correctly, persists across restarts, visible in UI.

## Sprint: Dragon Upgrades by Gold Amount
- Goal: dragon stage upgrades based on gold thresholds.
- Scope: define stages + thresholds, upgrade logic, UI indicator.
- Plan (1 week): stage rules -> upgrade checks -> visual state -> tests.
- Key risks: unclear thresholds, upgrade edge cases on refresh.
- Definition of Done: stage changes at correct gold amounts and is reflected in UI.

## Sprint: Dragon Stages (5 total, 2 vital)
- Goal: represent dragon growth across key stages.
- Scope: define 5 stages, implement 2 vital stage assets, mapping rules.
- Plan (1 week): stage list -> 2 core assets -> integrate stage mapping.
- Key risks: art delays, unclear stage naming.
- Definition of Done: 2 vital stages render correctly and map to progression rules.

## Sprint: Placeholder Resources
- Goal: add placeholder assets so UI flows are presentable.
- Scope: placeholder icons, images, and text labels.
- Plan (1 week): identify missing assets -> create placeholders -> integrate.
- Key risks: missing asset inventory, inconsistent sizing.
- Definition of Done: no empty UI slots; placeholders are consistent and readable.

## Sprint: Dragon Design (Core Asset)
- Goal: finalize base dragon design for use across UI.
- Scope: base dragon asset + basic variants (static).
- Plan (1 week): design draft -> review -> finalize -> export.
- Key risks: visual direction changes, export formats.
- Definition of Done: approved base dragon asset exported and integrated.

## Sprint: UI Design (Core Layouts)
- Goal: establish core UI layout for schedule + rewards.
- Scope: main screens layout, navigation structure, visual style tokens.
- Plan (1 week): wireframes -> style guide -> key screens.
- Key risks: scope creep, inconsistent styling.
- Definition of Done: key screens are designed and ready for implementation.

## Sprint: Gold Pile Stages (2 stages)
- Goal: show visual gold pile progression at two stages.
- Scope: 2 visual assets + threshold mapping.
- Plan (1 week): define thresholds -> create assets -> integrate mapping.
- Key risks: asset delays, unclear thresholds.
- Definition of Done: gold pile changes at defined thresholds and renders correctly.
