import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Screen = "import" | "calendar";
type SourceType = "ical" | "manual";

type CalendarEvent = {
  id: number;
  importId: number | null;
  sourceType: SourceType;
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

type EventApiResponse = {
  count: number;
  events: CalendarEvent[];
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function App() {
  const [screen, setScreen] = useState<Screen>("import");
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [icalUrl, setIcalUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("Manual Entry");
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => events.filter((event) => !event.isCancelled).length,
    [events],
  );

  const handleIcalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!icalUrl.trim()) {
      setError("Paste your iCal link first.");
      return;
    }

    try {
      setIsImporting(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/import/ical`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: icalUrl.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await getRequestError(response));
      }

      const payload = (await response.json()) as EventApiResponse;
      setEvents(payload.events);
      setScreen("calendar");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not import iCal link.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!manualDate || !manualStartTime || !manualEndTime) {
      setError("Add date, start time, and end time before submitting manual entry.");
      return;
    }

    try {
      setIsSavingManual(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/events/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: manualTitle.trim() || "Manual Entry",
          date: manualDate.trim(),
          startTime: manualStartTime.trim(),
          endTime: manualEndTime.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await getRequestError(response));
      }

      const payload = (await response.json()) as EventApiResponse;
      setEvents(payload.events);
      setScreen("calendar");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not save manual event.",
      );
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <main className="app-shell">
      {screen === "import" ? (
        <section className="phone-screen import-screen" data-name="phone" data-node-id="45:258">
          <div className="shape shape-top-right" aria-hidden="true" />
          <div className="shape shape-bottom-left" aria-hidden="true" />

          <header className="hero-block">
            <div className="hero-badge" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="hero-kicker">Semester Planner</p>
            <h1>Import Timetable</h1>
            <p className="hero-copy">Paste your iCal link or add a manual event.</p>
          </header>

          <section className="surface-panel">
            <form className="form-block" onSubmit={handleIcalSubmit}>
              <h2>Import via iCal</h2>
              <label className="line-input">
                <span>iCal Link</span>
                <input
                  type="url"
                  value={icalUrl}
                  onChange={(eventTarget) => setIcalUrl(eventTarget.target.value)}
                  placeholder="https://example.com/timetable.ics"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </label>
              <button className="action-button primary" type="submit" disabled={isImporting}>
                {isImporting ? "Importing..." : "Import timetable"}
              </button>
            </form>

            <div className="divider-line" aria-hidden="true">
              <span>or</span>
            </div>

            <form className="form-block" onSubmit={handleManualSubmit}>
              <h2>Manual entry</h2>
              <label className="line-input">
                <span>Event title</span>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(eventTarget) => setManualTitle(eventTarget.target.value)}
                  placeholder="Seminar"
                />
              </label>

              <label className="line-input">
                <span>Date</span>
                <input
                  type="text"
                  value={manualDate}
                  onChange={(eventTarget) => setManualDate(eventTarget.target.value)}
                  placeholder="DD/MM/YYYY"
                  inputMode="numeric"
                />
              </label>

              <div className="time-row">
                <label className="line-input compact">
                  <span>Start</span>
                  <input
                    type="text"
                    value={manualStartTime}
                    onChange={(eventTarget) => setManualStartTime(eventTarget.target.value)}
                    placeholder="HH:MM"
                    inputMode="numeric"
                  />
                </label>

                <label className="line-input compact">
                  <span>End</span>
                  <input
                    type="text"
                    value={manualEndTime}
                    onChange={(eventTarget) => setManualEndTime(eventTarget.target.value)}
                    placeholder="HH:MM"
                    inputMode="numeric"
                  />
                </label>
              </div>

              <button className="action-button secondary" type="submit" disabled={isSavingManual}>
                {isSavingManual ? "Saving..." : "Add manual event"}
              </button>
            </form>

            {error ? <p className="error-banner">{error}</p> : null}
          </section>
        </section>
      ) : (
        <section className="phone-screen calendar-screen">
          <header className="calendar-header">
            <div>
              <p className="calendar-kicker">Imported schedule</p>
              <h2>Calendar</h2>
              <p className="calendar-subcopy">{activeCount} active events</p>
            </div>
            <button className="calendar-back" type="button" onClick={() => setScreen("import")}>
              Edit import
            </button>
          </header>

          <div className="calendar-panel" data-node-id="45:406">
            {events.length === 0 ? (
              <p className="calendar-empty">No events imported yet.</p>
            ) : (
              events.map((eventRecord) => (
                <article
                  className={`calendar-event ${eventRecord.isCancelled ? "is-cancelled" : ""}`}
                  key={`${eventRecord.id}-${eventRecord.startIso}`}
                >
                  <h3 className="calendar-event-title">
                    {eventRecord.title}
                    {eventRecord.isCancelled ? <span className="event-pill">Cancelled</span> : null}
                  </h3>

                  <div className="calendar-event-meta">
                    <div className="calendar-meta-item">
                      <p className="calendar-meta-label">Time</p>
                      <p className="calendar-meta-value">{eventRecord.timeLabel}</p>
                    </div>
                    <div className="calendar-meta-item">
                      <p className="calendar-meta-label">Date</p>
                      <p className="calendar-meta-value">{eventRecord.dateLabel}</p>
                    </div>
                  </div>

                  {eventRecord.location ? (
                    <p className="calendar-location">{eventRecord.location}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;

async function getRequestError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    return `Request failed (${response.status}).`;
  }

  return `Request failed (${response.status}).`;
}
