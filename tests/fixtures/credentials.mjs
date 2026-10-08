// Node-only test tooling. Never import this module into application/client code.
const hostedIdentities = new Set([
  "admin1", "admin2",
  "candidate1", "candidate2", "candidate3", "candidate4",
  "company1", "company2", "company3", "company4",
]);
export function resolveHostedCredentials(identities, env = process.env) {
  const credentials = {};
  for (const identity of identities) {
    if (!hostedIdentities.has(identity)) throw new Error("DEMO_CREDENTIALS_REQUIRED: revisá docs/operations/demo-credentials.md.");
    const password = env[`DEMO_${identity.toUpperCase()}_PASSWORD`];
    if (typeof password !== "string" || !password.trim()) {
      throw new Error("DEMO_CREDENTIALS_REQUIRED: configurá las credenciales privadas por identidad; revisá docs/operations/demo-credentials.md.");
    }
    credentials[identity] = { email: `${identity}@example.invalid`, password };
  }
  return credentials;
}
function assertLoopbackOrigin(value, port) {
  try {
    const url = new URL(value);
    // Check raw authority too: URL normalization must not admit alternate IP
    // spellings, userinfo, deceptive prefixes, paths, queries or fragments.
    const exact = new RegExp(`^http://(127\\.0\\.0\\.1|localhost):${port}/?$`);
    if (url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.port === String(port) && !url.username && !url.password && exact.test(value)) return;
  } catch { /* Generic refusal below; never echo configuration. */ }
  throw new Error("LOCAL_FIXTURE_TARGET_REQUIRED: usá Supabase local :54321 y aplicación local :3000, sin credenciales ni rutas en las URLs.");
}
export function assertLocalTargets(env = process.env) {
  assertLoopbackOrigin(env.NEXT_PUBLIC_SUPABASE_URL, 54321);
  assertLoopbackOrigin(env.NEXT_PUBLIC_APP_URL, 3000);
}
export function localFixturePassword(env = process.env) {
  assertLocalTargets(env);
  // Existing deterministic seed credential, exclusively behind both local guards.
  return "Fictitious-Local-Only-2026!";
}
