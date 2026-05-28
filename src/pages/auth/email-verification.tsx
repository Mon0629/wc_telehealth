import * as React from "react";
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

const OTP_LENGTH = 6;

export default function EmailVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = otp.join("");
  const isComplete = otpValue.length === OTP_LENGTH && otp.every(Boolean);

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
    if (e.key === "Enter" && isComplete && !isSubmitting) {
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
    setIsSubmitting(true);
    try {
      // TODO: replace with real verification call.
      await new Promise((r) => setTimeout(r, 600));
      navigate("/login");
    } finally {
      setIsSubmitting(false);
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
              Verify Email<span className="text-sky-600">.</span>
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enter the 6-digit code we sent to your email.
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
                        className="h-12 w-12 rounded-full border-sky-100 bg-sky-50/60 px-0 text-center text-lg font-semibold tracking-widest text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                      />
                    ))}
                  </div>

                  <FieldDescription className="text-slate-500">
                    Didn&apos;t receive a code?{" "}
                    <button
                      type="button"
                      onClick={() => void handleResend()}
                      className="font-medium text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline"
                    >
                      Resend
                    </button>
                  </FieldDescription>
                </Field>

                <Field className="mt-auto gap-4">
                  <Button
                    type="submit"
                    disabled={!isComplete || isSubmitting}
                    className="h-12 w-full rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:ring-sky-200/70 disabled:opacity-60"
                  >
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </Button>

                  <FieldDescription className="text-center">
                    Want to change your email?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline"
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
