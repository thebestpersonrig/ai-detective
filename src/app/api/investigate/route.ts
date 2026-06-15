import { NextRequest, NextResponse } from "next/server";
import { SearchInput, ProfileData } from "@/lib/types";
import { checkPlatforms } from "@/lib/searchers/platform-check";
import { geminiGroundedSearch } from "@/lib/searchers/google-search";
import { checkBreaches } from "@/lib/searchers/hibp";
import { serpSearch } from "@/lib/searchers/serpapi";

export async function POST(req: NextRequest) {
  try {
    const input: SearchInput = await req.json();

    if (!input.username && !input.email && !input.phone && !input.name) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    const searchQueries: string[] = [];
    if (input.name) searchQueries.push(`"${input.name}"`);
    if (input.username) searchQueries.push(`"${input.username}"`);
    if (input.email) searchQueries.push(`"${input.email}"`);
    if (input.phone) searchQueries.push(`"${input.phone}"`);
    const combinedQuery = searchQueries.join(" OR ");

    const [platforms, geminiResult, serpResults, breaches] =
      await Promise.all([
        checkPlatforms(input.username),
        geminiGroundedSearch({
          username: input.username,
          email: input.email,
          phone: input.phone,
          name: input.name,
        }),
        serpSearch(combinedQuery),
        checkBreaches(input.email),
      ]);

    const foundPlatforms = platforms.filter((p) => p.found);
    const categories: Record<string, number> = {};
    for (const p of foundPlatforms) {
      categories[p.category] = (categories[p.category] || 0) + 1;
    }

    const riskLevel =
      breaches.length > 5
        ? "high"
        : breaches.length > 0
          ? "medium"
          : "low";

    const profile: ProfileData = {
      input,
      platforms,
      breaches,
      summary: {
        totalFound: foundPlatforms.length,
        totalSearched: platforms.length,
        riskLevel,
        categories,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      profile,
      geminiSummary: geminiResult.summary,
      geminiError: geminiResult.error || null,
      webResults: [
        ...geminiResult.results,
        ...serpResults.map((r) => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet,
          source: r.source,
        })),
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Investigation failed: ${String(err)}` },
      { status: 500 }
    );
  }
}
