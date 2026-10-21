import { RegistrationLayout } from "@/app/(auth)/_components/registration-layout";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

export default function CompanyRegistrationPage() {
  return <RegistrationLayout role="company"><CompanyRegistrationForm /></RegistrationLayout>;
}
