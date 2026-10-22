import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));
import HomePage from "@/app/(public)/page";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup(reduced: boolean) {
  const stroke = vi.fn();
  const context = { clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), bezierCurveTo: vi.fn(), stroke };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
  const motion = { matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", (query: string) => query.includes("prefers-reduced-motion") ? motion : { ...motion, matches: false });
  const request = vi.fn(() => 17);
  const cancel = vi.fn();
  vi.stubGlobal("requestAnimationFrame", request);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  return { stroke, disconnect, motion, request, cancel };
}

it("preloads a visible static ribbons frame without scheduling motion when reduced motion is requested", () => {
  const { stroke, request } = setup(true);
  const { container } = render(<HomePage />);
  expect(stroke).toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
  expect(container.querySelector("canvas")?.getAttribute("data-motion")).toBe("static");
});

it("autoplays the ribbons and releases the frame, observer and motion listener on unmount", () => {
  const { stroke, request, cancel, disconnect, motion } = setup(false);
  const view = render(<HomePage />);
  expect(stroke).toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(1);
  expect(view.container.querySelector("canvas")?.getAttribute("data-motion")).toBe("animated");
  view.unmount();
  expect(cancel).toHaveBeenCalledWith(17);
  expect(disconnect).toHaveBeenCalled();
  expect(motion.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});
