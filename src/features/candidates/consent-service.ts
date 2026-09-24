import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { getServerEnvironment } from "@/lib/env/server";
import { consentChangeSchema } from "@/validation/consent";

export async function getDemoConsentPolicy() {
  const session = await readAccountSession();
  if (!session || session.account.role !== "candidate" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  const result = await session.client.rpc("candidate_consent_policy");
  if (result.error || !result.data?.[0]) throw new AppError("INTERNAL_ERROR");
  const policy = result.data[0];
  if (policy.version !== getServerEnvironment().CONSENT_POLICY_VERSION) throw new AppError("INTERNAL_ERROR");
  return policy;
}

export async function changeCandidateConsent(input: unknown) {
  const parsed = consentChangeSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR");
  const session = await readAccountSession();
  if (!session || session.account.role !== "candidate" || session.account.status !== "active") {
    throw new AppError("ACCESS_DENIED");
  }
  const policy = await getDemoConsentPolicy();
  const result = await session.client.rpc("change_candidate_consent", {
    p_expected_version: parsed.data.version, p_status: parsed.data.status,
    p_policy_version: policy.version, p_policy_hash: policy.policy_hash,
  });
  if (result.error) throw workflowRpcError(result.error.message);
  return result.data;
}
