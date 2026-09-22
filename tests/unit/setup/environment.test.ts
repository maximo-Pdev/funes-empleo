import { describe, expect, it } from "vitest";
import { clientEnvironmentSchema, readEnvironment, serverEnvironmentSchema } from "@/lib/env/schema";

describe("configuración aislada", () => {
  it("rechaza placeholders y claves JWT privilegiadas", () => {
    const base = { NEXT_PUBLIC_APP_URL: "http://localhost:3000", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" };
    for (const key of ["REEMPLAZAR_CON_CLAVE_PUBLICABLE_LOCAL", "invalid", "a.!.b", `test.${btoa(JSON.stringify({ role: "service_role" }))}.fictitious`]) {
      expect(() => readEnvironment(clientEnvironmentSchema, { ...base, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key })).toThrow("configuración");
    }
    const anon = `test.${btoa(JSON.stringify({ role: "anon" }))}.fictitious`;
    expect(readEnvironment(clientEnvironmentSchema, { ...base, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anon }).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(anon);
  });
  it("expone únicamente variables públicas", () => {
    expect(readEnvironment(clientEnvironmentSchema, {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fictitious",
      SUPABASE_SECRET_KEY: "fictitious-server-value",
    })).not.toHaveProperty("SUPABASE_SECRET_KEY");
  });
  it("no asume un entorno ni habilita producción", () => {
    expect(() => readEnvironment(serverEnvironmentSchema, {})).toThrow("configuración");
    expect(() => readEnvironment(serverEnvironmentSchema, { APP_ENV: "production", CONSENT_POLICY_VERSION: "demo" })).toThrow("configuración");
    expect(readEnvironment(serverEnvironmentSchema, { APP_ENV: "local", CONSENT_POLICY_VERSION: "demo-not-approved" }).APP_ENV).toBe("local");
  });
  it("rechaza secretos en una variable pública sin mostrarlos", () => {
    const values = { NEXT_PUBLIC_APP_URL: "http://localhost:3000", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_fictitious" };
    expect(() => readEnvironment(clientEnvironmentSchema, values)).toThrow("configuración");
    try { readEnvironment(clientEnvironmentSchema, values); } catch (error) { expect(String(error)).not.toContain("sb_secret_fictitious"); }
  });
});
