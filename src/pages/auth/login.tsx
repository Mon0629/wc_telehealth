import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      navigate(role === "PATIENT" ? "/patient-dashboard" : "/doctor-dashboard");
    } catch {
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 py-6 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-xl -translate-x-1/2 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="relative mb-6 inline-flex items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          ← Back to home
        </Link>

        <Card className="relative gap-0 border-slate-200/70 bg-white/70 py-0 shadow-[0_20px_60px_-32px_rgba(2,132,199,0.35)] backdrop-blur-sm">
          <CardHeader className="gap-2 px-8 pt-10 pb-6 text-center">
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
              Welcome Back<span className="text-sky-600">!</span>
            </CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to continue your care.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col px-8 pb-10">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="flex flex-1 flex-col" onSubmit={handleLogin}>
              <FieldGroup className="flex flex-1 flex-col gap-8">
                <Field className="gap-3">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                    required
                    disabled={isLoading}
                  />
                </Field>

                <Field className="gap-3">
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm font-medium text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                    required
                    disabled={isLoading}
                  />
                </Field>

                <Field className="mt-auto gap-4">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:ring-sky-200/70 disabled:opacity-60"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in…" : "Sign in"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="h-12 w-full rounded-full border-slate-200 bg-white/60 hover:bg-slate-50"
                    disabled={isLoading}
                  >
                    Sign in with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      Sign up
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
