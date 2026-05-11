export function analyzeThought(content: string) {
  let score = 0;
  let category = "general";
  let flagged = false;

  if (content.length > 200) score += 2;
  if (content.includes("hate") || content.includes("violence")) {
    flagged = true;
    category = "sensitive";
  }

  if (content.includes("help") || content.includes("advice")) {
    category = "help";
  }

  return {
    score,
    category,
    flagged
  };
}
