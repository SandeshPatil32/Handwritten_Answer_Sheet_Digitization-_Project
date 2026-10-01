const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "has", "have", "he", "in", "is", "it", "of", "on", "or", "that",
  "the", "their", "this", "to", "was", "were", "will", "with", "you",
  "your", "we", "they", "i", "me", "my", "our", "but", "not", "can",
  "do", "does", "did", "if", "then", "than", "so", "such", "into", "also"
]);

const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text) =>
  normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const cosineSimilarity = (tokensA, tokensB) => {
  if (!tokensA.length || !tokensB.length) return 0;

  const frequencyA = new Map();
  const frequencyB = new Map();

  tokensA.forEach((token) => {
    frequencyA.set(token, (frequencyA.get(token) || 0) + 1);
  });

  tokensB.forEach((token) => {
    frequencyB.set(token, (frequencyB.get(token) || 0) + 1);
  });

  const vocabulary = new Set([
    ...frequencyA.keys(),
    ...frequencyB.keys()
  ]);

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  vocabulary.forEach((token) => {
    const a = frequencyA.get(token) || 0;
    const b = frequencyB.get(token) || 0;
    dot += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  });

  if (!magnitudeA || !magnitudeB) return 0;

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

const jaccardSimilarity = (tokensA, tokensB) => {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });

  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
};

const getNGrams = (tokens, size = 5) => {
  const grams = new Set();

  for (let index = 0; index <= tokens.length - size; index += 1) {
    grams.add(tokens.slice(index, index + size).join(" "));
  }

  return grams;
};

const getMatchingPhrases = (tokensA, tokensB) => {
  const sizes = [6, 5, 4];
  const matches = new Set();

  for (const size of sizes) {
    const gramsA = getNGrams(tokensA, size);
    const gramsB = getNGrams(tokensB, size);

    gramsA.forEach((gram) => {
      if (gramsB.has(gram)) matches.add(gram);
    });
  }

  return [...matches]
    .sort((a, b) => b.split(" ").length - a.split(" ").length)
    .slice(0, 8);
};

export const buildSimilarity = (assignmentA, assignmentB) => {
  const textA = assignmentA.scanResult?.pages?.map((page) => page.text || "").join(" ") || "";
  const textB = assignmentB.scanResult?.pages?.map((page) => page.text || "").join(" ") || "";

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  const cosine = cosineSimilarity(tokensA, tokensB);
  const jaccard = jaccardSimilarity(tokensA, tokensB);
  const score = Math.round(((cosine * 0.7) + (jaccard * 0.3)) * 100);

  let status = "Normal";
  if (score >= 80) status = "High similarity - review";
  else if (score >= 60) status = "Moderate similarity - review";

  return {
    assignmentA: assignmentA._id?.toString() || assignmentA.id,
    assignmentB: assignmentB._id?.toString() || assignmentB.id,
    studentA: {
      id: assignmentA.student?._id?.toString() || assignmentA.student?.toString(),
      name: assignmentA.student?.name || "Student A",
      email: assignmentA.student?.email || ""
    },
    studentB: {
      id: assignmentB.student?._id?.toString() || assignmentB.student?.toString(),
      name: assignmentB.student?.name || "Student B",
      email: assignmentB.student?.email || ""
    },
    assignmentTitle: assignmentA.title,
    subject: assignmentA.subject,
    score,
    status,
    commonPhrases: getMatchingPhrases(tokensA, tokensB),
    tokenCountA: tokensA.length,
    tokenCountB: tokensB.length
  };
};
