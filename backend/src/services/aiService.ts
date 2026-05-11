import { openai } from "../lib/openai.js"; // note .js

export interface AIResult {
  allowed: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  category: "SAFE" | "SPAM" | "ABUSE" | "PROMPT_INJECTION" | "MALICIOUS";
  cleanedText: string;
  reason: string;
}

export async function aiContentCheck(inputText: string): Promise<AIResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a security content filter.
Analyze user text and return JSON ONLY in this format:
{
  "allowed": boolean,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "category": "SAFE" | "SPAM" | "ABUSE" | "PROMPT_INJECTION" | "MALICIOUS",
  "cleanedText": string,
  "reason": string
}`
        },
        { role: "user", content: inputText }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty AI response");

    return JSON.parse(content) as AIResult;
  } catch (err) {
    return {
      allowed: false,
      riskLevel: "HIGH",
      category: "MALICIOUS",
      cleanedText: "",
      reason: "AI analysis failed or was unavailable"
    };
  }
}
