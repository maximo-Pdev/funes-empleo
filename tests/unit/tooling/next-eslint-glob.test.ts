// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Linter } from "eslint";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js") as {
  getRootDirs(context: { cwd: string; settings: { next?: { rootDir?: unknown } } }): string[];
};
const plugin = require("@next/eslint-plugin-next") as NonNullable<Linter.Config["plugins"]>[string];
const ruleId = "@next/next/no-html-link-for-pages";

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

type GlobAdapter = { globSync(pattern: unknown, options?: unknown): string[] };
type LockPackage = {
  link?: boolean;
  resolved?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

// Only synthetic files; no application environment, credentials or data loaded.
// Keep temporary fixtures for diagnosis rather than running deletion operations.
const fixture = mkdtempSync(path.join(tmpdir(), "next-eslint-glob-"));
const roots = ["fakeNext", "otherNext"].map((name) => path.join(fixture, name));
for (const root of roots) {
  mkdirSync(path.join(root, "pages"), { recursive: true });
  mkdirSync(path.join(root, "src", "nested"), { recursive: true });
  writeFileSync(path.join(root, "pages", "about.tsx"), "export default function About() { return null; }\n");
}
writeFileSync(path.join(fixture, "not-a-directory"), "synthetic fixture\n");
const slash = (value: string) => value.replace(/\\/g, "/");
const firstRoot = required(roots[0], "fakeNext fixture root");
const secondRoot = required(roots[1], "otherNext fixture root");
const relative = slash(path.relative(process.cwd(), firstRoot));
const relativeBase = slash(path.relative(process.cwd(), fixture));
const canonical = (values: string[]) => [...new Set(values.map((value) => path.resolve(slash(value))))].sort();
const cases: { name: string; rootDir: unknown; expected: string[] }[] = [
  { name: "literal relative", rootDir: relative, expected: [firstRoot] },
  { name: "literal trailing slash", rootDir: `${relative}/`, expected: [firstRoot] },
  { name: "relative glob", rootDir: `${relativeBase}/*Next`, expected: roots },
  { name: "relative brace", rootDir: `${relativeBase}/{fakeNext,otherNext}`, expected: roots },
  { name: "absolute literal", rootDir: slash(firstRoot), expected: [firstRoot] },
  { name: "absolute glob", rootDir: `${slash(fixture)}/*Next`, expected: roots },
  { name: "absolute brace", rootDir: `${slash(fixture)}/{fakeNext,otherNext}`, expected: roots },
  { name: "Windows separators", rootDir: relative.replace(/\//g, "\\"), expected: [firstRoot] },
  { name: "absolute Windows separators", rootDir: firstRoot.replace(/\//g, "\\"), expected: [firstRoot] },
  { name: "array with ignored non-string", rootDir: [slash(firstRoot), slash(secondRoot), 42], expected: roots },
];

describe("Next ESLint scoped glob dependency contract", () => {
  it("synchronously requires the private ESM adapter with only the supported named API", () => {
    const manifest = JSON.parse(readFileSync(pluginRequire.resolve("fast-glob/package.json"), "utf8"));
    expect(manifest.name).toBe("next-eslint-glob-adapter");
    expect(manifest.private).toBe(true);
    expect(manifest.main).toBe("index.mjs");
    expect(manifest.exports).toEqual({ ".": "./index.mjs", "./package.json": "./package.json" });
    expect(pluginRequire.resolve("fast-glob")).toBe(path.join(process.cwd(), "tools/next-eslint-glob-adapter/index.mjs"));
    expect(manifest.dependencies).toEqual({ tinyglobby: "0.2.17" });
    expect(Object.keys(pluginRequire("fast-glob"))).toEqual(["globSync"]);
    expect(typeof pluginRequire("fast-glob").globSync).toBe("function");
  });

  it("fails closed for unsupported patterns and options", () => {
    const { globSync } = pluginRequire("fast-glob") as GlobAdapter;
    for (const pattern of ["", [], null, 42]) {
      expect(() => globSync(pattern, { onlyDirectories: true })).toThrow(TypeError);
    }
    for (const options of [undefined, null, {}, { onlyDirectories: false },
      { onlyDirectories: true, cwd: fixture }, { onlyDirectories: true, expandDirectories: true },
      { onlyDirectories: true, [Symbol("unsupported")]: true }]) {
      expect(() => globSync(slash(firstRoot), options)).toThrow(TypeError);
    }
    const root = path.parse(firstRoot).root;
    expect(globSync(slash(root), { onlyDirectories: true })).toEqual([slash(root)]);
    expect(canonical(globSync(slash(firstRoot), { onlyDirectories: true }))).toEqual(canonical([firstRoot]));
  });

  it("records a portable root adapter link and its dependency in the project lockfile", () => {
    const lock = JSON.parse(readFileSync(path.join(process.cwd(), "package-lock.json"), "utf8")) as {
      packages: Record<string, LockPackage>;
    };
    const lockPackage = (key: string) => required(lock.packages[key], `lockfile package ${key || "(root)"}`);
    const links = Object.entries(lock.packages).filter(([key]) => key.endsWith("/fast-glob"));
    expect(links).toHaveLength(1);
    expect(required(links[0], "fast-glob lockfile link")[1])
      .toMatchObject({ link: true, resolved: "tools/next-eslint-glob-adapter" });
    expect(lockPackage("tools/next-eslint-glob-adapter").dependencies).toEqual({ tinyglobby: "0.2.17" });
    expect(required(lockPackage("").devDependencies, "root devDependencies")["next-eslint-glob-adapter"])
      .toBe("file:tools/next-eslint-glob-adapter");
    expect(lock.packages["node_modules/next-eslint-glob-adapter"])
      .toMatchObject({ link: true, resolved: "tools/next-eslint-glob-adapter" });
    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    expect(manifest.overrides).toEqual({ "@next/eslint-plugin-next": { "fast-glob": "$next-eslint-glob-adapter" } });
    const adapterRequire = createRequire(pluginRequire.resolve("fast-glob"));
    expect(adapterRequire("tinyglobby/package.json").version).toBe("0.2.17");
  });

  it("documents why tinyglobby 0.2.17 cannot be aliased with Next's exact options", () => {
    const candidate = require("tinyglobby") as { globSync(pattern: string, options: { onlyDirectories: boolean }): string[] };
    const manifest = require("tinyglobby/package.json") as { version: string };
    expect(manifest.version).toBe("0.2.17");
    expect(canonical(candidate.globSync(slash(firstRoot), { onlyDirectories: true }))).toEqual(
      canonical([firstRoot, path.join(firstRoot, "pages"), path.join(firstRoot, "src"), path.join(firstRoot, "src", "nested")]),
    );
  });

  it.each(cases)("preserves normalized getRootDirs: $name", ({ rootDir, expected }) => {
    expect(canonical(getRootDirs({ cwd: process.cwd(), settings: { next: { rootDir } } })))
      .toEqual(canonical(expected));
  });

  it("preserves default cwd and excludes missing roots and files", () => {
    expect(getRootDirs({ cwd: firstRoot, settings: {} })).toEqual([firstRoot]);
    for (const rootDir of [slash(path.join(fixture, "missing")), slash(path.join(fixture, "not-a-directory")), []]) {
      expect(getRootDirs({ cwd: process.cwd(), settings: { next: { rootDir } } })).toEqual([]);
    }
  });

  it.each(cases)("keeps actual ESLint link-rule behavior: $name", ({ rootDir }) => {
    const linter = new Linter();
    const config: Linter.Config = {
      plugins: { "@next/next": plugin },
      languageOptions: { ecmaVersion: 2022, sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
      settings: { next: { rootDir } },
      rules: { [ruleId]: "error" },
    };
    const bad = linter.verify("const view = <a href='/about'>About</a>;", config);
    expect(bad).toHaveLength(1);
    const diagnostic = required(bad[0], "internal-link ESLint diagnostic");
    expect(diagnostic).toMatchObject({ ruleId, severity: 2 });
    expect(diagnostic.message).toContain("Use `<Link />`");
    expect(linter.verify("const view = <a href='https://example.invalid/about'>External</a>;", config)).toEqual([]);
    expect(linter.verify("import Link from 'next/link'; const view = <Link href='/about'>About</Link>;", config)).toEqual([]);
  });
});
