const CF_DOH = "https://cloudflare-dns.com/dns-query";
const RDAP_URL = "https://rdap.org/domain/";
const HOST_IO_DNS_URL = "https://host.io/api/dns/";

const SETTINGS_FIELDS = [
  { key: "api_token", elementId: "api-token" }
];

const els = {
  domain: document.getElementById("target-host"),
  registrable: document.getElementById("registrable-domain"),
  status: document.getElementById("domain-status"),
  expiry: document.getElementById("domain-expiry"),
  registrar: document.getElementById("domain-registrar"),
  nsList: document.getElementById("ns-list"),
  nsEmpty: document.getElementById("ns-empty"),
  aList: document.getElementById("a-host-list"),
  aEmpty: document.getElementById("a-host-empty"),
  ipInfoIp: document.getElementById("ipinfo-ip"),
  ipInfoOrg: document.getElementById("ipinfo-org"),
  ipInfoCompany: document.getElementById("ipinfo-company"),
  ipInfoAsn: document.getElementById("ipinfo-asn"),
  ipInfoLocation: document.getElementById("ipinfo-location"),
  settingsForm: document.getElementById("settings-form"),
  saveToken: document.getElementById("save-token"),
  tokenStatus: document.getElementById("token-status"),
  error: document.getElementById("error")
};

const settingsInputs = Object.fromEntries(
  SETTINGS_FIELDS.map((field) => [field.key, document.getElementById(field.elementId)])
);

function getStorageAreas() {
  const areas = [];

  if (chrome?.storage?.sync) {
    areas.push({ type: "chrome", area: chrome.storage.sync });
  }

  if (chrome?.storage?.local) {
    areas.push({ type: "chrome", area: chrome.storage.local });
  }

  if (typeof localStorage !== "undefined") {
    areas.push({ type: "localStorage" });
  }

  return areas;
}

