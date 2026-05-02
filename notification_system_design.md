# Notification System Design

## Stage 1

This document explains the Stage 1 approach for the Campus Notifications Microservice task: how notifications are fetched, prioritized, marked as seen, and logged.

## Repository Structure

- `notification_app_fe/`
	- Runnable React + Vite frontend application.
	- Contains UI, priority logic, and API integration.
- `logging_middleware/`
	- Shared logging middleware implementation used by frontend.
	- File: `logging_middleware/middleware.js`.
- `notification_app_be/`
	- Backend placeholder folder for future stages.
- `output_screenshots/`
	- Stores output screenshots required for submission.
- `notification_system_design.md`
	- This design/approach document.
- `.gitignore`
	- Ignores `node_modules`, build outputs, and logs.

## Functional Goals Implemented

1. Fetch notifications from protected API endpoint.
2. Compute priority based on type weight and recency.
3. Show top `n` notifications efficiently.
4. Support filtering by type (`All`, `Placement`, `Result`, `Event`).
5. Distinguish unread/seen notifications.
6. Mark notification as seen when opened for details.
7. Log request lifecycle and app actions through logging middleware.

## API Integration

- Notifications endpoint:
	- `GET http://20.207.122.201/evaluation-service/notifications`
- Authorization:
	- `Authorization: Bearer <token>` header is attached during request.
- Response usage:
	- Reads `notifications` array and normalizes each item into:
		- `id` from `ID`
		- `type` from `Type`
		- `message` from `Message`
		- `timestamp` from `Timestamp`
		- `timestampMs` as parsed epoch milliseconds

## Priority/Weightage Calculation

### Type Weight

- `Placement` = 3
- `Result` = 2
- `Event` = 1

This follows required business priority: `Placement > Result > Event`.

### Recency Contribution

- Each notification timestamp is converted to epoch milliseconds.
- More recent notifications have larger `timestampMs` values.

### Final Score Formula

For each notification:

$$
score = (typeWeight \times 10^{12}) + timestampMs
$$

Reason:
- `typeWeight * 10^12` creates clear tier separation by category.
- `timestampMs` then orders notifications within the same category by recency.

So, any `Placement` will rank above any `Result`, and any `Result` above any `Event`; inside each type, latest timestamp comes first.

## Efficient Top-N Strategy

To avoid sorting the full dataset every time, the app maintains a bounded min-heap of size `n`:

1. Iterate through notifications.
2. Skip items that do not satisfy active filters.
3. Push `(notification, score)` into min-heap.
4. If heap size exceeds `n`, remove smallest score.
5. After iteration, sort heap descending by score for final display.

Complexity:
- Time: `O(m log n)` where `m` = candidate notifications.
- Space: `O(n)` for heap.

## Seen/Unread Behavior

- Seen state stored as ID set in local storage key: `campus-inbox-seen-ids`.
- A card is `Unread` if ID not in seen set.
- A card becomes `Seen` when:
	- User clicks "Mark visible as seen", or
	- User opens card details (click-to-expand behavior).

## Notification Details UX

When a user clicks a notification card:

1. Card toggles expanded details panel.
2. The notification ID is added to seen set immediately.
3. Extra fields shown:
	 - Notification ID
	 - Type weight
	 - Priority score
	 - Raw timestamp

This satisfies requirement that opening/reading an item should mark it seen.

## Logging Middleware Design

Middleware location: `logging_middleware/middleware.js`

Responsibilities:

1. Create structured logs (`id`, `timestamp`, `level`, `message`, `meta`).
2. Keep in-memory log buffer for UI display.
3. Provide pub/sub via `subscribe()`.
4. Wrap fetch via `fetchWithLogging()` and log:
	 - `request-start`
	 - `request-success` (status, duration, sample body)
	 - `request-failure` (error, duration)
5. Attach bearer token when configured.
6. Optionally forward logs to remote endpoint.

## Frontend Flow Summary

1. User sets top `n`, type filter, and unread filter.
2. User clicks `Load notifications`.
3. App fetches notifications with auth token.
4. Data is normalized and scored.
5. Top `n` are selected using heap.
6. UI renders cards with seen/unread state.
7. User can expand a card to view details and mark it seen.
8. Middleware logs every critical action.

## Submission Artifacts

- Code: repository folders listed above.
- Design: this `notification_system_design.md`.
- Screenshots: place in `output_screenshots/`.
