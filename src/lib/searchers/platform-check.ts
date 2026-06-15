import { PlatformResult } from "../types";

interface CheckFn {
  (username: string): Promise<boolean>;
}

interface Platform {
  name: string;
  url: (u: string) => string;
  category: string;
  icon: string;
  check: CheckFn;
}

async function httpCheck(url: string, expect404: boolean = false): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/json",
      },
    });
    if (expect404) return res.status !== 404;
    return res.ok;
  } catch {
    return false;
  }
}

async function jsonApiCheck(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "AI-Detective-OSINT",
        Accept: "application/json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

const PLATFORMS: Platform[] = [
  // --- APIs that reliably return 404 for missing users ---
  {
    name: "GitHub",
    url: (u) => `https://github.com/${u}`,
    category: "Development",
    icon: "github",
    check: (u) => jsonApiCheck(`https://api.github.com/users/${u}`),
  },
  {
    name: "GitLab",
    url: (u) => `https://gitlab.com/${u}`,
    category: "Development",
    icon: "git-branch",
    check: async (u) => {
      try {
        const res = await fetch(
          `https://gitlab.com/api/v4/users?username=${u}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) return false;
        const data = await res.json();
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    },
  },
  {
    name: "Reddit",
    url: (u) => `https://www.reddit.com/user/${u}`,
    category: "Social Media",
    icon: "message-circle",
    check: async (u) => {
      try {
        const res = await fetch(
          `https://www.reddit.com/user/${u}/about.json`,
          {
            signal: AbortSignal.timeout(8000),
            headers: { "User-Agent": "AI-Detective-OSINT/1.0" },
          }
        );
        if (!res.ok) return false;
        const data = await res.json();
        return data?.data?.name !== undefined;
      } catch {
        return false;
      }
    },
  },
  {
    name: "Steam",
    url: (u) => `https://steamcommunity.com/id/${u}`,
    category: "Gaming",
    icon: "gamepad-2",
    check: async (u) => {
      try {
        const res = await fetch(`https://steamcommunity.com/id/${u}`, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!res.ok) return false;
        const text = await res.text();
        return !text.includes("The specified profile could not be found");
      } catch {
        return false;
      }
    },
  },
  {
    name: "Keybase",
    url: (u) => `https://keybase.io/${u}`,
    category: "Security",
    icon: "key",
    check: (u) => jsonApiCheck(`https://keybase.io/_/api/1.0/user/lookup.json?usernames=${u}`),
  },
  {
    name: "npm",
    url: (u) => `https://www.npmjs.com/~${u}`,
    category: "Development",
    icon: "package",
    check: (u) => jsonApiCheck(`https://registry.npmjs.org/-/user/org.couchdb.user:${u}`),
  },
  {
    name: "PyPI",
    url: (u) => `https://pypi.org/user/${u}`,
    category: "Development",
    icon: "terminal",
    check: (u) => httpCheck(`https://pypi.org/user/${u}/`, true),
  },
  {
    name: "Gravatar",
    url: (u) => `https://gravatar.com/${u}`,
    category: "Other",
    icon: "user",
    check: (u) => httpCheck(`https://en.gravatar.com/${u}.json`),
  },
  {
    name: "Dev.to",
    url: (u) => `https://dev.to/${u}`,
    category: "Development",
    icon: "code",
    check: (u) => jsonApiCheck(`https://dev.to/api/users/by_username?url=${u}`),
  },

  // --- Sites that need HTML scraping to confirm ---
  {
    name: "Twitter / X",
    url: (u) => `https://x.com/${u}`,
    category: "Social Media",
    icon: "twitter",
    check: async (u) => {
      try {
        const res = await fetch(`https://nitter.net/${u}`, {
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!res.ok) return false;
        const text = await res.text();
        return !text.includes("User \"") || !text.includes("\" not found");
      } catch {
        return false;
      }
    },
  },
  {
    name: "Instagram",
    url: (u) => `https://www.instagram.com/${u}`,
    category: "Social Media",
    icon: "instagram",
    check: async (u) => {
      try {
        const res = await fetch(
          `https://www.instagram.com/api/v1/users/web_profile_info/?username=${u}`,
          {
            signal: AbortSignal.timeout(8000),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "X-IG-App-ID": "936619743392459",
            },
          }
        );
        return res.ok;
      } catch {
        return false;
      }
    },
  },
  {
    name: "TikTok",
    url: (u) => `https://www.tiktok.com/@${u}`,
    category: "Social Media",
    icon: "music",
    check: async (u) => {
      try {
        const res = await fetch(`https://www.tiktok.com/@${u}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        return res.ok && res.status !== 404;
      } catch {
        return false;
      }
    },
  },
  {
    name: "YouTube",
    url: (u) => `https://www.youtube.com/@${u}`,
    category: "Social Media",
    icon: "youtube",
    check: async (u) => {
      try {
        const res = await fetch(`https://www.youtube.com/@${u}`, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!res.ok) return false;
        const text = await res.text();
        return !text.includes('"externalId":""') && text.includes('"externalId"');
      } catch {
        return false;
      }
    },
  },
  {
    name: "Twitch",
    url: (u) => `https://www.twitch.tv/${u}`,
    category: "Social Media",
    icon: "tv",
    check: async (u) => {
      try {
        const res = await fetch(`https://www.twitch.tv/${u}`, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!res.ok) return false;
        const text = await res.text();
        return !text.includes("content=\"Sorry. Unless you've got a time machine");
      } catch {
        return false;
      }
    },
  },
  {
    name: "Pinterest",
    url: (u) => `https://www.pinterest.com/${u}`,
    category: "Social Media",
    icon: "image",
    check: (u) => httpCheck(`https://www.pinterest.com/${u}/`, true),
  },
  {
    name: "Medium",
    url: (u) => `https://medium.com/@${u}`,
    category: "Social Media",
    icon: "book-open",
    check: (u) => httpCheck(`https://medium.com/@${u}`, true),
  },
  {
    name: "SoundCloud",
    url: (u) => `https://soundcloud.com/${u}`,
    category: "Creative",
    icon: "headphones",
    check: (u) => httpCheck(`https://soundcloud.com/${u}`, true),
  },
  {
    name: "Spotify",
    url: (u) => `https://open.spotify.com/user/${u}`,
    category: "Creative",
    icon: "music",
    check: (u) => httpCheck(`https://open.spotify.com/user/${u}`),
  },
  {
    name: "LinkedIn",
    url: (u) => `https://www.linkedin.com/in/${u}`,
    category: "Professional",
    icon: "briefcase",
    check: (u) => httpCheck(`https://www.linkedin.com/in/${u}/`, true),
  },
  {
    name: "Dribbble",
    url: (u) => `https://dribbble.com/${u}`,
    category: "Creative",
    icon: "palette",
    check: (u) => httpCheck(`https://dribbble.com/${u}`, true),
  },
  {
    name: "Behance",
    url: (u) => `https://www.behance.net/${u}`,
    category: "Creative",
    icon: "pen-tool",
    check: (u) => httpCheck(`https://www.behance.net/${u}`, true),
  },
  {
    name: "DeviantArt",
    url: (u) => `https://www.deviantart.com/${u}`,
    category: "Creative",
    icon: "brush",
    check: (u) => httpCheck(`https://www.deviantart.com/${u}`, true),
  },
  {
    name: "Flickr",
    url: (u) => `https://www.flickr.com/people/${u}`,
    category: "Creative",
    icon: "camera",
    check: (u) => httpCheck(`https://www.flickr.com/people/${u}/`, true),
  },
  {
    name: "Tumblr",
    url: (u) => `https://${u}.tumblr.com`,
    category: "Social Media",
    icon: "pen-tool",
    check: async (u) => {
      try {
        const res = await fetch(`https://api.tumblr.com/v2/blog/${u}.tumblr.com/info`, {
          signal: AbortSignal.timeout(8000),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  },
  {
    name: "About.me",
    url: (u) => `https://about.me/${u}`,
    category: "Other",
    icon: "user",
    check: (u) => httpCheck(`https://about.me/${u}`, true),
  },
  {
    name: "HackerOne",
    url: (u) => `https://hackerone.com/${u}`,
    category: "Security",
    icon: "shield",
    check: (u) => httpCheck(`https://hackerone.com/${u}`, true),
  },
  {
    name: "Hashnode",
    url: (u) => `https://hashnode.com/@${u}`,
    category: "Development",
    icon: "hash",
    check: (u) => httpCheck(`https://hashnode.com/@${u}`, true),
  },
];

export async function checkPlatforms(
  username: string
): Promise<PlatformResult[]> {
  if (!username.trim()) return [];

  const BATCH_SIZE = 6;
  const results: PlatformResult[] = [];

  for (let i = 0; i < PLATFORMS.length; i += BATCH_SIZE) {
    const batch = PLATFORMS.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (platform) => {
        const found = await platform.check(username);
        return {
          platform: platform.name,
          url: platform.url(username),
          found,
          category: platform.category,
          icon: platform.icon,
        };
      })
    );
    results.push(...batchResults);
  }

  return results;
}
