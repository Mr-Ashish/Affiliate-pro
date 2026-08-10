import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  const params = await searchParams;
  const showError = params.error != null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            AffiliateHub
          </p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">
            Admin login
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Sign in to manage merchants and offers.
          </p>
        </div>

        {showError ? (
          <p
            role="alert"
            className="rounded-md bg-error-container px-3 py-2 text-sm text-error"
          >
            Invalid email or password.
          </p>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
