import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-[url('https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/65" />
      <header className="relative z-10 px-5 py-5 sm:px-[4vw]">
        <Logo />
      </header>
      <div className="relative z-10 flex justify-center px-4 pb-20 pt-4">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
