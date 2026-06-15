export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface GeminiCandidate {
  content: {
    parts: { text: string }[];
  };
  groundingMetadata?: {
    groundingChunks?: {
      web?: { uri: string; title: string };
    }[];
    groundingSupports?: {
      segment: { text: string };
      groundingChunkIndices: number[];
    }[];
  };
}

export async function geminiGroundedSearch(
  context: { username?: string; email?: string; phone?: string; name?: string }
): Promise<{ results: WebSearchResult[]; summary: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { results: [], summary: "", error: "GEMINI_API_KEY not set" };
  }

  const identifiers: string[] = [];
  if (context.username) identifiers.push(`- Username: "${context.username}"`);
  if (context.email) identifiers.push(`- Email: "${context.email}"`);
  if (context.phone) identifiers.push(`- Phone: "${context.phone}"`);
  if (context.name) identifiers.push(`- Full name: "${context.name}"`);

  const prompt = `You are an OSINT investigator building a profile of ONE specific person. Their known identifiers:
${identifiers.join("\n")}

CRITICAL RULES:
- ONLY report findings confidently linked to THIS specific person.
- Cross-reference: a result is relevant only if it matches 2+ identifiers (e.g. same username AND name, or same email AND username).
- Do NOT include results about different people who share the same name.
- For each finding, state which identifiers matched.

Search for: social media profiles, forum posts, personal websites, professional profiles, public mentions, code repositories, gaming profiles.

Write a structured intelligence report. Be concise and factual.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return {
        results: [],
        summary: "",
        error: `Gemini ${res.status}: ${errBody.slice(0, 300)}`,
      };
    }

    const data = await res.json();
    const candidate: GeminiCandidate | undefined = data.candidates?.[0];

    if (!candidate) {
      return {
        results: [],
        summary: "",
        error: `No candidates returned. Response: ${JSON.stringify(data).slice(0, 300)}`,
      };
    }

    const summary = candidate.content?.parts?.map((p) => p.text).join("") || "";

    const chunks = candidate.groundingMetadata?.groundingChunks || [];
    const supports = candidate.groundingMetadata?.groundingSupports || [];

    const results: WebSearchResult[] = chunks
      .filter((c) => c.web?.uri)
      .map((chunk, i) => {
        const matchingSupport = supports.find((s) =>
          s.groundingChunkIndices?.includes(i)
        );
        return {
          title: chunk.web!.title || "",
          link: chunk.web!.uri,
          snippet: matchingSupport?.segment?.text || "",
          source: new URL(chunk.web!.uri).hostname,
        };
      });

    return { results, summary };
  } catch (err) {
    return {
      results: [],
      summary: "",
      error: `Request failed: ${String(err)}`,
    };
  }
}
