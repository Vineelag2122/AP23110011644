# notification_app_stage2

Stage 2 frontend for the campus notifications evaluation.

## Run

```bash
npm install
npm run dev
```

The app runs on http://localhost:3000.

## Pages

- `/` - all notifications with paging and type filters
- `/priority` - priority inbox with top N and type filtering

## Notes

- Material UI is used for styling.
- Viewed state is stored in browser local storage.
- The notification cards open a dialog popup for details and can be marked as viewed.
- Add the required video recording of desktop and mobile views to the repository submission manually.
