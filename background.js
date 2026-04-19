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

chrome.contextMenus.onClicked.addListener((info) => {
  if (!info || info.menuItemId !== DNSLT_CONTEXT_MENU_ID) return;

  const target = normalizeSelectedTarget(info.selectionText || "");

  if (!target) return;

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
