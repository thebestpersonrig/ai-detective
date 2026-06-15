import { BreachResult } from "../types";

export async function checkBreaches(email: string): Promise<BreachResult[]> {
  if (!email.trim()) return [];

  const results: BreachResult[] = [];

  const [xonResults, hibpResults] = await Promise.all([
    checkXposedOrNot(email),
    checkHIBPSite(email),
  ]);

  const seen = new Set<string>();
  for (const b of [...hibpResults, ...xonResults]) {
    const key = b.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(b);
    }
  }

  return results;
}

async function checkXposedOrNot(email: string): Promise<BreachResult[]> {
  try {
    const res = await fetch(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const breaches = data.breaches;
    if (!breaches || !Array.isArray(breaches)) return [];

    return breaches.map(
      (b: { breach: string; date: string; data_types: string[] | string }) => ({
        name: b.breach || "Unknown",
        date: b.date || "Unknown",
        dataTypes: Array.isArray(b.data_types)
          ? b.data_types
          : typeof b.data_types === "string"
            ? b.data_types.split(",").map((s: string) => s.trim())
            : [],
      })
    );
  } catch {
    return [];
  }
}

async function checkHIBPSite(email: string): Promise<BreachResult[]> {
  try {
    const res = await fetch(
      `https://haveibeenpwned.com/unifiedsearch/${encodeURIComponent(email)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
          Referer: "https://haveibeenpwned.com/",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (res.status === 404) return [];
    if (!res.ok) return [];

    const data = await res.json();
    const breaches = data.Breaches;
    if (!breaches || !Array.isArray(breaches)) return [];

    return breaches.map(
      (b: { Name: string; BreachDate: string; DataClasses: string[] }) => ({
        name: b.Name,
        date: b.BreachDate,
        dataTypes: b.DataClasses || [],
      })
    );
  } catch {
    return [];
  }
}
