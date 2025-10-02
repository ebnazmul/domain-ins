// ======================================================================
// Domain Insight - popup.js (hardened)
// - Apex-first RDAP lookup
// - Robust registrar extraction (vCard, links, IANA fallback)
// - Expiry shown as "X days left" / "Expired"
// - Cloudflare DoH for NS/A/PTR + IPinfo enrichment
// ======================================================================

// ------------------------------
// Cloudflare DNS-over-HTTPS JSON
// ------------------------------
const CF_DOH = "https://cloudflare-dns.com/dns-query";
const DNS_JSON = (name, type) =>
  `${CF_DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&cd=false`;

// ------------------------------
// DOM references
// ------------------------------
const els = {
  target: document.getElementById('target-host'),
  domainStatus: document.getElementById('domain-status'),
  domainExpiry: document.getElementById('domain-expiry'),
  domainRegistrar: document.getElementById('domain-registrar'),

  nsList: document.getElementById('ns-list'),
  nsEmpty: document.getElementById('ns-empty'),

  aHostList: document.getElementById('a-host-list'),
  aHostEmpty: document.getElementById('a-host-empty'),
  aApexList: document.getElementById('a-apex-list'),
  aApexEmpty: document.getElementById('a-apex-empty'),
  apexName: document.getElementById('apex-name'),

  ip: document.getElementById('ip'),
  rdns: document.getElementById('rdns'),
  org: document.getElementById('org'),
  asn: document.getElementById('asn'),
  company: document.getElementById('company'),
  loc: document.getElementById('loc'),

  token: document.getElementById('ipinfo-token'),
  save: document.getElementById('save'),
  error: document.getElementById('error')
};

// ------------------------------
// Utils
// ------------------------------
function showError(msg) {
  if (!els.error) return;
  els.error.textContent = msg;
  els.error.classList.remove('hidden');
}
function clearError() {
  if (!els.error) return;
  els.error.textContent = '';
  els.error.classList.add('hidden');
}
function hostFromUrl(u) {
  try { return new URL(u).hostname; } catch { return null; }
}
async function doh(name, type) {
  const url = DNS_JSON(name, type);
  const res = await fetch(url, { headers: { 'accept': 'application/dns-json' } });
  if (!res.ok) throw new Error(`DoH ${type} lookup failed (${res.status})`);
  return res.json();
}
function answersOfType(json, rrtypeNum) {
  if (!json || !Array.isArray(json.Answer)) return [];
  return json.Answer.filter(a => a.type === rrtypeNum);
}
function toList(listEl, values) {
  if (!listEl) return;
  listEl.innerHTML = '';
  values.forEach(v => {
    const li = document.createElement('li');
    li.textContent = v;
    listEl.appendChild(li);
  });
}

// ------------------------------
// Find zone apex by walking labels
// (we consider the first label with NS answers a zone apex)
// ------------------------------
async function findApex(hostname) {
  const labels = (hostname || '').split('.');
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join('.');
    try {
      const ns = await doh(candidate, 'NS');
      const got = answersOfType(ns, 2).map(x => x.data).filter(Boolean);
      if (got.length) return { apex: candidate, nsList: got };
    } catch { /* keep trying */ }
  }
  return { apex: hostname, nsList: [] };
}

// ------------------------------
// Reverse DNS (IPv4 → PTR)
// ------------------------------
async function reverseDns(ip) {
  const octets = (ip || '').split('.');
  if (octets.length !== 4) return null;
  const ptr = `${octets.reverse().join('.')}.in-addr.arpa`;
  try {
    const j = await doh(ptr, 'PTR');
    const ptrs = answersOfType(j, 12).map(x => x.data.replace(/\.$/, ''));
    return ptrs[0] || null;
  } catch { return null; }
}

