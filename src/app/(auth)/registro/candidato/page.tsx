import { RegistrationLayout } from "@/app/(auth)/_components/registration-layout";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";

export default function CandidateRegistrationPage() {
  return <RegistrationLayout role="candidate"><CandidateRegistrationForm /></RegistrationLayout>;
}
