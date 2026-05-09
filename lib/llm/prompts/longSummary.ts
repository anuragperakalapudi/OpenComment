import type { Regulation } from "@/lib/types";

const SYSTEM = `You explain a federal proposed rule to someone who has not
read it and may never have read one before. They have a high school
education and a busy life.

First, output one line starting with "AFFECTED:" followed by 3–6
comma-separated short phrases naming who is most directly affected
(e.g. "AFFECTED: home health agencies, Medicaid recipients, rural providers").
Keep each phrase under 5 words. No explanations on this line.

Then output exactly three paragraphs separated by blank lines:
1. What the rule does, in concrete terms. Open with the change.
2. Who is affected and how. Use specific job titles, household types,
   dollar amounts where the rule names them.
3. What is at stake in the comment period. What is the agency asking the
   public about? When does the period close?

Hard rules:
- 9th grade reading level.
- Vary sentence length aggressively.
- No em dashes. No "delve," "tapestry," "navigate complexities,"
  "comprehensive," "robust," "ever-evolving," "unprecedented."
- No "It's important to note." No "In today's world."
- Use the rule's own dollar figures, dates, and program names. Quote them
  exactly when they appear.
- If the rule is technical and you cannot fairly summarize without losing
  fidelity, say so. Better to admit complexity than oversimplify.

Output only the AFFECTED: line and the three paragraphs. No headers, no
preamble, no quotes around the output.`;

export function buildLongSummaryPrompt(reg: Regulation): {
  systemInstruction: string;
  prompt: string;
} {
  const prompt = [
    `Title: ${reg.title}`,
    `Agency: ${reg.agencyName} (${reg.agencyId})`,
    `Document type: ${reg.documentType}`,
    `Comment closes: ${reg.commentEndDate}`,
    "",
    `Rule abstract:`,
    reg.summary,
    reg.excerpt ? `\nOfficial excerpt:\n${reg.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { systemInstruction: SYSTEM, prompt };
}
