import * as React from "react";
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

const OTP_LENGTH = 6;

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LENGTH).fill(""));
  const { verifyEmailOtp, isLoading, pendingVerificationEmail } =
    useAuthStore();
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = otp.join("");
  const isComplete = otpValue.length === OTP_LENGTH && otp.every(Boolean);

  const email = React.useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("email") ?? pendingVerificationEmail ?? "";
  }, [location.search, pendingVerificationEmail]);

  const focusIndex = React.useCallback((idx: number) => {
    inputsRef.current[idx]?.focus();
    inputsRef.current[idx]?.select();
  }, []);

  const setDigit = React.useCallback(
    (idx: number, digit: string) => {
      setOtp((prev) => {
        const next = [...prev];
        next[idx] = digit;
        return next;
      });
    },
    [setOtp]
  );

  const handleChange = (idx: number, nextRaw: string) => {
    const digits = nextRaw.replace(/\D/g, "");
    if (!digits) {
      setDigit(idx, "");
      return;
    }

    // If user pastes/types multiple digits into a single box, distribute forward.
    const chars = digits.slice(0, OTP_LENGTH - idx).split("");
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < chars.length; i++) next[idx + i] = chars[i];
      return next;
    });

    const nextFocus = Math.min(idx + chars.length, OTP_LENGTH - 1);
    focusIndex(nextFocus);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        setDigit(idx, "");
        return;
      }
      if (idx > 0) {
        setDigit(idx - 1, "");
        focusIndex(idx - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft" && idx > 0) {
      focusIndex(idx - 1);
      return;
    }

    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      focusIndex(idx + 1);
      return;
    }

    // Optional: pressing Enter submits if complete.
    if (e.key === "Enter" && isComplete && !isLoading) {
      void handleVerify();
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH - idx);
    if (!digits) return;
    e.preventDefault();
    handleChange(idx, digits);
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    try {
      if (!email) {
        toast.error("Missing email for verification. Please sign up again.");
        navigate("/signup");
        return;
      }

      await verifyEmailOtp({ email, otp: otpValue });
      toast.success("Account Created");
      const role = useAuthStore.getState().user?.role;
      navigate(role === "PATIENT" ? "/patient-dashboard" : "/doctor-dashboard");
    } catch {
      toast.error(
        useAuthStore.getState().error ?? "Invalid code. Please try again."
      );
    }
  };

  const handleResend = async () => {
    // TODO: wire to resend endpoint
    setOtp(Array(OTP_LENGTH).fill(""));
    focusIndex(0);
  };

  React.useEffect(() => {
    focusIndex(0);
  }, [focusIndex]);

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
              Verify email
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {email ? (
                <>
                  Enter the 6-digit code we sent to{" "}
                  <span className="font-medium text-zinc-700">{email}</span>.
                </>
              ) : (
                "Enter the 6-digit code we sent to your email."
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col px-8 pb-10">
            <form
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                void handleVerify();
              }}
            >
              <FieldGroup className="flex flex-1 flex-col gap-8">
                <Field className="gap-3">
                  <FieldLabel>Verification code</FieldLabel>

                  <div className="flex items-center justify-between gap-2">
                    {otp.map((value, idx) => (
                      <Input
                        key={idx}
                        ref={(el) => {
                          inputsRef.current[idx] = el;
                        }}
                        inputMode="numeric"
                        autoComplete={idx === 0 ? "one-time-code" : "off"}
                        aria-label={`OTP digit ${idx + 1}`}
                        value={value}
                        maxLength={OTP_LENGTH}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={(e) => handlePaste(idx, e)}
                        className="h-12 w-12 rounded-xl border-zinc-200 bg-zinc-50 px-0 text-center text-lg font-semibold tracking-widest text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
                      />
                    ))}
                  </div>

                  <FieldDescription className="text-zinc-500">
                    Didn&apos;t receive a code?{" "}
                    <button
                      type="button"
                      onClick={() => void handleResend()}
                      className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
                    >
                      Resend
                    </button>
                  </FieldDescription>
                </Field>

                <Field className="mt-auto gap-4">
                  <Button
                    type="submit"
                    disabled={!isComplete || isLoading}
                    className="h-12 w-full rounded-full bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 focus-visible:ring-zinc-400/70 disabled:opacity-60"
                  >
                    {isLoading ? "Verifying…" : "Verify"}
                  </Button>

                  <FieldDescription className="text-center text-zinc-500">
                    Want to change your email?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
                    >
                      Back to sign up
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
