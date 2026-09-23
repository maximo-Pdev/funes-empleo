import Link from "next/link";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthPage } from "@/features/accounts/components/auth-page";
export default function LoginPage() {
  return <AuthPage title="Iniciar sesión"><p className="mt-4">Usá tu cuenta individual y tu correo verificado.</p><AuthForm mode="login" /><Link href="/verification-pending" className="mt-4 block text-blue-800 underline">Necesito verificar mi correo</Link></AuthPage>;
}
