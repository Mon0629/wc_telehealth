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
              Create Account
            </CardTitle>
            <CardDescription className="text-zinc-500">
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
                      className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
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
                      className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
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
                    className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
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
                    className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
                  />
                  <FieldDescription className="text-zinc-500">
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
                    className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-5 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
                  />
                </Field>
                <Field className="mt-auto gap-4">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 focus-visible:ring-zinc-400/70"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating…" : "Sign up"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="h-12 w-full rounded-full border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900"
                    disabled={isLoading}
                  >
                    Sign up with Google
                  </Button>
                  <FieldDescription className="text-center text-zinc-500">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-zinc-900 underline-offset-4 hover:underline"
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
