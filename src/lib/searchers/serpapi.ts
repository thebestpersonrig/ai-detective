export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export async function serpSearch(query: string): Promise<SerpResult[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) return [];

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
