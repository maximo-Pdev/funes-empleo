import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Controlled time travel for the isolated local fixture. The production cron
// function is private and has no HTTP or authenticated-role entry point.
export function runLocalMaintenanceSql(sql: string): string {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321")) {
    throw new Error("El reloj de prueba exige Supabase local aislado.");
  }
  const windowsDocker = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA,
    "Programs", "DockerDesktop", "resources", "bin", "docker.exe");
  const docker = windowsDocker && existsSync(windowsDocker) ? windowsDocker : "docker";
  const container = "supabase_db_funes-empleo";
  const running = execFileSync(docker, ["ps", "--filter", `name=^/${container}$`, "--format", "{{.Names}}"],
    { encoding: "utf8", timeout: 10000 }).trim();
  if (running !== container) throw new Error("No se encontró la base local aislada de este proyecto.");
  return execFileSync(docker, ["exec", container, "psql", "-U", "postgres", "-d", "postgres",
    "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql],
  { encoding: "utf8", timeout: 10000 }).trim();
}
