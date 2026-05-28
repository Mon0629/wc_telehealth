import { Link } from "react-router";
import teleconference from "@/assets/teleconference.jpg";
import { Button } from "@/components/ui/button";

/** Full marketing landing page — shown at `/` */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-50">
        <div className="mx-auto max-w-xl px-4 pt-2">
          <nav className="flex items-center justify-between rounded-full border border-slate-200/60 bg-white/70 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] backdrop-blur-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold tracking-tight text-slate-900 hover:bg-slate-50"
            >
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                K
              </span>
              Konsultify
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <a
                href="#features"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Features
              </a>
              <a
                href="#how"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                How It works
              </a>
            </div>

            <Link
              to="/login"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-10 pt-4 pb-12 md:grid-cols-2 md:gap-12 md:pt-6 md:pb-14 lg:pt-8 lg:pb-16">
          <div className="space-y-4 md:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs font-bold tracking-wide text-sky-600">
              <span className="size-2 rounded-full bg-sky-500" />
              AVAILABLE 24/7 ANYWHERE IN THE WORLD
            </div>

            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Healthcare that <span className="text-sky-500">moves</span> with
              you.
            </h1>

            <p className="max-w-lg text-pretty text-base leading-relaxed text-slate-500 sm:text-lg">
              Skip the waiting room. Connect with world-class specialists via
              video consultation in minutes. Prescription delivery included.
            </p>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Button className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Book an appointment
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg md:max-w-none">
            <div className="overflow-hidden rounded-[2.5rem] shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]">
              <img
                src={teleconference}
                alt="Doctor on a video consultation"
                className="aspect-4/4 w-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-28 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-10"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Features
          </h2>
          <p className="mt-2 max-w-2xl text-slate-500">
            Replace these cards with your real value props.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Sticky glass nav",
                desc: "Rounded, blurred, and stays visible while scrolling.",
              },
              {
                title: "Responsive layout",
                desc: "Looks good on mobile, tablet, and desktop.",
              },
              {
                title: "Easy to customize",
                desc: "Tailwind-first styling with clean sections.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how"
          className="mt-10 scroll-mt-28 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-10"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            How It works
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Add your copy",
                desc: "Update the headline, subtext, and CTA labels.",
              },
              {
                step: "02",
                title: "Swap sections",
                desc: "Keep what you need, delete what you don’t.",
              },
              {
                step: "03",
                title: "Hook up Login",
                desc: "Point the Login button to your auth route.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-sky-600">{s.step}</p>
                <h3 className="mt-2 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="mt-10 scroll-mt-28 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-10"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            FAQ
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Can I rename the tabs?",
                a: "Yes—these are just anchor links. Rename and point them to your sections.",
              },
              {
                q: "Is this only Tailwind?",
                a: "Yep. The layout is built entirely with Tailwind utility classes.",
              },
            ].map((i) => (
              <details
                key={i.q}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-slate-900">
                  {i.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {i.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <footer className="py-12 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Konsultify. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