function storageGet(storageArea, keys) {
  return new Promise((resolve, reject) => {
    if (storageArea.type === "localStorage") {
      try {
        const result = {};
        for (const key of keys) {
          result[key] = localStorage.getItem(key) || "";
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
      return;
    }

    try {
      storageArea.area.get(keys, (result) => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(result || {});
      });
    } catch (error) {
      reject(error);
    }
  });
}

function storageSet(storageArea, payload) {
  return new Promise((resolve, reject) => {
    if (storageArea.type === "localStorage") {
      try {
        for (const [key, value] of Object.entries(payload)) {
          localStorage.setItem(key, value ?? "");
        }
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }

    try {
      storageArea.area.set(payload, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

function showError(message) {
  if (!els.error) return;
  els.error.textContent = message;
  els.error.classList.remove("hidden");
}

function clearError() {
  if (!els.error) return;
  els.error.textContent = "";
  els.error.classList.add("hidden");
}

let tokenStatusTimer = null;

function showTokenStatus(message, isError = false) {
  if (!els.tokenStatus) return;

  if (tokenStatusTimer) {
    clearTimeout(tokenStatusTimer);
  }

  els.tokenStatus.textContent = message;
  els.tokenStatus.classList.remove("hidden");
  els.tokenStatus.classList.toggle("token-status-error", isError);

  tokenStatusTimer = setTimeout(() => {
    els.tokenStatus?.classList.add("hidden");
    els.tokenStatus?.classList.remove("token-status-error");
  }, 1800);
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value ?? "Unknown";
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function doh(name, type) {
  const url = `${CF_DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&cd=false`;
  const response = await fetch(url, {
    headers: { accept: "application/dns-json" }
  });

  if (!response.ok) {
    throw new Error(`${type} lookup failed (${response.status})`);
  }

  return response.json();
}

function answersOfType(json, rrtype) {
  const answers = Array.isArray(json?.Answer) ? json.Answer : [];
  return answers.filter((answer) => answer.type === rrtype && answer.data);
}

function renderList(listEl, emptyEl, values, transform) {
  if (!listEl) return;

  listEl.innerHTML = "";
  const normalized = values.map((value) => (transform ? transform(value) : value));

  if (!normalized.length) {
    emptyEl?.classList.remove("hidden");
    return;
  }

  normalized.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    listEl.appendChild(li);
  });

  emptyEl?.classList.add("hidden");
}

async function loadSettings() {
  const keys = SETTINGS_FIELDS.map((field) => field.key);
  const areas = getStorageAreas();

  for (const area of areas) {
    try {
      const stored = await storageGet(area, keys);
      const legacy = await storageGet(area, ["ipinfo_token", "hostio_token"]);
      const mergedToken = stored?.api_token || legacy?.hostio_token || legacy?.ipinfo_token || "";
      const hasValue = Boolean(mergedToken);

      for (const field of SETTINGS_FIELDS) {
        const input = settingsInputs[field.key];
        if (input) {
          input.value = mergedToken || input.value || "";
        }
      }

      if (hasValue) {
        return { api_token: mergedToken };
      }
    } catch {
      // Try the next storage area.
    }
  }

  return {};
}

async function saveSettings() {
  const payload = {};
  const areas = getStorageAreas();

  for (const field of SETTINGS_FIELDS) {
    const input = settingsInputs[field.key];
    payload[field.key] = input ? input.value.trim() : "";
  }

  let saved = false;
  let lastErrorMessage = "No storage area available";

  for (const area of areas) {
    try {
      await storageSet(area, {
        api_token: payload.api_token,
        ipinfo_token: payload.api_token,
        hostio_token: payload.api_token
      });
      saved = true;
    } catch (error) {
      lastErrorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  if (!saved) {
    throw new Error(lastErrorMessage);
  }

  return payload;
}

function setupSettings() {
  if (!els.settingsForm) return;

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      if (els.saveToken) {
        els.saveToken.disabled = true;
      }

      await saveSettings();
      showTokenStatus("Saved");
      clearError();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save API settings.";
      showTokenStatus("Save failed", true);
      showError(`Could not save API settings: ${message}`);
    } finally {
      if (els.saveToken) {
        els.saveToken.disabled = false;
      }
    }
  });
}

async function fetchHostIoDns(domain, token) {
  if (!token) {
    throw new Error("Missing host.io token");
  }

  const url = `${HOST_IO_DNS_URL}${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`host.io DNS lookup failed (${response.status})`);
  }

  return response.json();
}

async function fetchIpInfo(ip, token) {
  if (!token) {
    throw new Error("Add your IPinfo token in Settings.");
  }

  const url = `https://ipinfo.io/${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`IPinfo lookup failed (${response.status})`);
  }

  return response.json();
}

async function fetchARecords(hostname, hostIoToken) {
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

async function findApex(hostname) {
  const labels = (hostname || "").split(".").filter(Boolean);

  if (labels.length < 2) {
    return { apex: hostname, nsList: [] };
  }

  if (labels.length === 2) {
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

    const response = await fetch(link.href, {
      headers: { accept: "application/rdap+json" }
    });

    if (!response.ok) return null;

    const registrarData = await response.json();

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

async function fetchDomainStatus(apexDomain) {
  const response = await fetch(`${RDAP_URL}${encodeURIComponent(apexDomain)}`, {
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

  const status = Array.isArray(data.status) && data.status.length
    ? data.status.join(", ")
    : "Unknown";

  let expiry = "Unknown";
  if (Array.isArray(data.events)) {
    const expirationEvent = data.events.find(
      (event) => (event.eventAction || "").toLowerCase() === "expiration"
    );

    if (expirationEvent?.eventDate) {
      const expiryDate = new Date(expirationEvent.eventDate);
      const daysLeft = Math.ceil((expiryDate - Date.now()) / 86400000);
      if (Number.isFinite(daysLeft)) {
        const formattedDate = expiryDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
        expiry = daysLeft > 0
          ? `${daysLeft} days left (${formattedDate})`
          : `Expired (${formattedDate})`;
      }
    }
  }

  let registrar = data.registrarName || null;

  if (!registrar && Array.isArray(data.entities)) {
    const registrarEntity = data.entities.find((entity) =>
      (entity.roles || []).some((role) => role.toLowerCase() === "registrar")
    );
    registrar = registrarEntity ? vcardFn(registrarEntity.vcardArray) : null;
  }

  if (!registrar) {
    registrar = await fetchRegistrarViaLink(data.links || []);
  }

  if (!registrar && Array.isArray(data.entities)) {
    for (const entity of data.entities) {
      if (!Array.isArray(entity.publicIds)) continue;
      const ianaId = entity.publicIds.find((publicId) => /iana/i.test(publicId.type || ""));
      if (ianaId?.identifier) {
        registrar = `IANA Registrar ID ${ianaId.identifier}`;
        break;
      }
    }
  }

  return {
    status,
    expiry,
    registrar: registrar || "Unknown"
  };
}

async function loadNsRecords(apex, hostIoToken) {
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

function initializePlaceholders(hostname) {
  setText(els.domain, hostname);
  setText(els.registrable, "Loading...");
  setText(els.status, "Loading...");
  setText(els.expiry, "Loading...");
  setText(els.registrar, "Loading...");
  setText(els.ipInfoIp, "Waiting for A record...");
  setText(els.ipInfoOrg, "Waiting for A record...");
  setText(els.ipInfoCompany, "Waiting for A record...");
  setText(els.ipInfoAsn, "Waiting for A record...");
  setText(els.ipInfoLocation, "Waiting for A record...");
}

function renderIpInfo(info, ip) {
  const location = [info.city, info.region, info.country].filter(Boolean).join(", ") || "Unknown";
  setText(els.ipInfoIp, ip || "Unknown");
  setText(els.ipInfoOrg, info.org || "Unknown");
  setText(els.ipInfoCompany, info.company?.name || info.org || "Unknown");
  setText(els.ipInfoAsn, info.asn?.asn || info.asn || "Unknown");
  setText(els.ipInfoLocation, location);
}

function setIpInfoMessage(message) {
  setText(els.ipInfoIp, message);
  setText(els.ipInfoOrg, message);
  setText(els.ipInfoCompany, message);
  setText(els.ipInfoAsn, message);
  setText(els.ipInfoLocation, message);
}

async function run() {
  clearError();
  setupSettings();
  const settings = await loadSettings();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = hostFromUrl(tab?.url || "");

  if (!hostname) {
    showError("Could not extract hostname from current tab URL.");
    return;
  }

  initializePlaceholders(hostname);

  fetchARecords(hostname, settings.api_token || "")
    .then((records) => {
      renderList(els.aList, els.aEmpty, records);

      const firstIp = records[0];
      if (!firstIp) {
        setIpInfoMessage("No A record found.");
        return;
      }

      setText(els.ipInfoIp, firstIp);
      setText(els.ipInfoOrg, "Loading...");
      setText(els.ipInfoCompany, "Loading...");
      setText(els.ipInfoAsn, "Loading...");
      setText(els.ipInfoLocation, "Loading...");

      fetchIpInfo(firstIp, settings.api_token || "")
        .then((info) => renderIpInfo(info, firstIp))
        .catch((error) => {
          setText(els.ipInfoIp, firstIp);
          setText(els.ipInfoOrg, "Unavailable");
          setText(els.ipInfoCompany, "Unavailable");
          setText(els.ipInfoAsn, "Unavailable");
          setText(els.ipInfoLocation, error.message);
        });
    })
    .catch((error) => {
      renderList(els.aList, els.aEmpty, []);
      setIpInfoMessage("Unavailable");
      showError(error.message);
    });

  findApex(hostname)
    .then(async ({ apex }) => {
      setText(els.registrable, apex);

      loadNsRecords(apex, settings.api_token || "")
        .then((nsList) => renderList(els.nsList, els.nsEmpty, nsList, (value) => value.replace(/\.$/, "")))
        .catch((error) => {
          renderList(els.nsList, els.nsEmpty, []);
          showError(error.message);
        });

      return fetchDomainStatus(apex)
        .then((domainInfo) => {
          setText(els.status, domainInfo.status);
          setText(els.expiry, domainInfo.expiry);
          setText(els.registrar, domainInfo.registrar);
        })
        .catch((error) => {
          setText(els.status, "Unavailable");
          setText(els.expiry, "Unavailable");
          setText(els.registrar, "Unavailable");
          showError(error.message);
        });
    })
    .catch((error) => {
      setText(els.registrable, "Unavailable");
      renderList(els.nsList, els.nsEmpty, []);
      setText(els.status, "Unavailable");
      setText(els.expiry, "Unavailable");
      setText(els.registrar, "Unavailable");
      showError(error.message);
    });
}

run().catch((error) => showError(error.message));
