import { describe, expect, it } from "vitest";
import { courseLinkSchema } from "@/validation/training";

describe("municipal course links", () => {
  it("accepts an administrator-supplied HTTPS link without fetching it", () => {
    expect(courseLinkSchema.parse({ title: " Curso municipal ", url: "https://funes.gob.ar/capacitacion" })).toEqual({ title: "Curso municipal", url: "https://funes.gob.ar/capacitacion", published: true });
  });
  it.each(["javascript:alert(1)", "http://funes.gob.ar/curso", "https://user:password@funes.gob.ar/curso", "https://funes.gob.ar\\@evil.test/curso", "https://funes.gob.ar/%0a", "https://funes.gob.ar:443/curso", "https://localhost/curso", "https://127.0.0.1/curso", "https://funes.gob.ar/ curso"])("rejects unsafe link %s", url => {
    expect(courseLinkSchema.safeParse({ title: "Curso", url }).success).toBe(false);
  });
  it("rejects blank or overlong titles and permits an unpublished link", () => {
    for (const title of [" ", "x".repeat(201)]) expect(courseLinkSchema.safeParse({ title, url: "https://funes.gob.ar/curso" }).success).toBe(false);
    expect(courseLinkSchema.parse({ title: "Curso", url: "https://funes.gob.ar/curso", published: false }).published).toBe(false);
  });
});
