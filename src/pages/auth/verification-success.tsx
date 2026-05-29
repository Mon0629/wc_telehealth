import { Link, Navigate, useNavigate } from "react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/authStore";

function ConfettiDecoration() {
  const pieces = [
    { className: "left-[12%] top-[18%] size-2 rotate-12", shape: "rounded-sm" },
    { className: "left-[22%] top-[12%] size-1.5", shape: "rounded-full" },
    { className: "right-[18%] top-[14%] size-2 -rotate-45", shape: "rounded-sm" },
    { className: "right-[28%] top-[20%] size-1.5", shape: "rounded-full" },
    { className: "left-[18%] top-[28%] size-1.5", shape: "rounded-full" },
    { className: "right-[14%] top-[26%] size-2 rotate-45", shape: "rounded-sm" },
    { className: "left-[32%] top-[8%] size-1", shape: "rounded-full" },
    { className: "right-[36%] top-[10%] size-1", shape: "rounded-full" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={`absolute bg-zinc-300/70 ${piece.shape} ${piece.className}`}
        />
      ))}
    </div>
  );
}

export default function VerificationSuccess() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleExplore = () => {
    const destination =
      user.role === "PATIENT" ? "/patient-dashboard" : "/doctor-dashboard";
    navigate(destination);
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 py-12 text-zinc-900">
      <ConfettiDecoration />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-8 flex size-28 items-center justify-center">
          <svg
            className="absolute inset-0 size-full -rotate-90 text-zinc-300"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="220 56"
              strokeLinecap="round"
            />
          </svg>
          <span className="flex size-16 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
            <Check className="size-8" strokeWidth={2.5} aria-hidden />
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 uppercase sm:text-4xl">
          Success!
        </h1>

        <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-500">
          Your email has been verified. You&apos;re all set to explore Konsultify
          and start your care journey.
        </p>

        <Button
          type="button"
          onClick={handleExplore}
          className="mt-10 h-12 w-full max-w-xs rounded-full bg-zinc-900 px-8 text-sm font-semibold tracking-wide text-white uppercase shadow-sm hover:bg-zinc-800"
        >
          Explore Konsultify
        </Button>

        <Link
          to="/"
          className="mt-6 text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
