"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { Field, TextInput, ChoiceGrid } from "@/components/onboarding/Field";
import { TopicChips } from "@/components/onboarding/TopicChips";
import { TagInput } from "@/components/onboarding/TagInput";
import {
  AGE_RANGES, INCOME_BRACKETS, HOUSEHOLD_STATUSES, US_STATES,
  ALL_PROFILE_FLAGS, PROFILE_FLAG_LABELS,
  FREE_TEXT_CONTEXT_LIMIT,
  COMMON_AGENCIES,
  SITUATION_PROMPTS_ENTRIES, SITUATION_CHAR_LIMIT,
  type AgeRange, type IncomeBracket, type HouseholdStatus, type Topic,
  type ProfileFlag, type Situation, type SituationType, type UserProfile,
} from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";

export default function SettingsProfilePage() {
  const router = useRouter();
  const { profile, hydrated, setProfile } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [occupation, setOccupation] = useState("");
  const [state, setState] = useState<string>("");
  const [income, setIncome] = useState<IncomeBracket | null>(null);
  const [household, setHousehold] = useState<HouseholdStatus | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [trackingKeywords, setTrackingKeywords] = useState<string[]>([]);
  const [followedAgencies, setFollowedAgencies] = useState<string[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [freeTextContext, setFreeTextContext] = useState("");
  const [additionalStates, setAdditionalStates] = useState<string[]>([]);
  const [profileFlags, setProfileFlags] = useState<ProfileFlag[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setAgeRange(profile.ageRange);
      setOccupation(profile.occupation);
      setState(profile.state);
      setIncome(profile.income);
      setHousehold(profile.household);
      setTopics(profile.topics);
      setTrackingKeywords(profile.trackingKeywords ?? []);
      setFollowedAgencies(profile.followedAgencies ?? []);
      setSituations(profile.situations ?? []);
      setFreeTextContext(profile.freeTextContext ?? "");
      setAdditionalStates(profile.additionalStates ?? []);
      setProfileFlags(profile.profileFlags ?? []);
    }
  }, [profile, hydrated, router]);

  const canSave =
    ageRange && occupation.trim().length >= 2 && state && income && household && topics.length >= 1;

  const toggleTopic = (t: Topic) =>
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const toggleState = (s: string) =>
    setAdditionalStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const toggleFlag = (f: ProfileFlag) =>
    setProfileFlags((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const toggleAgency = (id: string) =>
    setFollowedAgencies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );

  const updateSituation = (type: SituationType, text: string) => {
    setSituations((prev) => {
      const without = prev.filter((s) => s.type !== type);
      if (!text) return without;
      const existing = prev.find((s) => s.type === type);
      return [...without, { id: existing?.id ?? crypto.randomUUID(), type, text }];
    });
  };

  const handleSave = async () => {
    if (!canSave || !ageRange || !state || !income || !household || saving) return;
    const trimmedName = displayName.trim();
    const trimmedContext = freeTextContext.trim();
    const next: UserProfile = {
      displayName: trimmedName || undefined,
      ageRange,
      occupation: occupation.trim(),
      state,
      income,
      household,
      topics,
      freeTextContext: trimmedContext || undefined,
      additionalStates: additionalStates.filter((s) => s !== state),
      profileFlags: profileFlags.length > 0 ? profileFlags : undefined,
      trackingKeywords: trackingKeywords.length > 0 ? trackingKeywords : undefined,
      followedAgencies: followedAgencies.length > 0 ? followedAgencies : undefined,
      situations: situations.length > 0 ? situations : undefined,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    };
    setSaving(true);
    setSaveError(null);
    try {
      await setProfile(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (err) {
      setSavedFlash(false);
      setSaveError(
        err instanceof Error
          ? err.message
          : "We could not save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to settings
        </Link>

        <h1 className="headline mt-6 text-4xl">Profile</h1>
        <p className="mt-3 text-base text-ink-600">
          Used only to rank your feed and draft your comments. Update any time.
        </p>

        {saveError && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent-50 p-3 text-sm text-accent">
            {saveError}
          </p>
        )}

        <div className="mt-10 space-y-7">
          <Field
            label="What should we call you?"
            hint="First name only is fine. Optional. Used for your avatar."
          >
            <TextInput
              value={displayName}
              onChange={setDisplayName}
              placeholder="Alex"
            />
          </Field>

          <Field label="Age range">
            <ChoiceGrid
              options={AGE_RANGES}
              value={ageRange}
              onChange={setAgeRange}
              columns={3}
            />
          </Field>

          <Field label="Occupation">
            <TextInput
              value={occupation}
              onChange={setOccupation}
              placeholder="home health aide"
            />
          </Field>

          <Field label="State">
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-rule bg-paper px-4 py-3 font-display text-lg text-ink focus:border-accent focus:outline-none"
            >
              <option value="">Select your state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Household income">
            <ChoiceGrid
              options={INCOME_BRACKETS}
              value={income}
              onChange={setIncome}
              columns={3}
            />
          </Field>

          <Field label="Household status">
            <ChoiceGrid
              options={HOUSEHOLD_STATUSES}
              value={household}
              onChange={setHousehold}
              columns={3}
            />
          </Field>

          <Field label="Topics">
            <TopicChips selected={topics} onToggle={toggleTopic} />
          </Field>

          <div className="border-t border-rule pt-7">
            <h2 className="font-display text-2xl text-ink">Feed customization</h2>
            <p className="mt-2 text-sm text-ink-600">
              Boost specific regulations and agencies above the broad topic matching.
            </p>
          </div>

          <Field
            label="Tracking keywords"
            hint="Terms you want to follow specifically — e.g. 'insulin pricing', 'PFAS', 'Medicaid HCBS'. Press Enter after each one."
          >
            <TagInput
              values={trackingKeywords}
              onChange={setTrackingKeywords}
              maxTags={20}
              maxTagLength={40}
              placeholder="Add a keyword…"
            />
          </Field>

          <Field
            label="Agencies to follow"
            hint="Rules from these agencies will rank higher in your feed."
          >
            <div className="flex flex-wrap gap-2">
              {COMMON_AGENCIES.map(({ id, name }) => {
                const active = followedAgencies.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAgency(id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      active
                        ? "border-ink bg-ink text-cream-50 shadow-card"
                        : "border-rule bg-paper text-ink hover:border-ink/40"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="border-t border-rule pt-7">
            <h2 className="font-display text-2xl text-ink">Your situation</h2>
            <p className="mt-2 text-sm text-ink-600">
              These get woven into your comment drafts so they read like they came from you.
            </p>
          </div>

          <Field
            label="Fill in any that apply"
            hint="Each card adds specific personal context to your comment drafts."
          >
            <div className="space-y-3">
              {SITUATION_PROMPTS_ENTRIES.map(
                ([type, { label, placeholder }]) => {
                  const existing = situations.find((s) => s.type === type);
                  return (
                    <div
                      key={type}
                      className="rounded-lg border border-rule bg-paper p-4"
                    >
                      <label className="mb-2 block text-sm font-medium text-ink">
                        {label}
                      </label>
                      <textarea
                        value={existing?.text ?? ""}
                        onChange={(e) =>
                          updateSituation(
                            type,
                            e.target.value.slice(0, SITUATION_CHAR_LIMIT),
                          )
                        }
                        rows={3}
                        placeholder={placeholder}
                        className="w-full rounded-md border border-rule bg-paper/50 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                      />
                      {existing && (
                        <p className="mt-1 text-right font-mono text-xs text-muted">
                          {existing.text.length}/{SITUATION_CHAR_LIMIT}
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </Field>

          <div className="border-t border-rule pt-7">
            <h2 className="font-display text-2xl text-ink">More context</h2>
            <p className="mt-2 text-sm text-ink-600">
              Optional details used only for ranking and drafting.
            </p>
          </div>

          <Field
            label="Does any of this describe you?"
            hint="Optional. Helps surface relevant rules even if you didn't select those topics."
          >
            <div className="flex flex-col gap-2">
              {ALL_PROFILE_FLAGS.map((f) => {
                const active = profileFlags.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFlag(f)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition ${
                      active
                        ? "border-ink bg-ink text-cream-50 shadow-card"
                        : "border-rule bg-paper text-ink hover:border-ink/40"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                        active ? "border-cream-50 bg-cream-50" : "border-ink/30"
                      }`}
                    />
                    {PROFILE_FLAG_LABELS[f]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Other context"
            hint="Caregiving, health, job, family, or other lived context that should shape matching."
          >
            <textarea
              value={freeTextContext}
              onChange={(e) =>
                setFreeTextContext(
                  e.target.value.slice(0, FREE_TEXT_CONTEXT_LIMIT),
                )
              }
              maxLength={FREE_TEXT_CONTEXT_LIMIT}
              rows={5}
              placeholder="I care for my mother, who relies on home health services..."
              className="w-full rounded-md border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <p className="mt-2 text-right font-mono text-xs text-muted">
              {freeTextContext.length}/{FREE_TEXT_CONTEXT_LIMIT}
            </p>
          </Field>

          <Field
            label="Other states you care about"
            hint="Family in, work in, or regularly affected by rules in another state."
          >
            <div className="flex flex-wrap gap-2">
              {US_STATES.map((s) => {
                const active = additionalStates.includes(s);
                const primary = s === state;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={primary}
                    onClick={() => toggleState(s)}
                    className={`inline-flex min-w-11 justify-center rounded-full border px-3 py-2 font-mono text-xs transition ${
                      active
                        ? "border-ink bg-ink text-cream-50 shadow-card"
                        : "border-rule bg-paper text-ink hover:border-ink/40"
                    } ${primary ? "cursor-not-allowed opacity-35" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-rule pt-6">
          <span className="text-xs text-muted">
            Member since{" "}
            {new Date(profile.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream-50 shadow-card transition hover:bg-accent-700 disabled:bg-accent/40 disabled:shadow-none"
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving..." : savedFlash ? "Saved" : "Save changes"}
          </button>
        </div>
      </section>
    </main>
  );
}
