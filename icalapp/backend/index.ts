import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import * as ical from "node-ical";

const PORT = Number(Bun.env.PORT ?? 3000);
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ICAL_BYTES = 5_000_000;

const dataDirectory = fileURLToPath(new URL("./data", import.meta.url));
const databasePath = fileURLToPath(new URL("./data/timetable.sqlite", import.meta.url));

mkdirSync(dataDirectory, { recursive: true });

const db = new Database(databasePath, { create: true });

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT NOT NULL,
  imported_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id INTEGER,
  source_type TEXT NOT NULL,
  uid TEXT,
  title TEXT NOT NULL,
  start_iso TEXT NOT NULL,
  end_iso TEXT NOT NULL,
  location TEXT,
  description TEXT,
  is_cancelled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_iso);
CREATE INDEX IF NOT EXISTS idx_events_source_type ON events(source_type);
`);

type CalendarEvent = {
  id: number;
  importId: number | null;
  sourceType: "ical" | "manual";
  uid: string | null;
  title: string;
  startIso: string;
  endIso: string;
  location: string;
  description: string;
  isCancelled: boolean;
  dateLabel: string;
  timeLabel: string;
};

type DbEventRow = {
  id: number;
  importId: number | null;
  sourceType: "ical" | "manual";
  uid: string | null;
  title: string;
  startIso: string;
  endIso: string;
  location: string | null;
  description: string | null;
  isCancelled: number;
};

type ParsedEvent = {
  uid: string;
  title: string;
  startIso: string;
  endIso: string;
  location: string;
  description: string;
  isCancelled: boolean;
};

const insertImport = db.prepare(`
  INSERT INTO imports (source_url, imported_at)
  VALUES (?, ?)
`);

const deleteIcalEvents = db.prepare(`
  DELETE FROM events
  WHERE source_type = 'ical'
`);

const insertEvent = db.prepare(`
  INSERT INTO events (
    import_id,
    source_type,
    uid,
    title,
    start_iso,
    end_iso,
    location,
    description,
    is_cancelled,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectEvents = db.prepare(`
  SELECT
    id,
    import_id AS importId,
    source_type AS sourceType,
    uid,
    title,
    start_iso AS startIso,
    end_iso AS endIso,
    location,
    description,
    is_cancelled AS isCancelled
  FROM events
  ORDER BY start_iso ASC, id ASC
`);

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const saveImportedEvents = db.transaction((url: string, events: ParsedEvent[]) => {
  const importedAt = new Date().toISOString();
  const importResult = insertImport.run(url, importedAt);
  const importId = Number(importResult.lastInsertRowid);

  deleteIcalEvents.run();

  for (const event of events) {
    insertEvent.run(
      importId,
      "ical",
      event.uid,
      event.title,
      event.startIso,
      event.endIso,
      event.location,
      event.description,
      event.isCancelled ? 1 : 0,
      importedAt,
    );
  }

  return importId;
});

const saveManualEvent = db.transaction((event: ParsedEvent) => {
  const createdAt = new Date().toISOString();

  insertEvent.run(
    null,
    "manual",
    event.uid,
    event.title,
    event.startIso,
    event.endIso,
    event.location,
    event.description,
    event.isCancelled ? 1 : 0,
    createdAt,
  );
});

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST"],
    }),
  )
  .get("/api/health", () => ({ ok: true }))
  .get("/api/events", () => {
    const events = getAllEvents();

    return {
      count: events.length,
      events,
    };
  })
  .post(
    "/api/import/ical",
    async ({ body, set }) => {
      const url = body.url.trim();

      if (!isHttpUrl(url)) {
        set.status = 400;
        return { message: "Please provide a valid http or https iCal URL." };
      }

      try {
        const icsText = await fetchIcalText(url);
        const parsedEvents = await parseIcalEvents(icsText);
        const importId = saveImportedEvents(url, parsedEvents);
        const events = getAllEvents();

        return {
          importId,
          importedCount: parsedEvents.length,
          count: events.length,
          events,
        };
      } catch (error) {
        set.status = 400;

        return {
          message: error instanceof Error ? error.message : "Failed to import iCal file.",
        };
      }
    },
    {
      body: t.Object({
        url: t.String(),
      }),
    },
  )
  .post(
    "/api/events/manual",
    ({ body, set }) => {
      const manualEvent = createManualEvent(body);

      if (manualEvent instanceof Error) {
        set.status = 400;
        return { message: manualEvent.message };
      }

      saveManualEvent(manualEvent);
      const events = getAllEvents();

      return {
        count: events.length,
        events,
      };
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        date: t.String(),
        startTime: t.String(),
        endTime: t.String(),
      }),
    },
  )
  .listen(PORT);

