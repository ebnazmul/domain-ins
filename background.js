const DNSLT_CONTEXT_MENU_ID = "open-dnslt-domain";
const DNSLT_BASE_URL = "https://www.dnslt.com/";
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const IPV4_PATTERN = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

setupContextMenu();

chrome.runtime.onInstalled.addListener(setupContextMenu);
chrome.runtime.onStartup.addListener(setupContextMenu);

function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: DNSLT_CONTEXT_MENU_ID,
      title: "Open selected domain/IP in DNSLT",
      contexts: ["selection"]
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info || info.menuItemId !== DNSLT_CONTEXT_MENU_ID) return;

  const target = normalizeSelectedTarget(info.selectionText || "");

  if (!target) {
    showInvalidSelectionTooltip(tab?.id);
    return;
  }

  openDnsltTarget(target);
});

function normalizeSelectedTarget(value) {
  const cleaned = cleanSelectedText(value);
  if (!cleaned) return "";

  const fromUrl = hostnameFromUrl(cleaned);
  const candidate = fromUrl || cleaned.replace(/\.$/, "");

  if (IPV4_PATTERN.test(candidate)) {
    return { type: "ip", value: candidate };
  }

  if (DOMAIN_PATTERN.test(candidate)) {
    return { type: "domain", value: candidate.toLowerCase() };
  }

  return null;
}

function cleanSelectedText(value) {
  return value
    .trim()
    .replace(/^[<({["']+/, "")
    .replace(/[>)}\]"',;:]+$/, "");
}

function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function openDnsltTarget(target) {
  const url = `${DNSLT_BASE_URL}${target.type}/${encodeURIComponent(target.value)}`;

  if (!chrome.tabs?.create) {
    return;
  }

  chrome.tabs.create({ url });
}

function showInvalidSelectionTooltip(tabId) {
  if (!tabId || !chrome.scripting?.executeScript) {
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId },
    func: showDnsltTooltip,
    args: ["Select a valid domain or IPv4 address."]
  }, () => {
    void chrome.runtime.lastError;
  });
}

function showDnsltTooltip(message) {
  const existing = document.getElementById("domain-insight-dnslt-tooltip");
  if (existing) {
    existing.remove();
  }

  const tooltip = document.createElement("div");
  tooltip.id = "domain-insight-dnslt-tooltip";
  tooltip.textContent = message;
  tooltip.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "top:16px",
    "right:16px",
    "max-width:320px",
    "padding:10px 12px",
    "border-radius:12px",
    "background:#101828",
    "color:#ffffff",
    "font:600 13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
    "box-shadow:0 10px 30px rgba(16,24,40,.24)",
    "pointer-events:none"
  ].join(";");

  document.documentElement.appendChild(tooltip);
  setTimeout(() => tooltip.remove(), 2400);
}
