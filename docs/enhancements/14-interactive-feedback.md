# Interactive feedback and keyboard actions

Adds saved-work confirmations driven by newly persisted audit events, a completion pulse, page entrances, shortcut help and N-to-create (paused in inputs, contenteditable regions, composition, modified key combinations and dialogs). Existing Cmd/Ctrl+K search remains. Startup history is not replayed as success notifications. Confirmations describe a saved audit event, not a guarantee that every cloud upload succeeded; sync status remains separate.

Database Settings includes animation and optional haptic preferences. Vibration is off by default and feature-detected, requires prior user activation, and is suppressed for reduced motion or hidden pages. Mac desktop/Safari and other unsupported browsers keep visual feedback; browser JavaScript cannot force Mac trackpad haptics. No sound or fake hardware response is added. Reduced-motion preference and the animation toggle suppress transitions, including charts.

Maps to PMS-NF-003 usability and PMS-F-004/005 workflow feedback. These are optional enhancements proposed before the owner freezes development. Native device vibration and screen-reader behavior still require hardware/browser validation; automated tests cover consent, activation, unsupported paths and shortcut isolation.

Source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
