# Interactive feedback and keyboard actions

Adds saved-work confirmations driven by newly persisted audit events, a completion pulse, page entrances, shortcut help and N-to-create (paused in inputs, contenteditable regions, composition, modified key combinations and dialogs). Existing Cmd/Ctrl+K search remains. Startup history is not replayed as success notifications. Confirmations describe a saved audit event, not a guarantee that every cloud upload succeeded; sync status remains separate.

Database Settings includes animation and optional haptic preferences. Vibration is off by default and feature-detected, requires prior user activation, and is suppressed for reduced motion or hidden pages. Mac desktop/Safari and other unsupported browsers keep visual feedback; browser JavaScript cannot force Mac trackpad haptics. No sound or fake hardware response is added. Reduced-motion preference and the animation toggle suppress transitions, including charts.

Maps to PMS-NF-003 usability and PMS-F-004/005 workflow feedback. These are optional enhancements proposed before the owner freezes development. Native device vibration and screen-reader behavior still require hardware/browser validation; automated tests cover consent, activation, unsupported paths and shortcut isolation.

Source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
# Reference-inspired appearance and motion extension

Adds browser-persisted ivory/evergreen and charcoal/teal themes, compact desktop navigation with accessible icon names/tooltips, and stronger panel borders. Quick appearance controls sit beside shortcut help; full controls are in Database Settings. Existing stored preferences migrate with light theme and expanded navigation as defaults. Invalid preference values fall back safely. If storage is unavailable, changes apply for the session with an explicit unsaved-preferences message.

Additional finite animations cover report-card arrival, point-distribution bars, chart selections, heatmap hover, task rows, preview-drawer entry and map-node/edge entry. Buttons retain press/focus feedback. No perpetual decorative animation or new animation dependency is added. Animations remain enabled by default; the workspace motion preference and system reduced-motion setting suppress them. Compact navigation leaves mobile navigation unchanged. Hardware vibration remains opt-in and capability-dependent.

## Review feedback fixes

Personal save feedback selects only new recent audit events belonging to the current actor. Toast icons use theme tokens. Validated stored appearance applies before React paints sign-in, with a persistent appearance component maintaining it across sign-out/profile changes. Disabled storage and malformed preferences retain usable defaults.
