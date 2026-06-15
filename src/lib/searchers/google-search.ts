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
    webSearchQueries?: string[];
  };
}

export async function geminiGroundedSearch(
  context: { username?: string; email?: string; phone?: string; name?: string }
): Promise<{ results: WebSearchResult[]; summary: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { results: [], summary: "", error: "GEMINI_API_KEY not set" };
  }

  const parts: string[] = [];
  if (context.username) parts.push(`username "${context.username}"`);
  if (context.email) parts.push(`email "${context.email}"`);
  if (context.phone) parts.push(`phone number "${context.phone}"`);
  if (context.name) parts.push(`full name "${context.name}"`);

  const prompt = `Search the web and compile a summary of publicly available information about a person with the following details:
${parts.join(", ")}.

Please search for their social media accounts, websites, forum posts, professional profiles, repositories, and any other public mentions. For each result you find, note which of the above details matched so the reader can verify it is the same person. Only include results where you are confident the details match this specific individual. Organize your findings by category (social media, professional, development, etc).`;

  const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite"];

  let res: Response | null = null;
  let usedModel = "";

  for (const model of models) {
    try {
      res = await fetch(
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
      if (res.ok) {
        usedModel = model;
        break;
      }
      if (res.status === 429 || res.status === 404 || res.status === 503) {
        continue;
      }
      const errBody = await res.text().catch(() => "");
      return {
        results: [],
        summary: "",
        error: `${model} ${res.status}: ${errBody.slice(0, 300)}`,
      };
    } catch {
      continue;
    }
  }

  if (!res || !res.ok) {
    return {
      results: [],
      summary: "",
      error: "All Gemini models unavailable. Try again in a minute.",
    };
  }

  try {
    const data = await res.json();
    const candidate: GeminiCandidate | undefined = data.candidates?.[0];

    if (!candidate) {
      return {
        results: [],
        summary: "",
        error: `No candidates. Response: ${JSON.stringify(data).slice(0, 500)}`,
      };
    }

    // Extract grounding results even if text is empty
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

    const rawSummary =
      candidate.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("") || "";

    if (!rawSummary && results.length === 0) {
      return {
        results: [],
        summary: "",
        error: "Gemini searched but returned no results for this person.",
      };
    }

    const summary = rawSummary
      ? `[${usedModel}]\n\n${rawSummary}`
      : `[${usedModel}] No AI summary generated, but ${results.length} web results found via grounding.`;

    return { results, summary };
  } catch (err) {
    return {
      results: [],
      summary: "",
      error: `Response parsing failed: ${String(err)}`,
    };
  }
}
