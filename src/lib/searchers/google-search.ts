export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
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

  const queries: string[] = [];
  if (context.username) queries.push(`"${context.username}"`);
  if (context.email) queries.push(`"${context.email}"`);
  if (context.name && context.username) queries.push(`"${context.name}" "${context.username}"`);

  const searchQuery = queries.join(" OR ");

  const prompt = `Search for: ${searchQuery}

List every result you find. For each one give the title, URL, and a short description of what it is.`;

  const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite"];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
        if (res.status === 429 || res.status === 404 || res.status === 503) continue;
        const errBody = await res.text().catch(() => "");
        return { results: [], summary: "", error: `${model} ${res.status}: ${errBody.slice(0, 300)}` };
      }

      const data = await res.json();
      const candidate: GeminiCandidate | undefined = data.candidates?.[0];
      if (!candidate) continue;

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

      const summary =
        candidate.content?.parts
          ?.filter((p) => p.text)
          .map((p) => p.text)
          .join("") || "";

      if (summary || results.length > 0) {
        return {
          results,
          summary: summary ? `[${model}]\n\n${summary}` : "",
        };
      }
    } catch {
      continue;
    }
  }

  return { results: [], summary: "", error: "Gemini returned no results." };
}