console.log(`Backend running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`SQLite database: ${databasePath}`);

function getAllEvents(): CalendarEvent[] {
  const rows = selectEvents.all() as DbEventRow[];

  return rows.map((row) => {
    const startDate = new Date(row.startIso);

    return {
      id: row.id,
      importId: row.importId,
      sourceType: row.sourceType,
      uid: row.uid,
      title: row.title,
      startIso: row.startIso,
      endIso: row.endIso,
      location: row.location ?? "",
      description: row.description ?? "",
      isCancelled: row.isCancelled === 1,
      dateLabel: formatDate(startDate),
      timeLabel: formatTime(startDate),
    };
  });
}

function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return dateFormatter.format(date);
}

function formatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "Invalid Time";
  }

  return timeFormatter.format(date);
}

function createManualEvent(payload: {
  title?: string;
  date: string;
  startTime: string;
  endTime: string;
}): ParsedEvent | Error {
  const title = payload.title?.trim() || "Manual Entry";
  const dateValue = parseDateValue(payload.date);

  if (!dateValue) {
    return new Error("Date must use DD/MM/YYYY or YYYY-MM-DD format.");
  }

  const start = parseTimeValue(payload.startTime);
  const end = parseTimeValue(payload.endTime);

  if (!start || !end) {
    return new Error("Time must use HH:MM format.");
  }

  const startDate = new Date(
    dateValue.year,
    dateValue.month - 1,
    dateValue.day,
    start.hours,
    start.minutes,
    0,
    0,
  );

  const endDate = new Date(
    dateValue.year,
    dateValue.month - 1,
    dateValue.day,
    end.hours,
    end.minutes,
    0,
    0,
  );

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return new Error("Manual event date or time is invalid.");
  }

  if (endDate <= startDate) {
    return new Error("End time must be after start time.");
  }

  return {
    uid: `manual-${crypto.randomUUID()}`,
    title,
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    location: "",
    description: "Created manually",
    isCancelled: false,
  };
}

async function fetchIcalText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/calendar, text/plain;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download iCal file (${response.status}).`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_ICAL_BYTES) {
      throw new Error("iCal file is too large.");
    }

    const icsText = await response.text();

    if (icsText.length > MAX_ICAL_BYTES) {
      throw new Error("iCal file is too large.");
    }

    if (!icsText.includes("BEGIN:VCALENDAR")) {
      throw new Error("URL did not return an iCal file.");
    }

    return icsText;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out while downloading the iCal file.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseIcalEvents(icsText: string): Promise<ParsedEvent[]> {
  const parsed = await ical.async.parseICS(icsText);
  const events: ParsedEvent[] = [];

  for (const value of Object.values(parsed)) {
    if (!value || value.type !== "VEVENT") {
      continue;
    }

    const startIso = toIso(value.start);
    if (!startIso) {
      continue;
    }

    const endIso = toIso(value.end) ?? startIso;
    const title = safeText(value.summary, "Untitled Event");
    const description = safeText(value.description);
    const location = safeText(value.location);
    const status = safeText(value.status).toUpperCase();
    const isCancelled =
      status === "CANCELLED" ||
      /\[CANCELLED\]/i.test(title) ||
      /Type:\s*CANCELLED/i.test(description);

    events.push({
      uid: safeText(value.uid, crypto.randomUUID()),
      title,
      startIso,
      endIso,
      location,
      description,
      isCancelled,
    });
  }

  events.sort((left, right) => left.startIso.localeCompare(right.startIso));
  return events;
}

function toIso(value: unknown): string | null {
  if (!(value instanceof Date)) {
    return null;
  }

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

function safeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function parseDateValue(value: string): { year: number; month: number; day: number } | null {
  const trimmed = value.trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    if (isValidDateParts(year, month, day)) {
      return { year, month, day };
    }

    return null;
  }

  const ukMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!ukMatch) {
    return null;
  }

  const day = Number(ukMatch[1]);
  const month = Number(ukMatch[2]);
  const year = Number(ukMatch[3]);

  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return { year, month, day };
}

function parseTimeValue(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1970) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
