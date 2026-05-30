# OpenComment

Federal agencies publish proposed rules all the time -- new regulations on healthcare, housing, labor, the environment. Each one has a public comment period where anyone can weigh in before the rule is finalized. Most people have no idea this is happening.

OpenComment shows you the rules that are relevant to your life, explains what they actually mean, and helps you write a real comment that gets entered into the federal record.

**Live demo:** https://open-comment.vercel.app

## What it does

- You set up a profile with your topics, state, occupation, and personal stories
- It pulls open proposed rules from regulations.gov and ranks them against your profile
- It generates plain-English summaries and drafts a comment grounded in your specific situation
- It sends reminders when deadlines are approaching and alerts when a rule you commented on gets finalized

## Stack

Next.js 14 App Router, TypeScript, Clerk, Supabase, Gemini, Vercel, Resend

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Fill in the required keys below
npm run dev
```

## Configuration

| Variable | Where to get it |
|---|---|
| `REGULATIONS_GOV_API_KEY` | Free at https://api.data.gov/signup/ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | clerk.com |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | supabase.com |
| `GEMINI_API_KEY` | aistudio.google.com |
| `RESEND_API_KEY` | resend.com (only needed for email alerts) |

## A few things worth knowing

Comments are never submitted on your behalf. You copy the draft, open regulations.gov, and submit it yourself under your own name.

Every draft is grounded in your profile and stories, not a generic template. If you write that you're a nurse in rural Maryland who cares about Medicaid reimbursement rates, that context shows up in the comment.

No third-party scripts run on the client. Account deletion removes everything.

## License

Not yet specified.
