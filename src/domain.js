import { answersOfType, doh, fetchHostIoDns } from "./api.js";

export function hostFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host || null;
  } catch {
    return null;
  }
}

export async function fetchARecords(hostname, hostIoToken) {
  if (hostIoToken) {
    try {
      const dns = await fetchHostIoDns(hostname, hostIoToken);
      const hostIoA = Array.isArray(dns?.a) ? dns.a.filter(Boolean) : [];
      if (hostIoA.length) return hostIoA;
    } catch {
      // Fall through to DoH so a bad token or missing host.io data does not block the popup.
    }
  }

  const json = await doh(hostname, "A");
  return answersOfType(json, 1).map((answer) => answer.data);
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
        const nsList = answersOfType(json, 2).map((answer) => answer.data).filter(Boolean);
        return { candidate, nsList };
      } catch {
        return { candidate, nsList: [] };
      }
    })
  );

  const match = results.find((result) => result.nsList.length);
  return match ? { apex: match.candidate, nsList: match.nsList } : { apex: hostname, nsList: [] };
}

export async function loadNsRecords(apex, hostIoToken) {
  if (hostIoToken) {
    try {
      const dns = await fetchHostIoDns(apex, hostIoToken);
      const nsList = Array.isArray(dns?.ns) ? dns.ns.filter(Boolean) : [];
      if (nsList.length) return nsList;
    } catch {
      // Fall back to DoH below.
    }
  }

  const json = await doh(apex, "NS");
  return answersOfType(json, 2).map((answer) => answer.data).filter(Boolean);
}
