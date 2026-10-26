# Issue #11: Task labels and tags

Labels typed in the task dialog are normalised into short lowercase tags: surrounding spaces and a leading `#` are removed, inner spaces become hyphens, and each tag is at most 24 characters. Enter or a comma adds a label (a pasted comma-separated list adds each label), the × on a pill removes it, and a label still being typed when the task is saved is kept instead of dropped. Each task card shows one pill per distinct label. If moving a card fails to save, the board now says why instead of failing silently.

Automated cases cover normalisation, adding and removing labels, blank and duplicate input, cleanup of older label lists, distinct pill rendering, and labels surviving a save and reload through the data service.

Manual check: create a task with the labels "UI", "#api" and "ui" and save it. The card should show exactly two pills, #ui and #api. Reopen the task, remove #ui, save, reload the page, and confirm only #api remains.

## Validation

Verified on 26 October 2026: `npm test` (71 passing tests), `npm run build`, and `npm run lint` (zero errors; two existing advisory effect warnings).
