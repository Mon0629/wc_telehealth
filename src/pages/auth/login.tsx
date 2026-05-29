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
import { toast } from "sonner";

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
      const message =
        useAuthStore.getState().error ?? "Invalid credentials. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-6 text-zinc-900">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          ← Back to home
        </Link>

        <Card className="gap-0 border-zinc-200 bg-white py-0 shadow-sm">
          <CardHeader className="gap-2 px-8 pt-10 pb-6 text-center">
            <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Sign in to continue your care.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col px-8 pb-10">
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
                    className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
                    required
                    disabled={isLoading}
                  />
                </Field>

                <Field className="gap-3">
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
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
                    className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
                    required
                    disabled={isLoading}
                  />
                </Field>

                <Field className="mt-auto gap-4">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 focus-visible:ring-zinc-400/70 disabled:opacity-60"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in…" : "Sign in"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="h-12 w-full rounded-full border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900"
                    disabled={isLoading}
                  >
                    Sign in with Google
                  </Button>
                  <FieldDescription className="text-center text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="font-medium text-zinc-900 underline-offset-4 hover:underline"
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
