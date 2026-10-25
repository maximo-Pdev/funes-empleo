import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import type { NextConfig } from "next";
import nextConfig from "../../../next.config";
const config: NextConfig = nextConfig;

it.each([
  ["/login", "src/app/(auth)/login/page.tsx"],
  ["/candidato/perfil", "src/app/(candidate)/candidato/perfil/page.tsx"],
  ["/candidato/ofertas", "src/app/(candidate)/candidato/ofertas/page.tsx"],
  ["/candidato/postulaciones", "src/app/(candidate)/candidato/postulaciones/page.tsx"],
])("retires %s without a page or redirect", async (route, file) => {
  expect(existsSync(file)).toBe(false);
  expect((await config.redirects?.() ?? []).some(item => item.source === route)).toBe(false);
});
