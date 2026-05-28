import { Link, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const roles = [
  {
    role: "patient",
    label: "Patient",
    description: "Book appointments, track your health, and connect with doctors.",
    image: null as string | null,
    route: "/signup?role=patient",
  },
  {
    role: "doctor",
    label: "Doctor",
    description: "Manage your schedule, consult patients, and grow your practice.",
    image: null as string | null,
    route: "/signup?role=doctor",
  },
];

export default function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 py-4 text-slate-900">
      {/* Background blobs matching Login / Signup */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-xl -translate-x-1/2 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        {/* Back link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          ← Back to home
        </Link>

        {/* Page heading */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Join Konsultify<span className="text-sky-600">.</span>
          </h1>
          <p className="mt-2 text-slate-500">
            Choose how you'd like to register.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map(({ role, label, description, image, route }) => (
            <Card
              key={role}
              size="sm"
              className="group cursor-pointer border-slate-200/70 bg-white/70 shadow-[0_20px_60px_-32px_rgba(2,132,199,0.25)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_24px_64px_-28px_rgba(2,132,199,0.45)]"
              onClick={() => navigate(route)}
            >
              {/* Image area */}
              <div className="mx-3 mt-3 overflow-hidden rounded-lg bg-sky-50">
                {image ? (
                  <img
                    src={image}
                    alt={label}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    {role === "patient" ? (
                      <PatientIllustration />
                    ) : (
                      <DoctorIllustration />
                    )}
                  </div>
                )}
              </div>

              <CardHeader className="px-5 pb-1 pt-3 text-center">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  {label}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 pb-2" />

              <CardFooter className="border-t-0 bg-transparent px-5 pb-5">
                <Button
                  className="h-10 w-full rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:ring-sky-200/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(route);
                  }}
                >
                  Register as {label}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Login prompt */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function PatientIllustration() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="48" cy="32" r="18" fill="#bae6fd" />
      <circle cx="48" cy="32" r="12" fill="#0ea5e9" />
      <path
        d="M16 80c0-17.673 14.327-32 32-32s32 14.327 32 32"
        stroke="#0ea5e9"
        strokeWidth="4"
        strokeLinecap="round"
        fill="#e0f2fe"
      />
      <rect x="40" y="58" width="16" height="4" rx="2" fill="#0ea5e9" />
      <rect x="44" y="54" width="8" height="12" rx="2" fill="#0ea5e9" />
    </svg>
  );
}

function DoctorIllustration() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="48" cy="28" r="18" fill="#bae6fd" />
      <circle cx="48" cy="28" r="12" fill="#0284c7" />
      <path
        d="M16 76c0-17.673 14.327-32 32-32s32 14.327 32 32"
        stroke="#0284c7"
        strokeWidth="4"
        strokeLinecap="round"
        fill="#e0f2fe"
      />
      {/* stethoscope */}
      <circle cx="62" cy="72" r="7" fill="#fff" stroke="#0284c7" strokeWidth="2.5" />
      <path
        d="M55 72c0-4 3-7 7-7"
        stroke="#0284c7"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M48 44v10M44 48h8"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
