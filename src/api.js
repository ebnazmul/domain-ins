import { CF_DOH_URL, HOST_IO_DNS_URL, IPINFO_URL, RDAP_DOMAIN_URL } from "./config.js";

async function fetchJson(url, options, errorPrefix) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`${errorPrefix} (${response.status})`);
  }

  return response.json();
}

export async function doh(name, type) {
  const url = `${CF_DOH_URL}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&cd=false`;
  return fetchJson(url, { headers: { accept: "application/dns-json" } }, `${type} lookup failed`);
}

export function answersOfType(json, rrtype) {
  const answers = Array.isArray(json?.Answer) ? json.Answer : [];
  return answers.filter((answer) => answer.type === rrtype && answer.data);
}

export async function fetchHostIoDns(domain, token) {
  if (!token) {
    throw new Error("Missing host.io token");
  }

  const url = `${HOST_IO_DNS_URL}${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}`;
  return fetchJson(url, undefined, "host.io DNS lookup failed");
}

export async function fetchIpInfo(ip, token) {
  if (!token) {
    throw new Error("Add your IPinfo token in Settings.");
  }

  const url = `${IPINFO_URL}${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`;
  return fetchJson(url, undefined, "IPinfo lookup failed");
}

function vcardFn(vcardArray) {
  try {
    const items = vcardArray?.[1] || [];
    const fn = items.find((row) => Array.isArray(row) && row[0] === "fn");
    return fn?.[3] || null;
  } catch {
    return null;
  }
}

async function fetchRegistrarViaLink(links = []) {
  try {
    const link = links.find(
      (item) => (item.rel === "related" || item.rel === "registrar") && /rdap/i.test(item.href || "")
    );

    if (!link?.href) return null;

    const registrarData = await fetchJson(
      link.href,
      { headers: { accept: "application/rdap+json" } },
      "Registrar RDAP lookup failed"
    );

    if (registrarData.registrarName) return registrarData.registrarName;

    if (Array.isArray(registrarData.entities)) {
      const registrarEntity = registrarData.entities.find((entity) =>
        (entity.roles || []).some((role) => role.toLowerCase() === "registrar")
      );
      const fromEntity = registrarEntity ? vcardFn(registrarEntity.vcardArray) : null;
      if (fromEntity) return fromEntity;
    }

    return vcardFn(registrarData.vcardArray);
  } catch {
    return null;
  }
}

export async function fetchDomainStatus(apexDomain) {
  const response = await fetch(`${RDAP_DOMAIN_URL}${encodeURIComponent(apexDomain)}`, {
    headers: { accept: "application/rdap+json" }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        status: "Unavailable",
        expiry: "Unavailable",
        registrar: "Unavailable"
      };
    }

    throw new Error(`RDAP lookup failed (${response.status})`);
  }

  const data = await response.json();
  const status = Array.isArray(data.status) && data.status.length ? data.status.join(", ") : "Unknown";
  const expiry = formatExpiry(data.events);
  const registrar = await resolveRegistrar(data);

  return {
    status,
    expiry,
    registrar: registrar || "Unknown"
  };
}

function formatExpiry(events) {
  if (!Array.isArray(events)) {
    return "Unknown";
  }

  const expirationEvent = events.find(
    (event) => (event.eventAction || "").toLowerCase() === "expiration"
  );

  if (!expirationEvent?.eventDate) {
    return "Unknown";
  }

  const expiryDate = new Date(expirationEvent.eventDate);
  const daysLeft = Math.ceil((expiryDate - Date.now()) / 86400000);

  if (!Number.isFinite(daysLeft)) {
    return "Unknown";
  }

  const formattedDate = expiryDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return daysLeft > 0 ? `${daysLeft} days left (${formattedDate})` : `Expired (${formattedDate})`;
}

async function resolveRegistrar(data) {
  if (data.registrarName) return data.registrarName;

  if (Array.isArray(data.entities)) {
    const registrarEntity = data.entities.find((entity) =>
      (entity.roles || []).some((role) => role.toLowerCase() === "registrar")
    );
    const fromEntity = registrarEntity ? vcardFn(registrarEntity.vcardArray) : null;
    if (fromEntity) return fromEntity;
  }

  const linkedRegistrar = await fetchRegistrarViaLink(data.links || []);
  if (linkedRegistrar) return linkedRegistrar;

  if (Array.isArray(data.entities)) {
    for (const entity of data.entities) {
      if (!Array.isArray(entity.publicIds)) continue;
      const ianaId = entity.publicIds.find((publicId) => /iana/i.test(publicId.type || ""));
      if (ianaId?.identifier) {
        return `IANA Registrar ID ${ianaId.identifier}`;
      }
    }
  }

  return null;
}
