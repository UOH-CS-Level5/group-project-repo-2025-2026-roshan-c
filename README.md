# ical app example (example app with react + vite + capacitor)

## app setup

run all of these in the mobile folder

```bash
bun install
```

## Web Dev

```bash
bun run dev
```
i wouldnt bother with this as i havent even fixed the web ui yet (it's the same as the mobile one and i cba)
the app expects the backend at `http://localhost:3000` by default, can be configured in the .env file.

## iOS

```bash
bun run ios:open
```
this builds the web app, syncs capacitor, and opens the xcode project

## android

my assumption is that you just do the same as the ios one but with android studio, so instead of `bun run ios:open` you do `bun run android:open`. that might not work though. the commands that run when you run that command will be in the package.json file

## backend

the backend is in the `backend` folder. it's a bun + elysia api that fetches/parses iCal feeds and persists events in sqlite. it's configured to use the `data` folder for the database.

it is crucial to use bun to run this, as it uses bun's sqlite driver, not better-sqlite3 which is available in node.

just run `bun run dev` in the `backend` folder to start the backend.