# Quality report: revamp 4 ("Daylight", photo-led)

This is a fourth design, deliberately unlike the other three:
- **Enterprise build:** navy and blue.
- **One-pager:** a light page with orange accents.
- **Wizard:** a violet side panel with lime.
- **This build:** a **warm cream page led by real photos**.
  - **Photos:** a living-room photo beside the headline, a photo of the visitor's home or business on the "Address Found" card (laid out like the official one), and a photo banner on each step.
  - **Colour and type:** royal blue for structure, coral for the main action, bright solid service colours, and the Figtree font.

All wording is the official copy from assuredsaving.com, and the official selection and business rules are unchanged. Everything is mocked; nothing is sent anywhere.

## 1. Design-driven development (UI/UX TDD)

The design rules were written first in `tests/design.test.ts`. They failed against the copied foundation (7 of 81 red), and the UI was built until all 82 passed.

| Rule | Checked by |
| --- | --- |
| Flat colour only | No gradient, glow, blur, glass or drop shadow in `app/` or `components/`. The text band over photos is a solid colour, not a fade. |
| Colour roles | Royal blue #1652F0 (white text) for structure. Coral #FF5A3C (ink text) for the main action. Cream #FFF8EE canvas. Five distinct service colours: cyan, pink, lime, sunflower and green. |
| Contrast | Every text/background pair passes WCAG AA. |
| Touch targets | Every button and link is at least 44px. |
| Shape | Pill actions and 20px cards. |
| Type | Figtree only. |
| Photo-led | Step 1 has a `<Photo slot="hero">`. Every photo has a flat fallback, so nothing breaks before photos are added. The header shows a step track with names and no numbers. One step is on screen at a time. |

## 2. UI component unit tests

`tests/components.test.tsx` (15 tests) covers:
- the Button (coral pill);
- the Input, Checkbox, Chip, Slider, segmented control, empty state and modal;
- the service cards (solid colour when selected, official order);
- the address combobox;
- the plan card.

## 3. UI/UX integration tests

`tests/flow.test.tsx` (24) and `tests/callback.test.tsx` (18) drive the whole site. They cover:
- the official selection rules;
- gating on service and address;
- the business rule;
- name gating;
- Back, the browser Back button and reload;
- one step on screen;
- the step track naming the current step;
- photos falling back to drawings;
- the full flow to results;
- Back from results skipping the scan;
- the whole callback form.

axe-core reports 0 violations at step 1, at name, at usage and at results. Every visible text node is checked against the official copy.

**Total: 231 tests passing.** Typecheck, lint, the contrast script and the production build are also clean.

## 4. UX pen tester (empathic attacker), discussed and improved

A separate reviewer drove the production build with Playwright at 1280×720, 1440×900, 390×844, 360×640 and 640×400. It used the keyboard, Spanish, a business address, browser Back, Forward and reload, and the callback form. It reported 12 findings.

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | "Check Availability" was below the fold at every size | Major | **Fixed.** Step 1 is now three blocks. On desktop the services and address card sits beside the headline, with the photo under the headline. On phones the card comes before the photo. The button now ends at 695px at 1280×720 and 742px at 390×844. |
| 2 | At 200% zoom no field was visible after a step change | Major | **Fixed.** On short screens the photo banner and the answers strip are hidden, and the header doesn't stick. |
| 3 | Browser Back from results restored an old scroll position | Major | **Fixed.** `history.scrollRestoration = "manual"`; each step opens at the top. |
| 4 | Browser Forward is ignored | Minor | **Kept.** Forward would skip answering a step again. Back always works. |
| 5 | Focus fell to the page when the callback succeeded | Minor | **Fixed.** Focus moves to the confirmation. |
| 6 | "Schedule Callback" was hidden on phones | Minor | **Fixed.** An icon button appears at all widths, labelled for screen readers. |
| 7 | The business-only choice appeared off-screen | Minor | **Fixed.** It scrolls into view when it appears, and Check Availability switches to the secondary style. |
| 8 | The day and time selects share one name | Minor | **Not done.** The official copy has no separate "day" label, and we use official wording only. The group legend names both. |
| 9 | Disabled Continue can't be reached with Tab | Minor | **Kept.** This is standard disabled behaviour. The reason is in the button text, and the field above explains what is missing. |
| 10 | The bundle chip row is cut off on phones | Polish | **Kept.** The cut-off chip shows the row scrolls. Wrapping would push "Check Availability" below the fold. |
| 11 | The mobile sheet has a drag handle that doesn't drag | Polish | **Fixed.** Handle removed. |
| 12 | The drawing's sun sat behind the HOME/BUSINESS badge | Polish | **Fixed.** The sun moved. The drawings are stand-ins until the real photos arrive (`docs/image-prompts.md`). |

## 5. Simulated users

**Model level, 20,000 journeys** (`tests/simulation.test.ts`, part of `npm test`). **0 violations** of the official selection rules, the business rule, step order, Back or Start Over.

**Browser level, 1000 visitors** (`scripts/simulate.cjs`, Playwright against the production build, 5 at a time, seed 2468). Each visitor clicks random services and bundles, switches language, enters good, bad and no-match addresses, odd names, Back and restarts, the usage and TV steps, plan details and the callback form. The run checks:
- the official rules;
- one step on screen;
- no horizontal overflow;
- sound results;
- callback behaviour.

_Results below._
