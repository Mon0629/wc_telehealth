import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Check, Circle } from "lucide-react";
import AuthPasswordInput from "@/components/auth/PasswordInputWithToggle";
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
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getPasswordRequirementStatus,
  getPasswordValidationError,
} from "@/lib/password-requirements";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignupFields(fields: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  const firstName = fields.firstName.trim();
  const lastName = fields.lastName.trim();
  const email = fields.email.trim();
  const password = fields.password;
  const confirmPassword = fields.confirmPassword;

  const missing: string[] = [];
  if (!firstName) missing.push("first name");
  if (!lastName) missing.push("last name");
  if (!email) missing.push("email");
  if (!password) missing.push("password");
  if (!confirmPassword) missing.push("confirm password");

  if (missing.length === 5) {
    return "Please fill in all required fields.";
  }
  if (missing.length > 0) {
    return `Please enter your ${missing.join(", ")}.`;
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Please enter a valid email address.";
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) return passwordError;

  if (password !== confirmPassword) {
    return "Passwords do not match. Please check and try again.";
  }

  return null;
}

function PasswordRequirementsChecklist({ password }: { password: string }) {
  const requirements = getPasswordRequirementStatus(password);

  return (
    <ul
      className="mt-1.5 space-y-0.5 pl-1"
      aria-label="Password requirements"
    >
      {requirements.map((req) => (
        <li
          key={req.id}
          className={cn(
            "flex items-center gap-1.5 text-[11px] italic transition-colors",
            req.met ? "text-emerald-600" : "text-zinc-400"
          )}
        >
          {req.met ? (
            <Check className="size-3 shrink-0 not-italic" aria-hidden />
          ) : (
            <Circle className="size-3 shrink-0 not-italic" aria-hidden />
          )}
          <span>{req.label}</span>
        </li>
      ))}
    </ul>
  );
}

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
  const [passwordFocused, setPasswordFocused] = useState(false);

  const showPasswordRequirements = passwordFocused || password.length > 0;

  const handleSignup = async () => {
    const validationError = validateSignupFields({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });

    if (validationError) {
      toast.error("Unable to sign up", { description: validationError });
      return;
    }

    try {
      await signup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        role,
      });
      toast.success("Account created. Please verify your email.");
      navigate("/email-verification");
    } catch (err) {
      const message =
        useAuthStore.getState().error ??
        getApiErrorMessage(err, "Signup failed. Please try again.");
      toast.error("Unable to sign up", { description: message });
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
                  <AuthPasswordInput
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    disabled={isLoading}
                  />
                  {showPasswordRequirements && (
                    <PasswordRequirementsChecklist password={password} />
                  )}
                </Field>
                <Field className="gap-3">
                  <FieldLabel htmlFor="confirm-password">
                    Confirm password
                  </FieldLabel>
                  <AuthPasswordInput
                    id="confirm-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    disabled={isLoading}
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
