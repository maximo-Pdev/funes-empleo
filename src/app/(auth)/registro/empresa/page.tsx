import { AuthPage } from "@/features/accounts/components/auth-page";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

export default function CompanyRegistrationPage() {
  return <AuthPage title="Registro de empresas"><CompanyRegistrationForm /></AuthPage>;
}
