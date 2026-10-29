import { expect, it } from "vitest";
import { formatCalendarDate, formatFunesDate, formatFunesDateTime } from "@/lib/time/presentation";

it("conserva fechas calendario y valida bisiestos sin zona horaria", () => {
  expect(formatCalendarDate("2026-10-01")).toBe("01/10/2026");
  expect(formatCalendarDate("0001-01-01")).toBe("01/01/0001");
  expect(formatCalendarDate("2024-02-29")).toBe("29/02/2024");
  expect(formatCalendarDate("2023-02-29")).toBe("2023-02-29");
});
it("presenta instantes en Funes con ceros y año completo", () => {
  expect(formatFunesDate("2026-10-01T01:00:00Z")).toBe("30/09/2026");
  expect(formatFunesDateTime("2026-01-02T03:04:05Z")).toBe("02/01/2026, 00:04:05");
  expect(formatFunesDateTime("2031-01-01T00:00:00Z")).toBe("31/12/2030, 21:00:00");
  expect(formatFunesDateTime("2026-10-01T12:04:05-03:00", { seconds: false })).toBe("01/10/2026, 12:04");
});
it("no interpreta calendarios o valores sin zona como instantes", () => {
  expect(formatFunesDate("2026-01-01")).toBe("01/01/2026");
  for (const value of ["", "fecha", "2026-01-01T12:00", "2026-01-01"]) {
    expect(formatFunesDateTime(value)).toBe("Fecha no disponible");
  }
});
