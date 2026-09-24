import { AuthPage } from "@/features/accounts/components/auth-page";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";

export default function CandidateRegistrationPage() {
  return <AuthPage title="Registro de candidatos"><CandidateRegistrationForm /></AuthPage>;
}
