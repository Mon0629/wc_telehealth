import { Link } from "react-router";
import teleconference from "@/assets/teleconference.jpg";
import { Button } from "@/components/ui/button";
import {
  Video,
  Shield,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  MessageSquare,
  Stethoscope,
  HeartPulse,
  Activity,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-zinc-50/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
              K
            </span>
            Konsultify
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              Testimonials
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden text-sm font-medium text-zinc-600 transition hover:text-zinc-900 sm:inline-block"
            >
              Sign In
            </Link>
            <Link to="/login">
              <Button className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-zinc-900 pt-10 pb-20 sm:pt-12 lg:pt-14 lg:pb-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-700/40 via-zinc-900 to-zinc-950" />
          <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-zinc-600/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Healthcare That{" "}
                <span className="bg-linear-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Moves
                </span>{" "}
                With You
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                Skip the waiting room. Connect with world-class specialists via
                video consultation in minutes. Prescription delivery included.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/login">
                  <Button className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-6 text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-100">
                    Book a Consultation
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <a href="#how">
                  <Button
                    variant="ghost"
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-8 py-6 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    See How It Works
                  </Button>
                </a>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-b from-zinc-600/20 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-zinc-700/50 shadow-2xl shadow-zinc-950/50">
                <img
                  src={teleconference}
                  alt="Doctor on a video consultation"
                  className="aspect-video w-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-zinc-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: "10K+", label: "Consultations Completed" },
                { value: "500+", label: "Verified Specialists" },
                { value: "4.9★", label: "Average Rating" },
                { value: "<5min", label: "Average Wait Time" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-zinc-900 lg:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-20 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Everything You Need for Better Healthcare
              </h2>
              <p className="mt-4 text-lg text-zinc-500">
                Premium features designed to make your healthcare experience
                seamless, secure, and accessible.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Video,
                  title: "HD Video Consultations",
                  desc: "Crystal-clear video calls with your doctor. No downloads required — works right in your browser.",
                },
                {
                  icon: Shield,
                  title: "End-to-End Encryption",
                  desc: "Your medical data is protected with bank-grade encryption. HIPAA compliant and fully secure.",
                },
                {
                  icon: Clock,
                  title: "24/7 Availability",
                  desc: "Book appointments any time, day or night. Our specialists are available across all time zones.",
                },
                {
                  icon: Activity,
                  title: "AI Doctor Recommendations",
                  desc: "Our AI analyzes your concerns and matches you with the most qualified specialist tailored to your needs.",
                },
                {
                  icon: Calendar,
                  title: "Digital Prescription",
                  desc: "Receive prescriptions digitally after your consultation. Sent directly to your pharmacy — no paper needed.",
                },
                {
                  icon: HeartPulse,
                  title: "Health Records",
                  desc: "All your medical records in one place. Easily share with new doctors or specialists.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="inline-flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition group-hover:bg-zinc-900 group-hover:text-white">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how"
          className="scroll-mt-20 border-t border-zinc-200 bg-zinc-900 py-24 lg:py-32"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get Started in 3 Easy Steps
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                From sign-up to consultation in minutes. No complicated
                processes.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Create Your Account",
                  desc: "Sign up in seconds with just your email. Complete your medical profile at your own pace.",
                },
                {
                  step: "02",
                  icon: Stethoscope,
                  title: "Choose a Specialist",
                  desc: "Browse verified doctors by specialty, ratings, and availability. Pick the perfect match.",
                },
                {
                  step: "03",
                  icon: Activity,
                  title: "Start Your Consultation",
                  desc: "Connect via HD video at your scheduled time. Get prescriptions and follow-up plans instantly.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="relative rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-8"
                >
                  <span className="text-5xl font-black text-zinc-700/50">
                    {s.step}
                  </span>
                  <div className="mt-4 inline-flex size-11 items-center justify-center rounded-xl bg-zinc-700/50 text-zinc-300">
                    <s.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="scroll-mt-20 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">
                Testimonials
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Trusted by Thousands of Patients
              </h2>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Sarah M.",
                  role: "Patient",
                  quote:
                    "I was able to see a specialist within 10 minutes. The video quality was excellent and the doctor was incredibly thorough.",
                },
                {
                  name: "Dr. James K.",
                  role: "Cardiologist",
                  quote:
                    "Konsultify has transformed how I connect with patients. The platform is intuitive and the scheduling system is brilliant.",
                },
                {
                  name: "Michael R.",
                  role: "Patient",
                  quote:
                    "No more taking time off work for routine check-ups. I can consult with my doctor from anywhere. Game changer.",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-4 fill-zinc-900 text-zinc-900"
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                    "{t.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {t.name}
                      </p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-zinc-200 bg-zinc-900 py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Take Control of Your Health?
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Join thousands of patients already experiencing better healthcare.
              Your first consultation is on us.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <Button className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-6 text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-100">
                  Start Free Consultation
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-24 lg:py-32">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-zinc-500">
                Everything you need to know about Konsultify.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {[
                {
                  q: "How quickly can I see a doctor?",
                  a: "Most consultations begin within 5 minutes. You can also schedule ahead for a specific time that works for you.",
                },
                {
                  q: "Is my medical data secure?",
                  a: "Absolutely. We use end-to-end encryption and are fully HIPAA compliant. Your data is never shared without your consent.",
                },
                {
                  q: "What specialties are available?",
                  a: "We offer access to 50+ specialties including cardiology, dermatology, mental health, pediatrics, and more.",
                },
                {
                  q: "Can I get prescriptions through Konsultify?",
                  a: "Yes. Doctors can issue prescriptions during your consultation, delivered directly to your preferred pharmacy.",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-zinc-200 bg-white px-6 py-5 shadow-sm transition open:shadow-md"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-zinc-900">
                    {item.q}
                    <CheckCircle2 className="size-5 text-zinc-300 transition group-open:text-zinc-900" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5 text-lg font-bold text-zinc-900">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
                K
              </span>
              Konsultify
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#features" className="transition hover:text-zinc-900">
                Features
              </a>
              <a href="#how" className="transition hover:text-zinc-900">
                How It Works
              </a>
              <a href="#faq" className="transition hover:text-zinc-900">
                FAQ
              </a>
            </div>
            <p className="text-sm text-zinc-400">
              © {new Date().getFullYear()} Konsultify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
