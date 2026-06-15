export interface SearchInput {
  username: string;
  email: string;
  phone: string;
  name: string;
}

export interface PlatformResult {
  platform: string;
  url: string;
  found: boolean;
  category: string;
  icon: string;
  bio?: string;
  avatar?: string;
}

export interface BreachResult {
  name: string;
  date: string;
  dataTypes: string[];
}

export interface ProfileData {
  input: SearchInput;
  platforms: PlatformResult[];
  breaches: BreachResult[];
  summary: {
    totalFound: number;
    totalSearched: number;
    riskLevel: "low" | "medium" | "high";
    categories: Record<string, number>;
  };
  timestamp: string;
}
