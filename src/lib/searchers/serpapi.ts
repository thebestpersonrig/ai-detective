export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

async function searchOnce(
  apiKey: string,
  query: string
): Promise<SerpResult[]> {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      q: query,
      engine: "google",
      num: "10",
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.organic_results || []).map(
      (r: { title: string; link: string; snippet: string; source: string }) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet || "",
        source: r.source || new URL(r.link).hostname,
      })
    );
  } catch {
    return [];
  }
}

export async function serpSearch(context: {
  username?: string;
  email?: string;
  phone?: string;
  name?: string;
}): Promise<SerpResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const queries: string[] = [];

  // Exact username search — most unique identifier
  if (context.username) {
    queries.push(`"${context.username}"`);
  }

  // Username + name together for cross-referencing
  if (context.username && context.name) {
    queries.push(`"${context.username}" "${context.name}"`);
  }

  // Email is highly unique
  if (context.email) {
    queries.push(`"${context.email}"`);
  }

  // Only search name alone if we have nothing else
  if (context.name && !context.username && !context.email) {
    if (context.phone) {
      queries.push(`"${context.name}" "${context.phone}"`);
    } else {
      queries.push(`"${context.name}"`);
    }
  }

  if (queries.length === 0) return [];

  // Run searches (limit to 2 to save API quota)
  const searches = queries.slice(0, 2);
  const allResults = await Promise.all(
    searches.map((q) => searchOnce(apiKey, q))
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const merged: SerpResult[] = [];
  for (const results of allResults) {
    for (const r of results) {
      if (!seen.has(r.link)) {
        seen.add(r.link);
        merged.push(r);
      }
    }
  }

  return merged;
}
