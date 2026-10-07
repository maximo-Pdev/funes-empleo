import path from "node:path";
import { statSync } from "node:fs";
import { globSync as tinyGlobSync } from "tinyglobby";

// Only the contract consumed by Next's get-root-dirs; not a general fast-glob API.
export function globSync(pattern, options) {
  if (typeof pattern !== "string" || pattern.length === 0) {
    throw new TypeError("Next glob adapter requires a non-empty string pattern");
  }
  if (!options || options.onlyDirectories !== true ||
      Reflect.ownKeys(options).some((key) => key !== "onlyDirectories")) {
    throw new TypeError("Next glob adapter supports only { onlyDirectories: true }");
  }

  // Next already converts Windows separators. Preserve filesystem root separators:
  // tinyglobby removes the final slash of patterns, including a literal root.
  const root = path.parse(pattern).root;
  if (root && pattern === root) {
    return statSync(root).isDirectory() ? [root.replace(/\\/g, "/")] : [];
  }

  return tinyGlobSync(pattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: path.isAbsolute(pattern),
    debug: false,
  }).map((entry) => {
    // Directory results can carry a trailing slash. Never turn / or C:/ into
    // empty or drive-relative paths, and do not resolve relative results here.
    const value = entry.replace(/\\/g, "/");
    const entryRoot = path.parse(value).root.replace(/\\/g, "/");
    return value.length > entryRoot.length ? value.replace(/\/+$/, "") : value;
  });
}

