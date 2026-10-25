import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// Embla (shadcn carousel) relies on ResizeObserver, which jsdom does not implement.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Embla also observes slides in view via IntersectionObserver; jsdom lacks it.
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  } as unknown as typeof IntersectionObserver;
}

// Embla also reads window.matchMedia unconditionally; jsdom lacks it.
if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
