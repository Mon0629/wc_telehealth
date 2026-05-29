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
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-4 text-zinc-900">
      <div className="mx-auto w-full max-w-xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          ← Back to home
        </Link>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Join Konsultify
          </h1>
          <p className="mt-2 text-zinc-500">
            Choose how you'd like to register.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map(({ role, label, description, image, route }) => (
            <Card
              key={role}
              size="sm"
              className="group cursor-pointer border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
              onClick={() => navigate(route)}
            >
              <div className="mx-3 mt-3 overflow-hidden rounded-lg bg-zinc-100">
                {image ? (
                  <img
                    src={image}
                    alt={label}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center">
                    {role === "patient" ? (
                      <PatientIllustration />
                    ) : (
                      <DoctorIllustration />
                    )}
                  </div>
                )}
              </div>

              <CardHeader className="px-5 pb-1 pt-3 text-center">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  {label}
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  {description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 pb-2" />

              <CardFooter className="border-t-0 bg-transparent px-5 pb-5">
                <Button
                  className="h-10 w-full rounded-full bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 focus-visible:ring-zinc-400/70"
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

        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-zinc-900 underline-offset-4 hover:underline"
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
      width="128"
      height="128"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="48" cy="32" r="18" fill="#e4e4e7" />
      <circle cx="48" cy="32" r="12" fill="#71717a" />
      <path
        d="M16 80c0-17.673 14.327-32 32-32s32 14.327 32 32"
        stroke="#52525b"
        strokeWidth="4"
        strokeLinecap="round"
        fill="#f4f4f5"
      />
      <rect x="40" y="58" width="16" height="4" rx="2" fill="#52525b" />
      <rect x="44" y="54" width="8" height="12" rx="2" fill="#52525b" />
    </svg>
  );
}

function DoctorIllustration() {
  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="48" cy="28" r="18" fill="#e4e4e7" />
      <circle cx="48" cy="28" r="12" fill="#3f3f46" />
      <path
        d="M16 76c0-17.673 14.327-32 32-32s32 14.327 32 32"
        stroke="#52525b"
        strokeWidth="4"
        strokeLinecap="round"
        fill="#f4f4f5"
      />
      <circle cx="62" cy="72" r="7" fill="#fff" stroke="#52525b" strokeWidth="2.5" />
      <path
        d="M55 72c0-4 3-7 7-7"
        stroke="#52525b"
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
