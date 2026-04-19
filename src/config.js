export const RDAP_DOMAIN_URL = "https://rdap.org/domain/";
export const IPINFO_URL = "https://ipinfo.io/";

export const DNS_RESOLVERS = [
  {
    name: "Cloudflare",
    url: "https://cloudflare-dns.com/dns-query"
  },
  {
    name: "Google",
    url: "https://dns.google/resolve"
  }
];

export const SETTINGS_FIELDS = [
  { key: "api_token", elementId: "api-token" }
];

export const LEGACY_TOKEN_KEYS = ["ipinfo_token"];
