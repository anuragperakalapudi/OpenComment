"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Megaphone, ShieldCheck } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { Logo } from "@/components/shared/Logo";

export default function LandingPage() {
  const { profile, hydrated } = useProfile();
  const signedIn = hydrated && !!profile;
  const ctaHref = signedIn ? "/feed" : "/onboarding";
  const ctaLabel = signedIn ? "Continue to your feed" : "Build your civic profile";
  const navCtaLabel = signedIn ? "Open feed" : "Get started";

  return (
    <main className="min-h-screen">
      {/* Header — sticky with backdrop blur */}
      <header className="sticky top-0 z-30 border-b border-rule/60 bg-[#f7f2e8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
            <a className="hover:text-ink" href="#how">How it works</a>
            <a className="hover:text-ink" href="#why">Why it matters</a>
            {!signedIn && (
              <Link href="/sign-in" className="hover:text-ink">
                Sign in
              </Link>
            )}
            <Link
              href={ctaHref}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream-50 hover:bg-ink-600"
            >
              {navCtaLabel}
            </Link>
          </nav>

          {/* Mobile nav — fixes buttons disappearing on small screens */}
          <div className="flex items-center gap-3 md:hidden">
            {!signedIn && (
              <Link href="/sign-in" className="text-sm text-ink-600 hover:text-ink">
                Sign in
              </Link>
            )}
            <Link
              href={ctaHref}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream-50"
            >
              {navCtaLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-12">
          {/* Left: headline + CTA */}
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3 py-1.5 text-xs font-medium text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-forest" />
              Connected to the official regulations.gov database
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              className="headline text-[clamp(2.5rem,6vw,4.75rem)]"
            >
              The federal government writes{" "}
              <em className="font-display italic text-accent">
                thousands of rules
              </em>{" "}
              a year.
              <br />
              Lobbyists comment on every one.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600"
            >
              You should too. OpenComment finds the proposed rules that affect
              your life and helps you write a real comment into the federal
              record, grounded in your situation, not a template.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-base font-medium text-cream-50 shadow-card transition hover:bg-ink-600"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              {!signedIn && (
                <span className="text-sm text-muted">
                  Free. No spam. Delete your account anytime.
                </span>
              )}
            </motion.div>
          </div>

          {/* Right: mock card + stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="md:col-span-5"
          >
            <div className="paper-grain rounded-2xl border border-rule p-7 shadow-card">
              <div className="flex items-center justify-between">
                <span className="chip">
                  <FileText className="h-3 w-3" /> Proposed Rule · CMS
                </span>
                <span className="text-xs text-muted">Closes in 18 days</span>
              </div>
              <h3 className="font-display mt-4 text-2xl leading-tight text-ink">
                Permanent coverage of audio-only telehealth for Medicare
                beneficiaries.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                Would let licensed home health aides facilitate reimbursable
                phone visits for rural and homebound patients.
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
                <div className="flex items-center gap-2 text-sm text-forest">
                  <span className="h-2 w-2 rounded-full bg-forest" />
                  96% match for your profile
                </div>
                <span className="text-sm font-medium text-accent">
                  Read and comment
                </span>
              </div>
            </div>

            {/* Stats — moved here from the bottom section */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-rule bg-paper px-5 py-4">
                <p className="font-display text-2xl text-ink">~3,500</p>
                <p className="mt-1 text-xs leading-snug text-muted">federal rules per year</p>
              </div>
              <div className="rounded-xl border border-rule bg-paper px-5 py-4">
                <p className="font-display text-2xl text-accent">~92%</p>
                <p className="mt-1 text-xs leading-snug text-muted">of comments from organized interests</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="dotted-divider mt-24" />

        {/* How it works */}
        <section id="how" className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Tell us who you are.",
              body: "Your topics, state, occupation, any personal context you want to include. The kind of detail that makes a comment specific rather than generic.",
            },
            {
              icon: FileText,
              title: "Find the rules that affect you.",
              body: "Open comment periods from the federal docket, ranked by how directly they apply to your life, not by what's trending.",
            },
            {
              icon: Megaphone,
              title: "Your comment, on the record.",
              body: "We draft something anchored to your profile. You read it, adjust it if you want, then submit it on regulations.gov yourself.",
            },
          ].map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border-l-2 border-rule pl-5"
            >
              <Icon className="h-5 w-5 text-accent" />
              <h4 className="font-display mt-3 text-xl leading-snug">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
            </motion.div>
          ))}
        </section>

        {/* Why it matters */}
        <section
          id="why"
          className="mt-24 rounded-2xl border border-rule bg-paper p-10"
        >
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="font-display text-3xl italic leading-snug text-ink">
                &ldquo;The notice-and-comment process only works if the people
                who live under the rules are heard alongside the lobbyists who
                draft them.&rdquo;
              </p>
              <p className="mt-5 text-sm leading-relaxed text-ink-600">
                Public comment is one of the few legally binding ways ordinary
                people can influence federal policy before it takes effect.
                Agencies are required to read and respond to substantive
                comments. Most rules never get any from the public.
              </p>
              <div className="mt-8">
                <Link
                  href={ctaHref}
                  className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream-50 hover:bg-ink-600"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-muted md:flex-row md:items-center">
          <Logo small />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>Built for the public, not the docket-watchers.</span>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
