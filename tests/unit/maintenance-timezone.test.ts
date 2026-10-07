import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("tests/e2e/intermediation.spec.ts", "utf8");
const expression = source.match(/update public\.job_openings set closing_date = (.*?) where id =/)![1];
const buenosAiresYesterday = "(clock_timestamp() at time zone 'America/Buenos_Aires')::date - 1";
const dayMs = 24 * 60 * 60 * 1000;

// Only model the two known SQL expressions; never evaluate arbitrary source text.
function fixtureClosingDate(instant: string): string {
  let calendarDate: string;
  if (expression === "current_date - 1") {
    // Reproduce CI's UTC database session date.
    calendarDate = instant.slice(0, 10);
  } else {
    expect(expression).toBe(buenosAiresYesterday);
    calendarDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(instant));
  }
  return new Date(Date.parse(`${calendarDate}T00:00:00Z`) - dayMs).toISOString().slice(0, 10);
}

// T034: the exclusive deadline is midnight BA on the day AFTER closing_date.
function expiryUtc(closingDate: string): number {
  return Date.parse(`${closingDate}T03:00:00Z`) + dayMs;
}

describe("maintenance E2E closing-date fixture", () => {
  it("uses an explicit Buenos Aires wall-clock date rather than the session date", () => {
    expect(expression).toBe(buenosAiresYesterday);
  });

  it.each([
    ["2026-10-06T01:00:00.000Z", "2026-10-04"],
    ["2026-10-06T02:59:59.999Z", "2026-10-04"],
    ["2026-10-06T03:00:00.000Z", "2026-10-05"],
  ])("actual fixture is already expired at %s", (instant, yesterday) => {
    const closingDate = fixtureClosingDate(instant);
    expect(closingDate).toBe(yesterday);
    expect(expiryUtc(closingDate)).toBeLessThanOrEqual(Date.parse(instant));
  });

  it("a UTC-yesterday closing date is not expired before 03:00 UTC", () => {
    const deadline = expiryUtc("2026-10-05");
    expect(deadline).toBeGreaterThan(Date.parse("2026-10-06T01:00:00.000Z"));
    expect(deadline).toBeGreaterThan(Date.parse("2026-10-06T02:59:59.999Z"));
    expect(deadline).toBe(Date.parse("2026-10-06T03:00:00.000Z"));
  });
});