// ------------------------------
// IPinfo enrichment (optional token)
// ------------------------------
async function ipDetails(ip, token) {
  const base = `https://ipinfo.io/${ip}`;
  const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IPinfo failed (${res.status})`);
  return res.json();
}

// ------------------------------
// RDAP helpers for robust registrar extraction
// ------------------------------
function vcardFn(vcardArray) {
  try {
    // vcardArray = ["vcard", [ [ "fn", {}, "text", "Name" ], ... ]]
    const items = vcardArray?.[1] || [];
    const fn = items.find(row => Array.isArray(row) && row[0] === "fn");
    return fn?.[3] || null;
  } catch { return null; }
}

async function fetchRegistrarViaLink(links = []) {
  try {
    const link = (links || []).find(
      l => (l.rel === "related" || l.rel === "registrar") && /rdap/i.test(l.href || "")
    );
    if (!link?.href) return null;
    const res = await fetch(link.href, { headers: { "accept": "application/rdap+json" } });
    if (!res.ok) return null;
    const reg = await res.json();

    if (reg.registrarName) return reg.registrarName;

    if (Array.isArray(reg.entities)) {
      const ent = reg.entities.find(e => (e.roles || []).includes("registrar"));
      const byVcard = ent && vcardFn(ent.vcardArray);
      if (byVcard) return byVcard;
    }

    const fromVcard = vcardFn(reg.vcardArray);
    return fromVcard || null;
  } catch {
    return null;
  }
}

// ------------------------------
// RDAP: status, days-left expiry, registrar (APEX ONLY)
// ------------------------------
async function fetchDomainStatus(apexDomain) {
  try {
    const res = await fetch(`https://rdap.org/domain/${apexDomain}`, {
      headers: { "accept": "application/rdap+json" }
    });
    if (!res.ok) throw new Error(`RDAP lookup failed (${res.status})`);

    const data = await res.json();

    // ----- Status (string list, lower- or mixed-case) -----
    const status = Array.isArray(data.status) && data.status.length
      ? data.status.join(", ")
      : "Unknown";

    // ----- Expiration → "X days left" / "Expired" / "Unknown" -----
    let expiry = "Unknown";
    if (Array.isArray(data.events)) {
      const expEvent = data.events.find(ev => (ev.eventAction || "").toLowerCase() === "expiration");
      if (expEvent?.eventDate) {
        const expDate = new Date(expEvent.eventDate);
        const diffMs = expDate - new Date();
        if (Number.isFinite(diffMs)) {
          expiry = diffMs > 0 ? `${Math.ceil(diffMs / 86400000)} days left` : "Expired";
        }
      }
    }

    // ----- Registrar (strong heuristics) -----
    let registrar = null;

    // 1) Direct field
    if (data.registrarName) registrar = data.registrarName;

    // 2) Entities role=registrar → vCard fn
    if (!registrar && Array.isArray(data.entities)) {
      const regEnt = data.entities.find(e => (e.roles || []).some(r => r.toLowerCase() === "registrar"));
      const byVcard = regEnt && vcardFn(regEnt.vcardArray);
      if (byVcard) registrar = byVcard;
    }

    // 3) Follow related registrar RDAP link
    if (!registrar) {
      const viaLink = await fetchRegistrarViaLink(data.links);
      if (viaLink) registrar = viaLink;
    }

    // 4) Fallback: IANA Registrar ID
    if (!registrar && Array.isArray(data.entities)) {
      for (const ent of data.entities) {
        if (!Array.isArray(ent.publicIds)) continue;
        const pid = ent.publicIds.find(p => /iana/i.test(p.type || ""));
        if (pid?.identifier) { registrar = `IANA Registrar ID ${pid.identifier}`; break; }
      }
    }

    return { status, expiry, registrar: registrar || "Unknown" };
  } catch (e) {
    return { status: "Error fetching status", expiry: "Unknown", registrar: "Unknown" };
  }
}

// ------------------------------
// Main flow
// ------------------------------
async function run() {
  clearError();

  // Load saved IPinfo token
  try {
    const stored = await chrome.storage.sync.get(['ipinfo_token']);
    if (stored && stored.ipinfo_token && els.token) {
      els.token.value = stored.ipinfo_token;
    }
  } catch { /* ignore */ }

  if (els.save && els.token) {
    els.save.addEventListener('click', async () => {
      try {
        await chrome.storage.sync.set({ ipinfo_token: els.token.value.trim() });
      } catch {
        showError('Failed to save token');
      }
    });
  }

  // Current tab → hostname
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = hostFromUrl(tab?.url || "");
  if (!hostname) return showError('Could not extract hostname from current tab URL.');
  if (els.target) els.target.textContent = hostname;

  // --- Find APEX + NS FIRST (critical for RDAP) ---
  const { apex, nsList } = await findApex(hostname);
  if (els.apexName) els.apexName.textContent = apex;

  if (nsList.length) {
    toList(els.nsList, nsList.map(x => x.replace(/\.$/, '')));
    els.nsEmpty?.classList.add('hidden');
  } else {
    if (els.nsList) els.nsList.innerHTML = '';
    els.nsEmpty?.classList.remove('hidden');
  }

  // --- RDAP (use APEX!) ---
  const rdap = await fetchDomainStatus(apex);
  if (els.domainStatus)    els.domainStatus.textContent    = rdap.status;
  if (els.domainExpiry)    els.domainExpiry.textContent    = rdap.expiry;
  if (els.domainRegistrar) els.domainRegistrar.textContent = rdap.registrar;

  // --- A records: hostname ---
  let aHost = [];
  try {
    const a1 = await doh(hostname, 'A');
    aHost = answersOfType(a1, 1).map(x => x.data);
  } catch { /* ignore */ }

  if (aHost.length) {
    toList(els.aHostList, aHost);
    els.aHostEmpty?.classList.add('hidden');
  } else {
    if (els.aHostList) els.aHostList.innerHTML = '';
    els.aHostEmpty?.classList.remove('hidden');
  }

  // --- A records: apex ---
  let aApex = [];
  try {
    const a2 = await doh(apex, 'A');
    aApex = answersOfType(a2, 1).map(x => x.data);
  } catch { /* ignore */ }

  if (aApex.length) {
    toList(els.aApexList, aApex);
    els.aApexEmpty?.classList.add('hidden');
  } else {
    if (els.aApexList) els.aApexList.innerHTML = '';
    els.aApexEmpty?.classList.remove('hidden');
  }

  // --- Enrich first IP (prefer hostname A) ---
  const ip = (aHost[0] || aApex[0]) || null;
  if (els.ip) els.ip.textContent = ip || '—';

  if (ip) {
    // PTR
    try {
      const ptr = await reverseDns(ip);
      if (els.rdns) els.rdns.textContent = ptr || '—';
    } catch { if (els.rdns) els.rdns.textContent = '—'; }

    // IPinfo
    try {
      const token = (await chrome.storage.sync.get(['ipinfo_token']))?.ipinfo_token || '';
      const info = await ipDetails(ip, token);
      if (els.org) els.org.textContent = info.org || '—';
      if (els.asn) els.asn.textContent = info.asn?.asn || (info.org?.split(' ')[0] || '—');
      if (els.company) els.company.textContent = info.company?.name || info.org || '—';
      if (els.loc) {
        const regionBits = [info.country, info.region, info.city].filter(Boolean);
        els.loc.textContent = regionBits.join(' / ') || '—';
      }
    } catch (e) {
      showError(e.message);
    }
  }
}

// Auto-run when popup opens
run().catch(err => showError(err.message));
