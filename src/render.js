import { els } from "./dom.js";

let tokenStatusTimer = null;

export function setText(el, value) {
  if (!el) return;
  el.textContent = value ?? "Unknown";
}

export function showError(message) {
  if (!els.error) return;
  els.error.textContent = message;
  els.error.classList.remove("hidden");
}

export function clearError() {
  if (!els.error) return;
  els.error.textContent = "";
  els.error.classList.add("hidden");
}

export function showTokenStatus(message, isError = false) {
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

export function renderList(listEl, emptyEl, values, transform) {
  if (!listEl) return;

  listEl.replaceChildren();
  const normalized = values.map((value) => (transform ? transform(value) : value));

  if (!normalized.length) {
    emptyEl?.classList.remove("hidden");
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const value of normalized) {
    const li = document.createElement("li");
    if (isLinkValue(value)) {
      const link = document.createElement("a");
      link.href = value.href;
      link.textContent = value.label;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      li.appendChild(link);
    } else {
      li.textContent = value;
    }
    fragment.appendChild(li);
  }

  listEl.appendChild(fragment);
  emptyEl?.classList.add("hidden");
}

function isLinkValue(value) {
  return Boolean(value && typeof value === "object" && value.href && value.label);
}

export function initializePlaceholders(hostname) {
  setText(els.domain, hostname);
  setText(els.registrable, "Loading...");
  setText(els.status, "Loading...");
  setText(els.expiry, "Loading...");
  setText(els.registrar, "Loading...");
  setIpInfoMessage("Waiting for A record...");
}

export function renderIpInfo(info, ip) {
  const location = [info.city, info.region, info.country].filter(Boolean).join(", ") || "Unknown";
  setText(els.ipInfoIp, ip || "Unknown");
  setText(els.ipInfoOrg, info.org || "Unknown");
  setText(els.ipInfoCompany, info.company?.name || info.org || "Unknown");
  setText(els.ipInfoAsn, info.asn?.asn || info.asn || "Unknown");
  setText(els.ipInfoLocation, location);
}

export function setIpInfoMessage(message) {
  setText(els.ipInfoIp, message);
  setText(els.ipInfoOrg, message);
  setText(els.ipInfoCompany, message);
  setText(els.ipInfoAsn, message);
  setText(els.ipInfoLocation, message);
}
