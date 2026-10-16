# UI regression checks

The site runs directly from a static HTTP server; npm is only used for tests.

```sh
npm ci
npx playwright install chromium
npm test
```

If Chromium is already installed, set `CHROMIUM_PATH` to its executable instead
of downloading a browser. The tests automatically use `/usr/bin/chromium` when
available.

These browser tests exercise the campaign renderers in isolated DOM fixtures.
They check multi-digit stat editing, focus, derived bonuses, read-only stats,
shop search and filters, selection, and purchase indices without connecting to
or modifying Firebase data. Hub checks also cover pointer-event batching,
reduced motion, and keyboard navigation.

Calculator checks cover proficiency overrides (including zero), initiative,
and switching characters. Mobile checks load the real campaign HTML, CSS, and
shared navigation module while blocking campaign/Firebase modules. They verify
full-width sheets, menu positioning, Escape and outside-click dismissal,
keyboard focus, and resizing back to desktop.
