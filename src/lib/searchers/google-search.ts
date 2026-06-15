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
    searchEntryPoint?: {
      renderedContent: string;
    };
    groundingSupports?: {
      segment: { text: string };
      groundingChunkIndices: number[];
    }[];
  };
}

export async function geminiGroundedSearch(
  query: string
): Promise<{ results: WebSearchResult[]; summary: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return { results: [], summary: "" };

  const prompt = `You are an OSINT investigator. Search the web for information about this person and compile what you find.

Search for: ${query}

Find their social media profiles, public records, mentions, websites, and any other publicly available information. Be thorough but only report factual findings from search results.`;

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

    if (!res.ok) return { results: [], summary: "" };

    const data = await res.json();
    const candidate: GeminiCandidate | undefined = data.candidates?.[0];

    if (!candidate) return { results: [], summary: "" };

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
  } catch {
    return { results: [], summary: "" };
  }
}
