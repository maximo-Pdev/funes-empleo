import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

it("supports Vercel's managed Node 24 while pinning local and CI tooling", () => {
  const manifest = readJson("package.json");
  const lock = readJson("package-lock.json");
  const vercel = readJson("vercel.json");
  const localNode = readFileSync(resolve(process.cwd(), ".node-version"), "utf8").trim();
  const ci = readFileSync(resolve(process.cwd(), ".github/workflows/quality.yml"), "utf8");

  expect(manifest.engines.node).toBe("24.x");
  expect(lock.packages[""].engines).toEqual(manifest.engines);
  expect(localNode).toBe("24.22.0");
  expect(manifest.engines.npm).toBe("11.19.1");
  expect(manifest.packageManager).toBe("npm@11.19.1");
  expect(ci.match(/node-version-file: \.node-version/g)).toHaveLength(2);
  expect(ci.match(/npm install --global npm@11\.19\.1/g)).toHaveLength(2);
  expect(vercel.installCommand).toBe("npm install --global npm@11.19.1 && npm ci");
});
