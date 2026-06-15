export interface PlatformCheck {
  name: string;
  urlTemplate: string;
  category: string;
  icon: string;
}

export const PLATFORMS: PlatformCheck[] = [
  // Social Media
  { name: "GitHub", urlTemplate: "https://github.com/{username}", category: "Development", icon: "github" },
  { name: "Twitter / X", urlTemplate: "https://x.com/{username}", category: "Social Media", icon: "twitter" },
  { name: "Instagram", urlTemplate: "https://www.instagram.com/{username}", category: "Social Media", icon: "instagram" },
  { name: "Reddit", urlTemplate: "https://www.reddit.com/user/{username}", category: "Social Media", icon: "message-circle" },
  { name: "TikTok", urlTemplate: "https://www.tiktok.com/@{username}", category: "Social Media", icon: "music" },
  { name: "YouTube", urlTemplate: "https://www.youtube.com/@{username}", category: "Social Media", icon: "youtube" },
  { name: "Twitch", urlTemplate: "https://www.twitch.tv/{username}", category: "Social Media", icon: "tv" },
  { name: "Pinterest", urlTemplate: "https://www.pinterest.com/{username}", category: "Social Media", icon: "image" },
  { name: "Tumblr", urlTemplate: "https://{username}.tumblr.com", category: "Social Media", icon: "pen-tool" },
  { name: "Medium", urlTemplate: "https://medium.com/@{username}", category: "Social Media", icon: "book-open" },

  // Professional
  { name: "LinkedIn", urlTemplate: "https://www.linkedin.com/in/{username}", category: "Professional", icon: "briefcase" },
  { name: "GitLab", urlTemplate: "https://gitlab.com/{username}", category: "Development", icon: "git-branch" },
  { name: "Bitbucket", urlTemplate: "https://bitbucket.org/{username}", category: "Development", icon: "git-merge" },
  { name: "Stack Overflow", urlTemplate: "https://stackoverflow.com/users/{username}", category: "Development", icon: "layers" },
  { name: "Dev.to", urlTemplate: "https://dev.to/{username}", category: "Development", icon: "code" },
  { name: "Hashnode", urlTemplate: "https://hashnode.com/@{username}", category: "Development", icon: "hash" },
  { name: "npm", urlTemplate: "https://www.npmjs.com/~{username}", category: "Development", icon: "package" },
  { name: "PyPI", urlTemplate: "https://pypi.org/user/{username}", category: "Development", icon: "terminal" },

  // Gaming
  { name: "Steam", urlTemplate: "https://steamcommunity.com/id/{username}", category: "Gaming", icon: "gamepad-2" },
  { name: "Xbox", urlTemplate: "https://www.xbox.com/en-US/play/user/{username}", category: "Gaming", icon: "monitor" },

  // Creative
  { name: "Dribbble", urlTemplate: "https://dribbble.com/{username}", category: "Creative", icon: "palette" },
  { name: "Behance", urlTemplate: "https://www.behance.net/{username}", category: "Creative", icon: "pen-tool" },
  { name: "DeviantArt", urlTemplate: "https://www.deviantart.com/{username}", category: "Creative", icon: "brush" },
  { name: "Flickr", urlTemplate: "https://www.flickr.com/people/{username}", category: "Creative", icon: "camera" },
  { name: "SoundCloud", urlTemplate: "https://soundcloud.com/{username}", category: "Creative", icon: "headphones" },
  { name: "Spotify", urlTemplate: "https://open.spotify.com/user/{username}", category: "Creative", icon: "music" },

  // Other
  { name: "Gravatar", urlTemplate: "https://gravatar.com/{username}", category: "Other", icon: "user" },
  { name: "Keybase", urlTemplate: "https://keybase.io/{username}", category: "Security", icon: "key" },
  { name: "HackerOne", urlTemplate: "https://hackerone.com/{username}", category: "Security", icon: "shield" },
  { name: "About.me", urlTemplate: "https://about.me/{username}", category: "Other", icon: "user" },
];
