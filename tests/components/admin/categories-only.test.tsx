import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/features/candidates/assisted-actions", () => ({ saveAssistedAction: vi.fn(), assistedCommandAction: vi.fn() }));
vi.mock("@/features/candidates/claim-actions", () => ({ claimAssistedAction: vi.fn() }));
import { AssistedProfileForm } from "@/features/candidates/components/assisted/assisted-forms";
import { assistedFields, assistedProfileSchema } from "@/validation/duplicate-resolution";
import { candidateProfileSchema } from "@/validation/candidate-profile";
const ids = Array.from({ length: 41 }, (_, i) => `04000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const base = { name: "Persona ficticia", dni: "98000001", email: "", phone: "3410000000", locality: "Funes", summary: "Experiencia ficticia", availability: "available", detail: "", address: "", categories: ids.slice(0, 40) };
it("solo permite elegir categorías y no ofrece el antiguo campo en el alta presencial", () => {
  render(<AssistedProfileForm categories={[{ id: ids[0]!, name: "Rubro ficticio" }]} creationPolicy={{ version: "demo-not-approved", policy_text: "Política ficticia", policy_hash: "a".repeat(64) }} />);
  expect(screen.getByRole("group", { name: "Categorías laborales" })).toBeTruthy();
  expect(screen.queryByRole("group", { name: "Intereses laborales" })).toBeNull();
  expect(screen.queryByLabelText("Interés: Rubro ficticio")).toBeNull();
  expect(assistedFields).not.toContain("interests");
});
it("puede guardar la unión histórica de40 categorías sin perder selecciones", () => {
  expect(assistedProfileSchema.safeParse(base).success).toBe(true);
  expect(candidateProfileSchema.safeParse({ ...base, version: 1 }).success).toBe(true);
  expect(assistedProfileSchema.safeParse({ ...base, categories: ids }).success).toBe(false);
});
it("rechaza intereses legados con datos y solo compatibiliza el array vacío sin devolver el campo", () => {
  expect(assistedProfileSchema.safeParse({ ...base, interests: [ids[0]] }).success).toBe(false);
  expect(assistedProfileSchema.parse({ ...base, interests: [] })).not.toHaveProperty("interests");
});
