import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}
function token(name: string) {
  const match = css.match(new RegExp(`--color-status-${name}:\\s*(#[a-f\\d]{6})\\s*;`, "i"));
  expect(match, `Token semántico ${name} declarado`).not.toBeNull();
  return match![1]!;
}
it.each(["green", "red", "amber", "blue", "violet", "neutral"])("estado %s conserva contraste legible para texto pequeño", tone => {
  const first = luminance(token(tone)), second = luminance(token(`${tone}-soft`));
  expect((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)).toBeGreaterThanOrEqual(4.5);
});
