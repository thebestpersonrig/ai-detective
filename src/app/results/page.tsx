"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
import { ProfileData, PlatformResult, BreachResult } from "@/lib/types";

interface WebResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface InvestigationData {
  profile: ProfileData;
  geminiSummary: string;
  geminiError: string | null;
  webResults: WebResult[];
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<InvestigationData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "platforms" | "breaches" | "web"
  >("overview");

  useEffect(() => {
    const stored = sessionStorage.getItem("investigation");
    if (!stored) {
      router.push("/");
      return;
    }
    setData(JSON.parse(stored));
  }, [router]);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const { profile, geminiSummary, geminiError, webResults } = data;
  const uniqueWeb = webResults.filter(
    (r, i, arr) => arr.findIndex((x) => x.link === r.link) === i
  );

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            New Search
          </button>
          <div className="text-sm text-muted">
            {new Date(profile.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Subject card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-card-border rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Investigation Report
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-muted">
                {profile.input.name && (
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded">
                    {profile.input.name}
                  </span>
                )}
                {profile.input.username && (
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded">
                    @{profile.input.username}
                  </span>
                )}
                {profile.input.email && (
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded">
                    {profile.input.email}
                  </span>
                )}
                {profile.input.phone && (
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded">
                    {profile.input.phone}
                  </span>
                )}
              </div>
            </div>
            <RiskBadge level={profile.summary.riskLevel} />
          </div>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Profiles Found"
            value={profile.summary.totalFound}
            total={profile.summary.totalSearched}
            color="text-accent"
          />
          <StatCard
            label="Breaches"
            value={profile.breaches.length}
            color={
              profile.breaches.length > 0 ? "text-danger" : "text-success"
            }
          />
          <StatCard
            label="Web Results"
            value={uniqueWeb.length}
            color="text-accent"
          />
          <StatCard
            label="Categories"
            value={Object.keys(profile.summary.categories).length}
            color="text-accent"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-6">
          {(
            [
              {
                id: "overview" as const,
                label: "AI Summary",
                count: geminiSummary ? 1 : 0,
              },
              {
                id: "platforms" as const,
                label: "Platforms",
                count: profile.summary.totalFound,
              },
              {
                id: "breaches" as const,
                label: "Breaches",
                count: profile.breaches.length,
              },
              {
                id: "web" as const,
                label: "Web Results",
                count: uniqueWeb.length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  activeTab === tab.id
                    ? "bg-accent/20"
                    : "bg-card-border"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab summary={geminiSummary} error={geminiError} />
          )}
          {activeTab === "platforms" && (
            <PlatformsTab platforms={profile.platforms} />
          )}
          {activeTab === "breaches" && (
            <BreachesTab breaches={profile.breaches} />
          )}
          {activeTab === "web" && <WebTab results={uniqueWeb} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OverviewTab({ summary, error }: { summary: string; error: string | null }) {
  if (!summary) {
    return (
      <motion.div
        key="overview"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-card border border-card-border rounded-xl p-12 text-center"
      >
        <Brain className="w-12 h-12 text-muted mx-auto mb-3" />
        <p className="text-lg font-medium mb-1">AI Summary Unavailable</p>
        {error ? (
          <p className="text-danger text-sm font-mono bg-danger/10 rounded-lg p-3 mt-3 text-left break-all">
            {error}
          </p>
        ) : (
          <p className="text-muted text-sm">
            Gemini returned no summary for this search.
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="bg-card border border-accent/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-lg">AI Intelligence Report</h2>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      </div>
    </motion.div>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const config = {
    low: {
      icon: ShieldCheck,
      label: "Low Risk",
      className: "bg-success/10 text-success border-success/20",
    },
    medium: {
      icon: AlertTriangle,
      label: "Medium Risk",
      className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    high: {
      icon: ShieldAlert,
      label: "High Risk",
      className: "bg-danger/10 text-danger border-danger/20",
    },
  };
  const c = config[level];
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${c.className}`}
    >
      <c.icon className="w-4 h-4" />
      <span className="font-medium text-sm">{c.label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total?: number;
  color: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="text-sm text-muted mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {value}
        {total !== undefined && (
          <span className="text-sm text-muted font-normal">/{total}</span>
        )}
      </div>
    </div>
  );
}

function PlatformsTab({ platforms }: { platforms: PlatformResult[] }) {
  const [showAll, setShowAll] = useState(false);
  const found = platforms.filter((p) => p.found);
  const notFound = platforms.filter((p) => !p.found);

  const grouped: Record<string, PlatformResult[]> = {};
  for (const p of found) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  return (
    <motion.div
      key="platforms"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {found.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <XCircle className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">
            No profiles found for this username.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted mb-3 uppercase tracking-wider">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((p) => (
                  <a
                    key={p.platform}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-card border border-card-border rounded-xl p-4 hover:border-accent/30 transition-colors group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{p.platform}</div>
                      <div className="text-xs text-muted truncate">
                        {p.url}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}

          {notFound.length > 0 && (
            <div>
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-3"
              >
                {showAll ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {showAll ? "Hide" : "Show"} {notFound.length} not found
              </button>
              {showAll && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {notFound.map((p) => (
                    <div
                      key={p.platform}
                      className="flex items-center gap-3 bg-card/50 border border-card-border/50 rounded-lg p-3 opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-muted shrink-0" />
                      <span className="text-sm">{p.platform}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function BreachesTab({ breaches }: { breaches: BreachResult[] }) {
  if (breaches.length === 0) {
    return (
      <motion.div
        key="breaches"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-card border border-card-border rounded-xl p-12 text-center"
      >
        <ShieldCheck className="w-12 h-12 text-success mx-auto mb-3" />
        <p className="text-lg font-medium mb-1">No Breaches Found</p>
        <p className="text-muted text-sm">
          This email wasn&apos;t found in any known data breaches.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="breaches"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {breaches.map((breach) => (
        <div
          key={breach.name}
          className="bg-card border border-danger/20 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-danger" />
              <h3 className="font-semibold">{breach.name}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Calendar className="w-3.5 h-3.5" />
              {breach.date}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {breach.dataTypes.map((type) => (
              <span
                key={type}
                className="text-xs px-2 py-1 rounded bg-danger/10 text-danger/80"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function WebTab({
  results,
}: {
  results: WebResult[];
}) {
  if (results.length === 0) {
    return (
      <motion.div
        key="web"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-card border border-card-border rounded-xl p-12 text-center"
      >
        <Search className="w-12 h-12 text-muted mx-auto mb-3" />
        <p className="text-lg font-medium mb-1">No Web Results</p>
        <p className="text-muted text-sm">
          No public web mentions found.
          <span className="block mt-2 text-muted/60">
            (Configure Gemini/SerpAPI keys for web search)
          </span>
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="web"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {results.map((r, i) => (
        <a
          key={i}
          href={r.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card border border-card-border rounded-xl p-5 hover:border-accent/30 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs text-muted">{r.source}</span>
              </div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-accent transition-colors">
                {r.title}
              </h3>
              <p className="text-sm text-muted line-clamp-2">
                {r.snippet}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0 mt-1" />
          </div>
        </a>
      ))}
    </motion.div>
  );
}
