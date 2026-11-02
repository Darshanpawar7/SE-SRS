# Workspace recovery

A React error boundary around the providers and app replaces a blank screen after a render/lifecycle exception with retry and reload actions. Neither action clears browser storage. Retrying remounts the failed subtree; transient UI/form state may be lost. Errors are logged to the developer console, not sent to a service. Event-handler and asynchronous request failures still use existing local error handling; this boundary does not replace those paths.

Manual check: use a development-only throwing child to trigger a real render error; confirm fallback renders, persisted data remains, and retry renders again when the fault is removed. No production crash-test switch is shipped.
