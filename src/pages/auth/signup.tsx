import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isLoading } = useAuthStore();

  const role = useMemo<"PATIENT" | "DOCTOR">(() => {
    const sp = new URLSearchParams(location.search);
    const r = sp.get("role")?.toLowerCase();
    return r === "doctor" ? "DOCTOR" : "PATIENT";
  }, [location.search]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {
    try {
      await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        role,
      });
      toast.success("Account created. Please verify your email.");
      navigate("/email-verification");
    } catch {
      toast.error(
        useAuthStore.getState().error ?? "Signup failed. Please try again."
      );
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 py-6 text-slate-900">
      {/* subtle medical-tint background */}
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
              Create Account<span className="text-sky-600">.</span>
            </CardTitle>
            <CardDescription className="text-slate-500">
              Start your journey to better care.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-8 pb-10">
            <form
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSignup();
              }}
            >
              <FieldGroup className="flex flex-1 flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="gap-3">
                    <FieldLabel htmlFor="firstName">First name</FieldLabel>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                    />
                  </Field>
                  <Field className="gap-3">
                    <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="DelaCruz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                    />
                  </Field>
                </div>
                <Field className="gap-3">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juandelacruz@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                  />
                </Field>
                <Field className="gap-3">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                  />
                  <FieldDescription className="text-slate-500">
                    Password must be at least 8 characters long
                  </FieldDescription>
                </Field>
                <Field className="gap-3">
                  <FieldLabel htmlFor="confirm-password">
                    Confirm password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-full border-sky-100 bg-sky-50/60 px-5 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                  />
                </Field>
                <Field className="mt-auto gap-4">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:ring-sky-200/70"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating…" : "Sign up"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="h-12 w-full rounded-full border-slate-200 bg-white/60 hover:bg-slate-50"
                    disabled={isLoading}
                  >
                    Sign up with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline"
                    >
                      Login
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
