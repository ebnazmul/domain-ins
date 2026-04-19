import { answersOfType, doh } from "./api.js";

export function hostFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host || null;
  } catch {
    return null;
  }
}

export async function fetchARecords(hostname) {
  const json = await doh(hostname, "A");
  return answersOfType(json, 1).map((answer) => normalizeDnsRecord(answer, json.resolver));
}

export async function findApex(hostname) {
  const labels = (hostname || "").split(".").filter(Boolean);

  if (labels.length <= 2) {
    return { apex: hostname, nsList: [] };
  }

  const candidates = labels
    .slice(0, -2)
    .map((_, index) => labels.slice(index).join("."))
    .concat(labels.slice(-2).join("."));

  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const json = await doh(candidate, "NS");
        const nsList = answersOfType(json, 2).map((answer) => normalizeDnsRecord(answer, json.resolver));
        return { candidate, nsList };
      } catch {
        return { candidate, nsList: [] };
      }
    })
  );

  const match = results.find((result) => result.nsList.length);
  return match ? { apex: match.candidate, nsList: match.nsList } : { apex: hostname, nsList: [] };
}

export async function loadNsRecords(apex) {
  const json = await doh(apex, "NS");
  return answersOfType(json, 2).map((answer) => normalizeDnsRecord(answer, json.resolver));
}

function normalizeDnsRecord(answer, resolver) {
  return {
    value: answer.data,
    ttl: Number.isFinite(answer.TTL) ? answer.TTL : null,
    resolver
  };
}
