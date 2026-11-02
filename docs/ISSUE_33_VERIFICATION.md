# PMS-NF-003 Accessibility Verification

## Changes and automated checks

- Task cards are focusable `role="button"` controls. Enter and Space open the task; other keys do nothing. The quick-advance button is a separate, named control outside the card button role.
- The Kanban board and workflow columns have accessible names. Search and filter controls have accessible names; the workspace navigation has a label.
- Task, sprint, project, and Supabase settings dialogs have dialog names and modal semantics. Visible form labels point to control IDs; profile radio controls remain wrapped by their labels. Story point buttons are grouped under a named group.
- Validation and save errors use alert roles. Task and priority controls reference task form errors, and the sprint-name and Supabase URL controls reference their corresponding errors.
- `npm test -- src/tests/accessibility.test.jsx` checks Enter/Space activation, ignored keys and child events, task card semantics, and task form label associations. The full project test suite also covers the primary features.

## Contrast checks

Ratios below were calculated from the declared CSS foreground/background hex colors using the WCAG relative luminance formula. Normal text uses the 4.5:1 threshold; focus indicators use the 3:1 non-text threshold.

| Foreground | Background | Ratio | Result |
| --- | --- | ---: | --- |
| `#29262a` main text | `#f4f1eb` page | 13.26:1 | Pass |
| `#69616a` muted text | `#fffdf9` card | 5.87:1 | Pass |
| `#6f6573` placeholder | `#fffdf9` input | 5.46:1 | Pass |
| `#6f6573` placeholder | `#f4f1eb` page | 4.92:1 | Pass |
| `#a47a38` focus outline | `#eae5de` board column | 3.09:1 | Pass |
| `#f5e5c8` sidebar focus outline | `#473447` active nav item | 9.15:1 | Pass |
| `#ffffff` primary button text | `#56364e` button | 10.33:1 | Pass |
| `#86601e` high priority text | `#f3ead7` badge | 4.74:1 | Pass |
| `#a13838` error text | `#f9e9e5` error surface | 5.68:1 | Pass |

## Lighthouse and manual assistive technology

Lighthouse was not run, so no accessibility score is claimed. Lighthouse, Puppeteer, and Playwright packages are not present in this checkout. To record the issue's Lighthouse score: run `npm run build`, then `npm run preview -- --host 127.0.0.1`; open `http://127.0.0.1:4173/` in Chrome and sign in through the existing profile flow; open DevTools → Lighthouse; select the Accessibility category and Navigation mode; run the audit and save the report for the root Kanban route.

Live keyboard and screen-reader verification was not completed because the in-app browser connection could not be initialized in this session. The Vitest checks above are automated markup and handler checks; they do not substitute for testing the live workflow with a keyboard and a screen reader such as NVDA or VoiceOver.
